import {Component, computed, effect, inject, Input, OnInit, Signal, signal, WritableSignal} from '@angular/core';
import {EconomicoPersonalService} from '../../../services/economico-personal-service';
import {CosteHoraPersonalDTO} from '../../../models/personal-economico';
import {getVisiblePages, SavingState} from '../../../models/savingState';
import {PaginacionResponse} from '../../../models/paginacion-response';
@Component({
    selector: 'app-resumen-coste-hora-personal',
    imports: [],
    templateUrl: './resumen-coste-hora-personal.html',
    styleUrl: './resumen-coste-hora-personal.css'
})
export class ResumenCosteHoraPersonal implements OnInit {
    @Input() idEconomico!: number;
    private economicoPersonalService: EconomicoPersonalService = inject(EconomicoPersonalService);

    // Signals principales
    public costesHora: WritableSignal<CosteHoraPersonalDTO[]> = signal<CosteHoraPersonalDTO[]>([]);
    public loading: WritableSignal<boolean> = signal(false);
    public savingStates: WritableSignal<{ [key: number]: SavingState }> = signal<{ [key: number]: SavingState }>({});

    // Signals para paginación
    public currentPage: WritableSignal<number> = signal(0);
    public pageSize: WritableSignal<number> = signal(10);
    public totalElements: WritableSignal<number> = signal(0);
    public totalPages: WritableSignal<number> = signal(0);

    // Computed signals
    public visiblePages: Signal<number[]> = computed((): number[] => getVisiblePages(this.currentPage(), this.totalPages()));

    // Para acceder a Math en el template
    public Math: Math = Math;

    public constructor() {
        // Effect para recargar datos cuando cambie la página
        effect(() => {
            const page = this.currentPage();
            if (page >= 0) {
                this.loadDataInternal();
            }
        });
    }

    public ngOnInit(): void {
        this.loadData();
    }

    // Métodos de carga de datos
    public loadData(): void {
        this.currentPage.set(0);
    }

    private loadDataInternal(): void {
        this.loading.set(true);
        try {
            this.economicoPersonalService.obtenerCosteHoraPorIdEconomico(this.idEconomico, this.currentPage(), this.pageSize()).subscribe({
                next: (response: PaginacionResponse<CosteHoraPersonalDTO>) => {
                    this.costesHora.set(response.content);
                    this.totalElements.set(response.totalElements);
                    this.totalPages.set(response.totalPages);
                    this.loading.set(false);
                },
                error: (error) => {
                    console.error('Error cargando costes hora:', error);
                    this.loading.set(false);
                }
            });
        } catch (error) {
            console.error('Error cargando datos:', error);
            this.loading.set(false);
        }
    }

    // Mtodo para recalcular costes
    public recalcularCostes(): void {
        this.loading.set(true);

        this.economicoPersonalService.recalcularCostesHora(this.idEconomico, this.currentPage(), this.pageSize()).subscribe({
            next: () => {
                this.loadData(); // Recargar datos actualizados
            },
            error: (error) => {
                console.error('Error recalculando costes:', error);
                this.loading.set(false);
            }
        });
    }

    public formatCurrency(value: number): string {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(value || 0);
    }

    public formatHours(value: number): string {
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(value || 0) + ' h';
    }

    public formatPercent(value: number): string {
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value || 0) + ' %';
    }

    public formatOrigenATEP(origen: string | null): string {
        if (!origen) return '-';
        if (origen.startsWith('CUADRO_II_CLAVE_')) {
            return 'Cuadro II (' + origen.replace('CUADRO_II_CLAVE_', '') + ')';
        }
        if (origen.startsWith('CUADRO_I_CNAE_')) {
            return 'CNAE ' + origen.replace('CUADRO_I_CNAE_', '');
        }
        return origen;
    }

    // Métodos de paginación
    public previousPage(): void {
        if (this.currentPage() > 0) {
            this.currentPage.update(page => page - 1);
        }
    }

    public nextPage(): void {
        if (this.currentPage() < this.totalPages() - 1) {
            this.currentPage.update(page => page + 1);
        }
    }

    public goToPage(page: number): void {
        this.currentPage.set(page);
    }

    public getPageButtonClass(page: number): string {
        const baseClass = 'relative inline-flex items-center px-4 py-2 border text-sm font-medium';
        if (this.currentPage() === page) {
            return `${baseClass} z-10 bg-blue-50 border-blue-500 text-blue-600`;
        }
        return `${baseClass} bg-white border-gray-300 text-gray-500 hover:bg-gray-50`;
    }

    // Métodos de conveniencia para el template
    public isLoading(): boolean {
        return this.loading();
    }

    public hasCostesHora(): boolean {
        return this.costesHora().length > 0;
    }

    public canGoPrevious(): boolean {
        return this.currentPage() > 0;
    }

    public canGoNext(): boolean {
        return this.currentPage() < this.totalPages() - 1;
    }
}
