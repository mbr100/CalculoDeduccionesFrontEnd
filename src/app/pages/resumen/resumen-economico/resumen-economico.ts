import {Component, computed, inject, OnInit, Signal, signal, WritableSignal} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {Sidebar} from '../../../components/personal/sidebar/sidebar';
import {EconomicoService} from '../../../services/economico-service';
import {ProyectoService} from '../../../services/proyecto-service';
import {FaseProyectoService} from '../../../services/fase-proyecto-service';
import {GastoProyectoDetalladoDTO} from '../../../models/resumen.model';
import {Proyecto} from '../../../models/proyecto-economico';
import {ResumenGastoFaseDTO, ResumenGastoFasePersonaDTO} from '../../../models/fase-proyecto';
import {SavingState} from '../../../models/savingState';

@Component({
  selector: 'app-resumen-economico',
  imports: [Sidebar, FormsModule],
  templateUrl: './resumen-economico.html',
  styleUrl: './resumen-economico.css'
})
export class ResumenEconomico implements OnInit {
    private route: ActivatedRoute = inject(ActivatedRoute);
    private economicoService: EconomicoService = inject(EconomicoService);
    private proyectoService: ProyectoService = inject(ProyectoService);
    private faseProyectoService: FaseProyectoService = inject(FaseProyectoService);
    public economicoId: number;

    // Tabs
    public activeTab: WritableSignal<string> = signal('proyecto');
    public tabs = [
        {id: 'proyecto', label: 'Por Proyecto', icon: 'fas fa-project-diagram'},
        {id: 'fase', label: 'Por Fase', icon: 'fas fa-layer-group'},
    ];

    // Fases tab data
    public proyectos: WritableSignal<Proyecto[]> = signal<Proyecto[]>([]);
    public selectedFaseProyectoId: WritableSignal<number | null> = signal(null);
    public resumenFases: WritableSignal<ResumenGastoFaseDTO[]> = signal<ResumenGastoFaseDTO[]>([]);
    public desgloseFasePersona: WritableSignal<ResumenGastoFasePersonaDTO[]> = signal<ResumenGastoFasePersonaDTO[]>([]);
    public fasesLoading: WritableSignal<boolean> = signal(false);

    // Signals principales
    public gastosProyectos: WritableSignal<GastoProyectoDetalladoDTO[]> = signal<GastoProyectoDetalladoDTO[]>([]);
    public loading: WritableSignal<boolean> = signal(false);
    public savingStates: WritableSignal<{ [key: string]: SavingState }> = signal<{ [key: string]: SavingState }>({});

    // Computed signals
    public totalProyectos: Signal<number> = computed(() => this.gastosProyectos().length);

    public tiposGasto: Signal<string[]> = computed(() => {
        const proyectos = this.gastosProyectos();
        if (proyectos.length === 0) return [];

        // Obtener tipos de gasto del primer proyecto (asumiendo que todos tienen los mismos)
        return proyectos[0].partidas.map(p => p.tipoGasto);
    });

    public constructor() {
        this.economicoId = +this.route.snapshot.paramMap.get('id')!;
    }

    public ngOnInit(): void {
        this.loadData();
    }

    // Métodos de carga de datos
    public loadData(): void {
        this.loading.set(true);

        try {
            this.economicoService.resumenGastoProyectoEconomico(this.economicoId).subscribe({
                next: (response: GastoProyectoDetalladoDTO[]) => {
                    this.gastosProyectos.set(response);
                    this.loading.set(false);
                },
                error: (error) => {
                    console.error('Error cargando gastos de proyectos:', error);
                    this.loading.set(false);
                }
            });
        } catch (error) {
            console.error('Error cargando datos:', error);
            this.loading.set(false);
        }
    }

    // Métodos de actualización ELIMINADOS - Solo lectura
    // Los datos no se pueden modificar desde esta vista

