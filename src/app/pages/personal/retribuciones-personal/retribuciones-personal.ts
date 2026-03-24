import {Component, computed, effect, inject, Input, OnInit, Signal, signal, WritableSignal} from '@angular/core';
import {EconomicoPersonalService} from '../../../services/economico-personal-service';
import {PaginacionResponse} from '../../../models/paginacion-response';
import {actualizarRetribucionDTO, RetribucionesPersonalDTO} from '../../../models/personal-economico';
import {getVisiblePages} from '../../../models/savingState';

type SavingState = 'idle' | 'saving' | 'success' | 'error';

@Component({
    selector: 'app-retribuciones-personal',
    imports: [],
    templateUrl: './retribuciones-personal.html',
    styles: ``
})
export class RetribucionesPersonal implements OnInit {
    @Input() idEconomico!: number;
    private economicoPersonalService: EconomicoPersonalService = inject(EconomicoPersonalService);

    // Signals para el estado del componente
    public retribuciones: WritableSignal<RetribucionesPersonalDTO[]> = signal<RetribucionesPersonalDTO[]>([]);
    public loading: WritableSignal<boolean> = signal(false);
    public savingStates:WritableSignal<{[ key: number]: SavingState }> = signal<{ [key: number]: SavingState }>({});

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
        effect((): void => {
            const page: number = this.currentPage();
            if (page >= 0) {
                this.loadDataInternal();
            }
        });
    }

    public ngOnInit(): void {
        this.loadData();
    }

    public loadData(): void {
        this.currentPage.set(0); // Esto disparará el effect
    }

    private loadDataInternal(): void {
        this.loading.set(true);
        try {
            this.economicoPersonalService.obtenerRetribucionesPorIdEconomico(
                this.idEconomico,
                this.currentPage(),
                this.pageSize()
            ).subscribe({
                next: (response: PaginacionResponse<RetribucionesPersonalDTO>) => {
                    this.retribuciones.set(response.content);
                    this.totalElements.set(response.totalElements);
                    this.totalPages.set(response.totalPages);
                    this.loading.set(false);
                },
                error: (error) => {
                    console.error('Error cargando retribuciones:', error);
                    this.loading.set(false);
                }
            });
        } catch (error) {
            console.error('Error cargando datos:', error);
            this.loading.set(false);
        }
    }

    public updateField(idRetribucion: number, field: keyof RetribucionesPersonalDTO, value: number): void {
        // Actualizar el estado de guardado de forma inmutable
        this.savingStates.update(states => ({
            ...states,
            [idRetribucion]: 'saving'
        }));

        try {
            const actualizacion: actualizarRetribucionDTO = {
                idRetribucion: idRetribucion,
                campoActualizado: field,
                valor: value
            };

            this.economicoPersonalService.actualizarRetribucion(actualizacion).subscribe({
                next: () => {
                    this.savingStates.update(states => ({
                        ...states,
                        [idRetribucion]: 'success'
                    }));

                    // Actualizar el valor en la lista local
                    this.retribuciones.update(items =>
                        items.map(item =>
                            item.idRetribucion === idRetribucion
                                ? { ...item, [field]: value }
                                : item
                        )
                    );

                    setTimeout(() => {
                        this.savingStates.update(states => ({
                            ...states,
                            [idRetribucion]: 'idle'
                        }));
                    }, 2000);
                },
                error: () => {
                    this.handleSavingError(idRetribucion);
                }
            });

            console.log(`Actualizando campo ${field} para retribución ID ${idRetribucion} con valor ${value}`);
        } catch (error) {
            console.error('Error actualizando campo:', error);
            this.handleSavingError(idRetribucion);
        }
    }

    private handleSavingError(idRetribucion: number): void {
        this.savingStates.update(states => ({
            ...states,
            [idRetribucion]: 'error'
        }));

        setTimeout(() => {
            this.savingStates.update(states => ({
                ...states,
                [idRetribucion]: 'idle'
            }));
        }, 3000);
    }

    public formatEuro(value: number): string {
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value || 0) + ' €';
    }

    public onFocus(event: FocusEvent): void {
        const input = event.target as HTMLInputElement;
        const raw = this.parseInputValue(input.value);
        input.value = raw === 0 ? '' : raw.toString().replace('.', ',');
    }

    public onBlurField(event: FocusEvent, idRetribucion: number, field: keyof RetribucionesPersonalDTO): void {
        const input = event.target as HTMLInputElement;
        const value = this.parseInputValue(input.value);
        input.value = this.formatEuro(value);

        // Actualizar el modelo local
        this.retribuciones.update(items =>
            items.map(item =>
                item.idRetribucion === idRetribucion
                    ? { ...item, [field]: value }
                    : item
            )
        );

        this.updateField(idRetribucion, field, value);
    }

    public onKeyPressField(event: KeyboardEvent, idRetribucion: number, field: keyof RetribucionesPersonalDTO): void {
        if (event.key === 'Enter') {
            (event.target as HTMLInputElement).blur();
        }
    }

    private parseInputValue(value: string): number {
        if (!value || value.trim() === '') return 0;
        // Quitar símbolo €, espacios, y puntos de miles; cambiar coma decimal por punto
        const cleaned = value.replace(/[€\s]/g, '').replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }

    public getInputClass(idRetribucion: number): string {
        const savingState = this.savingStates()[idRetribucion] || 'idle';
        let borderColor: string;

        switch (savingState) {
            case 'saving':
                borderColor = 'border-blue-400';
                break;
            case 'success':
                borderColor = 'border-green-400';
                break;
            case 'error':
                borderColor = 'border-red-400';
                break;
            default:
                borderColor = 'border-gray-200';
        }

        return `w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${borderColor}`;
    }

    public getTotalPercepciones(item: RetribucionesPersonalDTO): number {
        return item.importeRetribucionNoIT +
            item.importeRetribucionExpecie +
            item.aportacionesPrevencionSocial +
            item.dietasViajeExentas +
            item.rentasExentas190;
    }

    public formatCurrency(value: number): string {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(value);
    }

    // Métodos de paginación simplificados
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

    public hasRetribuciones(): boolean {
        return this.retribuciones().length > 0;
    }

    public canGoPrevious(): boolean {
        return this.currentPage() > 0;
    }

    public canGoNext(): boolean {
        return this.currentPage() < this.totalPages() - 1;
    }
}
