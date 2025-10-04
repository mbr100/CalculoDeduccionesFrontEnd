import {Component, computed, inject, Input, OnInit, Signal, signal, WritableSignal} from '@angular/core';
import {ProyectoService} from '../../../services/proyecto-service';
import {ActualizarAsignacionDTO, FilaAsignacionDTO, MatrizAsignacionesDTO} from '../../../models/asignaciones.proyecto';
import {SavingState} from '../../../models/savingState';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-asignar-personal-proyecto',
  imports: [],
  templateUrl: './asignar-personal-proyecto.html',
  styleUrl: './asignar-personal-proyecto.css'
})
export class AsignarPersonalProyecto implements OnInit {
    @Input()
    public idEconomico!: number;

    private proyectoService: ProyectoService = inject(ProyectoService);

    // Signals principales
    public matrizData: WritableSignal<MatrizAsignacionesDTO> = signal<MatrizAsignacionesDTO>({
        proyectos: [],
        filas: []
    });

    public loading: WritableSignal<boolean> = signal(false);
    public savingStates: WritableSignal<{ [key: string]: SavingState }> = signal<{ [key: string]: SavingState }>({});

    // Computed signals para estadísticas
    public totalPersonas: Signal<number> = computed(() => this.matrizData().filas.length);
    public totalProyectos: Signal<number> = computed(() => this.matrizData().proyectos.length);

    public constructor() {}

    public ngOnInit(): void {
        this.loadData();
    }

    // Métodos de carga de datos
    public loadData(): void {
        this.loading.set(true);

        try {
            this.proyectoService.getAsignacionesPerosnalProyecto(this.idEconomico).subscribe({
                next: (response: MatrizAsignacionesDTO) => {
                    this.matrizData.set(response);
                    this.loading.set(false);
                },
                error: (error) => {
                    console.error('Error cargando matriz de asignaciones:', error);
                    this.loading.set(false);
                }
            });
        } catch (error) {
            console.error('Error cargando datos:', error);
            this.loading.set(false);
        }
    }

    // Métodos de actualización con validación
    public updateHoras(idPersonal: number, proyectoIndex: number, value: string): void {
        const horas = this.parseNumberValue(value);
        const fila = this.matrizData().filas.find(f => f.idPersonal === idPersonal);

        if (!fila) return;

        // Validar que no exceda las horas máximas
        const horasOtrosProyectos = fila.horas.reduce((sum, h, i) =>
            i !== proyectoIndex ? sum + (h || 0) : sum, 0
        );

        const horasRestantesDisponibles = fila.horasMaximas - horasOtrosProyectos;

        if (horas > horasRestantesDisponibles) {
            this.showValidationError(
                `No puedes asignar ${horas}h. Solo quedan ${horasRestantesDisponibles}h disponibles para ${fila.nombreCompleto}`
            );
            return;
        }

        const idProyecto = this.matrizData().proyectos[proyectoIndex]?.idProyecto;
        if (!idProyecto) return;

        const key = `${idPersonal}-${proyectoIndex}`;

        this.savingStates.update(states => ({
            ...states,
            [key]: 'saving'
        }));

        try {
            const actualizacion: ActualizarAsignacionDTO = {
                idPersonal,
                idProyecto,
                horas
            };

            this.proyectoService.actualizarAsignacion(actualizacion).subscribe({
                next: () => {
                    this.savingStates.update(states => ({
                        ...states,
                        [key]: 'success'
                    }));

                    // Actualizar el valor en la matriz local
                    this.matrizData.update(matriz => ({
                        ...matriz,
                        filas: matriz.filas.map(fila =>
                            fila.idPersonal === idPersonal
                                ? { ...fila, horas: fila.horas.map((h, i) => i === proyectoIndex ? horas : h) }
                                : fila
                        )
                    }));

                    setTimeout(() => {
                        this.savingStates.update(states => ({
                            ...states,
                            [key]: 'idle'
                        }));
                    }, 2000);
                },
                error: (error) => {
                    console.error('Error actualizando asignación:', error);
                    this.handleSavingError(key);
                }
            });
        } catch (error) {
            console.error('Error actualizando horas:', error);
            this.handleSavingError(key);
        }
    }

    // Validación en tiempo real mientras el usuario escribe
    public validateHorasMaximas(event: Event, fila: FilaAsignacionDTO): void {
        const input = event.target as HTMLInputElement;
        const value = this.parseNumberValue(input.value);

        // Encontrar el índice del proyecto actual
        const proyectoIndex = Array.from(input.closest('tr')?.querySelectorAll('input[type="number"]') || [])
            .indexOf(input);

        if (proyectoIndex === -1) return;

        // Calcular horas de otros proyectos
        const horasOtrosProyectos = fila.horas.reduce((sum, h, i) =>
            i !== proyectoIndex ? sum + (h || 0) : sum, 0
        );

        const horasRestantesDisponibles = fila.horasMaximas - horasOtrosProyectos;

        // Aplicar estilos visuales según la validación
        if (value > horasRestantesDisponibles) {
            input.classList.add('border-red-500', 'bg-red-50');
            input.classList.remove('border-gray-200', 'border-green-500');
            input.title = `Excedes el límite. Máximo disponible: ${horasRestantesDisponibles}h`;
        } else {
            input.classList.remove('border-red-500', 'bg-red-50');
            input.classList.add('border-green-500');
            input.title = `Válido. Disponibles: ${horasRestantesDisponibles}h`;
        }
    }