    // Método para exportar a Excel
    public exportToExcel(): void {
        if (!this.hasData()) return;

        const worksheetData = [];
        const proyectos = this.gastosProyectos();
        const tiposGasto = this.tiposGasto();

        // Headers
        const headers = ['Proyecto', 'Título', ...tiposGasto, '% Deducción', 'Deducción', 'Total'];
        worksheetData.push(headers);

        // Datos de proyectos
        proyectos.forEach(proyecto => {
            const row = [
                proyecto.acronimo,
                proyecto.titulo,
                ...tiposGasto.map(tipo => this.getImportePartida(proyecto, tipo)),
                proyecto.porcentajeDeduccion,
                proyecto.deduccion,
                proyecto.total
            ];
            worksheetData.push(row);
        });

        // Fila vacía para separar
        worksheetData.push([]);

        // Fila de % deducción promedio
        const promediosRow = [
            '% DEDUCCIÓN PROMEDIO',
            '',
            ...tiposGasto.map(tipo => `${this.getPromedioDeduccionPorPartida(tipo)}%`),
            `${this.getPromedioDeduccionGeneral()}%`,
            '',
            ''
        ];
        worksheetData.push(promediosRow);

        // Fila de totales
        const totalesRow = [
            'TOTAL POR PARTIDA',
            '',
            ...tiposGasto.map(tipo => this.getTotalPorPartida(tipo)),
            '',
            this.getTotalDeducciones(),
            this.getTotalGeneral()
        ];
        worksheetData.push(totalesRow);

        // Crear y descargar Excel
        this.downloadExcel(worksheetData, 'Matriz_Gastos_Proyectos');
    }

