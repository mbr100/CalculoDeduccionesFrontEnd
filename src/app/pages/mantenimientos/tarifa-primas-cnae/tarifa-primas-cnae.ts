import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TarifaPrimasCnaeService } from '../../../services/tarifa-primas-cnae-service';
import { CrearTarifaPrimasCnaeDTO, TarifaPrimasCnaeDTO } from '../../../models/tarifa-primas-cnae';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-tarifa-primas-cnae',
    imports: [ReactiveFormsModule],
    templateUrl: './tarifa-primas-cnae.html',
    styleUrl: './tarifa-primas-cnae.css'
})
export class TarifaPrimasCnaeComponent implements OnInit {

    public tarifas: WritableSignal<TarifaPrimasCnaeDTO[]> = signal<TarifaPrimasCnaeDTO[]>([]);
    public loading: WritableSignal<boolean> = signal<boolean>(false);
    public mostrarFormulario: WritableSignal<boolean> = signal<boolean>(false);
    public editandoId: WritableSignal<number | null> = signal<number | null>(null);
    public filtroAnio: WritableSignal<number | null> = signal<number | null>(null);

    private service = inject(TarifaPrimasCnaeService);
    private router = inject(Router);
    private fb = inject(FormBuilder);

    public form: FormGroup = this.fb.group({
        cnae: ['', [Validators.required, Validators.maxLength(10)]],
        anio: [new Date().getFullYear(), [Validators.required, Validators.min(2000), Validators.max(2100)]],
        descripcion: [''],
        tipoIt: [0.65, [Validators.required, Validators.min(0)]],
        tipoIms: [0.35, [Validators.required, Validators.min(0)]],
        versionCnae: ['2009']
    });

    ngOnInit(): void {
        this.cargarDatos();
    }

    cargarDatos(): void {
        this.loading.set(true);
        const anio = this.filtroAnio();
        this.service.listarTodos(anio ?? undefined).subscribe({
            next: (data) => {
                this.tarifas.set(data);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error al cargar tarifas:', err);
                this.loading.set(false);
            }
        });
    }

    filtrarPorAnio(event: Event): void {
        const value = (event.target as HTMLSelectElement).value;
        this.filtroAnio.set(value ? parseInt(value, 10) : null);
        this.cargarDatos();
    }

    abrirFormularioNuevo(): void {
        this.editandoId.set(null);
        this.form.reset({
            cnae: '', anio: new Date().getFullYear(), descripcion: '',
            tipoIt: 0.65, tipoIms: 0.35, versionCnae: '2009'
        });
        this.mostrarFormulario.set(true);
    }

    editarTarifa(tarifa: TarifaPrimasCnaeDTO): void {
        this.editandoId.set(tarifa.id);
        this.form.patchValue(tarifa);
        this.mostrarFormulario.set(true);
    }

    cancelarFormulario(): void {
        this.mostrarFormulario.set(false);
        this.editandoId.set(null);
    }

    guardar(): void {
        if (this.form.invalid) return;

        const dto: CrearTarifaPrimasCnaeDTO = this.form.value;
        const id = this.editandoId();

        const obs = id !== null
            ? this.service.actualizar(id, dto)
            : this.service.crear(dto);

        obs.subscribe({
            next: () => {
                Swal.fire('Guardado', 'Tarifa guardada correctamente.', 'success').then();
                this.mostrarFormulario.set(false);
                this.editandoId.set(null);
                this.cargarDatos();
            },
            error: (err) => {
                console.error('Error al guardar:', err);
                const msg = err.status === 409
                    ? 'Ya existe una tarifa para ese CNAE y año.'
                    : 'Error al guardar la tarifa.';
                Swal.fire('Error', msg, 'error').then();
            }
        });
    }

    eliminarTarifa(tarifa: TarifaPrimasCnaeDTO): void {
        Swal.fire({
            title: '¿Eliminar?',
            text: `¿Eliminar tarifa CNAE ${tarifa.cnae} - ${tarifa.anio}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.service.eliminar(tarifa.id).subscribe({
                    next: () => {
                        Swal.fire('Eliminado', 'Tarifa eliminada.', 'success').then();
                        this.cargarDatos();
                    },
                    error: () => Swal.fire('Error', 'No se pudo eliminar.', 'error').then()
                });
            }
        });
    }

    volver(): void {
        this.router.navigate(['/']).then();
    }

    getAniosDisponibles(): number[] {
        const anios = new Set(this.tarifas().map(t => t.anio));
        return Array.from(anios).sort();
    }
}
