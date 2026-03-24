import {Component, computed, effect, inject, Input, OnInit, Signal, signal, WritableSignal} from '@angular/core';
import {EconomicoPersonalService} from '../../../services/economico-personal-service';
import {PaginacionResponse} from '../../../models/paginacion-response';
import {actualizarAltaEjercicioDTO, AltaEjercicioDTO} from '../../../models/personal-economico';
import {getVisiblePages, SavingState} from '../../../models/savingState';
import {EconomicoService} from '../../../services/economico-service';
import {EconomicoDto} from '../../../models/economico';

@Component({
  selector: 'app-alta-ejercicio-personal',
    imports: [],
  templateUrl: './alta-ejercicio-personal.html',
  styleUrls: ['./alta-ejercicio-personal.css'],
})
export class AltaEjercicioPersonal implements OnInit {
    @Input() public idEconomico!: number;
    private economicoPersonalService: EconomicoPersonalService = inject(EconomicoPersonalService);
    private economicoService: EconomicoService = inject(EconomicoService);

    // Signals para el estado del componente
    public altasEjercicio: WritableSignal<AltaEjercicioDTO[]> = signal<AltaEjercicioDTO[]>([]);
    public loading: WritableSignal<boolean> = signal(false);
    public savingStates: WritableSignal<{ [key: number]: SavingState }> = signal<{ [key: number]: SavingState }>({});

    // Signals para paginación
    public currentPage: WritableSignal<number> = signal(0);
    public pageSize: WritableSignal<number> = signal(10);
    public totalElements: WritableSignal<number> = signal(0);
    public totalPages: WritableSignal<number> = signal(0);
    public horasConvenioAnual: WritableSignal<number> = signal(0);

    // Computed signals
    public visiblePages: Signal<number[]> = computed((): number[] => getVisiblePages(this.currentPage(), this.totalPages()));


