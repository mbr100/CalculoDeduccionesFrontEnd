import {Component, computed, inject, Input, OnInit, Signal, signal, WritableSignal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ProyectoService} from '../../../services/proyecto-service';
import {FaseProyectoService} from '../../../services/fase-proyecto-service';
import {Proyecto} from '../../../models/proyecto-economico';
import {FaseSavingState, FilaAsignacionFaseDTO, MatrizAsignacionFasesDTO, FaseProyectoDTO} from '../../../models/fase-proyecto';
import {DecimalPipe} from '@angular/common';

@Component({
    selector: 'app-asignar-fases-proyecto',
    imports: [FormsModule, DecimalPipe],
    templateUrl: './asignar-fases-proyecto.html',
    styleUrl: './asignar-fases-proyecto.css'
})
export class AsignarFasesProyecto implements OnInit {
    @Input()
    public idEconomico!: number;

    private proyectoService: ProyectoService = inject(ProyectoService);
    private faseProyectoService: FaseProyectoService = inject(FaseProyectoService);

    // Proyectos disponibles
    public proyectos: WritableSignal<Proyecto[]> = signal<Proyecto[]>([]);
    public selectedProyectoId: WritableSignal<number | null> = signal(null);

    // Matriz de asignacion de fases
    public matrizData: WritableSignal<MatrizAsignacionFasesDTO> = signal<MatrizAsignacionFasesDTO>({
        fases: [],
        filas: []
    });

    public loading: WritableSignal<boolean> = signal(false);
    public proyectosLoading: WritableSignal<boolean> = signal(false);
    public savingStates: WritableSignal<{ [key: string]: FaseSavingState }> = signal({});

    // Computed
    public totalPersonas: Signal<number> = computed(() => this.matrizData().filas.length);
    public totalFases: Signal<number> = computed(() => this.matrizData().fases.length);

    public ngOnInit(): void {
        this.loadProyectos();
    }

    private loadProyectos(): void {
        this.proyectosLoading.set(true);
        this.proyectoService.getProyectosByEconomico(this.idEconomico, 0, 100).subscribe({
            next: (response) => {
                this.proyectos.set(response.content);
                this.proyectosLoading.set(false);
            },
            error: (error) => {
                console.error('Error cargando proyectos:', error);
                this.proyectosLoading.set(false);
            }
        });
    }

    public onProyectoChange(idProyecto: string): void {
        const id = parseInt(idProyecto, 10);
        if (isNaN(id)) {
            this.selectedProyectoId.set(null);
            this.matrizData.set({fases: [], filas: []});
            return;
        }
        this.selectedProyectoId.set(id);
        this.loadMatriz(id);
    }

    private loadMatriz(idProyecto: number): void {
        this.loading.set(true);
        this.faseProyectoService.getMatrizAsignacionFases(idProyecto).subscribe({
            next: (data) => {
                this.matrizData.set(data);
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error cargando matriz de fases:', error);
                this.loading.set(false);
            }
        });
    }

    public updatePorcentaje(fila: FilaAsignacionFaseDTO, faseIndex: number, value: string): void {
        const numValue = parseFloat(value) || 0;
        const fase = this.matrizData().fases[faseIndex];
        const cellKey = `${fila.idProyectoPersonal}-${fase.idFase}`;

        this.savingStates.update(s => ({...s, [cellKey]: 'saving'}));

        this.faseProyectoService.actualizarAsignacionFase({
            idProyectoPersonal: fila.idProyectoPersonal,
            idFase: fase.idFase,
            porcentajeDedicacion: numValue
        }).subscribe({
            next: () => {
                // Actualizar valor local
                this.matrizData.update(data => {
                    const newFilas = data.filas.map(f => {
                        if (f.idProyectoPersonal === fila.idProyectoPersonal) {
                            const newPorcentajes = [...f.porcentajes];
                            newPorcentajes[faseIndex] = numValue;
                            return {...f, porcentajes: newPorcentajes};
                        }
                        return f;
                    });
                    return {...data, filas: newFilas};
                });
                this.savingStates.update(s => ({...s, [cellKey]: 'success'}));
                setTimeout(() => this.savingStates.update(s => ({...s, [cellKey]: 'idle'})), 2000);
            },
            error: (error) => {
                console.error('Error actualizando asignacion fase:', error);
                this.savingStates.update(s => ({...s, [cellKey]: 'error'}));
                setTimeout(() => this.savingStates.update(s => ({...s, [cellKey]: 'idle'})), 3000);
            }
        });
    }

    public onKeyPress(event: KeyboardEvent, fila: FilaAsignacionFaseDTO, faseIndex: number, value: string): void {
        if (event.key === 'Enter') {
            (event.target as HTMLInputElement).blur();
            this.updatePorcentaje(fila, faseIndex, value);
        }
    }

    public getTotalPorPersona(fila: FilaAsignacionFaseDTO): number {
        return fila.porcentajes.reduce((sum, p) => sum + p, 0);
    }

    public getTotalPorFase(faseIndex: number): number {
        return this.matrizData().filas.reduce((sum, fila) => {
            const horasFase = fila.horasAsignadas * (fila.porcentajes[faseIndex] || 0) / 100;
            return sum + horasFase;
        }, 0);
    }

    public isOverAllocated(fila: FilaAsignacionFaseDTO): boolean {
        return this.getTotalPorPersona(fila) > 100;
    }

    public getCellClass(fila: FilaAsignacionFaseDTO, faseIndex: number): string {
        const fase = this.matrizData().fases[faseIndex];
        const cellKey = `${fila.idProyectoPersonal}-${fase.idFase}`;
        const state = this.savingStates()[cellKey] || 'idle';

        let borderColor: string;
        switch (state) {
            case 'saving': borderColor = 'border-blue-400'; break;
            case 'success': borderColor = 'border-green-400'; break;
            case 'error': borderColor = 'border-red-400'; break;
            default: borderColor = 'border-gray-200';
        }

        return `w-full px-2 py-1 text-sm text-center border rounded focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors ${borderColor}`;
    }

    public getHorasFase(fila: FilaAsignacionFaseDTO, faseIndex: number): number {
        return fila.horasAsignadas * (fila.porcentajes[faseIndex] || 0) / 100;
    }

    public getTotalHorasPersona(fila: FilaAsignacionFaseDTO): number {
        return fila.porcentajes.reduce((sum, p) => sum + fila.horasAsignadas * p / 100, 0);
    }

    public getTotalHorasGeneral(): number {
        return this.matrizData().filas.reduce((sum, fila) => sum + this.getTotalHorasPersona(fila), 0);
    }

    public getSelectedProyecto(): Proyecto | undefined {
        return this.proyectos().find(p => p.idProyecto === this.selectedProyectoId());
    }
}
