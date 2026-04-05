import {Component, computed, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {Sidebar} from '../../../components/personal/sidebar/sidebar';
import {MaterialFungibleService} from '../../../services/material-fungible-service';
import {ProyectoService} from '../../../services/proyecto-service';
import {FaseProyectoService} from '../../../services/fase-proyecto-service';
import {
    ActualizarFacturaMaterialDTO,
    ActualizarImputacionMaterialFaseDTO,
    CrearFacturaMaterialDTO,
    FacturaMaterialDTO,
    ValidezIDI
} from '../../../models/material-fungible';
import {Proyecto} from '../../../models/proyecto-economico';
import {FaseProyectoDTO} from '../../../models/fase-proyecto';
import {SavingState} from '../../../models/savingState';
import Swal from 'sweetalert2';

interface FormFactura {
    numeroFactura: string;
    proveedor: string;
    descripcion: string;
    baseImponible: number | null;
    iva: number | null;
    porcentajeProrrata: number;
    validez: ValidezIDI | '';
    porcentajeValidez: number | null;
    idProyecto: number | null;
}

@Component({
    selector: 'app-materiales-fungibles',
    imports: [FormsModule, Sidebar],
    templateUrl: './materiales-fungibles.html',
    styleUrl: './materiales-fungibles.css'
})
export class MaterialesFungibles implements OnInit {
    private route: ActivatedRoute = inject(ActivatedRoute);
    private materialService: MaterialFungibleService = inject(MaterialFungibleService);
    private proyectoService: ProyectoService = inject(ProyectoService);
    private faseProyectoService: FaseProyectoService = inject(FaseProyectoService);

    public economicoId: number;

    // ---- Loading ----
    public loading: WritableSignal<boolean> = signal(false);

    // ---- Datos ----
    public facturas: WritableSignal<FacturaMaterialDTO[]> = signal<FacturaMaterialDTO[]>([]);
    public proyectos: WritableSignal<Proyecto[]> = signal<Proyecto[]>([]);
    public savingStates: WritableSignal<{[key: string]: SavingState}> = signal<{[key: string]: SavingState}>({});

    // ---- Filtros ----
    public filtroProyecto: WritableSignal<number | null> = signal<number | null>(null);

    public facturasFiltradas = computed(() => {
        const filtro = this.filtroProyecto();
        const todas = this.facturas();
        if (!filtro) return todas;
        return todas.filter(f => f.idProyecto === filtro);
    });

    // ---- Expansión de fases ----
    public expandedFacturaId: WritableSignal<number | null> = signal<number | null>(null);
    public fasesActuales: WritableSignal<FaseProyectoDTO[]> = signal<FaseProyectoDTO[]>([]);
    public fasesLoading: WritableSignal<boolean> = signal(false);
    public savingImputaciones: WritableSignal<{[key: string]: SavingState}> = signal<{[key: string]: SavingState}>({});

    // ---- Modal ----
    public modalOpen: WritableSignal<boolean> = signal(false);
    public modalMode: WritableSignal<'create' | 'edit' | null> = signal(null);
    public modalLoading: WritableSignal<boolean> = signal(false);
    public modalError: WritableSignal<string> = signal('');
    public editingFacturaId: WritableSignal<number | null> = signal(null);

    public formFactura: WritableSignal<FormFactura> = signal({
        numeroFactura: '',
        proveedor: '',
        descripcion: '',
        baseImponible: null,
        iva: null,
        porcentajeProrrata: 0,
        validez: '',
        porcentajeValidez: null,
        idProyecto: null
    });

    // ---- Computed importes en tiempo real ----
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

    // Enum expuesto al template
    public ValidezIDI = ValidezIDI;

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

        this.materialService.getFacturas(this.economicoId).subscribe({
            next: (data) => { this.facturas.set(data); done(); },
            error: () => done()
        });

        this.proyectoService.getProyectosByEconomico(this.economicoId, 0, 200).subscribe({
            next: (response) => { this.proyectos.set(response.content); done(); },
            error: () => done()
        });
    }

    // ==================== MODAL ====================

    public openCreateFactura(): void {
        this.formFactura.set({
            numeroFactura: '', proveedor: '', descripcion: '',
            baseImponible: null, iva: null, porcentajeProrrata: 0,
            validez: '', porcentajeValidez: null, idProyecto: null
        });
        this.editingFacturaId.set(null);
        this.modalMode.set('create');
        this.modalError.set('');
        this.modalOpen.set(true);
        document.body.style.overflow = 'hidden';
    }

    public openEditFactura(factura: FacturaMaterialDTO): void {
        this.formFactura.set({
            numeroFactura: factura.numeroFactura,
            proveedor: factura.proveedor,
            descripcion: factura.descripcion || '',
            baseImponible: factura.baseImponible,
            iva: factura.iva,
            porcentajeProrrata: factura.porcentajeProrrata,
            validez: factura.validez,
            porcentajeValidez: factura.porcentajeValidez,
            idProyecto: factura.idProyecto
        });
        this.editingFacturaId.set(factura.idFactura);
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

    public saveFactura(): void {
        const form = this.formFactura();
        if (!form.numeroFactura.trim() || !form.proveedor.trim() || form.baseImponible === null || form.iva === null || !form.validez) {
            this.modalError.set('Número de factura, proveedor, importes y validez son obligatorios.');
            return;
        }
        if (form.validez === ValidezIDI.VALIDA_PARCIAL && (form.porcentajeValidez === null || form.porcentajeValidez < 1 || form.porcentajeValidez > 99)) {
            this.modalError.set('Para validez parcial, el porcentaje debe estar entre 1 y 99.');
            return;
        }

        this.modalLoading.set(true);
        this.modalError.set('');

        const porcentajeValidez = form.validez === ValidezIDI.VALIDA_IDI ? 100
            : form.validez === ValidezIDI.NO_VALIDA ? 0
            : form.porcentajeValidez!;

        if (this.modalMode() === 'create') {
            const dto: CrearFacturaMaterialDTO = {
                idEconomico: this.economicoId,
                numeroFactura: form.numeroFactura.trim(),
                proveedor: form.proveedor.trim(),
                descripcion: form.descripcion,
                baseImponible: form.baseImponible,
                iva: form.iva,
                porcentajeProrrata: form.porcentajeProrrata || 0,
                validez: form.validez as ValidezIDI,
                porcentajeValidez,
                idProyecto: form.idProyecto ?? undefined
            };
            this.materialService.crearFactura(dto).subscribe({
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
            const dto: ActualizarFacturaMaterialDTO = {
                idFactura: id,
                numeroFactura: form.numeroFactura.trim(),
                proveedor: form.proveedor.trim(),
                descripcion: form.descripcion,
                baseImponible: form.baseImponible,
                iva: form.iva,
                porcentajeProrrata: form.porcentajeProrrata || 0,
                validez: form.validez as ValidezIDI,
                porcentajeValidez,
                idProyecto: form.idProyecto,
                clearProyecto: form.idProyecto === null
            };
            this.materialService.actualizarFactura(dto).subscribe({
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

    public deleteFactura(id: number, numero: string): void {
        Swal.fire({
            title: '¿Eliminar factura?',
            text: `Se eliminará la factura "${numero}" y sus imputaciones a fases.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444'
        }).then(result => {
            if (result.isConfirmed) {
                this.materialService.eliminarFactura(id).subscribe({
                    next: () => {
                        this.facturas.update(list => list.filter(f => f.idFactura !== id));
                        if (this.expandedFacturaId() === id) {
                            this.expandedFacturaId.set(null);
                        }
                        Swal.fire({title: 'Eliminada', icon: 'success', timer: 1800, showConfirmButton: false});
                    },
                    error: () => Swal.fire({title: 'Error', text: 'No se pudo eliminar la factura.', icon: 'error'})
                });
            }
        });
    }

    // ==================== IMPUTACIONES ====================

    public toggleImputaciones(factura: FacturaMaterialDTO): void {
        const current = this.expandedFacturaId();
        if (current === factura.idFactura) {
            this.expandedFacturaId.set(null);
            this.fasesActuales.set([]);
            return;
        }
        this.expandedFacturaId.set(factura.idFactura);
        if (factura.idProyecto) {
            this.fasesLoading.set(true);
            this.faseProyectoService.getFases(factura.idProyecto).subscribe({
                next: (fases: FaseProyectoDTO[]) => { this.fasesActuales.set(fases); this.fasesLoading.set(false); },
                error: () => this.fasesLoading.set(false)
            });
        } else {
            this.fasesActuales.set([]);
        }
    }

    public getImporteImputacion(factura: FacturaMaterialDTO, idFase: number): number {
        const imp = factura.imputaciones.find(i => i.idFase === idFase);
        return imp ? imp.importe : 0;
    }

    public getTotalImputado(factura: FacturaMaterialDTO): number {
        return factura.imputaciones.reduce((sum, i) => sum + i.importe, 0);
    }

    public saveImputacion(factura: FacturaMaterialDTO, idFase: number, value: number): void {
        const key = `${factura.idFactura}-${idFase}`;
        this.savingImputaciones.update(s => ({...s, [key]: 'saving'}));

        const dto: ActualizarImputacionMaterialFaseDTO = {
            idFactura: factura.idFactura,
            idFase,
            importe: value || 0
        };
        this.materialService.actualizarImputacion(dto).subscribe({
            next: () => {
                this.materialService.getFacturas(this.economicoId).subscribe({
                    next: (data) => {
                        this.facturas.set(data);
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

    public getImputacionCellClass(idFactura: number, idFase: number): string {
        const key = `${idFactura}-${idFase}`;
        const state = this.savingImputaciones()[key] || 'idle';
        if (state === 'saving') return 'border-blue-400 bg-blue-50';
        if (state === 'success') return 'border-emerald-400 bg-emerald-50';
        if (state === 'error') return 'border-red-400 bg-red-50';
        return 'border-slate-200';
    }

    // ==================== SETTERS DE FORMULARIO (No usar arrow functions en templates Angular) ====================

    public setFormNumeroFactura(value: string): void {
        this.formFactura.update(f => ({...f, numeroFactura: value}));
    }

    public setFormProveedor(value: string): void {
        this.formFactura.update(f => ({...f, proveedor: value}));
    }

    public setFormDescripcion(value: string): void {
        this.formFactura.update(f => ({...f, descripcion: value}));
    }

    public setFormBaseImponible(value: number): void {
        this.formFactura.update(f => ({...f, baseImponible: value}));
    }

    public setFormIva(value: number): void {
        this.formFactura.update(f => ({...f, iva: value}));
    }

    public setFormPorcentajeProrrata(value: number): void {
        this.formFactura.update(f => ({...f, porcentajeProrrata: value}));
    }

    public setFormValidez(value: string): void {
        const validez = value as ValidezIDI | '';
        let porcentajeValidez: number | null = this.formFactura().porcentajeValidez;
        if (value === ValidezIDI.VALIDA_IDI) porcentajeValidez = 100;
        else if (value === ValidezIDI.NO_VALIDA) porcentajeValidez = 0;
        else if (value === ValidezIDI.VALIDA_PARCIAL) porcentajeValidez = null;
        this.formFactura.update(f => ({...f, validez, porcentajeValidez}));
    }

    public setFormPorcentajeValidez(value: number): void {
        this.formFactura.update(f => ({...f, porcentajeValidez: value}));
    }

    public setFormIdProyecto(value: any): void {
        this.formFactura.update(f => ({...f, idProyecto: value ? +value : null}));
    }

    // ==================== HELPERS UI ====================

    public isPorcentajeValidezEditable(): boolean {
        return this.formFactura().validez === ValidezIDI.VALIDA_PARCIAL;
    }

    public getValidezBadgeClass(validez: ValidezIDI): string {
        if (validez === ValidezIDI.VALIDA_IDI) return 'bg-emerald-100 text-emerald-800';
        if (validez === ValidezIDI.VALIDA_PARCIAL) return 'bg-amber-100 text-amber-800';
        return 'bg-red-100 text-red-800';
    }

    public getValidezLabel(validez: ValidezIDI): string {
        if (validez === ValidezIDI.VALIDA_IDI) return 'Válida I+D';
        if (validez === ValidezIDI.VALIDA_PARCIAL) return 'Parcial';
        return 'No válida';
    }

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
