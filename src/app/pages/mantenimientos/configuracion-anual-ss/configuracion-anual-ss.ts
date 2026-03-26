import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfiguracionAnualSSService } from '../../../services/configuracion-anual-ss-service';
import { ConfiguracionAnualSSDTO, CrearConfiguracionAnualSSDTO } from '../../../models/configuracion-anual-ss';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-configuracion-anual-ss',
    imports: [ReactiveFormsModule],
    templateUrl: './configuracion-anual-ss.html',
    styleUrl: './configuracion-anual-ss.css'
})
export class ConfiguracionAnualSSComponent implements OnInit {

    public configs: WritableSignal<ConfiguracionAnualSSDTO[]> = signal<ConfiguracionAnualSSDTO[]>([]);
    public loading: WritableSignal<boolean> = signal<boolean>(false);
    public mostrarFormulario: WritableSignal<boolean> = signal<boolean>(false);
    public editandoId: WritableSignal<number | null> = signal<number | null>(null);

    private service = inject(ConfiguracionAnualSSService);
    private router = inject(Router);
    private fb = inject(FormBuilder);

    public form: FormGroup = this.fb.group({
        anio: [new Date().getFullYear(), [Validators.required, Validators.min(2000), Validators.max(2100)]],
        ccEmpresa: [23.60, [Validators.required, Validators.min(0)]],
        ccTrabajador: [4.70, [Validators.required, Validators.min(0)]],
        desempleoEmpresaIndefinido: [5.50, [Validators.required, Validators.min(0)]],
        desempleoEmpresaTemporal: [6.70, [Validators.required, Validators.min(0)]],
        fogasa: [0.20, [Validators.required, Validators.min(0)]],
        fpEmpresa: [0.60, [Validators.required, Validators.min(0)]],
        meiEmpresa: [0.67, [Validators.required, Validators.min(0)]],
        meiTrabajador: [0.13, [Validators.required, Validators.min(0)]]
    });

    ngOnInit(): void {
        this.cargarDatos();
    }

    cargarDatos(): void {
        this.loading.set(true);
        this.service.listarTodos().subscribe({
            next: (data) => {
                this.configs.set(data.sort((a, b) => a.anio - b.anio));
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error al cargar configuración anual SS:', err);
                this.loading.set(false);
            }
        });
    }

    abrirFormularioNuevo(): void {
        this.editandoId.set(null);
        this.form.reset({
            anio: new Date().getFullYear(),
            ccEmpresa: 23.60, ccTrabajador: 4.70,
            desempleoEmpresaIndefinido: 5.50, desempleoEmpresaTemporal: 6.70,
            fogasa: 0.20, fpEmpresa: 0.60,
            meiEmpresa: 0.67, meiTrabajador: 0.13
        });
        this.mostrarFormulario.set(true);
    }

    editarConfig(config: ConfiguracionAnualSSDTO): void {
        this.editandoId.set(config.id);
        this.form.patchValue(config);
        this.mostrarFormulario.set(true);
    }

    cancelarFormulario(): void {
        this.mostrarFormulario.set(false);
        this.editandoId.set(null);
    }

    guardar(): void {
        if (this.form.invalid) return;

        const dto: CrearConfiguracionAnualSSDTO = this.form.value;
        const id = this.editandoId();

        const obs = id !== null
            ? this.service.actualizar(id, dto)
            : this.service.crear(dto);

        obs.subscribe({
            next: () => {
                Swal.fire('Guardado', 'Configuración anual SS guardada correctamente.', 'success').then();
                this.mostrarFormulario.set(false);
                this.editandoId.set(null);
                this.cargarDatos();
            },
            error: (err) => {
                console.error('Error al guardar:', err);
                const msg = err.status === 409
                    ? 'Ya existe configuración para ese año.'
                    : 'Error al guardar la configuración.';
                Swal.fire('Error', msg, 'error').then();
            }
        });
    }

    eliminarConfig(config: ConfiguracionAnualSSDTO): void {
        Swal.fire({
            title: '¿Eliminar?',
            text: `¿Eliminar configuración del año ${config.anio}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.service.eliminar(config.id).subscribe({
                    next: () => {
                        Swal.fire('Eliminado', 'Configuración eliminada.', 'success').then();
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
