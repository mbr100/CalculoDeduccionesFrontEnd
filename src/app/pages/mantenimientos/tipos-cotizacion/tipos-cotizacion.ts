import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TipoCotizacionService } from '../../../services/tipo-cotizacion-service';
import { CrearTipoCotizacionDTO, TipoCotizacionDTO } from '../../../models/tipo-cotizacion';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-tipos-cotizacion',
    imports: [ReactiveFormsModule],
    templateUrl: './tipos-cotizacion.html',
    styleUrl: './tipos-cotizacion.css'
})
export class TiposCotizacion implements OnInit {

    public tipos: WritableSignal<TipoCotizacionDTO[]> = signal<TipoCotizacionDTO[]>([]);
    public loading: WritableSignal<boolean> = signal<boolean>(false);
    public mostrarFormulario: WritableSignal<boolean> = signal<boolean>(false);
    public editandoId: WritableSignal<number | null> = signal<number | null>(null);
    public filtroAnualidad: WritableSignal<number | null> = signal<number | null>(null);

    private tipoCotizacionService = inject(TipoCotizacionService);
    private router = inject(Router);
    private fb = inject(FormBuilder);

    public form: FormGroup = this.fb.group({
        cnae: ['', [Validators.required, Validators.maxLength(10)]],
        anualidad: [new Date().getFullYear(), [Validators.required, Validators.min(2000), Validators.max(2100)]],
        descripcion: [''],
        contingenciasComunes: [23.60, [Validators.required, Validators.min(0)]],
        accidentesTrabajoIT: [0.65, [Validators.required, Validators.min(0)]],
        accidentesTrabajoIMS: [0.35, [Validators.required, Validators.min(0)]],
        desempleoIndefinido: [5.50, [Validators.required, Validators.min(0)]],
        desempleoTemporal: [6.70, [Validators.required, Validators.min(0)]],
        fogasa: [0.20, [Validators.required, Validators.min(0)]],
        formacionProfesional: [0.60, [Validators.required, Validators.min(0)]],
        mei: [0.67, [Validators.required, Validators.min(0)]]
    });

    ngOnInit(): void {
        this.cargarDatos();
    }

    cargarDatos(): void {
        this.loading.set(true);
        const anualidad = this.filtroAnualidad();
        this.tipoCotizacionService.listarTodos(anualidad ?? undefined).subscribe({
            next: (data) => {
                this.tipos.set(data);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error al cargar tipos de cotización:', err);
                this.loading.set(false);
            }
        });
    }

    filtrarPorAnualidad(event: Event): void {
        const value = (event.target as HTMLSelectElement).value;
        this.filtroAnualidad.set(value ? parseInt(value, 10) : null);
        this.cargarDatos();
    }

    abrirFormularioNuevo(): void {
        this.editandoId.set(null);
        this.form.reset({
            cnae: '',
            anualidad: new Date().getFullYear(),
            descripcion: '',
            contingenciasComunes: 23.60,
            accidentesTrabajoIT: 0.65,
            accidentesTrabajoIMS: 0.35,
            desempleoIndefinido: 5.50,
            desempleoTemporal: 6.70,
            fogasa: 0.20,
            formacionProfesional: 0.60,
            mei: 0.67
        });
        this.mostrarFormulario.set(true);
    }

    editarTipo(tipo: TipoCotizacionDTO): void {
        this.editandoId.set(tipo.id);
        this.form.patchValue({
            cnae: tipo.cnae,
            anualidad: tipo.anualidad,
            descripcion: tipo.descripcion,
            contingenciasComunes: tipo.contingenciasComunes,
            accidentesTrabajoIT: tipo.accidentesTrabajoIT,
            accidentesTrabajoIMS: tipo.accidentesTrabajoIMS,
            desempleoIndefinido: tipo.desempleoIndefinido,
            desempleoTemporal: tipo.desempleoTemporal,
            fogasa: tipo.fogasa,
            formacionProfesional: tipo.formacionProfesional,
            mei: tipo.mei
        });
        this.mostrarFormulario.set(true);
    }

    cancelarFormulario(): void {
        this.mostrarFormulario.set(false);
        this.editandoId.set(null);
    }

    guardar(): void {
        if (this.form.invalid) return;

        const dto: CrearTipoCotizacionDTO = this.form.value;
        const id = this.editandoId();

        const obs = id !== null
            ? this.tipoCotizacionService.actualizar(id, dto)
            : this.tipoCotizacionService.crear(dto);

        obs.subscribe({
            next: () => {
                Swal.fire('Guardado', 'Tipo de cotización guardado correctamente.', 'success').then();
                this.mostrarFormulario.set(false);
                this.editandoId.set(null);
                this.cargarDatos();
            },
            error: (err) => {
                console.error('Error al guardar:', err);
                const msg = err.status === 409
                    ? 'Ya existe un tipo de cotización para ese CNAE y anualidad.'
                    : 'Error al guardar el tipo de cotización.';
                Swal.fire('Error', msg, 'error').then();
            }
        });
    }

    eliminarTipo(tipo: TipoCotizacionDTO): void {
        Swal.fire({
            title: '¿Eliminar?',
            text: `¿Eliminar cotización CNAE ${tipo.cnae} - ${tipo.anualidad}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.tipoCotizacionService.eliminar(tipo.id).subscribe({
                    next: () => {
                        Swal.fire('Eliminado', 'Tipo de cotización eliminado.', 'success').then();
                        this.cargarDatos();
                    },
                    error: (err) => {
                        console.error('Error al eliminar:', err);
                        Swal.fire('Error', 'No se pudo eliminar.', 'error').then();
                    }
                });
            }
        });
    }

    volver(): void {
        this.router.navigate(['/']).then();
    }

    getAnualidadesDisponibles(): number[] {
        const anualidades = new Set(this.tipos().map(t => t.anualidad));
        return Array.from(anualidades).sort();
    }
}
