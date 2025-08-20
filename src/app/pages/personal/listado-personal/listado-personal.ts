import {Component, ElementRef, inject, Input, OnInit, signal, ViewChild, WritableSignal} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {PaginacionResponse} from '../../../models/paginacion-response';
import {environment} from '../../../../environments/environment';
import {EconomicoPersonalService} from '../../../services/economico-personal-service';
import {ActivatedRoute} from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-listado-personal',
    imports: [
        ReactiveFormsModule
    ],
  templateUrl: './listado-personal.html',
  styleUrl: './listado-personal.css'
})
export class ListadoPersonal implements OnInit {
    private economicoPersonalService: EconomicoPersonalService = inject(EconomicoPersonalService);

    @ViewChild('fileInput') public fileInput!: ElementRef<HTMLInputElement>;
    // ID del económico
    @Input() idEconomico!: number;

    // Signals para el estado del componente
    public personalList: WritableSignal<PersonalEconomico[]> = signal<PersonalEconomico[]>([]);
    public loading: WritableSignal<boolean> = signal(false);
    public error: WritableSignal<string|null> = signal<string | null>(null);
    public currentPage: WritableSignal<number> = signal(1);
    public totalPages: WritableSignal<number> = signal(0);
    public totalelements: WritableSignal<number> = signal(0);
    public pagesize: WritableSignal<number> = signal(10);

    // Signals para modales
    public mostrarModal: WritableSignal<boolean> = signal(false);
    public mostrarModalFichero: WritableSignal<boolean> = signal(false);
    public personalSeleccionado: WritableSignal<PersonalEconomico|null> = signal<PersonalEconomico | null>(null);
    public guardando: WritableSignal<boolean> = signal(false);

    // Signals para subida de archivos
    public archivoSeleccionado: WritableSignal<File | null> = signal<File | null>(null);
    public subiendoArchivo: WritableSignal<boolean> = signal(false);
    public errorFichero: WritableSignal<string | null> = signal<string | null>(null);
    public isDragging = false;

    // Formulario
    public personalForm: FormGroup;

    // URL base de la API (ajustar según tu configuración)

    constructor(private fb: FormBuilder, private http: HttpClient) {
        this.personalForm = this.fb.group({
            nombre: ['Mario', Validators.required],
            apellidos: ['Borrego Rodríguez', Validators.required],
            dni: ['12345678A', Validators.required],
            puesto: ['Desarrollador Backend', Validators.required],
            departamento: ['I+D+i', Validators.required],
            titulacion1: ['Grado en Ingeniería Informática'],
            titulacion2: ['Máster en Ciencia de Datos'],
            titulacion3: [''],
            titulacion4: [''],
            esPersonalInvestigador: [true]
        });
    }

    public ngOnInit(): void {
        this.loadData();
    }

    // Cargar datos desde el servidor
    public loadData(): void {
        this.loading.set(true);
        this.error.set(null);

        try {
            const params = {
                page: (this.currentPage() - 1).toString(),
                size: this.pagesize().toString()
            };
            this.economicoPersonalService.getPersonalByIdEconomico(this.idEconomico, params).subscribe({
                next: (response: PaginacionResponse<PersonalEconomico>) => {
                    console.log(response);
                    this.personalList.set(response.content);
                    this.totalPages.set(response.totalPages);
                    this.totalelements.set(response.totalElements);
                },
                error: (err: any) => {
                    this.error.set('Error al cargar los datos: ' + (err.message || 'Error desconocido'));
                    console.error('Error loading data:', err);
                }
            })
        } catch (err: any) {
            this.error.set('Error al cargar los datos: ' + (err.message || 'Error desconocido'));
            console.error('Error loading data:', err);
        } finally {
            this.loading.set(false);
        }
    }

    // Refrescar datos
    public refreshData(): void {
        this.loadData();
    }

    // Cambiar tamaño de página
    public changePageSize(event: Event): void {
        const target = event.target as HTMLSelectElement;
        this.pagesize.set(parseInt(target.value));
        this.currentPage.set(1);
        this.loadData();
    }

