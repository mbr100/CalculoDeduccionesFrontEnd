import {Component, inject, OnDestroy, OnInit, signal, WritableSignal} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActualizarDatosEconomicoDTO, EconomicoDto} from '../../../models/economico';
import {ActivatedRoute, Router} from '@angular/router';
import {EconomicoService} from '../../../services/economico-service';
import {Editor, NgxEditorComponent, NgxEditorMenuComponent, toHTML, Toolbar} from 'ngx-editor';
import {NgClass} from '@angular/common';
import Swal from 'sweetalert2';
import {environment} from '../../../../environments/environment';
import {Sidebar} from '../../../components/personal/sidebar/sidebar';

@Component({
  selector: 'app-ver-economico',
    imports: [ReactiveFormsModule, NgClass, FormsModule, NgxEditorMenuComponent, NgxEditorComponent, Sidebar],
  templateUrl: './ver-economico.html',
  styleUrl: './ver-economico.css'
})
export class VerEconomico implements OnInit, OnDestroy {
    private route: ActivatedRoute = inject(ActivatedRoute);
    private router: Router = inject(Router);
    private fb: FormBuilder = inject(FormBuilder);
    private economicoService: EconomicoService = inject(EconomicoService);

    public nombre: WritableSignal<string> = signal('');
    public economicoForm: FormGroup;
    public economico: EconomicoDto | null = null;
    public loading: boolean = false;
    public saving: boolean = false;
    public economicoId: number;
    public editorDesc!: Editor;
    public editorPres!: Editor;
    public toolbar: Toolbar;
    public toolbar2: Toolbar;

    public constructor() {
        this.economicoId = +this.route.snapshot.paramMap.get('id')!;
        this.economicoForm = this.fb.group({
            cif: ['', [Validators.required, Validators.pattern(/^[A-Z][0-9]{8}$/)]],
            direccion: ['', Validators.required],
            telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
            nombreContacto: ['', Validators.required],
            emailContacto: ['', [Validators.required, Validators.email]],
            horasConvenio: [null, [Validators.min(1500), Validators.max(2048)]],
            urllogo: ['', Validators.pattern(/^https?:\/\/.+/)],
            urlWeb: ['', Validators.pattern(/^https?:\/\/.+/)],
            cnae: [0, Validators.required],
            anualidad: [0, [Validators.required, Validators.min(2020)]],
            esPyme: [false],
            selloPymeInnovadora: [false],
            descripcionIDI: ['', Validators.required],
            presentacionEmpresa: ['', Validators.required]
        }) as FormGroup;
        this.toolbar = environment.editorToolbar;
        this.toolbar2= environment.editorToolbar;
    }

    public ngOnInit(): void {
        this.loadEconomico();
        this.editorDesc = new Editor({
            history: true,
            keyboardShortcuts: true,
        });
        this.editorPres = new Editor({
            history: true,
            keyboardShortcuts: true,
        });
    }

    public ngOnDestroy(): void {
        this.editorDesc.destroy();
        this.editorPres.destroy();
    }


    public loadEconomico(): void {
        this.loading = true;
        this.economicoService.getEconomicoById(this.economicoId).subscribe({
            next: (economico) => {
                console.log(economico);
                this.nombre.set(economico.nombre);
                this.economico = economico;
                this.economicoForm.patchValue(economico);
                this.loading = false;
            },
            error: (error) => {
                console.error('Error cargando económico:', error);
                this.loading = false;
            }
        });
    }

    public onSubmit(): void {
        if (this.economicoForm.valid && this.economico) {
            this.saving = true;
            const dto: ActualizarDatosEconomicoDTO = {
                id: this.economico.id,
                nombre: this.economico.nombre,
                direccion: this.economicoForm.get('direccion')?.value,
                telefono: this.economicoForm.get('telefono')?.value,
                nombreContacto: this.economicoForm.get('nombreContacto')?.value,
                emailContacto: this.economicoForm.get('emailContacto')?.value,
                horasConvenio: this.economicoForm.get('horasConvenio')?.value,
                urllogo: this.economicoForm.get('urllogo')?.value,
                urlWeb: this.economicoForm.get('urlWeb')?.value,
                cnae: this.economicoForm.get('cnae')?.value,
                esPyme: this.economicoForm.get('esPyme')?.value,
                selloPymeInnovadora: this.economicoForm.get('selloPymeInnovadora')?.value,
                descripcionIDI: toHTML(this.economicoForm.get('descripcionIDI')?.value) ,
                presentacionEmpresa: toHTML(this.economicoForm.get('presentacionEmpresa')?.value),
            };
            console.log('Datos a enviar:', dto);
            this.economicoService.actualizarEconomico(dto).subscribe({
                next: (result) => {
                    this.economico = result;
                    this.saving = false;
                    Swal.fire({
                        title: 'Éxito',
                        text: 'Datos actualizados correctamente',
                        icon: 'success',
                        confirmButtonText: 'Aceptar'
                    }).then();
                },
                error: (error) => {
                    console.error('Error actualizando económico:', error);
                    Swal.fire({
                        title: 'Error',
                        text: 'No se pudieron actualizar los datos del económico',
                        icon: 'error',
                        confirmButtonText: 'Aceptar'
                    }).then();
                    this.saving = false;
                }
            });
        }
    }

    public goBack(): void {
        this.router.navigate(['']).then();
    }

    // Getters para facilitar el acceso a los controles del formulario
    public get f() { return this.economicoForm.controls; }
}
