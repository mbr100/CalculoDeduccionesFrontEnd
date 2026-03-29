import {Component, computed, effect, inject, Input, OnInit, Signal, signal, WritableSignal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {EconomicoPersonalService} from '../../../services/economico-personal-service';
import {
    ActualizarPeriodoContratoDTO,
    ClaveContratoDTO,
    CrearPeriodoContratoDTO,
    ListadoPersonalSelectorEconomicoDTO,
    NaturalezaContrato,
    PeriodoContratoDTO,
    TipoJornada
} from '../../../models/personal-economico';
import {FormPeriodoContrato, GrupoClave} from './periodos-contrato-personal.interfaces';
import {PaginacionResponse} from '../../../models/paginacion-response';
import {getVisiblePages, ModalMode, SavingState} from '../../../models/savingState';
import Swal from 'sweetalert2';


@Component({
    selector: 'app-periodos-contrato-personal',
    imports: [FormsModule],
    templateUrl: './periodos-contrato-personal.html',
    styleUrl: './periodos-contrato-personal.css'
})
export class PeriodosContratoPersonal implements OnInit {

    @Input()
    public idEconomico!: number;
    @Input()
    public anualidad!: number;

    private readonly economicoPersonalService: EconomicoPersonalService = inject(EconomicoPersonalService);

    // ── Datos principales ─────────────────────────────────────────────────────
    public periodos: WritableSignal<PeriodoContratoDTO[]> = signal<PeriodoContratoDTO[]>([]);
    public listadoPersonal: WritableSignal<ListadoPersonalSelectorEconomicoDTO[]> = signal<ListadoPersonalSelectorEconomicoDTO[]>([]);
    public clavesContrato: WritableSignal<ClaveContratoDTO[]> = signal<ClaveContratoDTO[]>([]);
    public loading: WritableSignal<boolean> = signal(false);
    public savingStates: WritableSignal<{ [key: number]: SavingState }> = signal<{ [key: number]: SavingState }>({});

    // ── Paginación ────────────────────────────────────────────────────────────
    public currentPage: WritableSignal<number> = signal(0);
    public pageSize: WritableSignal<number> = signal(10);
    public totalElements: WritableSignal<number> = signal(0);
    public totalPages: WritableSignal<number> = signal(0);

    // ── Modal ─────────────────────────────────────────────────────────────────
    public modalOpen: WritableSignal<boolean> = signal(false);
    public modalMode: WritableSignal<ModalMode> = signal<ModalMode>(null);
    public modalLoading: WritableSignal<boolean> = signal(false);
    public selectedPeriodo: WritableSignal<PeriodoContratoDTO | null> = signal<PeriodoContratoDTO | null>(null);

    public formData: WritableSignal<FormPeriodoContrato> = signal<FormPeriodoContrato>({
        idPersona: 0,
        claveContrato: '',
        fechaAlta: '',
        fechaBaja: '',
        porcentajeJornada: 100,
        horasConvenio: 1720,
        nombrePersona: ''
    });

    // ── Computed ──────────────────────────────────────────────────────────────
    public visiblePages: Signal<number[]> = computed((): number[] =>
        getVisiblePages(this.currentPage(), this.totalPages())
    );

    /** Agrupaciones de claves para el select del formulario */
    public gruposClaves: Signal<GrupoClave[]> = computed((): GrupoClave[] => {
        const claves = this.clavesContrato().filter(c => c.vigente);

        const grupos: { [key: string]: ClaveContratoDTO[] } = {
            'Indefinidos - Tiempo Completo': [],
            'Indefinidos - Tiempo Parcial': [],
            'Fijo Discontinuo': [],
            'Temporales - Tiempo Completo': [],
            'Temporales - Tiempo Parcial': [],
            'Formacion / Becarios': []
        };

        for (const clave of claves) {
            if (clave.naturaleza === 'INDEFINIDO' && clave.jornada === 'TIEMPO_COMPLETO') {
                grupos['Indefinidos - Tiempo Completo'].push(clave);
            } else if (clave.naturaleza === 'INDEFINIDO' && clave.jornada === 'TIEMPO_PARCIAL') {
                grupos['Indefinidos - Tiempo Parcial'].push(clave);
            } else if (clave.jornada === 'FIJO_DISCONTINUO') {
                grupos['Fijo Discontinuo'].push(clave);
            } else if (clave.naturaleza === 'TEMPORAL' && clave.jornada === 'TIEMPO_COMPLETO') {
                grupos['Temporales - Tiempo Completo'].push(clave);
            } else if (clave.naturaleza === 'TEMPORAL' && clave.jornada === 'TIEMPO_PARCIAL') {
                grupos['Temporales - Tiempo Parcial'].push(clave);
            } else {
                grupos['Formacion / Becarios'].push(clave);
            }
        }

        return Object.entries(grupos)
            .filter(([, items]) => items.length > 0)
            .map(([label, claves]) => ({label, claves}));
    });

    /** Clave actualmente seleccionada en el formulario */
    public claveSeleccionada: Signal<ClaveContratoDTO | null> = computed((): ClaveContratoDTO | null => {
        const clave = this.formData().claveContrato;
        if (!clave) return null;
        return this.clavesContrato().find(c => c.clave === clave) ?? null;
    });

    /** Indica si la naturaleza del contrato seleccionado es FORMACION o BECARIO */
    public esFormacionOBecario: Signal<boolean> = computed((): boolean => {
        const clave = this.claveSeleccionada();
        if (!clave) return false;
        return clave.naturaleza === 'FORMACION'
            || clave.naturaleza === 'BECARIO_REMUNERADO'
            || clave.naturaleza === 'BECARIO_NO_REMUNERADO';
    });

    public Math: Math = Math;

    public constructor() {
        effect((): void => {
            const page = this.currentPage();
            if (page >= 0) {
                this.loadDataInternal();
            }
        });
    }

    public ngOnInit(): void {
        this.loadData();
        this.loadPersonalSelector();
        this.loadClavesContrato();
    }

    // ── Carga de datos ────────────────────────────────────────────────────────

    public loadData(): void {
        this.currentPage.set(0);
        this.loadDataInternal();
    }

    private loadDataInternal(): void {
        this.loading.set(true);
        this.economicoPersonalService
            .obtenerPeriodosContratoPorIdEconomico(this.idEconomico, this.currentPage(), this.pageSize())
            .subscribe({
                next: (response: PaginacionResponse<PeriodoContratoDTO>) => {
                    this.periodos.set(response.content);
                    this.totalElements.set(response.totalElements);
                    this.totalPages.set(response.totalPages);
                    this.loading.set(false);
                },
                error: (error) => {
                    console.error('Error cargando períodos de contrato:', error);
                    this.loading.set(false);
                }
            });
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

    private loadClavesContrato(): void {
        this.economicoPersonalService.obtenerClavesContrato().subscribe({
            next: (claves: ClaveContratoDTO[]) => {
                this.clavesContrato.set(claves);
            },
            error: (error) => {
                console.error('Error cargando claves de contrato:', error);
            }
        });
    }

    // ── CRUD ──────────────────────────────────────────────────────────────────

    public deletePeriodo(idPeriodo: number): void {
        Swal.fire({
            title: '¿Está seguro?',
            text: 'Esta acción eliminará el período de contrato permanentemente.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280'
        }).then((result) => {
            if (result.isConfirmed) {
                this.savingStates.update(states => ({...states, [idPeriodo]: 'saving'}));

                this.economicoPersonalService.eliminarPeriodoContrato(idPeriodo).subscribe({
                    next: () => {
                        this.periodos.update(items => items.filter(item => item.id !== idPeriodo));
                        this.totalElements.update(n => n - 1);
                        this.savingStates.update(states => {
                            const next = {...states};
                            delete next[idPeriodo];
                            return next;
                        });
                        Swal.fire('Eliminado', 'El período de contrato ha sido eliminado.', 'success');
                    },
                    error: (error) => {
                        console.error('Error eliminando período de contrato:', error);
                        this.handleSavingError(idPeriodo);
                        const mensaje = error?.error?.mensaje || 'Error al eliminar el período';
                        Swal.fire('Error', mensaje, 'error');
                    }
                });
            }
        });
    }

    // ── Modal ─────────────────────────────────────────────────────────────────

    public openCreateModal(): void {
        this.resetForm();
        this.modalMode.set('create');
        this.modalOpen.set(true);
        document.body.style.overflow = 'hidden';
    }

    public openEditModal(periodo: PeriodoContratoDTO): void {
        this.selectedPeriodo.set(periodo);
        this.formData.set({
            idPersona: periodo.idPersona,
            claveContrato: periodo.claveContrato,
            fechaAlta: periodo.fechaAlta ? periodo.fechaAlta.substring(0, 10) : '',
            fechaBaja: periodo.fechaBaja ? periodo.fechaBaja.substring(0, 10) : '',
            porcentajeJornada: periodo.porcentajeJornada,
            horasConvenio: periodo.horasConvenio,
            nombrePersona: periodo.nombre
        });
        this.modalMode.set('edit');
        this.modalOpen.set(true);
        document.body.style.overflow = 'hidden';
    }

    public closeModal(): void {
        this.modalOpen.set(false);
        this.modalMode.set(null);
        this.selectedPeriodo.set(null);
        this.resetForm();
        document.body.style.overflow = 'auto';
    }

    public onBackdropClick(event: Event): void {
        if (event.target === event.currentTarget) {
            this.closeModal();
        }
    }

    public saveModal(): void {
        if (!this.validateForm()) return;
        this.modalLoading.set(true);

        if (this.modalMode() === 'create') {
            this.createPeriodo();
        } else if (this.modalMode() === 'edit') {
            this.updatePeriodo();
        }
    }

    private createPeriodo(): void {
        const form = this.formData();
        const dto: CrearPeriodoContratoDTO = {
            idPersona: Number(form.idPersona),
            claveContrato: form.claveContrato,
            fechaAlta: form.fechaAlta,
            fechaBaja: form.fechaBaja || null,
            anioFiscal: new Date(form.fechaAlta).getFullYear(),
            porcentajeJornada: Number(form.porcentajeJornada),
            horasConvenio: Number(form.horasConvenio)
        };

        this.economicoPersonalService.crearPeriodoContrato(dto).subscribe({
            next: () => {
                this.modalLoading.set(false);
                this.closeModal();
                this.loadData();
                Swal.fire('Creado', 'El período de contrato ha sido creado correctamente.', 'success');
            },
            error: (error) => {
                console.error('Error creando período de contrato:', error);
                this.modalLoading.set(false);
                const mensaje = error?.error?.mensaje || 'Error al crear el período';
                Swal.fire('Error', mensaje, 'error');
            }
        });
    }

    private updatePeriodo(): void {
        const form = this.formData();
        const periodo = this.selectedPeriodo();
        if (!periodo) {
            this.modalLoading.set(false);
            return;
        }

        const dto: ActualizarPeriodoContratoDTO = {
            id: periodo.id,
            claveContrato: form.claveContrato,
            fechaAlta: form.fechaAlta,
            fechaBaja: form.fechaBaja || null,
            porcentajeJornada: Number(form.porcentajeJornada),
            horasConvenio: Number(form.horasConvenio)
        };

        this.economicoPersonalService.actualizarPeriodoContrato(dto).subscribe({
            next: () => {
                this.modalLoading.set(false);
                this.closeModal();
                this.loadData();
                Swal.fire('Actualizado', 'El período de contrato ha sido actualizado.', 'success');
            },
            error: (error) => {
                console.error('Error actualizando período de contrato:', error);
                this.modalLoading.set(false);
                const mensaje = error?.error?.mensaje || 'Error al actualizar el período';
                Swal.fire('Error', mensaje, 'error');
            }
        });
    }

    // ── Handlers del formulario ───────────────────────────────────────────────

    public onPersonalChange(): void {
        const form = this.formData();
        const persona = this.listadoPersonal().find(p => p.idPersona === Number(form.idPersona));
        if (persona) {
            this.formData.update(current => ({...current, nombrePersona: persona.nombre}));
        }
    }

    public onClaveChange(): void {
        const clave = this.claveSeleccionada();
        if (!clave) return;

        // Auto-set porcentajeJornada: TC → 100, otros → dejar como está si ya tiene valor
        const porcentaje = clave.jornada === 'TIEMPO_COMPLETO' ? 100 : this.formData().porcentajeJornada;

        this.formData.update(current => ({
            ...current,
            porcentajeJornada: porcentaje
        }));
    }

    // ── Validación ────────────────────────────────────────────────────────────

    private validateForm(): boolean {
        const form = this.formData();

        if (this.modalMode() === 'create' && Number(form.idPersona) === 0) {
            Swal.fire('Error', 'Debe seleccionar un empleado', 'warning');
            return false;
        }

        if (!form.claveContrato) {
            Swal.fire('Error', 'Debe seleccionar una clave de contrato', 'warning');
            return false;
        }

        if (!form.fechaAlta) {
            Swal.fire('Error', 'La fecha de alta es obligatoria', 'warning');
            return false;
        }

        if (form.fechaBaja && form.fechaBaja < form.fechaAlta) {
            Swal.fire('Error', 'La fecha de baja no puede ser anterior a la fecha de alta', 'warning');
            return false;
        }

        if (Number(form.porcentajeJornada) <= 0 || Number(form.porcentajeJornada) > 100) {
            Swal.fire('Error', 'El porcentaje de jornada debe estar entre 1 y 100', 'warning');
            return false;
        }

        if (Number(form.horasConvenio) <= 0) {
            Swal.fire('Error', 'Las horas de convenio deben ser mayores que 0', 'warning');
            return false;
        }

        return true;
    }

    // ── Utilidades ────────────────────────────────────────────────────────────

    private resetForm(): void {
        this.formData.set({
            idPersona: 0,
            claveContrato: '',
            fechaAlta: '',
            fechaBaja: '',
            porcentajeJornada: 100,
            horasConvenio: 1720,
            nombrePersona: ''
        });
    }

    private handleSavingError(idPeriodo: number): void {
        this.savingStates.update(states => ({...states, [idPeriodo]: 'error'}));
        setTimeout(() => {
            this.savingStates.update(states => ({...states, [idPeriodo]: 'idle'}));
        }, 3000);
    }

    public formatDate(dateStr: string | null): string {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '—';
            return d.toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit', year: 'numeric'});
        } catch {
            return '—';
        }
    }

    public getNaturalezaLabel(naturaleza: NaturalezaContrato): string {
        const labels: Record<NaturalezaContrato, string> = {
            INDEFINIDO: 'Indefinido',
            TEMPORAL: 'Temporal',
            FORMACION: 'Formación',
            BECARIO_REMUNERADO: 'Becario rem.',
            BECARIO_NO_REMUNERADO: 'Becario no rem.'
        };
        return labels[naturaleza] ?? naturaleza;
    }

    public getNaturalezaBadgeClass(naturaleza: NaturalezaContrato): string {
        switch (naturaleza) {
            case 'INDEFINIDO':
                return 'bg-emerald-100 text-emerald-800';
            case 'TEMPORAL':
                return 'bg-amber-100 text-amber-800';
            case 'FORMACION':
            case 'BECARIO_REMUNERADO':
            case 'BECARIO_NO_REMUNERADO':
                return 'bg-sky-100 text-sky-800';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    }

    public getJornadaLabel(jornada: TipoJornada): string {
        const labels: Record<TipoJornada, string> = {
            TIEMPO_COMPLETO: 'TC',
            TIEMPO_PARCIAL: 'TP',
            FIJO_DISCONTINUO: 'FD'
        };
        return labels[jornada] ?? jornada;
    }

    // ── Paginación ────────────────────────────────────────────────────────────

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
        const base = 'relative inline-flex items-center px-4 py-2 border text-sm font-medium';
        if (this.currentPage() === page) {
            return `${base} z-10 bg-blue-50 border-blue-500 text-blue-600`;
        }
        return `${base} bg-white border-gray-300 text-gray-500 hover:bg-gray-50`;
    }

    public isLoading(): boolean { return this.loading(); }
    public hasPeriodos(): boolean { return this.periodos().length > 0; }
    public canGoPrevious(): boolean { return this.currentPage() > 0; }
    public canGoNext(): boolean { return this.currentPage() < this.totalPages() - 1; }
}
