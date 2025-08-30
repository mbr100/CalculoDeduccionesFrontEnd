import {Component, computed, effect, inject, Input, OnInit, Signal, signal, WritableSignal} from '@angular/core';
import {EconomicoPersonalService} from '../../../services/economico-personal-service';
import {ActualizarCosteHoraDTO, CosteHoraPersonalDTO} from '../../../models/personal-economico';
import {getVisiblePages, SavingState} from '../../../models/savingState';
import {PaginacionResponse} from '../../../models/paginacion-response';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-resumen-coste-hora-personal',
    imports: [
        FormsModule
    ],
  templateUrl: './resumen-coste-hora-personal.html',
  styleUrl: './resumen-coste-hora-personal.css'
})
export class ResumenCosteHoraPersonal implements OnInit {
    @Input() idEconomico!: number;
    private economicoPersonalService: EconomicoPersonalService = inject(EconomicoPersonalService);

    // Signals principales
    costesHora: WritableSignal<CosteHoraPersonalDTO[]> = signal<CosteHoraPersonalDTO[]>([]);
    loading: WritableSignal<boolean> = signal(false);
    savingStates: WritableSignal<{[key: number]: SavingState }> = signal<{[key: number]: SavingState }>({});

    // Signals para paginación
    currentPage: WritableSignal<number> = signal(0);
    pageSize: WritableSignal<number> = signal(10);
    totalElements: WritableSignal<number> = signal(0);
    totalPages: WritableSignal<number> = signal(0);

    // Computed signals
    visiblePages :Signal<number[]> = computed((): number[] => getVisiblePages(this.currentPage(), this.totalPages()));

    costeHoraPromedio = computed(() => {
        const items = this.costesHora();
        if (items.length === 0) return 0;
        return items.reduce((sum: number, item: CosteHoraPersonalDTO) =>
            sum + (item.costeHora || 0), 0) / items.length;
    });


    // Para acceder a Math en el template
    Math = Math;

    constructor() {
        // Effect para recargar datos cuando cambie la página
        effect(() => {
            const page = this.currentPage();
            if (page >= 0) {
                this.loadDataInternal();
            }
        });
    }

    ngOnInit(): void {
        this.loadData();
    }

    // Métodos de carga de datos
    public loadData(): void {
        this.currentPage.set(0);
    }

    private loadDataInternal(): void {
        this.loading.set(true);
        try {
            this.economicoPersonalService.obtenerCosteHoraPorIdEconomico(this.idEconomico).subscribe({
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

    // Métodos de actualización (solo para campos editables)
    public updateField(id: number, field: keyof CosteHoraPersonalDTO, value: string | number): void {
        // Solo algunos campos son editables (si el backend los permite)
        const editableFields = ['retribucionTotal', 'costeSS', 'horasMaximas'];

        if (!editableFields.includes(field as string)) {
            console.warn(`Campo ${field} no es editable - se calcula automáticamente`);
            return;
        }

        this.savingStates.update(states => ({
            ...states,
            [id]: 'saving'
        }));

        try {
            const valorFinal = this.parseNumberValue(value);

            const actualizacion: ActualizarCosteHoraDTO = {
                id: id,
                campoActualizado: field,
                valor: valorFinal
            };

            this.economicoPersonalService.actualizarCosteHora(actualizacion).subscribe({
                next: () => {
                    this.savingStates.update(states => ({
                        ...states,
                        [id]: 'success'
                    }));

                    // Actualizar el valor en la lista local y recalcular
                    this.costesHora.update(items =>
                        items.map(item => {
                            if (item.id === id) {
                                const updatedItem = { ...item, [field]: valorFinal };
                                // Recalcular coste hora si es necesario
                                if (field === 'retribucionTotal' || field === 'costeSS' || field === 'horasMaximas') {
                                    updatedItem.costeHora = this.calcularCosteHora(updatedItem);
                                }
                                return updatedItem;
                            }
                            return item;
                        })
                    );

                    setTimeout(() => {
                        this.savingStates.update(states => ({
                            ...states,
                            [id]: 'idle'
                        }));
                    }, 2000);
                },
                error: (error) => {
                    console.error('Error actualizando coste hora:', error);
                    this.handleSavingError(id);
                }
            });

            console.log(`Actualizando campo ${field} para coste ID ${id} con valor ${value}`);
        } catch (error) {
            console.error('Error actualizando campo:', error);
            this.handleSavingError(id);
        }
    }

    // Método para recalcular costes
    public recalcularCostes(): void {
        this.loading.set(true);

        this.economicoPersonalService.recalcularCostesHora(this.idEconomico).subscribe({
            next: () => {
                this.loadData(); // Recargar datos actualizados
            },
            error: (error) => {
                console.error('Error recalculando costes:', error);
                this.loading.set(false);
            }
        });
    }

    // Métodos auxiliares
    private handleSavingError(id: number): void {
        this.savingStates.update(states => ({
            ...states,
            [id]: 'error'
        }));

        setTimeout(() => {
            this.savingStates.update(states => ({
                ...states,
                [id]: 'idle'
            }));
        }, 3000);
    }

    public onKeyPress(event: KeyboardEvent, id: number, field: keyof CosteHoraPersonalDTO, value: string | number): void {
        if (event.key === 'Enter') {
            (event.target as HTMLInputElement).blur();
            this.updateField(id, field, value);
        }
    }

    public getInputClass(id: number): string {
        const savingState = this.savingStates()[id] || 'idle';
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

    // Métodos específicos de costes
    public getCosteNivel(costeHora: number): 'alto' | 'medio' | 'bajo' {
        if (costeHora >= 25) return 'alto';
        if (costeHora >= 15) return 'medio';
        return 'bajo';
    }

    public getCosteClass(costeHora: number): string {
        const nivel = this.getCosteNivel(costeHora);
        switch (nivel) {
            case 'alto': return 'coste-alto';
            case 'medio': return 'coste-medio';
            case 'bajo': return 'coste-bajo';
            default: return '';
        }
    }

    public parseNumberValue(value: string | number): number {
        if (value === null || value === undefined || value === '') {
            return 0;
        }
        if (typeof value === 'number') {
            return value;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : Math.max(0, parsed);
    }

    public formatCurrency(value: number): string {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(value || 0);
    }

    private calcularCosteHora(item: CosteHoraPersonalDTO): number {
        if (!item.horasMaximas || item.horasMaximas === 0) return 0;
        return (item.retribucionTotal + item.costeSS) / item.horasMaximas;
    }

    // Métodos de análisis
    public getEficienciaCoste(item: CosteHoraPersonalDTO): string {
        const costeHora = item.costeHora;
        const promedio = this.costeHoraPromedio();

        if (costeHora <= promedio * 0.8) return 'Muy eficiente';
        if (costeHora <= promedio * 1.1) return 'Eficiente';
        if (costeHora <= promedio * 1.3) return 'Moderado';
        return 'Alto coste';
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
