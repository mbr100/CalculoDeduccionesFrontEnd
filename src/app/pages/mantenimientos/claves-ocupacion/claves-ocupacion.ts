import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClaveOcupacionService } from '../../../services/clave-ocupacion-service';
import { ClaveOcupacionDTO, CrearClaveOcupacionDTO } from '../../../models/clave-ocupacion';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-claves-ocupacion',
    imports: [ReactiveFormsModule],
    templateUrl: './claves-ocupacion.html',
    styleUrl: './claves-ocupacion.css'
})
export class ClavesOcupacionComponent implements OnInit {

    public claves: WritableSignal<ClaveOcupacionDTO[]> = signal<ClaveOcupacionDTO[]>([]);
    public loading: WritableSignal<boolean> = signal<boolean>(false);
    public mostrarFormulario: WritableSignal<boolean> = signal<boolean>(false);
    public editandoClave: WritableSignal<string | null> = signal<string | null>(null);

    private service = inject(ClaveOcupacionService);
    private router = inject(Router);
    private fb = inject(FormBuilder);

    public form: FormGroup = this.fb.group({
        clave: ['', [Validators.required, Validators.maxLength(2)]],
        descripcion: [''],
        tipoIt: [0.65, [Validators.required, Validators.min(0)]],
        tipoIms: [0.35, [Validators.required, Validators.min(0)]],
        activa: [true]
    });

    ngOnInit(): void {
        this.cargarDatos();
    }

    cargarDatos(): void {
        this.loading.set(true);
        this.service.listarTodos().subscribe({
            next: (data) => {
                this.claves.set(data);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error al cargar claves de ocupación:', err);
                this.loading.set(false);
            }
        });
    }

    abrirFormularioNuevo(): void {
        this.editandoClave.set(null);
        this.form.reset({
            clave: '', descripcion: '',
            tipoIt: 0.65, tipoIms: 0.35, activa: true
        });
        this.form.get('clave')?.enable();
        this.mostrarFormulario.set(true);
    }

    editarClave(clave: ClaveOcupacionDTO): void {
        this.editandoClave.set(clave.clave);
        this.form.patchValue(clave);
        this.form.get('clave')?.disable();
        this.mostrarFormulario.set(true);
    }

    cancelarFormulario(): void {
        this.mostrarFormulario.set(false);
        this.editandoClave.set(null);
        this.form.get('clave')?.enable();
    }

    guardar(): void {
        if (this.form.invalid) return;

        const rawValue = this.form.getRawValue();
        const dto: CrearClaveOcupacionDTO = rawValue;
        const clave = this.editandoClave();

        const obs = clave !== null
            ? this.service.actualizar(clave, dto)
            : this.service.crear(dto);

        obs.subscribe({
            next: () => {
                Swal.fire('Guardado', 'Clave de ocupación guardada correctamente.', 'success').then();
                this.mostrarFormulario.set(false);
                this.editandoClave.set(null);
                this.form.get('clave')?.enable();
                this.cargarDatos();
            },
            error: (err) => {
                console.error('Error al guardar:', err);
                const msg = err.status === 409
                    ? 'Ya existe esa clave de ocupación.'
                    : 'Error al guardar la clave de ocupación.';
                Swal.fire('Error', msg, 'error').then();
            }
        });
    }

    eliminarClave(clave: ClaveOcupacionDTO): void {
        Swal.fire({
            title: '¿Eliminar?',
            text: `¿Eliminar clave de ocupación "${clave.clave}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.service.eliminar(clave.clave).subscribe({
                    next: () => {
                        Swal.fire('Eliminado', 'Clave de ocupación eliminada.', 'success').then();
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
}