    private downloadExcel(data: any[][], filename: string): void {
        // Crear contenido CSV
        const csvContent = data.map(row =>
            row.map(cell => {
                if (typeof cell === 'string' && cell.includes(',')) {
                    return `"${cell}"`;
                }
                return cell;
            }).join(',')
        ).join('\n');

        // Crear Blob y descargar
        const blob = new Blob(['\ufeff' + csvContent], {
            type: 'text/csv;charset=utf-8;'
        });

        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Métodos auxiliares
    public getImportePartida(proyecto: GastoProyectoDetalladoDTO, tipoGasto: string): number {
        const partida = proyecto.partidas.find(p => p.tipoGasto === tipoGasto);
        return partida?.importe || 0;
    }

    public getIconoPartida(tipoGasto: string): string {
        const iconos: { [key: string]: string } = {
            'Personal': 'fas fa-users text-blue-500',
            'Colaboraciones Externas': 'fas fa-handshake text-green-500',
            'Materiales Fungibles': 'fas fa-box text-orange-500',
            'Amortizaciones': 'fas fa-chart-line text-purple-500',
            'Otros': 'fas fa-ellipsis-h text-gray-500'
        };
        return iconos[tipoGasto] || 'fas fa-euro-sign text-gray-500';
    }
    public getSavingState(idProyecto: number, tipoGasto: string): SavingState {
        const key = `${idProyecto}-${tipoGasto}`;
        return this.savingStates()[key] || 'idle';
    }

    // Métodos de cálculo y estadísticas
    public getTotalPorPartida(tipoGasto: string): number {
        return this.gastosProyectos().reduce((sum, proyecto) => {
            const partida = proyecto.partidas.find(p => p.tipoGasto === tipoGasto);
            return sum + (partida?.importe || 0);
        }, 0);
    }

    public getTotalGeneral(): number {
        return this.gastosProyectos().reduce((sum, proyecto) => sum + proyecto.total, 0);
    }

    public getTotalDeducciones(): number {
        return this.gastosProyectos().reduce((sum, proyecto) => sum + proyecto.deduccion, 0);
    }

    public getPromedioPorProyecto(): number {
        const total = this.getTotalGeneral();
        const numProyectos = this.totalProyectos();
        return numProyectos > 0 ? total / numProyectos : 0;
    }

    // Métodos para calcular porcentajes de deducción promedio
    public getPromedioDeduccionPorPartida(tipoGasto: string): number {
        const proyectosConPartida = this.gastosProyectos().filter(p =>
            p.partidas.some(partida => partida.tipoGasto === tipoGasto && partida.importe > 0)
        );

        if (proyectosConPartida.length === 0) return 0;

        const sumaDeduccion = proyectosConPartida.reduce((sum, proyecto) =>
            sum + proyecto.porcentajeDeduccion, 0
        );

        return Math.round(sumaDeduccion / proyectosConPartida.length);
    }

    public getPromedioDeduccionGeneral(): number {
        const proyectos = this.gastosProyectos();
        if (proyectos.length === 0) return 0;

        const suma = proyectos.reduce((sum, p) => sum + p.porcentajeDeduccion, 0);
        return Math.round(suma / proyectos.length);
    }

    public getPartidaMayor(): { tipo: string; total: number } {
        const tiposGasto = this.tiposGasto();
        let mayorTipo = '';
        let mayorTotal = 0;

        tiposGasto.forEach(tipo => {
            const total = this.getTotalPorPartida(tipo);
            if (total > mayorTotal) {
                mayorTotal = total;
                mayorTipo = tipo;
            }
        });

        return { tipo: mayorTipo || '-', total: mayorTotal };
    }

    // Método para formatear moneda
    public formatCurrency(value: number): string {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }

    // Métodos de conveniencia para el template
    public isLoading(): boolean {
        return this.loading();
    }

    public hasData(): boolean {
        return this.gastosProyectos().length > 0;
    }

    // ---- Tabs ----
    public setActiveTab(tabId: string): void {
        this.activeTab.set(tabId);
        if (tabId === 'fase' && this.proyectos().length === 0) {
            this.loadProyectos();
        }
    }

    public getTabButtonClass(tabId: string): string {
        const base = 'flex items-center space-x-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200';
        return this.activeTab() === tabId
            ? `${base} bg-white text-green-600 shadow-sm`
            : `${base} text-gray-600 hover:text-gray-900 hover:bg-gray-200`;
    }

    // ---- Fases tab ----
    private loadProyectos(): void {
        this.proyectoService.getProyectosByEconomico(this.economicoId, 0, 100).subscribe({
            next: (response) => this.proyectos.set(response.content),
            error: (error) => console.error('Error cargando proyectos:', error)
        });
    }

    public onFaseProyectoChange(idProyecto: string): void {
        const id = parseInt(idProyecto, 10);
        if (isNaN(id)) {
            this.selectedFaseProyectoId.set(null);
            this.resumenFases.set([]);
            this.desgloseFasePersona.set([]);
            return;
        }
        this.selectedFaseProyectoId.set(id);
        this.loadResumenFases(id);
    }

    private loadResumenFases(idProyecto: number): void {
        this.fasesLoading.set(true);
        this.faseProyectoService.getResumenGastoFases(idProyecto).subscribe({
            next: (data) => {
                this.resumenFases.set(data);
                // Also load desglose
                this.faseProyectoService.getDesgloseFasePersona(idProyecto).subscribe({
                    next: (desglose) => {
                        this.desgloseFasePersona.set(desglose);
                        this.fasesLoading.set(false);
                    },
                    error: (error) => {
                        console.error('Error cargando desglose:', error);
                        this.fasesLoading.set(false);
                    }
                });
            },
            error: (error) => {
                console.error('Error cargando resumen fases:', error);
                this.fasesLoading.set(false);
            }
        });
    }

    public getTotalFases(): number {
        return this.resumenFases().reduce((sum, f) => sum + f.total, 0);
    }

    public getTotalDeduccionesFases(): number {
        return this.resumenFases().reduce((sum, f) => sum + f.deduccion, 0);
    }

    public getTotalFasePorPartida(tipoGasto: string): number {
        return this.resumenFases().reduce((sum, fase) => {
            const partida = fase.partidas.find(p => p.tipoGasto === tipoGasto);
            return sum + (partida?.importe || 0);
        }, 0);
    }

    public getFaseTiposGasto(): string[] {
        const fases = this.resumenFases();
        if (fases.length === 0) return [];
        return fases[0].partidas.map(p => p.tipoGasto);
    }

    public getFaseImportePartida(fase: ResumenGastoFaseDTO, tipoGasto: string): number {
        const partida = fase.partidas.find(p => p.tipoGasto === tipoGasto);
        return partida?.importe || 0;
    }

    public getDesgloseByFase(idFase: number): ResumenGastoFasePersonaDTO[] {
        return this.desgloseFasePersona().filter(d => d.idFase === idFase);
    }

    public getSelectedFaseProyecto(): Proyecto | undefined {
        return this.proyectos().find(p => p.idProyecto === this.selectedFaseProyectoId());
    }

}
