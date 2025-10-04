import {Component, computed, effect, inject, Input, OnInit, signal} from '@angular/core';
import {EconomicoPersonalService} from '../../../services/economico-personal-service';
import {PaginacionResponse} from '../../../models/paginacion-response';
import {FormsModule} from '@angular/forms';
import {actualizarBbccDTO, BbccPersonalDTO} from '../../../models/personal-economico';
import {MonthConfig, SavingState} from '../../../models/savingState';


@Component({
    selector: 'app-bases-cotizacion-personal',
    imports: [FormsModule],
    templateUrl: './bases-cotizacion-personal.html',
    styleUrls: ['./bases-cotizacion-personal.css'],
})
export class BasesCotizacionPersonal implements OnInit {
    @Input() idEconomico!: number;
    private economicoPersonalService: EconomicoPersonalService = inject(EconomicoPersonalService);

    // Signals para el estado del componente
    bbccPersonal = signal<BbccPersonalDTO[]>([]);
    loading = signal(false);
    savingStates = signal<{ [key: number]: SavingState }>({});

    // Signals para paginación
    currentPage = signal(0);
    pageSize = signal(10);
    totalElements = signal(0);
    totalPages = signal(0);

    // Configuración de meses
    meses: MonthConfig[] = [
        {key: 'basesCotizacionContingenciasComunesEnero', label: 'Enero', shortLabel: 'Ene', icon: 'fas fa-calendar-alt'},
        {key: 'basesCotizacionContingenciasComunesFebrero', label: 'Febrero', shortLabel: 'Feb', icon: 'fas fa-heart'},
        {key: 'basesCotizacionContingenciasComunesMarzo', label: 'Marzo', shortLabel: 'Mar', icon: 'fas fa-seedling'},
        {key: 'basesCotizacionContingenciasComunesAbril', label: 'Abril', shortLabel: 'Abr', icon: 'fas fa-leaf'},
        {key: 'basesCotizacionContingenciasComunesMayo', label: 'Mayo', shortLabel: 'May', icon: 'fas fa-flower'},
        {key: 'basesCotizacionContingenciasComunesJunio', label: 'Junio', shortLabel: 'Jun', icon: 'fas fa-sun'},
        {key: 'basesCotizacionContingenciasComunesJulio', label: 'Julio', shortLabel: 'Jul', icon: 'fas fa-umbrella-beach'},
        {key: 'basesCotizacionContingenciasComunesAgosto', label: 'Agosto', shortLabel: 'Ago', icon: 'fas fa-fire'},
        {key: 'basesCotizacionContingenciasComunesSeptiembre', label: 'Septiembre', shortLabel: 'Sep', icon: 'fas fa-tree'},
        {key: 'basesCotizacionContingenciasComunesOctubre', label: 'Octubre', shortLabel: 'Oct', icon: 'fas fa-maple-leaf'},
        {key: 'basesCotizacionContingenciasComunesNoviembre', label: 'Noviembre', shortLabel: 'Nov', icon: 'fas fa-cloud-rain'},
        {key: 'basesCotizacionContingenciasComunesDiciembre', label: 'Diciembre', shortLabel: 'Dic', icon: 'fas fa-snowflake'}
    ];

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
    // totalCotizacionesPage = computed(() => {
    //     return this.bbccPersonal().reduce((sum: number, item: BbccPersonalDTO) =>
    //         sum + this.getTotalCotizacionesAnuales(item), 0
    //     );
    // });

