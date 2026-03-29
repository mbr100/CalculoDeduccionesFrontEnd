import {Component, computed, effect, inject, input, Input, OnInit, Signal, signal, WritableSignal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {EconomicoPersonalService} from '../../../services/economico-personal-service';
import {
    ActualizarBonificacionDTO,
    BonificacionesEmpleadoEconomicoDTO,
    CrearBonificacionDTO,
    formBonificacion,
    ListadoPersonalSelectorEconomicoDTO,
    tiposBonificacion,
    TiposBonificacion
} from '../../../models/personal-economico';
import {PaginacionResponse} from '../../../models/paginacion-response';
import {getVisiblePages, ModalMode, SavingState} from '../../../models/savingState';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-bonificaciones-personal',
    imports: [
        FormsModule
    ],
  templateUrl: './bonificaciones-personal.html',
  styleUrl: './bonificaciones-personal.css'
})
export class BonificacionesPersonal implements OnInit {
    @Input()
    public idEconomico!: number;

    public anualidad = input<number>(new Date().getFullYear());

    private economicoPersonalService: EconomicoPersonalService = inject(EconomicoPersonalService);

    // Signals principales
    public bonificaciones: WritableSignal<BonificacionesEmpleadoEconomicoDTO[]> = signal<BonificacionesEmpleadoEconomicoDTO[]>([]);
    public listadoPersonal: WritableSignal<ListadoPersonalSelectorEconomicoDTO[]> = signal<ListadoPersonalSelectorEconomicoDTO[]>([]);
    public loading: WritableSignal<boolean> = signal(false);
    public savingStates: WritableSignal<{ [key: number]: SavingState }> = signal<{ [key: number]: SavingState }>({});

    // Signals para paginación
    public currentPage: WritableSignal<number> = signal(0);
    public pageSize: WritableSignal<number> = signal(10);
    public totalElements: WritableSignal<number> = signal(0);
    public totalPages: WritableSignal<number> = signal(0);

    // Signals para modal
    public modalOpen: WritableSignal<boolean> = signal(false);
    public modalMode : WritableSignal<ModalMode>= signal<ModalMode>(null);
    public modalLoading: WritableSignal<boolean> = signal(false);
    public selectedBonificacion: WritableSignal<BonificacionesEmpleadoEconomicoDTO | null> = signal<BonificacionesEmpleadoEconomicoDTO | null>(null);

    // Signals para el formulario del modal
    public formData: WritableSignal<formBonificacion> = signal({
        idPersona: 0,
        tipoBonificacion: TiposBonificacion.BONIFICACION_PERSONAL_INVESTIGADOR,
        porcentajeBonificacion: 40,
        nombre: '',
        fechaInicio: '',
        fechaFin: '',
        anioFiscal: 0,
        descripcion: ''
    });

    // Porcentajes válidos para investigador
    public porcentajesInvestigador: {value: number, label: string}[] = [
        { value: 40, label: '40% (base)' },
        { value: 45, label: '45% (menor de 30 años)' },
        { value: 50, label: '50% (mujer menor de 30)' }
    ];

    // Tipos de bonificación disponibles
    public tiposBonificacion: tiposBonificacion[] = [
        { value: TiposBonificacion.BONIFICACION_PERSONAL_INVESTIGADOR, label: 'Personal Investigador (RD 475/2014)', porcentajeDefault: 40 },
        { value: TiposBonificacion.OTRA_BONIFICACION, label: 'Otra bonificación', porcentajeDefault: 0 },
    ];

    // Computed signals
    public visiblePages: Signal<number[]> = computed((): number[] => getVisiblePages(this.currentPage(), this.totalPages()));

    public isInvestigador: Signal<boolean> = computed((): boolean =>
        this.formData().tipoBonificacion === TiposBonificacion.BONIFICACION_PERSONAL_INVESTIGADOR
    );

    // Para acceder a Math en el template
    public Math: Math = Math;

