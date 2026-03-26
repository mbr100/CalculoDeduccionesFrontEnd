import {Component, inject} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {EconomicoCreadoDTO, nuevoEconomicoDto} from '../../../models/economico';
import {EconomicoService} from '../../../services/economico-service';
import {Router} from '@angular/router';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-nuevo-economico',
    imports: [
        ReactiveFormsModule
    ],
    templateUrl: './nuevo-economico.html',
    styleUrl: './nuevo-economico.css'
})
export class NuevoEconomico {
    private fb: FormBuilder = inject(FormBuilder);
    public form: FormGroup ;
    private economicoService: EconomicoService = inject(EconomicoService);
    private router: Router = inject(Router);

    public constructor() {
        this.form = this.fb.group({
            nombre: this.fb.nonNullable.control('Empresa S.A.', Validators.required),
            cif: this.fb.nonNullable.control('B12345678', [Validators.required, Validators.minLength(9)]),
            direccion: this.fb.nonNullable.control('Calle Falsa 123, Madrid', Validators.required),
            telefono: this.fb.nonNullable.control('911234567', [Validators.required, Validators.pattern(/^\d{9}$/)]),
            nombreContacto: this.fb.nonNullable.control('Juan Pérez', Validators.required),
            emailContacto: this.fb.nonNullable.control('juan.perez@empresa.com', [Validators.required, Validators.email]),
            horasConvenio: this.fb.control<number>(40),
            urllogo: this.fb.nonNullable.control('https://empresa.com/logo.png', Validators.required),
            urlWeb: this.fb.nonNullable.control('https://empresa.com', Validators.required),
            cnae: this.fb.nonNullable.control(6201, Validators.required),
            anualidad: this.fb.nonNullable.control(2025, Validators.required),
            esPyme: this.fb.nonNullable.control(true),
            selloPymeInnovadora: this.fb.nonNullable.control(false),
        }) as FormGroup;

    }

    public onSubmit(): void {
        console.log("Formulario enviado");
        if (this.form.valid) {
            const data: nuevoEconomicoDto = {
                ...this.form.getRawValue(),
                anualidad: this.form.value.anualidad ?? 2025 // fallback
            };
            console.log('Datos enviados:', data);
            this.economicoService.crearEconomico(data).subscribe({
                next: (response: EconomicoCreadoDTO) => {
                    console.log('Economico creado con éxito:', response);
                    Swal.fire({
                        icon: 'success',
                        title: 'Economico creado con éxito',
                        text: `El economico ${data.nombre}-${data.anualidad} ha sido creado correctamente.`
                    }).then(() => this.router.navigate(['/economico/ver', response.id]).then());
                },
                error: (error) => {
                    let mensajeError = 'Error desconocido';
                    if (error.status === 409) {
                        // Si hay un mensaje desde el backend, úsalo
                        mensajeError = error?.error?.message || 'El económico ya existe';
                    } else if (error?.error?.message) {
                        mensajeError = error.error.message;
                    } else if (typeof error.error === 'string') {
                        mensajeError = error.error;
                    }
                    Swal.fire({
                        icon: 'error',
                        title: 'Error al crear el económico',
                        text: mensajeError
                    }).then(r =>console.error('Error al crear el económico:', error));
                }
            });

        } else {
            console.log('Datos enviados no valido');
            this.form.markAllAsTouched();
        }
    }

    public volver(): void {
        this.router.navigate(['']).then();
    }
}