    // promedioCotizaciones = computed(() => {
    //     const items = this.bbccPersonal();
    //     if (items.length === 0) return 0;
    //     return this.totalCotizacionesPage() / items.length;
    // });
    //
    // // Estadísticas por mes
    // estadisticasPorMes = computed(() => {
    //     const items = this.bbccPersonal();
    //     return this.meses.map(mes => ({
    //         mes: mes.label,
    //         shortLabel: mes.shortLabel,
    //         icon: mes.icon,
    //         total: items.reduce((sum: number, item: BbccPersonalDTO) => {
    //             const valor = item[mes.key] as number | null;
    //             return sum + (valor || 0);
    //         }, 0),
    //         promedio: items.length > 0 ?
    //             items.reduce((sum: number, item: BbccPersonalDTO) => {
    //                 const valor = item[mes.key] as number | null;
    //                 return sum + (valor || 0);
    //             }, 0) / items.length : 0,
    //         empleadosConDatos: items.filter(item => (item[mes.key] as number | null) !== null).length
    //     }));
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
            this.economicoPersonalService.obtemerBbccPersonalPorIdEconomico(this.idEconomico).subscribe({
                next: (response: PaginacionResponse<BbccPersonalDTO>) => {
                    this.bbccPersonal.set(response.content);
                    this.totalElements.set(response.totalElements);
                    this.totalPages.set(response.totalPages);
                    this.loading.set(false);
                },
                error: (error) => {
                    console.error('Error cargando bases de cotización:', error);
                    this.loading.set(false);
                }
            });
        } catch (error) {
            console.error('Error cargando datos:', error);
            this.loading.set(false);
        }
    }

    public updateField(idPersonal: number, field: keyof BbccPersonalDTO, value: number | null): void {
        // Validar que el campo sea uno de los campos editables de bases de cotización
        const editableFields = [
            'basesCotizacionContingenciasComunesEnero',
            'basesCotizacionContingenciasComunesFebrero',
            'basesCotizacionContingenciasComunesMarzo',
            'basesCotizacionContingenciasComunesAbril',
            'basesCotizacionContingenciasComunesMayo',
            'basesCotizacionContingenciasComunesJunio',
            'basesCotizacionContingenciasComunesJulio',
            'basesCotizacionContingenciasComunesAgosto',
            'basesCotizacionContingenciasComunesSeptiembre',
            'basesCotizacionContingenciasComunesOctubre',
            'basesCotizacionContingenciasComunesNoviembre',
            'basesCotizacionContingenciasComunesDiciembre'
        ];

        if (!editableFields.includes(field as string)) {
            console.warn(`Campo ${field} no es editable`);
            return;
        }

        this.savingStates.update(states => ({
            ...states,
            [idPersonal]: 'saving'
        }));

        try {
            const actualizacion: actualizarBbccDTO = {
                idBbccPersonal: idPersonal,
                campoActualizado: field,
                valor: value
            };

            // Nota: Asumiendo que usas el mismo endpoint, si no, necesitarías un metodo específico
            this.economicoPersonalService.actualizarBBCC(actualizacion as any).subscribe({
                next: () => {
                    this.savingStates.update(states => ({
                        ...states,
                        [idPersonal]: 'success'
                    }));

                    // Actualizar el valor en la lista local
                    this.bbccPersonal.update(items =>
                        items.map(item =>
                            item.idPersonal === idPersonal
                                ? {...item, [field]: value}
                                : item
                        )
                    );

                    setTimeout(() => {
                        this.savingStates.update(states => ({
                            ...states,
                            [idPersonal]: 'idle'
                        }));
                    }, 2000);
                },
                error: (error) => {
                    console.error('Error actualizando base de cotización:', error);
                    this.handleSavingError(idPersonal);
                }
            });

            console.log(`Actualizando campo ${field} para personal ID ${idPersonal} con valor ${value}`);
        } catch (error) {
            console.error('Error actualizando campo:', error);
            this.handleSavingError(idPersonal);
        }
    }

    private handleSavingError(idPersonal: number): void {
        this.savingStates.update(states => ({
            ...states,
            [idPersonal]: 'error'
        }));

        setTimeout(() => {
            this.savingStates.update(states => ({
                ...states,
                [idPersonal]: 'idle'
            }));
        }, 3000);
    }

    onKeyPress(event: KeyboardEvent, idPersonal: number, field: keyof BbccPersonalDTO, value: string | number | null): void {
        if (event.key === 'Enter') {
            (event.target as HTMLInputElement).blur();
            this.updateField(idPersonal, field, this.parseNumberValue(value));
        }
    }

    // Metodo auxiliar para convertir valores (público para usar en templarte)
    parseNumberValue(value: string | number | null): number | null {
        if (value === null || value === undefined || value === '') {
            return null;
        }
        if (typeof value === 'number') {
            return value;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
    }

    getInputClass(idPersonal: number): string {
        const savingState = this.savingStates()[idPersonal] || 'idle';
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

    getTotalCotizacionesAnuales(item: BbccPersonalDTO): number {
        return (item.basesCotizacionContingenciasComunesEnero || 0) +
            (item.basesCotizacionContingenciasComunesFebrero || 0) +
            (item.basesCotizacionContingenciasComunesMarzo || 0) +
            (item.basesCotizacionContingenciasComunesAbril || 0) +
            (item.basesCotizacionContingenciasComunesMayo || 0) +
            (item.basesCotizacionContingenciasComunesJunio || 0) +
            (item.basesCotizacionContingenciasComunesJulio || 0) +
            (item.basesCotizacionContingenciasComunesAgosto || 0) +
            (item.basesCotizacionContingenciasComunesSeptiembre || 0) +
            (item.basesCotizacionContingenciasComunesOctubre || 0) +
            (item.basesCotizacionContingenciasComunesNoviembre || 0) +
            (item.basesCotizacionContingenciasComunesDiciembre || 0);
    }

    // getMesesConDatos(item: BbccPersonalDTO): number {
    //     let count = 0;
    //     this.meses.forEach(mes => {
    //         if ((item[mes.key] as number | null) !== null) {
    //             count++;
    //         }
    //     });
    //     return count;
    // }

    // getPromedioMensual(item: BbccPersonalDTO): number {
    //     const mesesConDatos = this.getMesesConDatos(item);
    //     if (mesesConDatos === 0) return 0;
    //     return this.getTotalCotizacionesAnuales(item) / mesesConDatos;
    // }

    formatCurrency(value: number): string {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(value);
    }

    // Metodos de paginación
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

    // Metodos de conveniencia para el tempate
    isLoading(): boolean {
        return this.loading();
    }

    hasBbccPersonal(): boolean {
        return this.bbccPersonal().length > 0;
    }

    canGoPrevious(): boolean {
        return this.currentPage() > 0;
    }

    canGoNext(): boolean {
        return this.currentPage() < this.totalPages() - 1;
    }

    // Metodo para obtener el color del mes (útil para visualización)
    getMonthColor(index: number): string {
        const colors = [
            'bg-blue-50 text-blue-900',      // Enero
            'bg-pink-50 text-pink-900',      // Febrero
            'bg-green-50 text-green-900',    // Marzo
            'bg-yellow-50 text-yellow-900',  // Abril
            'bg-purple-50 text-purple-900',  // Mayo
            'bg-orange-50 text-orange-900',  // Junio
            'bg-red-50 text-red-900',        // Julio
            'bg-indigo-50 text-indigo-900',  // Agosto
            'bg-teal-50 text-teal-900',      // Septiembre
            'bg-amber-50 text-amber-900',    // Octubre
            'bg-gray-50 text-gray-900',      // Noviembre
            'bg-cyan-50 text-cyan-900'       // Diciembre
        ];
        return colors[index % colors.length];
    }

    // Metodo para validar si un valor es válido
    // isValidValue(value: any): boolean {
    //     if (value === null || value === undefined) return true; // null es válido
    //     if (typeof value === 'number') return !isNaN(value) && isFinite(value);
    //     if (typeof value === 'string') {
    //         const parsed = parseFloat(value);
    //         return !isNaN(parsed) && isFinite(parsed);
    //     }
    //     return false;
    // }

    // // Metodo para obtener el valor formateado o placeholder
    // getDisplayValue(value: number | null): string {
    //     if (value === null || value === undefined) return '';
    //     return value.toString();
    // }
    //
    // // Metodo para obtener estadísticas rápidas de un empleado
    // getEmployeeStats(item: BbccPersonalDTO): { total: number, mesesConDatos: number, promedio: number } {
    //     const total = this.getTotalCotizacionesAnuales(item);
    //     const mesesConDatos = this.getMesesConDatos(item);
    //     const promedio = this.getPromedioMensual(item);
    //
    //     return {total, mesesConDatos, promedio};
    // }
}