    public constructor() {
        effect((): void => {
            const page: number = this.currentPage();
            if (page >= 0) {
                this.loadDataInternal();
            }
        });

        // Sincronizar anioFiscal cuando cambie la anualidad
        effect(() => {
            const anio = this.anualidad();
            if (anio) {
                this.formData.update(current => ({
                    ...current,
                    anioFiscal: anio,
                    fechaInicio: `${anio}-01-01`,
                    fechaFin: `${anio}-12-31`
                }));
            }
        });
    }

   public ngOnInit(): void {
        this.loadData();
        this.loadPersonalSelector();
    }

    public loadData(): void {
        this.currentPage.set(0);
    }

    private loadDataInternal(): void {
        this.loading.set(true);
        try {
            this.economicoPersonalService.obtenerBonificacionesPorIdEconomico(this.idEconomico).subscribe({
                next: (response: PaginacionResponse<BonificacionesEmpleadoEconomicoDTO>) => {
                    this.bonificaciones.set(response.content);
                    this.totalElements.set(response.totalElements);
                    this.totalPages.set(response.totalPages);
                    this.loading.set(false);
                },
                error: (error) => {
                    console.error('Error cargando bonificaciones:', error);
                    this.loading.set(false);
                }
            });
        } catch (error) {
            console.error('Error cargando datos:', error);
            this.loading.set(false);
        }
    }

    private loadPersonalSelector(): void {
        this.economicoPersonalService.obtenerListadoPersonalSelector(this.idEconomico).subscribe({
            next: (response: ListadoPersonalSelectorEconomicoDTO[]) => {
                this.listadoPersonal.set(response);
            },
            error: (error) => {
                console.error('Error cargando listado personal:', error);
            }
        });
    }

    public updateField(idBonificacionTrabajador: number, field: keyof BonificacionesEmpleadoEconomicoDTO, value: string | number): void {
        const editableFields = ['tipoBonificacion', 'porcentajeBonificacion', 'fechaInicio', 'fechaFin', 'descripcion'];

        if (!editableFields.includes(field as string)) {
            console.warn(`Campo ${field} no es editable`);
            return;
        }

        this.savingStates.update(states => ({
            ...states,
            [idBonificacionTrabajador]: 'saving'
        }));

        try {
            let valorFinal: TiposBonificacion | number | string;
            if (field === 'tipoBonificacion') {
                valorFinal = value as TiposBonificacion;
            } else if (field === 'porcentajeBonificacion') {
                valorFinal = this.parseNumberValue(value);
            } else {
                valorFinal = value as string;
            }

            const actualizacion: ActualizarBonificacionDTO = {
                idBonificacionTrabajador: idBonificacionTrabajador,
                campoActualizado: field,
                valor: valorFinal
            };

            this.economicoPersonalService.actualizarBonificacion(actualizacion).subscribe({
                next: () => {
                    this.savingStates.update(states => ({
                        ...states,
                        [idBonificacionTrabajador]: 'success'
                    }));

                    this.bonificaciones.update(items =>
                        items.map(item =>
                            item.idBonificacionTrabajador === idBonificacionTrabajador
                                ? { ...item, [field]: valorFinal }
                                : item
                        )
                    );

                    setTimeout(() => {
                        this.savingStates.update(states => ({
                            ...states,
                            [idBonificacionTrabajador]: 'idle'
                        }));
                    }, 2000);
                },
                error: (error) => {
                    console.error('Error actualizando bonificación:', error);
                    this.handleSavingError(idBonificacionTrabajador);
                }
            });
        } catch (error) {
            console.error('Error actualizando campo:', error);
            this.handleSavingError(idBonificacionTrabajador);
        }
    }

    public deleteBonificacion(idBonificacionTrabajador: number): void {
        Swal.fire({
            title: '¿Está seguro?',
            text: 'Esta acción eliminará la bonificación permanentemente.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.savingStates.update(states => ({
                    ...states,
                    [idBonificacionTrabajador]: 'saving'
                }));

