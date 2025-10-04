import {Component, computed, inject, OnInit, Signal, signal, WritableSignal} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {EconomicoService} from '../../../services/economico-service';
import {GastoProyectoDetalladoDTO} from '../../../models/resumen.model';
import {SavingState} from '../../../models/savingState';

@Component({
  selector: 'app-resumen-economico',
  imports: [],
  templateUrl: './resumen-economico.html',
  styleUrl: './resumen-economico.css'
})
export class ResumenEconomico implements OnInit {
    private route: ActivatedRoute = inject(ActivatedRoute);
    private economicoService: EconomicoService = inject(EconomicoService);
    public economicoId: number;

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

}
