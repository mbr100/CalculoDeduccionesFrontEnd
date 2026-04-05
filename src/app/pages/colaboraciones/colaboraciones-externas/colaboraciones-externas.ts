import {Component, computed, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {Sidebar} from '../../../components/personal/sidebar/sidebar';
import {ColaboracionesService} from '../../../services/colaboraciones-service';
import {ProyectoService} from '../../../services/proyecto-service';
import {FaseProyectoService} from '../../../services/fase-proyecto-service';
import {
    ActualizarColaboradoraDTO,
    ActualizarContratoColaboracionDTO,
    ActualizarFacturaColaboracionDTO,
    ActualizarImputacionFacturaFaseDTO,
    ColaboradoraDTO,
    ContratoColaboracionDTO,
    CrearColaboradoraDTO,
    CrearContratoColaboracionDTO,
    CrearFacturaColaboracionDTO,
    FacturaColaboracionDTO,
    TipoContratoColaboradorasExternas,
    ValidezIDI
} from '../../../models/colaboracion';
import {Proyecto} from '../../../models/proyecto-economico';
import {FaseProyectoDTO} from '../../../models/fase-proyecto';
import {SavingState} from '../../../models/savingState';
import Swal from 'sweetalert2';

// ---- Formulario colaboradora ----
interface FormColaboradora {
    cif: string;
    nombre: string;
}

// ---- Formulario contrato ----
interface FormContrato {
    idColaboradora: number | null;
    nombreContrato: string;
    objeto: string;
    tipoContrato: TipoContratoColaboradorasExternas | '';
    validez: ValidezIDI | '';
    importeCubierto: number | null;
}

// ---- Formulario factura ----
interface FormFactura {
    idColaboradora: number | null;
    numeroFactura: string;
    conceptos: string;
    importe: number | null;
    baseImponible: number | null;
    iva: number | null;
    porcentajeProrrata: number;
    validez: ValidezIDI | '';
    porcentajeValidez: number | null;
    idContrato: number | null;
    idProyecto: number | null;
}

@Component({
    selector: 'app-colaboraciones-externas',
    imports: [FormsModule, Sidebar],
    templateUrl: './colaboraciones-externas.html',
})
export class ColaboracionesExternas implements OnInit {
    private route: ActivatedRoute = inject(ActivatedRoute);
    private colaboracionesService: ColaboracionesService = inject(ColaboracionesService);
    private proyectoService: ProyectoService = inject(ProyectoService);
    private faseProyectoService: FaseProyectoService = inject(FaseProyectoService);

    public economicoId: number;

    // ---- Tabs ----
    public activeTab: WritableSignal<string> = signal<string>('colaboradoras');

    public tabs = [
        {id: 'colaboradoras', label: 'Colaboradoras', icon: 'fas fa-building'},
        {id: 'contratos', label: 'Contratos', icon: 'fas fa-file-contract'},
        {id: 'facturas', label: 'Facturas', icon: 'fas fa-file-invoice-dollar'}
    ] as const;

    // ---- Loading ----
    public loading: WritableSignal<boolean> = signal(false);

    // ---- Colaboradoras ----
    public colaboradoras: WritableSignal<ColaboradoraDTO[]> = signal<ColaboradoraDTO[]>([]);
    public savingStatesColaboradoras: WritableSignal<{[key: string]: SavingState}> = signal<{[key: string]: SavingState}>({});

    // ---- Contratos ----
    public contratos: WritableSignal<ContratoColaboracionDTO[]> = signal<ContratoColaboracionDTO[]>([]);
    public savingStatesContratos: WritableSignal<{[key: string]: SavingState}> = signal<{[key: string]: SavingState}>({});
    public filtroContratoColaboradora: WritableSignal<number | null> = signal<number | null>(null);

    public contratosFiltrados = computed(() => {
        const filtro = this.filtroContratoColaboradora();
        const todos = this.contratos();
        if (!filtro) return todos;
        return todos.filter(c => c.idColaboradora === filtro);
    });

    // ---- Facturas ----
    public facturas: WritableSignal<FacturaColaboracionDTO[]> = signal<FacturaColaboracionDTO[]>([]);
    public savingStatesFacturas: WritableSignal<{[key: string]: SavingState}> = signal<{[key: string]: SavingState}>({});
    public filtroFacturaColaboradora: WritableSignal<number | null> = signal<number | null>(null);
    public filtroFacturaProyecto: WritableSignal<number | null> = signal<number | null>(null);
    public filtroFacturaContrato: WritableSignal<number | null> = signal<number | null>(null);
    public expandedFacturaId: WritableSignal<number | null> = signal<number | null>(null);
    public fasesFactura: WritableSignal<FaseProyectoDTO[]> = signal<FaseProyectoDTO[]>([]);
    public fasesFacturaLoading: WritableSignal<boolean> = signal(false);
    public savingStatesImputaciones: WritableSignal<{[key: string]: SavingState}> = signal<{[key: string]: SavingState}>({});

    public facturasFiltradas = computed(() => {
        const filtroCol = this.filtroFacturaColaboradora();
        const filtroProj = this.filtroFacturaProyecto();
        const filtroContr = this.filtroFacturaContrato();
        return this.facturas().filter(f => {
            if (filtroCol && f.idColaboradora !== filtroCol) return false;
            if (filtroProj && f.idProyecto !== filtroProj) return false;
            if (filtroContr && f.idContrato !== filtroContr) return false;
            return true;
        });
    });

    // ---- Proyectos (dropdown) ----
    public proyectos: WritableSignal<Proyecto[]> = signal<Proyecto[]>([]);

    // ---- Modal genérico ----
    public modalOpen: WritableSignal<boolean> = signal(false);
    public modalType: WritableSignal<'colaboradora' | 'contrato' | 'factura' | null> = signal(null);
    public modalMode: WritableSignal<'create' | 'edit' | null> = signal(null);
    public modalLoading: WritableSignal<boolean> = signal(false);
    public modalError: WritableSignal<string> = signal('');

    // ---- Formulario colaboradora ----
    public formColaboradora: WritableSignal<FormColaboradora> = signal({cif: '', nombre: ''});
    public editingColaboradoraId: WritableSignal<number | null> = signal(null);

    // ---- Formulario contrato ----
    public formContrato: WritableSignal<FormContrato> = signal({
        idColaboradora: null,
        nombreContrato: '',
        objeto: '',
        tipoContrato: '',
        validez: '',
        importeCubierto: null
    });
    public editingContratoId: WritableSignal<number | null> = signal(null);

    // ---- Formulario factura ----
    public formFactura: WritableSignal<FormFactura> = signal({
        idColaboradora: null,
        numeroFactura: '',
        conceptos: '',
        importe: null,
        baseImponible: null,
        iva: null,
        porcentajeProrrata: 0,
        validez: '',
        porcentajeValidez: null,
        idContrato: null,
        idProyecto: null
    });
    public editingFacturaId: WritableSignal<number | null> = signal(null);

    // ---- Computed: contratos filtrados por colaboradora seleccionada en formulario factura ----
    public contratosParaFactura = computed(() => {
        const idCol = this.formFactura().idColaboradora;
        if (!idCol) return this.contratos();
        return this.contratos().filter(c => c.idColaboradora === idCol);
    });

    // ---- Computed: importes calculados en tiempo real ----
    public importeFinalCalculado = computed(() => {
        const f = this.formFactura();
        if (f.baseImponible === null || f.iva === null) return null;
        return f.baseImponible + (f.iva * (f.porcentajeProrrata / 100));
    });

    public importeImputableCalculado = computed(() => {
        const importeFinal = this.importeFinalCalculado();
        const f = this.formFactura();
        if (importeFinal === null || f.porcentajeValidez === null) return null;
        return importeFinal * (f.porcentajeValidez / 100);
    });

    // Enums expuestos al template
    public ValidezIDI = ValidezIDI;
    public TipoContratoColaboradorasExternas = TipoContratoColaboradorasExternas;

    public constructor() {
        this.economicoId = +this.route.snapshot.paramMap.get('id')!;
    }

    public ngOnInit(): void {
        this.loadAll();
    }

    // ==================== CARGA DE DATOS ====================

    public loadAll(): void {
        this.loading.set(true);
        let pending = 3;
        const done = () => {
            pending--;
            if (pending === 0) this.loading.set(false);
        };

        this.colaboracionesService.getColaboradoras(this.economicoId).subscribe({
            next: (data) => {this.colaboradoras.set(data); done();},
            error: () => done()
        });

        this.colaboracionesService.getContratos(this.economicoId).subscribe({
            next: (data) => {this.contratos.set(data); done();},
            error: () => done()
        });

        this.colaboracionesService.getFacturas(this.economicoId).subscribe({
            next: (data) => {this.facturas.set(data); done();},
            error: () => done()
        });

        // Proyectos: paginados, cargamos la primera página con tamaño grande
        this.proyectoService.getProyectosByEconomico(this.economicoId, 0, 200).subscribe({
            next: (response) => this.proyectos.set(response.content),
            error: () => {}
        });
    }

    // ==================== TABS ====================

    public setActiveTab(tabId: string): void {
        this.activeTab.set(tabId);
    }

    public getTabButtonClass(tabId: string): string {
        const base = 'flex items-center space-x-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200';
        const active = 'bg-white text-indigo-600 shadow-sm';
        const inactive = 'text-slate-600 hover:text-slate-900 hover:bg-slate-200';
        return `${base} ${this.activeTab() === tabId ? active : inactive}`;
    }

    // ==================== HELPER KEY ========================

    private fieldKey(id: number, field: string): string {
        return `${id}-${field}`;
    }

    private setSaving(states: WritableSignal<{[k: string]: SavingState}>, key: string, state: SavingState): void {
        states.update(s => ({...s, [key]: state}));
    }

    private setSuccessAndReset(states: WritableSignal<{[k: string]: SavingState}>, key: string): void {
        this.setSaving(states, key, 'success');
        setTimeout(() => this.setSaving(states, key, 'idle'), 2000);
    }

    private setErrorAndReset(states: WritableSignal<{[k: string]: SavingState}>, key: string): void {
        this.setSaving(states, key, 'error');
        setTimeout(() => this.setSaving(states, key, 'idle'), 3000);
    }

    public getInlineInputClass(states: {[k: string]: SavingState}, id: number, field: string): string {
        const state = states[this.fieldKey(id, field)] || 'idle';
        const base = 'w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-colors';
        if (state === 'saving') return `${base} border-blue-400`;
        if (state === 'success') return `${base} border-emerald-400`;
        if (state === 'error') return `${base} border-red-400`;
        return `${base} border-slate-300`;
    }

    public getSavingState(states: {[k: string]: SavingState}, id: number, field: string): SavingState {
        return states[this.fieldKey(id, field)] || 'idle';
    }

    // ==================== COLABORADORAS ====================

    public openCreateColaboradora(): void {
        this.formColaboradora.set({cif: '', nombre: ''});
        this.editingColaboradoraId.set(null);
        this.modalType.set('colaboradora');
        this.modalMode.set('create');
        this.modalError.set('');
        this.modalOpen.set(true);
        document.body.style.overflow = 'hidden';
    }

    public openEditColaboradora(col: ColaboradoraDTO): void {
        this.formColaboradora.set({cif: col.cif, nombre: col.nombre});
        this.editingColaboradoraId.set(col.idColaboradora);
        this.modalType.set('colaboradora');
        this.modalMode.set('edit');
        this.modalError.set('');
        this.modalOpen.set(true);
        document.body.style.overflow = 'hidden';
    }

    public saveColaboradora(): void {
        const form = this.formColaboradora();
        if (!form.cif.trim() || !form.nombre.trim()) {
            this.modalError.set('CIF y nombre son obligatorios.');
            return;
        }
        this.modalLoading.set(true);
        this.modalError.set('');

        if (this.modalMode() === 'create') {
            const dto: CrearColaboradoraDTO = {
                idEconomico: this.economicoId,
                cif: form.cif.trim(),
                nombre: form.nombre.trim()
            };
            this.colaboracionesService.crearColaboradora(dto).subscribe({
                next: (created) => {
                    this.colaboradoras.update(list => [...list, created]);
                    this.modalLoading.set(false);
                    this.closeModal();
                },
                error: () => {
                    this.modalLoading.set(false);
                    this.modalError.set('Error al crear la colaboradora.');
                }
            });
        } else {
            const id = this.editingColaboradoraId()!;
            const dto: ActualizarColaboradoraDTO = {idColaboradora: id, cif: form.cif.trim(), nombre: form.nombre.trim()};
            this.colaboracionesService.actualizarColaboradora(dto).subscribe({
                next: (updated) => {
                    this.colaboradoras.update(list => list.map(c => c.idColaboradora === id ? updated : c));
                    this.modalLoading.set(false);
                    this.closeModal();
                },
                error: () => {
                    this.modalLoading.set(false);
                    this.modalError.set('Error al actualizar la colaboradora.');
                }
            });
        }
    }

    public updateColaboradoraField(id: number, field: 'cif' | 'nombre', value: string): void {
        const key = this.fieldKey(id, field);
        this.setSaving(this.savingStatesColaboradoras, key, 'saving');
        const dto: ActualizarColaboradoraDTO = {idColaboradora: id, [field]: value};
        this.colaboracionesService.actualizarColaboradora(dto).subscribe({
            next: (updated) => {
                this.colaboradoras.update(list => list.map(c => c.idColaboradora === id ? updated : c));
                this.setSuccessAndReset(this.savingStatesColaboradoras, key);
            },
            error: () => this.setErrorAndReset(this.savingStatesColaboradoras, key)
        });
    }

    public deleteColaboradora(id: number, nombre: string): void {
        Swal.fire({
            title: '¿Eliminar colaboradora?',
            text: `Se eliminará "${nombre}" y todos sus contratos y facturas.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444'
        }).then(result => {
            if (result.isConfirmed) {
                this.colaboracionesService.eliminarColaboradora(id).subscribe({
                    next: () => {
                        this.colaboradoras.update(list => list.filter(c => c.idColaboradora !== id));
                        this.contratos.update(list => list.filter(c => c.idColaboradora !== id));
                        this.facturas.update(list => list.filter(f => f.idColaboradora !== id));
                        Swal.fire({title: 'Eliminada', icon: 'success', timer: 1800, showConfirmButton: false});
                    },
                    error: () => Swal.fire({title: 'Error', text: 'No se pudo eliminar la colaboradora.', icon: 'error'})
                });
            }
        });
    }

    // ==================== CONTRATOS ====================

    public openCreateContrato(): void {
        this.formContrato.set({
            idColaboradora: null,
            nombreContrato: '',
            objeto: '',
            tipoContrato: '',
            validez: '',
            importeCubierto: null
        });
        this.editingContratoId.set(null);
        this.modalType.set('contrato');
        this.modalMode.set('create');
        this.modalError.set('');
        this.modalOpen.set(true);
        document.body.style.overflow = 'hidden';
    }

    public openEditContrato(contrato: ContratoColaboracionDTO): void {
        this.formContrato.set({
            idColaboradora: contrato.idColaboradora,
            nombreContrato: contrato.nombreContrato,
            objeto: contrato.objeto,
            tipoContrato: contrato.tipoContrato,
            validez: contrato.validez,
            importeCubierto: contrato.importeCubierto
        });
        this.editingContratoId.set(contrato.idContrato);
        this.modalType.set('contrato');
        this.modalMode.set('edit');
        this.modalError.set('');
        this.modalOpen.set(true);
        document.body.style.overflow = 'hidden';
    }

    public saveContrato(): void {
        const form = this.formContrato();
        if (!form.idColaboradora || !form.nombreContrato.trim() || !form.tipoContrato || !form.validez || form.importeCubierto === null) {
            this.modalError.set('Todos los campos son obligatorios.');
            return;
        }
        this.modalLoading.set(true);
        this.modalError.set('');

        if (this.modalMode() === 'create') {
            const dto: CrearContratoColaboracionDTO = {
                idColaboradora: form.idColaboradora,
                nombreContrato: form.nombreContrato.trim(),
                objeto: form.objeto.trim(),
                tipoContrato: form.tipoContrato as TipoContratoColaboradorasExternas,
                validez: form.validez as ValidezIDI,
                importeCubierto: form.importeCubierto
            };
            this.colaboracionesService.crearContrato(dto).subscribe({
                next: (created) => {
                    this.contratos.update(list => [...list, created]);
                    this.modalLoading.set(false);
                    this.closeModal();
                },
                error: () => {
                    this.modalLoading.set(false);
                    this.modalError.set('Error al crear el contrato.');
                }
            });
        } else {
            const id = this.editingContratoId()!;
            const dto: ActualizarContratoColaboracionDTO = {
                idContrato: id,
                nombreContrato: form.nombreContrato.trim(),
                objeto: form.objeto.trim(),
                tipoContrato: form.tipoContrato as TipoContratoColaboradorasExternas,
                validez: form.validez as ValidezIDI,
                importeCubierto: form.importeCubierto!
            };
            this.colaboracionesService.actualizarContrato(dto).subscribe({
                next: (updated) => {
                    this.contratos.update(list => list.map(c => c.idContrato === id ? updated : c));
                    this.modalLoading.set(false);
                    this.closeModal();
                },
                error: () => {
                    this.modalLoading.set(false);
                    this.modalError.set('Error al actualizar el contrato.');
                }
            });
        }
    }

    public updateContratoField(id: number, field: keyof ActualizarContratoColaboracionDTO, value: any): void {
        if (field === 'idContrato') return;
        const key = this.fieldKey(id, field as string);
        this.setSaving(this.savingStatesContratos, key, 'saving');
        const dto: ActualizarContratoColaboracionDTO = {idContrato: id, [field]: value};
        this.colaboracionesService.actualizarContrato(dto).subscribe({
            next: (updated) => {
                this.contratos.update(list => list.map(c => c.idContrato === id ? updated : c));
                this.setSuccessAndReset(this.savingStatesContratos, key);
            },
            error: () => this.setErrorAndReset(this.savingStatesContratos, key)
        });
    }

    public deleteContrato(id: number, nombre: string): void {
        Swal.fire({
            title: '¿Eliminar contrato?',
            text: `Se eliminará "${nombre}" y sus facturas asociadas.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444'
        }).then(result => {
            if (result.isConfirmed) {
                this.colaboracionesService.eliminarContrato(id).subscribe({
                    next: () => {
                        this.contratos.update(list => list.filter(c => c.idContrato !== id));
                        this.facturas.update(list => list.map(f => f.idContrato === id ? {...f, idContrato: null, nombreContrato: null} : f));
                        Swal.fire({title: 'Eliminado', icon: 'success', timer: 1800, showConfirmButton: false});
                    },
                    error: () => Swal.fire({title: 'Error', text: 'No se pudo eliminar el contrato.', icon: 'error'})
                });
            }
        });
    }

    // ---- Setters de campos del formulario contrato (Arrow functions no permitidas en templates Angular) ----

    public setFormContratoIdColaboradora(value: any): void {
        this.formContrato.update(f => ({...f, idColaboradora: value ? +value : null}));
    }

    public setFormContratoNombreContrato(value: string): void {
        this.formContrato.update(f => ({...f, nombreContrato: value}));
    }

    public setFormContratoObjeto(value: string): void {
        this.formContrato.update(f => ({...f, objeto: value}));
    }

    public setFormContratoTipoContrato(value: string): void {
        this.formContrato.update(f => ({...f, tipoContrato: value as TipoContratoColaboradorasExternas | ''}));
    }

    public setFormContratoValidez(value: string): void {
        this.formContrato.update(f => ({...f, validez: value as ValidezIDI | ''}));
    }

    public setFormContratoImporteCubierto(value: number): void {
        this.formContrato.update(f => ({...f, importeCubierto: value}));
    }

    // ==================== FACTURAS ====================

    public openCreateFactura(): void {
        this.formFactura.set({
            idColaboradora: null,
            numeroFactura: '',
            conceptos: '',
            importe: null,
            baseImponible: null,
            iva: null,
            porcentajeProrrata: 0,
            validez: '',
            porcentajeValidez: null,
            idContrato: null,
            idProyecto: null
        });
        this.editingFacturaId.set(null);
        this.modalType.set('factura');
        this.modalMode.set('create');
        this.modalError.set('');
        this.modalOpen.set(true);
        document.body.style.overflow = 'hidden';
    }

    public openEditFactura(factura: FacturaColaboracionDTO): void {
        this.formFactura.set({
            idColaboradora: factura.idColaboradora,
            numeroFactura: factura.numeroFactura,
            conceptos: factura.conceptos,
            importe: factura.importe,
            baseImponible: factura.baseImponible,
            iva: factura.iva,
            porcentajeProrrata: factura.porcentajeProrrata,
            validez: factura.validez,
            porcentajeValidez: factura.porcentajeValidez,
            idContrato: factura.idContrato,
            idProyecto: factura.idProyecto
        });
        this.editingFacturaId.set(factura.idFactura);
        this.modalType.set('factura');
        this.modalMode.set('edit');
        this.modalError.set('');
        this.modalOpen.set(true);
        document.body.style.overflow = 'hidden';
    }

    public onFacturaValidezChange(validez: string): void {
        const current = this.formFactura();
        let porcentajeValidez: number | null = current.porcentajeValidez;
        if (validez === ValidezIDI.VALIDA_IDI) porcentajeValidez = 100;
        else if (validez === ValidezIDI.NO_VALIDA) porcentajeValidez = 0;
        this.formFactura.set({...current, validez: validez as ValidezIDI, porcentajeValidez});
    }

    public onFacturaColaboradoraChange(idColaboradora: number | null): void {
        this.formFactura.update(f => ({...f, idColaboradora: idColaboradora ? +idColaboradora : null, idContrato: null}));
    }

    public saveFactura(): void {
        const form = this.formFactura();
        if (!form.idColaboradora || !form.numeroFactura.trim() || !form.validez ||
            form.baseImponible === null || form.iva === null || form.porcentajeValidez === null) {
            this.modalError.set('Colaboradora, número de factura, base imponible, IVA, validez y % validez son obligatorios.');
            return;
        }
        this.modalLoading.set(true);
        this.modalError.set('');

        if (this.modalMode() === 'create') {
            const dto: CrearFacturaColaboracionDTO = {
                idColaboradora: form.idColaboradora,
                numeroFactura: form.numeroFactura.trim(),
                conceptos: form.conceptos.trim(),
                importe: form.importe ?? 0,
                baseImponible: form.baseImponible,
                iva: form.iva,
                porcentajeProrrata: form.porcentajeProrrata,
                validez: form.validez as ValidezIDI,
                porcentajeValidez: form.porcentajeValidez,
                idContrato: form.idContrato ?? undefined,
                idProyecto: form.idProyecto ?? undefined
            };
            this.colaboracionesService.crearFactura(dto).subscribe({
                next: (created) => {
                    this.facturas.update(list => [...list, created]);
                    this.modalLoading.set(false);
                    this.closeModal();
                },
                error: () => {
                    this.modalLoading.set(false);
                    this.modalError.set('Error al crear la factura.');
                }
            });
        } else {
            const id = this.editingFacturaId()!;
            const dto: ActualizarFacturaColaboracionDTO = {
                idFactura: id,
                numeroFactura: form.numeroFactura.trim(),
                conceptos: form.conceptos.trim(),
                importe: form.importe ?? 0,
                baseImponible: form.baseImponible!,
                iva: form.iva!,
                porcentajeProrrata: form.porcentajeProrrata,
                validez: form.validez as ValidezIDI,
                porcentajeValidez: form.porcentajeValidez!,
                idContrato: form.idContrato ?? undefined,
                idProyecto: form.idProyecto ?? undefined
            };
            this.colaboracionesService.actualizarFactura(dto).subscribe({
                next: (updated) => {
                    this.facturas.update(list => list.map(f => f.idFactura === id ? updated : f));
                    this.modalLoading.set(false);
                    this.closeModal();
                },
                error: () => {
                    this.modalLoading.set(false);
                    this.modalError.set('Error al actualizar la factura.');
                }
            });
        }
    }

    public updateFacturaField(id: number, field: keyof ActualizarFacturaColaboracionDTO, value: any): void {
        if (field === 'idFactura') return;
        const key = this.fieldKey(id, field as string);
        this.setSaving(this.savingStatesFacturas, key, 'saving');
        const dto: ActualizarFacturaColaboracionDTO = {idFactura: id, [field]: value};
        this.colaboracionesService.actualizarFactura(dto).subscribe({
            next: (updated) => {
                this.facturas.update(list => list.map(f => f.idFactura === id ? updated : f));
                this.setSuccessAndReset(this.savingStatesFacturas, key);
            },
            error: () => this.setErrorAndReset(this.savingStatesFacturas, key)
        });
    }

    public deleteFactura(id: number, numero: string): void {
        Swal.fire({
            title: '¿Eliminar factura?',
            text: `Se eliminará la factura "${numero}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444'
        }).then(result => {
            if (result.isConfirmed) {
                this.colaboracionesService.eliminarFactura(id).subscribe({
                    next: () => {
                        this.facturas.update(list => list.filter(f => f.idFactura !== id));
                        if (this.expandedFacturaId() === id) this.expandedFacturaId.set(null);
                        Swal.fire({title: 'Eliminada', icon: 'success', timer: 1800, showConfirmButton: false});
                    },
                    error: () => Swal.fire({title: 'Error', text: 'No se pudo eliminar la factura.', icon: 'error'})
                });
            }
        });
    }

    // ---- Setters de campos del formulario factura (Arrow functions no permitidas en templates Angular) ----

    public setFormFacturaNumeroFactura(value: string): void {
        this.formFactura.update(f => ({...f, numeroFactura: value}));
    }

    public setFormFacturaConceptos(value: string): void {
        this.formFactura.update(f => ({...f, conceptos: value}));
    }

    public setFormFacturaBaseImponible(value: number): void {
        this.formFactura.update(f => ({...f, baseImponible: value}));
    }

    public setFormFacturaIva(value: number): void {
        this.formFactura.update(f => ({...f, iva: value}));
    }

    public setFormFacturaPorcentajeProrrata(value: number): void {
        this.formFactura.update(f => ({...f, porcentajeProrrata: value}));
    }

    public setFormFacturaPorcentajeValidez(value: number): void {
        this.formFactura.update(f => ({...f, porcentajeValidez: value}));
    }

    public setFormFacturaIdContrato(value: any): void {
        this.formFactura.update(f => ({...f, idContrato: value ? +value : null}));
    }

    public setFormFacturaIdProyecto(value: any): void {
        this.formFactura.update(f => ({...f, idProyecto: value ? +value : null}));
    }

    // ==================== IMPUTACIONES A FASES ====================

    public toggleExpandFactura(factura: FacturaColaboracionDTO): void {
        const currentId = this.expandedFacturaId();
        if (currentId === factura.idFactura) {
            this.expandedFacturaId.set(null);
            this.fasesFactura.set([]);
            return;
        }
        this.expandedFacturaId.set(factura.idFactura);
        this.fasesFactura.set([]);

        if (factura.idProyecto) {
            this.fasesFacturaLoading.set(true);
            this.faseProyectoService.getFases(factura.idProyecto).subscribe({
                next: (fases) => {
                    this.fasesFactura.set(fases);
                    this.fasesFacturaLoading.set(false);
                },
                error: () => this.fasesFacturaLoading.set(false)
            });
        }
    }

    public getImputacionImporte(factura: FacturaColaboracionDTO, idFase: number): number {
        const imp = factura.imputacionesFase?.find(i => i.idFase === idFase);
        return imp?.importe ?? 0;
    }

    public updateImputacion(factura: FacturaColaboracionDTO, idFase: number, importe: number): void {
        const key = this.fieldKey(factura.idFactura, `fase-${idFase}`);
        this.setSaving(this.savingStatesImputaciones, key, 'saving');
        const dto: ActualizarImputacionFacturaFaseDTO = {
            idFactura: factura.idFactura,
            idFase,
            importe
        };
        this.colaboracionesService.actualizarImputacion(dto).subscribe({
            next: () => {
                // Actualizar localmente la imputacion
                this.facturas.update(list => list.map(f => {
                    if (f.idFactura !== factura.idFactura) return f;
                    const existingIdx = f.imputacionesFase?.findIndex(i => i.idFase === idFase) ?? -1;
                    const newImputaciones = [...(f.imputacionesFase ?? [])];
                    if (existingIdx >= 0) {
                        newImputaciones[existingIdx] = {...newImputaciones[existingIdx], importe};
                    } else {
                        const fase = this.fasesFactura().find(fa => fa.idFase === idFase);
                        newImputaciones.push({id: 0, idFactura: factura.idFactura, idFase, nombreFase: fase?.nombre ?? '', importe});
                    }
                    return {...f, imputacionesFase: newImputaciones};
                }));
                this.setSuccessAndReset(this.savingStatesImputaciones, key);
            },
            error: () => this.setErrorAndReset(this.savingStatesImputaciones, key)
        });
    }

    // ==================== MODAL GENÉRICO ====================

    public closeModal(): void {
        this.modalOpen.set(false);
        this.modalType.set(null);
        this.modalMode.set(null);
        this.modalLoading.set(false);
        this.modalError.set('');
        this.editingColaboradoraId.set(null);
        this.editingContratoId.set(null);
        this.editingFacturaId.set(null);
        document.body.style.overflow = 'auto';
    }

    public onBackdropClick(event: Event): void {
        if (event.target === event.currentTarget) {
            this.closeModal();
        }
    }

    public saveModal(): void {
        const type = this.modalType();
        if (type === 'colaboradora') this.saveColaboradora();
        else if (type === 'contrato') this.saveContrato();
        else if (type === 'factura') this.saveFactura();
    }

    // ==================== HELPERS DISPLAY ====================

    public getValidezLabel(validez: ValidezIDI | string): string {
        if (validez === ValidezIDI.VALIDA_IDI) return 'Válida I+D+i';
        if (validez === ValidezIDI.VALIDA_PARCIAL) return 'Válida Parcial';
        if (validez === ValidezIDI.NO_VALIDA) return 'No válida';
        return validez;
    }

    public getValidezBadgeClass(validez: ValidezIDI | string): string {
        if (validez === ValidezIDI.VALIDA_IDI) return 'ui-pill bg-emerald-100 text-emerald-800';
        if (validez === ValidezIDI.VALIDA_PARCIAL) return 'ui-pill bg-amber-100 text-amber-800';
        if (validez === ValidezIDI.NO_VALIDA) return 'ui-pill bg-rose-100 text-rose-800';
        return 'ui-pill ui-pill-neutral';
    }

    public getTipoContratoLabel(tipo: TipoContratoColaboradorasExternas | string): string {
        if (tipo === TipoContratoColaboradorasExternas.GASTOS) return 'Gastos';
        if (tipo === TipoContratoColaboradorasExternas.COSTE_HORA_PERSONAL) return 'Coste/Hora Personal';
        return tipo;
    }

    public getTipoContratoBadgeClass(tipo: TipoContratoColaboradorasExternas | string): string {
        if (tipo === TipoContratoColaboradorasExternas.GASTOS) return 'ui-pill bg-cyan-100 text-cyan-800';
        if (tipo === TipoContratoColaboradorasExternas.COSTE_HORA_PERSONAL) return 'ui-pill bg-indigo-100 text-indigo-800';
        return 'ui-pill ui-pill-neutral';
    }

    public formatCurrency(value: number | null | undefined): string {
        if (value === null || value === undefined) return '—';
        return new Intl.NumberFormat('es-ES', {style: 'currency', currency: 'EUR'}).format(value);
    }

    public formatPercent(value: number | null | undefined): string {
        if (value === null || value === undefined) return '—';
        return `${value}%`;
    }

    public isPorcentajeValidezEditable(): boolean {
        const v = this.formFactura().validez;
        return v === ValidezIDI.VALIDA_PARCIAL;
    }

    public onKeyEnter(event: KeyboardEvent, callback: () => void): void {
        if (event.key === 'Enter') {
            (event.target as HTMLElement).blur();
            callback();
        }
    }
}
