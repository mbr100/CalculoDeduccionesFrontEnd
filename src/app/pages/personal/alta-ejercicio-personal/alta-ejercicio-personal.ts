import {Component, computed, effect, inject, Input, OnInit, signal} from '@angular/core';
import {EconomicoPersonalService} from '../../../services/economico-personal-service';
import {PaginacionResponse} from '../../../models/paginacion-response';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-alta-ejercicio-personal',
    imports: [
        FormsModule
    ],
  templateUrl: './alta-ejercicio-personal.html',
  styleUrls: ['./alta-ejercicio-personal.css'],
})
export class AltaEjercicioPersonal implements OnInit {
    @Input() idEconomico!: number;
    private economicoPersonalService: EconomicoPersonalService = inject(EconomicoPersonalService);

    // Signals para el estado del componente
    altasEjercicio = signal<AltaEjercicioDTO[]>([]);
    loading = signal(false);
    savingStates = signal<{ [key: number]: SavingState }>({});

    // Signals para paginación
    currentPage = signal(0);
    pageSize = signal(10);
    totalElements = signal(0);
    totalPages = signal(0);

    // Computed signals
    visiblePages = computed(() => {
        const maxVisiblePages = 5;
        const halfVisible = Math.floor(maxVisiblePages / 2);
        const current = this.currentPage();
        const total = this.totalPages();

        let startPage = Math.max(0, current - halfVisible);
        let endPage = Math.min(total - 1, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(0, endPage - maxVisiblePages + 1);
        }

        const pages: number[] = [];
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    });

    // Computed signals para estadísticas
    totalHorasConvenio = computed(() => {
        return this.altasEjercicio().reduce((sum: number, item: AltaEjercicioDTO) =>
            sum + (item.horasConvenioAnual || 0), 0
        );
    });

    // totalHorasMaximas = computed(() => {
    //     return this.altasEjercicio().reduce((sum: number, item: AltaEjercicioDTO) =>
    //         sum + (item.horasMaximasAnuales || 0), 0
    //     );
    // });
    //
    // promedioHorasConvenio = computed(() => {
    //     const items = this.altasEjercicio();
    //     if (items.length === 0) return 0;
    //     return this.totalHorasConvenio() / items.length;
    // });

    // promedioHorasMaximas = computed(() => {
    //     const items = this.altasEjercicio();
    //     if (items.length === 0) return 0;
    //     return this.totalHorasMaximas() / items.length;
    // });

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

            // Asumiendo que usas un metodo específico para actualizar altas
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

    onKeyPress(event: KeyboardEvent, idAltaEjercicio: number, field: keyof AltaEjercicioDTO, value: string | number): void {
        if (event.key === 'Enter') {
            (event.target as HTMLInputElement).blur();
            this.updateField(idAltaEjercicio, field, value);
        }
    }

    getInputClass(idAltaEjercicio: number): string {
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

    // // Métodos específicos para fechas y horas
    // getHorasDisponibles(item: AltaEjercicioDTO): number {
    //     return Math.max(0, item.horasMaximasAnuales - item.horasConvenioAnual);
    // }
    //
    // getPorcentajeUsoHoras(item: AltaEjercicioDTO): number {
    //     if (item.horasMaximasAnuales === 0) return 0;
    //     return (item.horasConvenioAnual / item.horasMaximasAnuales) * 100;
    // }

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

    parseNumberValue(value: string | number): number {
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
    previousPage(): void {
        if (this.currentPage() > 0) {
            this.currentPage.update(page => page - 1);
        }
    }

    nextPage(): void {
        if (this.currentPage() < this.totalPages() - 1) {
            this.currentPage.update(page => page + 1);
        }
    }

    goToPage(page: number): void {
        this.currentPage.set(page);
    }

    getPageButtonClass(page: number): string {
        const baseClass = 'relative inline-flex items-center px-4 py-2 border text-sm font-medium';
        if (this.currentPage() === page) {
            return `${baseClass} z-10 bg-blue-50 border-blue-500 text-blue-600`;
        }
        return `${baseClass} bg-white border-gray-300 text-gray-500 hover:bg-gray-50`;
    }

    // Métodos de conveniencia para el template
    isLoading(): boolean {
        return this.loading();
    }

    hasAltasEjercicio(): boolean {
        return this.altasEjercicio().length > 0;
    }

    canGoPrevious(): boolean {
        return this.currentPage() > 0;
    }

    canGoNext(): boolean {
        return this.currentPage() < this.totalPages() - 1;
    }

    // Metodo para obtener el color del porcentaje de horas
    // getColorPorcentajeHoras(porcentaje: number): string {
    //     if (porcentaje >= 90) return 'text-red-600 bg-red-50';
    //     if (porcentaje >= 75) return 'text-orange-600 bg-orange-50';
    //     if (porcentaje >= 50) return 'text-yellow-600 bg-yellow-50';
    //     return 'text-green-600 bg-green-50';
    // }
}
