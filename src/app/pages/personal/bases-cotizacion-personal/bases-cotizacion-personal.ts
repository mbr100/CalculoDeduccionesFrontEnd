import {Component, computed, effect, inject, Input, OnInit, signal} from '@angular/core';
import {EconomicoPersonalService} from '../../../services/economico-personal-service';
import {PaginacionResponse} from '../../../models/paginacion-response';
import {actualizarBbccDTO, BbccPersonalDTO} from '../../../models/personal-economico';
import {MonthConfig, SavingState} from '../../../models/savingState';


@Component({
    selector: 'app-bases-cotizacion-personal',
    imports: [],
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
    pageSize = signal(50);
    totalElements = signal(0);
    totalPages = signal(0);

    // Configuración de meses (índice 1-12)
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

    Math = Math;

    constructor() {
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

    /**
     * Determina si un mes (índice 0-11) está habilitado para una fila.
     * Si la fila tiene periodo de contrato, solo se habilitan los meses dentro del rango fechaAlta-fechaBaja.
     * Si no tiene periodo (fila legacy), todos los meses están habilitados.
     */
    public isMonthEnabled(item: BbccPersonalDTO, monthIndex: number): boolean {
        if (!item.idPeriodoContrato) {
            return true; // Fila legacy: todos los meses habilitados
        }

        const anio = item.anioFiscal!;
        const mes = monthIndex + 1; // 1-12

        // Inicio y fin del mes
        const inicioMes = new Date(anio, monthIndex, 1);
        const finMes = new Date(anio, monthIndex + 1, 0); // último día del mes

        // Fechas del periodo
        const fechaAlta = new Date(item.fechaAlta!);
        const fechaBaja = item.fechaBaja ? new Date(item.fechaBaja) : new Date(anio, 11, 31);

        // El mes se habilita si hay solapamiento con el rango del periodo
        return inicioMes <= fechaBaja && finMes >= fechaAlta;
    }

    /**
     * Genera la etiqueta del periodo para mostrar en la fila.
     */
    public getPeriodoLabel(item: BbccPersonalDTO): string {
        if (!item.idPeriodoContrato) return '';
        const alta = this.formatDateShort(item.fechaAlta);
        const baja = item.fechaBaja ? this.formatDateShort(item.fechaBaja) : 'Activo';
        return `${item.claveContrato} · ${alta} → ${baja}`;
    }

    private formatDateShort(dateStr: string | null): string {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '—';
            return d.toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit', year: '2-digit'});
        } catch {
            return '—';
        }
    }

    public updateField(idBaseCotizacion: number, idPersonal: number, field: keyof BbccPersonalDTO, value: number | null): void {
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

        // Usar id_baseCotizacion como clave única de saving state
        this.savingStates.update(states => ({
            ...states,
            [idBaseCotizacion]: 'saving'
        }));

        try {
            const actualizacion: actualizarBbccDTO = {
                idBbccPersonal: idBaseCotizacion,
                campoActualizado: field,
                valor: value
            };

            this.economicoPersonalService.actualizarBBCC(actualizacion as any).subscribe({
                next: () => {
                    this.savingStates.update(states => ({
                        ...states,
                        [idBaseCotizacion]: 'success'
                    }));

                    this.bbccPersonal.update(items =>
                        items.map(item =>
                            item.id_baseCotizacion === idBaseCotizacion
                                ? {...item, [field]: value}
                                : item
                        )
                    );

                    setTimeout(() => {
                        this.savingStates.update(states => ({
                            ...states,
                            [idBaseCotizacion]: 'idle'
                        }));
                    }, 2000);
                },
                error: (error) => {
                    console.error('Error actualizando base de cotización:', error);
                    this.handleSavingError(idBaseCotizacion);
                }
            });
        } catch (error) {
            console.error('Error actualizando campo:', error);
            this.handleSavingError(idBaseCotizacion);
        }
    }

    private handleSavingError(idBaseCotizacion: number): void {
        this.savingStates.update(states => ({
            ...states,
            [idBaseCotizacion]: 'error'
        }));

        setTimeout(() => {
            this.savingStates.update(states => ({
                ...states,
                [idBaseCotizacion]: 'idle'
            }));
        }, 3000);
    }

    public formatEuro(value: number | null): string {
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

    public onBlurField(event: FocusEvent, idBaseCotizacion: number, idPersonal: number, field: keyof BbccPersonalDTO): void {
        const input = event.target as HTMLInputElement;
        const value = this.parseInputValue(input.value);
        input.value = this.formatEuro(value);

        this.bbccPersonal.update(items =>
            items.map(item =>
                item.id_baseCotizacion === idBaseCotizacion
                    ? { ...item, [field]: value }
                    : item
            )
        );

        this.updateField(idBaseCotizacion, idPersonal, field, value);
    }

    public onKeyPressField(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            (event.target as HTMLInputElement).blur();
        }
    }

    private parseInputValue(value: string): number {
        if (!value || value.trim() === '') return 0;
        const cleaned = value.replace(/[€\s]/g, '').replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }

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

    getInputClass(idBaseCotizacion: number): string {
        const savingState = this.savingStates()[idBaseCotizacion] || 'idle';
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

    getMonthColor(index: number): string {
        const colors = [
            'bg-blue-50 text-blue-900',
            'bg-pink-50 text-pink-900',
            'bg-green-50 text-green-900',
            'bg-yellow-50 text-yellow-900',
            'bg-purple-50 text-purple-900',
            'bg-orange-50 text-orange-900',
            'bg-red-50 text-red-900',
            'bg-indigo-50 text-indigo-900',
            'bg-teal-50 text-teal-900',
            'bg-amber-50 text-amber-900',
            'bg-gray-50 text-gray-900',
            'bg-cyan-50 text-cyan-900'
        ];
        return colors[index % colors.length];
    }
}
