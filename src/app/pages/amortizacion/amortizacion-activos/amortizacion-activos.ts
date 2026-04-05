import {Component, computed, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {Sidebar} from '../../../components/personal/sidebar/sidebar';
import {AmortizacionService} from '../../../services/amortizacion-service';
import {ProyectoService} from '../../../services/proyecto-service';
import {FaseProyectoService} from '../../../services/fase-proyecto-service';
import {
    ActivoAmortizableDTO,
    ActualizarActivoAmortizableDTO,
    ActualizarImputacionActivoFaseDTO,
    CrearActivoAmortizableDTO
} from '../../../models/amortizacion';
import {Proyecto} from '../../../models/proyecto-economico';
import {FaseProyectoDTO} from '../../../models/fase-proyecto';
import {SavingState} from '../../../models/savingState';
import Swal from 'sweetalert2';

interface FormActivo {
    descripcion: string;
    proveedor: string;
    numeroFactura: string;
    valorAdquisicion: number | null;
    porcentajeAmortizacion: number | null;
    porcentajeUsoProyecto: number | null;
    idProyecto: number | null;
}

@Component({
    selector: 'app-amortizacion-activos',
    imports: [FormsModule, Sidebar],
    templateUrl: './amortizacion-activos.html',
    styleUrl: './amortizacion-activos.css'
})
export class AmortizacionActivos implements OnInit {
    private route: ActivatedRoute = inject(ActivatedRoute);
    private amortizacionService: AmortizacionService = inject(AmortizacionService);
    private proyectoService: ProyectoService = inject(ProyectoService);
    private faseProyectoService: FaseProyectoService = inject(FaseProyectoService);

    public economicoId: number;

    // ---- Loading ----
    public loading: WritableSignal<boolean> = signal(false);

    // ---- Datos ----
    public activos: WritableSignal<ActivoAmortizableDTO[]> = signal<ActivoAmortizableDTO[]>([]);
    public proyectos: WritableSignal<Proyecto[]> = signal<Proyecto[]>([]);

    // ---- Filtros ----
    public filtroProyecto: WritableSignal<number | null> = signal<number | null>(null);

    public activosFiltrados = computed(() => {
        const filtro = this.filtroProyecto();
        const todos = this.activos();
        if (!filtro) return todos;
        return todos.filter(a => a.idProyecto === filtro);
    });

    // ---- Expansión de fases ----
    public expandedActivoId: WritableSignal<number | null> = signal<number | null>(null);
    public fasesActuales: WritableSignal<FaseProyectoDTO[]> = signal<FaseProyectoDTO[]>([]);
    public fasesLoading: WritableSignal<boolean> = signal(false);
    public savingImputaciones: WritableSignal<{[key: string]: SavingState}> = signal<{[key: string]: SavingState}>({});

    // ---- Modal ----
    public modalOpen: WritableSignal<boolean> = signal(false);
    public modalMode: WritableSignal<'create' | 'edit' | null> = signal(null);
    public modalLoading: WritableSignal<boolean> = signal(false);
    public modalError: WritableSignal<string> = signal('');
    public editingActivoId: WritableSignal<number | null> = signal(null);

    public formActivo: WritableSignal<FormActivo> = signal({
        descripcion: '',
        proveedor: '',
        numeroFactura: '',
        valorAdquisicion: null,
        porcentajeAmortizacion: null,
        porcentajeUsoProyecto: null,
        idProyecto: null
    });

    // ---- Computed campos calculados en tiempo real ----
    public cuotaAmortizacionCalculada = computed(() => {
        const f = this.formActivo();
        if (f.valorAdquisicion === null || f.porcentajeAmortizacion === null) return null;
        return f.valorAdquisicion * (f.porcentajeAmortizacion / 100);
    });

    public importeImputableCalculado = computed(() => {
        const cuota = this.cuotaAmortizacionCalculada();
        const f = this.formActivo();
        if (cuota === null || f.porcentajeUsoProyecto === null) return null;
        return cuota * (f.porcentajeUsoProyecto / 100);
    });

    public constructor() {
        this.economicoId = +this.route.snapshot.paramMap.get('id')!;
    }

    public ngOnInit(): void {
        this.loadAll();
    }

    // ==================== CARGA ====================

    public loadAll(): void {
        this.loading.set(true);
        let pending = 2;
        const done = () => { if (--pending === 0) this.loading.set(false); };

        this.amortizacionService.getActivos(this.economicoId).subscribe({
            next: (data) => { this.activos.set(data); done(); },
            error: () => done()
        });

        this.proyectoService.getProyectosByEconomico(this.economicoId, 0, 200).subscribe({
            next: (response) => { this.proyectos.set(response.content); done(); },
            error: () => done()
        });
    }

    // ==================== MODAL ====================

    public openCreateActivo(): void {
        this.formActivo.set({
            descripcion: '', proveedor: '', numeroFactura: '',
            valorAdquisicion: null, porcentajeAmortizacion: null,
            porcentajeUsoProyecto: null, idProyecto: null
        });
        this.editingActivoId.set(null);
        this.modalMode.set('create');
        this.modalError.set('');
        this.modalOpen.set(true);
        document.body.style.overflow = 'hidden';
    }

    public openEditActivo(activo: ActivoAmortizableDTO): void {
        this.formActivo.set({
            descripcion: activo.descripcion,
            proveedor: activo.proveedor,
            numeroFactura: activo.numeroFactura || '',
            valorAdquisicion: activo.valorAdquisicion,
            porcentajeAmortizacion: activo.porcentajeAmortizacion,
            porcentajeUsoProyecto: activo.porcentajeUsoProyecto,
            idProyecto: activo.idProyecto
        });
        this.editingActivoId.set(activo.idActivo);
        this.modalMode.set('edit');
        this.modalError.set('');
        this.modalOpen.set(true);
        document.body.style.overflow = 'hidden';
    }

    public closeModal(): void {
        this.modalOpen.set(false);
        this.modalMode.set(null);
        document.body.style.overflow = '';
    }

    public saveActivo(): void {
        const form = this.formActivo();
        if (!form.descripcion.trim() || !form.proveedor.trim() ||
            form.valorAdquisicion === null || form.porcentajeAmortizacion === null || form.porcentajeUsoProyecto === null) {
            this.modalError.set('Descripción, proveedor, valor de adquisición y porcentajes son obligatorios.');
            return;
        }

        this.modalLoading.set(true);
        this.modalError.set('');

        if (this.modalMode() === 'create') {
            const dto: CrearActivoAmortizableDTO = {
                idEconomico: this.economicoId,
                descripcion: form.descripcion.trim(),
                proveedor: form.proveedor.trim(),
                numeroFactura: form.numeroFactura.trim() || undefined,
                valorAdquisicion: form.valorAdquisicion,
                porcentajeAmortizacion: form.porcentajeAmortizacion,
                porcentajeUsoProyecto: form.porcentajeUsoProyecto,
                idProyecto: form.idProyecto ?? undefined
            };
            this.amortizacionService.crearActivo(dto).subscribe({
                next: (created) => {
                    this.activos.update(list => [...list, created]);
                    this.modalLoading.set(false);
                    this.closeModal();
                },
                error: () => {
                    this.modalLoading.set(false);
                    this.modalError.set('Error al crear el activo.');
                }
            });
        } else {
            const id = this.editingActivoId()!;
            const dto: ActualizarActivoAmortizableDTO = {
                idActivo: id,
                descripcion: form.descripcion.trim(),
                proveedor: form.proveedor.trim(),
                numeroFactura: form.numeroFactura.trim() || undefined,
                valorAdquisicion: form.valorAdquisicion,
                porcentajeAmortizacion: form.porcentajeAmortizacion,
                porcentajeUsoProyecto: form.porcentajeUsoProyecto,
                idProyecto: form.idProyecto,
                clearProyecto: form.idProyecto === null
            };
            this.amortizacionService.actualizarActivo(dto).subscribe({
                next: (updated) => {
                    this.activos.update(list => list.map(a => a.idActivo === id ? updated : a));
                    this.modalLoading.set(false);
                    this.closeModal();
                },
                error: () => {
                    this.modalLoading.set(false);
                    this.modalError.set('Error al actualizar el activo.');
                }
            });
        }
    }

    public deleteActivo(id: number, descripcion: string): void {
        Swal.fire({
            title: '¿Eliminar activo?',
            text: `Se eliminará "${descripcion}" y sus imputaciones a fases.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444'
        }).then(result => {
            if (result.isConfirmed) {
                this.amortizacionService.eliminarActivo(id).subscribe({
                    next: () => {
                        this.activos.update(list => list.filter(a => a.idActivo !== id));
                        if (this.expandedActivoId() === id) {
                            this.expandedActivoId.set(null);
                        }
                        Swal.fire({title: 'Eliminado', icon: 'success', timer: 1800, showConfirmButton: false});
                    },
                    error: () => Swal.fire({title: 'Error', text: 'No se pudo eliminar el activo.', icon: 'error'})
                });
            }
        });
    }

    // ==================== IMPUTACIONES ====================

    public toggleImputaciones(activo: ActivoAmortizableDTO): void {
        const current = this.expandedActivoId();
        if (current === activo.idActivo) {
            this.expandedActivoId.set(null);
            this.fasesActuales.set([]);
            return;
        }
        this.expandedActivoId.set(activo.idActivo);
        if (activo.idProyecto) {
            this.fasesLoading.set(true);
            this.faseProyectoService.getFases(activo.idProyecto).subscribe({
                next: (fases: FaseProyectoDTO[]) => { this.fasesActuales.set(fases); this.fasesLoading.set(false); },
                error: () => this.fasesLoading.set(false)
            });
        } else {
            this.fasesActuales.set([]);
        }
    }

    public getImporteImputacion(activo: ActivoAmortizableDTO, idFase: number): number {
        const imp = activo.imputaciones.find(i => i.idFase === idFase);
        return imp ? imp.importe : 0;
    }

    public getTotalImputado(activo: ActivoAmortizableDTO): number {
        return activo.imputaciones.reduce((sum, i) => sum + i.importe, 0);
    }

    public saveImputacion(activo: ActivoAmortizableDTO, idFase: number, value: number): void {
        const key = `${activo.idActivo}-${idFase}`;
        this.savingImputaciones.update(s => ({...s, [key]: 'saving'}));

        const dto: ActualizarImputacionActivoFaseDTO = {
            idActivo: activo.idActivo,
            idFase,
            importe: value || 0
        };
        this.amortizacionService.actualizarImputacion(dto).subscribe({
            next: () => {
                this.amortizacionService.getActivos(this.economicoId).subscribe({
                    next: (data) => {
                        this.activos.set(data);
                        this.savingImputaciones.update(s => ({...s, [key]: 'success'}));
                        setTimeout(() => this.savingImputaciones.update(s => ({...s, [key]: 'idle'})), 2000);
                    }
                });
            },
            error: () => {
                this.savingImputaciones.update(s => ({...s, [key]: 'error'}));
                setTimeout(() => this.savingImputaciones.update(s => ({...s, [key]: 'idle'})), 3000);
            }
        });
    }

    public getImputacionCellClass(idActivo: number, idFase: number): string {
        const key = `${idActivo}-${idFase}`;
        const state = this.savingImputaciones()[key] || 'idle';
        if (state === 'saving') return 'border-blue-400 bg-blue-50';
        if (state === 'success') return 'border-emerald-400 bg-emerald-50';
        if (state === 'error') return 'border-red-400 bg-red-50';
        return 'border-slate-200';
    }

    // ==================== SETTERS DE FORMULARIO (No usar arrow functions en templates Angular) ====================

    public setFormDescripcion(value: string): void {
        this.formActivo.update(f => ({...f, descripcion: value}));
    }

    public setFormProveedor(value: string): void {
        this.formActivo.update(f => ({...f, proveedor: value}));
    }

    public setFormNumeroFactura(value: string): void {
        this.formActivo.update(f => ({...f, numeroFactura: value}));
    }

    public setFormValorAdquisicion(value: number): void {
        this.formActivo.update(f => ({...f, valorAdquisicion: value}));
    }

    public setFormPorcentajeAmortizacion(value: number): void {
        this.formActivo.update(f => ({...f, porcentajeAmortizacion: value}));
    }

    public setFormPorcentajeUsoProyecto(value: number): void {
        this.formActivo.update(f => ({...f, porcentajeUsoProyecto: value}));
    }

    public setFormIdProyecto(value: any): void {
        this.formActivo.update(f => ({...f, idProyecto: value ? +value : null}));
    }

    // ==================== HELPERS UI ====================

    public formatCurrency(value: number | null): string {
        if (value === null) return '-';
        return new Intl.NumberFormat('es-ES', {style: 'currency', currency: 'EUR'}).format(value);
    }

    public getNombreProyecto(idProyecto: number | null): string {
        if (!idProyecto) return '-';
        const p = this.proyectos().find(p => p.idProyecto === idProyecto);
        return p ? p.acronimo : '-';
    }
}