                this.economicoPersonalService.eliminarBonificacion(idBonificacionTrabajador).subscribe({
                    next: () => {
                        this.bonificaciones.update(items =>
                            items.filter(item => item.idBonificacionTrabajador !== idBonificacionTrabajador)
                        );
                        this.savingStates.update(states => {
                            const newStates = { ...states };
                            delete newStates[idBonificacionTrabajador];
                            return newStates;
                        });
                        Swal.fire('Eliminado', 'La bonificación ha sido eliminada.', 'success').then();
                    },
                    error: (error) => {
                        console.error('Error eliminando bonificación:', error);
                        this.handleSavingError(idBonificacionTrabajador);
                    }
                });
            }
        })
    }

    // Métodos del modal
    public openCreateModal(): void {
        this.resetForm();
        this.modalMode.set('create');
        this.modalOpen.set(true);
        document.body.style.overflow = 'hidden';
    }

    public closeModal(): void {
        this.modalOpen.set(false);
        this.modalMode.set(null);
        this.selectedBonificacion.set(null);
        this.resetForm();
        document.body.style.overflow = 'auto';
    }

    public onBackdropClick(event: Event): void {
        if (event.target === event.currentTarget) {
            this.closeModal();
        }
    }

    public saveModal(): void {
        if (!this.validateForm()) {
            return;
        }
        this.modalLoading.set(true);

        if (this.modalMode() === 'create') {
            this.createBonificacion();
        } else if (this.modalMode() === 'edit') {
            this.updateBonificacionFromModal();
        }
    }

    private createBonificacion(): void {
        const form = this.formData();
        const nuevaBonificacion: CrearBonificacionDTO = {
            idPersona: form.idPersona,
            tipoBonificacion: form.tipoBonificacion,
            porcentajeBonificacion: form.porcentajeBonificacion,
            fechaInicio: form.fechaInicio,
            fechaFin: form.fechaFin,
            anioFiscal: form.anioFiscal || this.anualidad(),
            descripcion: form.tipoBonificacion === TiposBonificacion.OTRA_BONIFICACION ? form.descripcion : null
        };

        this.economicoPersonalService.crearBonificacion(nuevaBonificacion).subscribe({
            next: (_) => {
                this.modalLoading.set(false);
                this.closeModal();
                this.loadData();
                Swal.fire('Creada', 'La bonificación ha sido creada correctamente.', 'success').then();
            },
            error: (error) => {
                console.error('Error creando bonificación:', error);
                this.modalLoading.set(false);
                const mensaje = error?.error?.mensaje || 'Error al crear la bonificación';
                Swal.fire('Error', mensaje, 'error').then();
            }
        });
    }

    private updateBonificacionFromModal(): void {
        this.modalLoading.set(false);
        this.closeModal();
    }

    private resetForm(): void {
        const anio = this.anualidad() || new Date().getFullYear();
        this.formData.set({
            idPersona: 0,
            tipoBonificacion: TiposBonificacion.BONIFICACION_PERSONAL_INVESTIGADOR,
            porcentajeBonificacion: 40,
            nombre: '',
            fechaInicio: `${anio}-01-01`,
            fechaFin: `${anio}-12-31`,
            anioFiscal: anio,
            descripcion: ''
        });
    }

    private validateForm(): boolean {
        const form = this.formData();

        if (form.idPersona === 0) {
            Swal.fire('Error', 'Debe seleccionar un empleado', 'warning').then();
            return false;
        }

        if (!form.tipoBonificacion) {
            Swal.fire('Error', 'Debe seleccionar un tipo de bonificación', 'warning').then();
            return false;
        }

        if (!form.fechaInicio || !form.fechaFin) {
            Swal.fire('Error', 'Debe indicar las fechas de inicio y fin', 'warning').then();
            return false;
        }

        if (form.fechaFin < form.fechaInicio) {
            Swal.fire('Error', 'La fecha fin no puede ser anterior a la fecha inicio', 'warning').then();
            return false;
        }

        if (form.tipoBonificacion === TiposBonificacion.BONIFICACION_PERSONAL_INVESTIGADOR) {
            if (![40, 45, 50].includes(form.porcentajeBonificacion)) {
                Swal.fire('Error', 'Personal investigador solo admite 40%, 45% o 50%', 'warning').then();
                return false;
            }
        } else {
            if (form.porcentajeBonificacion <= 0 || form.porcentajeBonificacion > 100) {
                Swal.fire('Error', 'El porcentaje debe estar entre 0.01% y 100%', 'warning').then();
                return false;
            }
            if (!form.descripcion || form.descripcion.trim() === '') {
                Swal.fire('Error', 'La descripción es obligatoria para otras bonificaciones', 'warning').then();
                return false;
            }
        }

        return true;
    }

    private handleSavingError(idBonificacionTrabajador: number): void {
        this.savingStates.update(states => ({
            ...states,
            [idBonificacionTrabajador]: 'error'
        }));

        setTimeout(() => {
            this.savingStates.update(states => ({
                ...states,
                [idBonificacionTrabajador]: 'idle'
            }));
        }, 3000);
    }

    public onKeyPress(event: KeyboardEvent, idBonificacionTrabajador: number, field: keyof BonificacionesEmpleadoEconomicoDTO, value: string | number): void {
        if (event.key === 'Enter') {
            (event.target as HTMLInputElement).blur();
            this.updateField(idBonificacionTrabajador, field, value);
        }
    }

    public getInputClass(idBonificacionTrabajador: number): string {
        const savingState = this.savingStates()[idBonificacionTrabajador] || 'idle';
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

    public getTipoLabel(tipo: TiposBonificacion): string {
        const tipoConfig = this.tiposBonificacion.find(t => t.value === tipo);
        return tipoConfig ? tipoConfig.label : tipo;
    }

    public getTipoLabelShort(tipo: TiposBonificacion): string {
        if (tipo === TiposBonificacion.BONIFICACION_PERSONAL_INVESTIGADOR) return 'Investigador';
        if (tipo === TiposBonificacion.OTRA_BONIFICACION) return 'Otra';
        return tipo;
    }

    public formatDate(dateStr: string): string {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    public parseNumberValue(value: string | number): number {
        if (value === null || value === undefined || value === '') {
            return 0;
        }
        if (typeof value === 'number') {
            return value;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
    }

    // Métodos del formulario modal
    public onPersonalChange(): void {
        const form = this.formData();
        const personalSeleccionado = this.listadoPersonal().find(p => p.idPersona === form.idPersona);

        if (personalSeleccionado) {
            this.formData.update(current => ({
                ...current,
                nombre: personalSeleccionado.nombre
            }));
        }
    }

    public onTipoBonificacionChange(): void {
        const form = this.formData();
        if (form.tipoBonificacion === TiposBonificacion.BONIFICACION_PERSONAL_INVESTIGADOR) {
            this.formData.update(current => ({
                ...current,
                porcentajeBonificacion: 40,
                descripcion: ''
            }));
        } else {
            this.formData.update(current => ({
                ...current,
                porcentajeBonificacion: 0
            }));
        }
    }

    public onPorcentajeInvestigadorChange(pct: number): void {
        this.formData.update(current => ({
            ...current,
            porcentajeBonificacion: pct
        }));
    }

    // Paginación
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

    public isLoading(): boolean {
        return this.loading();
    }

    public hasBonificaciones(): boolean {
        return this.bonificaciones().length > 0;
    }

    public canGoPrevious(): boolean {
        return this.currentPage() > 0;
    }

    public canGoNext(): boolean {
        return this.currentPage() < this.totalPages() - 1;
    }
}