    public onKeyPress(event: KeyboardEvent, idPersonal: number, proyectoIndex: number, value: string): void {
        if (event.key === 'Enter') {
            (event.target as HTMLInputElement).blur();
            this.updateHoras(idPersonal, proyectoIndex, value);
        }
    }

    // Métodos auxiliares
    private parseNumberValue(value: string): number {
        if (value === null || value === undefined || value === '') {
            return 0;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : Math.max(0, parsed);
    }

    private handleSavingError(key: string): void {
        this.savingStates.update(states => ({
            ...states,
            [key]: 'error'
        }));

        setTimeout(() => {
            this.savingStates.update(states => ({
                ...states,
                [key]: 'idle'
            }));
        }, 3000);
    }

    public getSavingState(idPersonal: number, proyectoIndex: number): SavingState {
        const key = `${idPersonal}-${proyectoIndex}`;
        return this.savingStates()[key] || 'idle';
    }

    public getInputClass(idPersonal: number, proyectoIndex: number): string {
        const savingState = this.getSavingState(idPersonal, proyectoIndex);
        let stateClass: string;

        switch (savingState) {
            case 'saving':
                stateClass = 'saving';
                break;
            case 'success':
                stateClass = 'success';
                break;
            case 'error':
                stateClass = 'error';
                break;
            default:
                stateClass = '';
        }

        return `input-horas px-3 py-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${stateClass}`;
    }

    // Métodos de cálculo y validación
    public getTotalPorPersona(horas: number[]): number {
        return horas.reduce((sum, h) => sum + (h || 0), 0);
    }

    public getTotalPorProyecto(proyectoIndex: number): number {
        return this.matrizData().filas.reduce((sum, fila) =>
            sum + (fila.horas[proyectoIndex] || 0), 0
        );
    }

    public getTotalGeneral(): number {
        return this.matrizData().filas.reduce((sum, fila) =>
            sum + this.getTotalPorPersona(fila.horas), 0
        );
    }

    public getTotalHorasMaximas(): number {
        return this.matrizData().filas.reduce((sum, fila) =>
            sum + (fila.horasMaximas || 0), 0
        );
    }

    public getTotalHorasRestantes(): number {
        return this.matrizData().filas.reduce((sum, fila) =>
            sum + this.getHorasRestantes(fila), 0
        );
    }

    // Métodos específicos para horas restantes
    public getHorasRestantes(fila: FilaAsignacionDTO): number {
        const totalAsignadas = this.getTotalPorPersona(fila.horas);
        return Math.max(0, fila.horasMaximas - totalAsignadas);
    }

    public getMaxHorasDisponibles(fila: FilaAsignacionDTO, proyectoIndex: number): number {
        const horasOtrosProyectos = fila.horas.reduce((sum, h, i) =>
            i !== proyectoIndex ? sum + (h || 0) : sum, 0
        );
        return Math.max(0, fila.horasMaximas - horasOtrosProyectos);
    }

    public getHorasRestantesClass(fila: FilaAsignacionDTO): string {
        const restantes = this.getHorasRestantes(fila);
        if (restantes === 0) return 'bg-red-50';
        if (restantes <= 5) return 'bg-orange-50';
        return 'bg-green-50';
    }

    public getHorasRestantesSpanClass(fila: FilaAsignacionDTO): string {
        const restantes = this.getHorasRestantes(fila);
        const baseClass = 'inline-flex items-center px-2 py-1 rounded-full text-sm font-medium';

        if (restantes === 0) {
            return `${baseClass} bg-red-100 text-red-800`;
        }
        if (restantes <= 5) {
            return `${baseClass} bg-orange-100 text-orange-800`;
        }
        return `${baseClass} bg-green-100 text-green-800`;
    }

    // Metodo para mostrar errores de validación
    private showValidationError(message: string): void {
        Swal.fire({
            icon: 'error',
            title: 'Error de Validación',
            text: message,
            confirmButtonText: 'Aceptar'
        }).then()
    }

    public getPromedioPorPersona(): number {
        const total = this.getTotalGeneral();
        const personas = this.totalPersonas();
        return personas > 0 ? Math.round((total / personas) * 100) / 100 : 0;
    }

    public getPromedioPorProyecto(): number {
        const total = this.getTotalGeneral();
        const proyectos = this.totalProyectos();
        return proyectos > 0 ? Math.round((total / proyectos) * 100) / 100 : 0;
    }

    public getMaximoIndividual(): number {
        return Math.max(...this.matrizData().filas.map(fila =>
            this.getTotalPorPersona(fila.horas)
        ), 0);
    }

    // Métodos de conveniencia para el template
    public isLoading(): boolean {
        return this.loading();
    }

    public hasData(): boolean {
        return this.matrizData().filas.length > 0 && this.matrizData().proyectos.length > 0;
    }
}