    // Navegación de páginas
    public goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages()) {
            this.currentPage.set(page);
            this.loadData();
        }
    }

    public previousPage(): void {
        if (this.currentPage() > 1) {
            this.goToPage(this.currentPage() - 1);
        }
    }

    public nextPage(): void {
        if (this.currentPage() < this.totalPages()) {
            this.goToPage(this.currentPage() + 1);
        }
    }

    // Obtener páginas visibles para la paginación
    public getVisiblePages(): number[] {
        const total = this.totalPages();
        const current = this.currentPage();
        const pages: number[] = [];

        let start = Math.max(1, current - 2);
        let end = Math.min(total, start + 4);

        if (end - start < 4) {
            start = Math.max(1, end - 4);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return pages;
    }

    // Calcular elementos mostrados
    public getStartElement(): number {
        return (this.currentPage() - 1) * this.pagesize() + 1;
    }

    public getEndElement(): number {
        return Math.min(this.currentPage() * this.pagesize(), this.totalelements());
    }

    // CRUD Operations
    public nuevoPersonal(): void {
        this.personalSeleccionado.set(null);
        // this.personalForm.reset({
        //     esPersonalInvestigador: false
        // });
        this.mostrarModal.set(true);
    }

    public editarPersonal(personal: PersonalEconomico): void {
        this.personalSeleccionado.set(personal);
        this.personalForm.patchValue({
            nombre: personal.nombre,
            apellidos: personal.apellidos,
            dni: personal.dni,
            puesto: personal.puesto,
            departamento: personal.departamento,
            titulacion1: personal.titulacion1 || '',
            titulacion2: personal.titulacion2 || '',
            titulacion3: personal.titulacion3 || '',
            titulacion4: personal.titulacion4 || '',
            esPersonalInvestigador: personal.esPersonalInvestigador
        });
        this.mostrarModal.set(true);
    }

    public eliminarPersonal(personal: PersonalEconomico): void {
        if (!personal || !personal.idPersona) {
            this.error.set('Personal no válido para eliminar');
            return;
        }

        try {
            this.economicoPersonalService.eliminarPersonal(this.idEconomico,personal.idPersona).subscribe({
                next: () => {
                    Swal.fire({
                        title: 'Personal eliminado',
                        text: 'El personal ha sido eliminado correctamente.',
                        icon: 'success',
                        confirmButtonText: 'Aceptar'
                    }).then(_ => {
                        this.personalList.set(this.personalList().filter(p => p.idPersona !== personal.idPersona));
                        this.error.set(null);
                    })
                }, error: () => {
                this.error.set('Error al eliminar el personal');}
            });
            this.loadData();
        } catch (err: any) {
            this.error.set('Error al eliminar el personal: ' + (err.message || 'Error desconocido'));
            console.error('Error deleting personal:', err);
        }
    }

     public guardarPersonal(): void {
        if (this.personalForm.invalid) {
            Object.keys(this.personalForm.controls).forEach(key => {
                const control = this.personalForm.get(key);
                if (control && control.invalid) {
                    control.markAsTouched();
                }
            });
            return;
        }
        this.guardando.set(true);
        const personalId = this.personalSeleccionado()?.idPersona;

        try {
            if (personalId) {
                const actualizarPersonal: CrearPersonalEconomico = {
                    idEconomico: this.idEconomico,
                    idPersona: personalId,
                    nombre: this.personalForm.value.nombre,
                    apellidos: this.personalForm.value.apellidos,
                    dni: this.personalForm.value.dni,
                    puesto: this.personalForm.value.puesto,
                    departamento: this.personalForm.value.departamento,
                    titulacion1: this.personalForm.value.titulacion1 || '',
                    titulacion2: this.personalForm.value.titulacion2 || '',
                    titulacion3: this.personalForm.value.titulacion3 || '',
                    titulacion4: this.personalForm.value.titulacion4 || '',
                    esPersonalInvestigador: this.personalForm.value.esPersonalInvestigador || false
                }
                this.economicoPersonalService.actualizarPersonalEconomico(actualizarPersonal).subscribe({
                    next: () => {
                        Swal.fire({
                            title: 'Personal actualizado',
                            text: 'El personal ha sido actualizado correctamente.',
                            icon: 'success',
                            confirmButtonText: 'Aceptar'
                        }).then(_ => {
                            this.cerrarModal();
                            this.loadData();
                            this.error.set(null);
                        })
                    },
                    error: (err: any) => {
                        this.error.set('Error al actualizar el personal: ' + (err.message || 'Error desconocido'));
                        console.error('Error updating personal:', err);
                    }
                });
            } else {
                const crearPersonalEconomico: CrearPersonalEconomico = {
                    idEconomico: this.idEconomico,
                    idPersona: 0,
                    nombre: this.personalForm.value.nombre,
                    apellidos: this.personalForm.value.apellidos,
                    dni: this.personalForm.value.dni,
                    puesto: this.personalForm.value.puesto,
                    departamento: this.personalForm.value.departamento,
                    titulacion1: this.personalForm.value.titulacion1 || '',
                    titulacion2: this.personalForm.value.titulacion2 || '',
                    titulacion3: this.personalForm.value.titulacion3 || '',
                    titulacion4: this.personalForm.value.titulacion4 || '',
                    esPersonalInvestigador: this.personalForm.value.esPersonalInvestigador || false
                }
                // Crear nuevo
                this.economicoPersonalService.crearPersonal(crearPersonalEconomico).subscribe({
                    next: () => {
                        this.cerrarModal();
                        this.loadData();
                    },
                    error: (err: any) => {
                        this.error.set('Error al crear el personal: ' + (err.message || 'Error desconocido'));
                        console.error('Error creating personal:', err);
                    }
                });
            }

            this.cerrarModal();
            this.loadData();
        } catch (err: any) {
            this.error.set('Error al guardar el personal: ' + (err.message || 'Error desconocido'));
            console.error('Error saving personal:', err);
        } finally {
            this.guardando.set(false);
        }
    }

    cerrarModal(): void {
        this.mostrarModal.set(false);
        this.personalSeleccionado.set(null);
        this.personalForm.reset();
    }

    // Manejo de archivos
    abrirModalSubirFichero(): void {
        this.mostrarModalFichero.set(true);
        this.errorFichero.set(null);
        this.archivoSeleccionado.set(null);
    }

    cerrarModalFichero(): void {
        this.mostrarModalFichero.set(false);
        this.archivoSeleccionado.set(null);
        this.errorFichero.set(null);
        if (this.fileInput) {
            this.fileInput.nativeElement.value = '';
        }
    }

    onFileSelected(event: Event): void {
        const target = event.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            const file = target.files[0];
            this.validateAndSetFile(file);
        }
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;

        if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
            const file = event.dataTransfer.files[0];
            this.validateAndSetFile(file);
        }
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = true;
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;
    }

    private validateAndSetFile(file: File): void {
        const validExtensions = ['.csv', '.xlsx', '.xls'];
        const fileName = file.name.toLowerCase();
        const isValid = validExtensions.some(ext => fileName.endsWith(ext));

        if (!isValid) {
            this.errorFichero.set('Por favor, seleccione un archivo CSV, XLSX o XLS');
            this.archivoSeleccionado.set(null);
            return;
        }

        // Validar tamaño (máximo 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            this.errorFichero.set('El archivo es demasiado grande. Máximo permitido: 10MB');
            this.archivoSeleccionado.set(null);
            return;
        }

        this.errorFichero.set(null);
        this.archivoSeleccionado.set(file);
    }

    eliminarArchivo(): void {
        this.archivoSeleccionado.set(null);
        if (this.fileInput) {
            this.fileInput.nativeElement.value = '';
        }
    }

    async subirArchivo(): Promise<void> {
        const file = this.archivoSeleccionado();
        if (!file) return;

        this.subiendoArchivo.set(true);
        this.errorFichero.set(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            this.cerrarModalFichero();
            this.loadData();
        } catch (err: any) {
            this.errorFichero.set('Error al subir el archivo: ' + (err.message || 'Error desconocido'));
            console.error('Error uploading file:', err);
        } finally {
            this.subiendoArchivo.set(false);
        }
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

}
