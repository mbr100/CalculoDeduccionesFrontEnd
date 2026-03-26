import {Component, computed, effect, inject, Input, OnInit, Signal, signal, WritableSignal} from '@angular/core';
import {EconomicoPersonalService} from '../../../services/economico-personal-service';
import {CosteHoraPersonalDTO} from '../../../models/personal-economico';
import {getVisiblePages, SavingState} from '../../../models/savingState';
import {PaginacionResponse} from '../../../models/paginacion-response';

interface ResumenCostePagina {
    personal: number;
    retribucionTotal: number;
    costeSS: number;
    horasMaximas: number;
    costeHoraMedio: number;
}

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
    public searchTerm: WritableSignal<string> = signal('');
    public loading: WritableSignal<boolean> = signal(false);
    public savingStates: WritableSignal<{ [key: number]: SavingState }> = signal<{ [key: number]: SavingState }>({});

    // Signals para paginación
    public currentPage: WritableSignal<number> = signal(0);
    public pageSize: WritableSignal<number> = signal(10);
    public totalElements: WritableSignal<number> = signal(0);
    public totalPages: WritableSignal<number> = signal(0);

    // Computed signals
    public visiblePages: Signal<number[]> = computed((): number[] => getVisiblePages(this.currentPage(), this.totalPages()));
    public filteredCostesHora: Signal<CosteHoraPersonalDTO[]> = computed((): CosteHoraPersonalDTO[] => {
        const query = this.normalizeText(this.searchTerm());
        if (!query) {
            return this.costesHora();
        }

        return this.costesHora().filter(item =>
            this.normalizeText(item.nombre).includes(query)
            || this.normalizeText(item.dni).includes(query)
            || this.normalizeText(item.puesto).includes(query)
            || this.normalizeText(item.titulacion).includes(query)
            || this.normalizeText(item.departamento).includes(query)
        );
    });
    public resumenPagina: Signal<ResumenCostePagina> = computed((): ResumenCostePagina => {
        const resumen = this.filteredCostesHora().reduce((acumulado, item) => {
            acumulado.personal += 1;
            acumulado.retribucionTotal += this.normalizeValue(item.retribucionTotal);
            acumulado.costeSS += this.normalizeValue(item.costeSS);
            acumulado.horasMaximas += this.normalizeValue(item.horasMaximas);

            return acumulado;
        }, {
            personal: 0,
            retribucionTotal: 0,
            costeSS: 0,
            horasMaximas: 0
        });

        return {
            ...resumen,
            costeHoraMedio: resumen.horasMaximas > 0
                ? (resumen.retribucionTotal + resumen.costeSS) / resumen.horasMaximas
                : 0
        };
    });

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
        if (this.currentPage() === 0) {
            this.loadDataInternal();
            return;
        }

        this.currentPage.set(0);
    }

    private loadDataInternal(): void {
        if (!Number.isFinite(this.idEconomico)) {
            this.costesHora.set([]);
            this.totalElements.set(0);
            this.totalPages.set(0);
            this.loading.set(false);
            return;
        }

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

    private normalizeValue(value: number | null | undefined): number {
        return Number.isFinite(value) ? Number(value) : 0;
    }

    private normalizeText(value: string | null | undefined): string {
        return (value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    private formatNumber(value: number | null | undefined, minimumFractionDigits: number, maximumFractionDigits: number): string {
        const normalizedValue = this.normalizeValue(value);
        const sign = normalizedValue < 0 ? '-' : '';
        const absoluteValue = Math.abs(normalizedValue);
        const fractionDigits = absoluteValue % 1 === 0 ? minimumFractionDigits : maximumFractionDigits;
        const fixedValue = absoluteValue.toFixed(fractionDigits);
        const [integerPart, decimalPart] = fixedValue.split('.');
        const integerWithGrouping = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        if (!decimalPart) {
            return `${sign}${integerWithGrouping}`;
        }

        return `${sign}${integerWithGrouping},${decimalPart}`;
    }

    public formatMoney(value: number | null | undefined): string {
        return `${this.formatNumber(value, 2, 2)} €`;
    }

    public formatHours(value: number | null | undefined): string {
        return `${this.formatNumber(value, 0, 2)} h`;
    }

    public formatCosteHora(value: number | null | undefined): string {
        return `${this.formatNumber(value, 2, 2)} €/h`;
    }

    public formatPercent(value: number | null | undefined): string {
        return `${this.formatNumber(value, 2, 2)} %`;
    }

    public getTitulacion(item: CosteHoraPersonalDTO): string {
        return item.titulacion?.trim() || 'Sin titulación';
    }

    public getTextValue(value: string | null | undefined, fallback: string): string {
        return value?.trim() || fallback;
    }

    public onSearch(value: string): void {
        this.searchTerm.set(value);
    }

    public clearSearch(): void {
        this.searchTerm.set('');
    }

    public hasSearchActive(): boolean {
        return this.searchTerm().trim().length > 0;
    }

    public hasResultadosBusqueda(): boolean {
        return this.filteredCostesHora().length > 0;
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
        const baseClass = 'relative inline-flex min-w-10 items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium transition';
        if (this.currentPage() === page) {
            return `${baseClass} z-10 border-indigo-500 bg-indigo-50 text-indigo-700`;
        }
        return `${baseClass} border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50`;
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

    public getCurrentPageStart(): number {
        if (this.totalElements() === 0) {
            return 0;
        }

        return this.currentPage() * this.pageSize() + 1;
    }

    public getCurrentPageEnd(): number {
        return Math.min((this.currentPage() + 1) * this.pageSize(), this.totalElements());
    }
}