    // Computed signals para estadísticas
    totalHorasConvenio = computed(() => {
        return this.altasEjercicio().reduce((sum: number, item: AltaEjercicioDTO) =>
            sum + (item.horasConvenioAnual || 0), 0
        );
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

    public loadData(): void {
        this.currentPage.set(0);
    }

    private loadDataInternal(): void {
        this.loading.set(true);
        try {
            // Asumiendo que tienes un metodo similar en tu servicio
            this.economicoPersonalService.getAltaPersonalEconomico(this.idEconomico).subscribe({
                next: (response: PaginacionResponse<AltaEjercicioDTO>) => {
                    this.altasEjercicio.set(response.content);
                    this.totalElements.set(response.totalElements);
                    this.totalPages.set(response.totalPages);
                    this.loading.set(false);
                },
                error: (error) => {
                    console.error('Error cargando altas de ejercicio:', error);
                    this.loading.set(false);
                }
            });
            this.economicoService.getEconomicoById(this.idEconomico).subscribe({
                next: (economico: EconomicoDto) => {
                    this.horasConvenioAnual.set(economico.horasConvenio || 0);
                },
                error: (error) => {
                    console.error('Error cargando económico:', error);
                }
            })
        } catch (error) {
            console.error('Error cargando datos:', error);
            this.loading.set(false);
        }
    }

    public updateField(idAltaEjercicio: number, field: keyof AltaEjercicioDTO, value: string | number): void {
        // Validar que el campo sea editable
        const editableFields = [
            'fechaAltaEjercicio',
            'fechaBajaEjercicio',
            'horasConvenioAnual',
            'horasMaximasAnuales'
        ];

        if (!editableFields.includes(field as string)) {
            console.warn(`Campo ${field} no es editable`);
            return;
        }

        this.savingStates.update(states => ({
            ...states,
            [idAltaEjercicio]: 'saving'
        }));

        try {
            // Convertir el valor según el tipo de campo
            let valorFinal: Date | number;
            if (field === 'fechaAltaEjercicio' || field === 'fechaBajaEjercicio') {
                valorFinal = value ? new Date(value as string) : null as any;
            } else {
                valorFinal = this.parseNumberValue(value);
            }

            const actualizacion: actualizarAltaEjercicioDTO = {
                idAltaEjercicio: idAltaEjercicio,
                campoActualizado: field,
                valor: valorFinal
            };

            if (actualizacion.valor === null || actualizacion.valor === undefined) {
                console.warn(`Valor para el campo ${field} es nulo o indefinido, no se actualizará.`);
                this.savingStates.update(states => ({
                    ...states,
                    [idAltaEjercicio]: 'idle'
                }));
                return;
            } else {
                this.economicoPersonalService.actualizarAltaEjercicio(actualizacion).subscribe({
                    next: () => {
                        this.savingStates.update(states => ({
                            ...states,
                            [idAltaEjercicio]: 'success'
                        }));

                        // Actualizar el valor en la lista local
                        this.altasEjercicio.update(items =>
                            items.map(item =>
                                item.idAltaEjercicio === idAltaEjercicio
                                    ? { ...item, [field]: valorFinal }
                                    : item
                            )
                        );

                        setTimeout(() => {
                            this.savingStates.update(states => ({
                                ...states,
                                [idAltaEjercicio]: 'idle'
                            }));
                        }, 2000);
                    },
                    error: (error) => {
                        console.error('Error actualizando alta de ejercicio:', error);
                        this.handleSavingError(idAltaEjercicio);
                    }
                });
            }

            console.log(`Actualizando campo ${field} para alta ID ${idAltaEjercicio} con valor ${value}`);
        } catch (error) {
            console.error('Error actualizando campo:', error);
            this.handleSavingError(idAltaEjercicio);
        }
    }

    private handleSavingError(idAltaEjercicio: number): void {
        this.savingStates.update(states => ({
            ...states,
            [idAltaEjercicio]: 'error'
        }));

        setTimeout(() => {
            this.savingStates.update(states => ({
                ...states,
                [idAltaEjercicio]: 'idle'
            }));
        }, 3000);
    }

    public onKeyPress(event: KeyboardEvent, idAltaEjercicio: number, field: keyof AltaEjercicioDTO, value: string | number): void {
        if (event.key === 'Enter') {
            (event.target as HTMLInputElement).blur();
            this.updateField(idAltaEjercicio, field, value);
            this.loadDataInternal();
        }
    }

    public getInputClass(idAltaEjercicio: number): string {
        const savingState = this.savingStates()[idAltaEjercicio] || 'idle';
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

    formatDateForInput(date: Date | string | null): string {
        if (!date) return '';
        try {
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';
            return d.toISOString().split('T')[0];
        } catch {
            return '';
        }
    }

    public formatHours(value: number): string {
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(value || 0) + ' h';
    }

    public onFocusHours(event: FocusEvent): void {
        const input = event.target as HTMLInputElement;
        const raw = this.parseHoursInput(input.value);
        input.value = raw === 0 ? '' : raw.toString().replace('.', ',');
    }

    public onBlurHoursField(event: FocusEvent, idAltaEjercicio: number, field: keyof AltaEjercicioDTO): void {
        const input = event.target as HTMLInputElement;
        const value = this.parseHoursInput(input.value);
        input.value = this.formatHours(value);

        this.altasEjercicio.update(items =>
            items.map(item =>
                item.idAltaEjercicio === idAltaEjercicio
                    ? { ...item, [field]: value }
                    : item
            )
        );

        this.updateField(idAltaEjercicio, field, value);
    }

    public onKeyPressFormatted(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            (event.target as HTMLInputElement).blur();
        }
    }

    private parseHoursInput(value: string): number {
        if (!value || value.trim() === '') return 0;
        const cleaned = value.replace(/[h\s]/g, '').replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }

    public parseNumberValue(value: string | number): number {
        if (value === null || value === undefined || value === '') {
            return 0;
        }
        if (typeof value === 'number') {
            return value;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
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

    public hasAltasEjercicio(): boolean {
        return this.altasEjercicio().length > 0;
    }

    public canGoPrevious(): boolean {
        return this.currentPage() > 0;
    }

    public canGoNext(): boolean {
        return this.currentPage() < this.totalPages() - 1;
    }
}
