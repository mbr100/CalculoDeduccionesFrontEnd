import {Component, computed, ElementRef, inject, Input, OnInit, Signal, signal, ViewChild, WritableSignal} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {PaginacionResponse} from '../../../models/paginacion-response';
import {EconomicoPersonalService} from '../../../services/economico-personal-service';
import Swal from 'sweetalert2';
import {ClaveContratoDTO, CrearPeriodoContratoDTO, CrearPersonalEconomico, NaturalezaContrato, PersonalEconomico, TipoJornada} from '../../../models/personal-economico';
import {switchMap} from 'rxjs';

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

    // Claves de contrato
    public clavesContrato: WritableSignal<ClaveContratoDTO[]> = signal<ClaveContratoDTO[]>([]);

    /** Grouped contract keys for the select */
    public gruposClaves: Signal<{ label: string; claves: ClaveContratoDTO[] }[]> = computed(() => {
        const claves = this.clavesContrato().filter(c => c.vigente);
        const grupos: { [key: string]: ClaveContratoDTO[] } = {
            'Indefinidos — Tiempo Completo': [],
            'Indefinidos — Tiempo Parcial': [],
            'Fijo Discontinuo': [],
            'Temporales — Tiempo Completo': [],
            'Temporales — Tiempo Parcial': [],
            'Formación / Becarios': []
        };
        for (const clave of claves) {
            if (clave.naturaleza === 'INDEFINIDO' && clave.jornada === 'TIEMPO_COMPLETO') {
                grupos['Indefinidos — Tiempo Completo'].push(clave);
            } else if (clave.naturaleza === 'INDEFINIDO' && clave.jornada === 'TIEMPO_PARCIAL') {
                grupos['Indefinidos — Tiempo Parcial'].push(clave);
            } else if (clave.jornada === 'FIJO_DISCONTINUO') {
                grupos['Fijo Discontinuo'].push(clave);
            } else if (clave.naturaleza === 'TEMPORAL' && clave.jornada === 'TIEMPO_COMPLETO') {
                grupos['Temporales — Tiempo Completo'].push(clave);
            } else if (clave.naturaleza === 'TEMPORAL' && clave.jornada === 'TIEMPO_PARCIAL') {
                grupos['Temporales — Tiempo Parcial'].push(clave);
            } else {
                grupos['Formación / Becarios'].push(clave);
            }
        }
        return Object.entries(grupos)
            .filter(([, items]) => items.length > 0)
            .map(([label, claves]) => ({label, claves}));
    });

    /** Currently selected clave in the form */
    public claveSeleccionada: Signal<ClaveContratoDTO | null> = computed(() => {
        const clave = this.personalForm?.get('claveContrato')?.value;
        if (!clave) return null;
        return this.clavesContrato().find(c => c.clave === clave) ?? null;
    });

    // Formulario
    public personalForm: FormGroup;

    // URL base de la API (ajustar según tu configuración)

    constructor(private fb: FormBuilder) {
        this.personalForm = this.fb.group({
            nombre: ['', Validators.required],
            apellidos: ['', Validators.required],
            dni: ['', Validators.required],
            puesto: ['', Validators.required],
            departamento: ['', Validators.required],
            titulacion1: [''],
            titulacion2: [''],
            titulacion3: [''],
            titulacion4: [''],
            claveOcupacion: [''],
            // Periodo de contrato inicial (solo nuevo)
            claveContrato: [''],
            fechaAlta: [''],
            fechaBaja: [''],
            porcentajeJornada: [100],
            horasConvenio: [1720]
        });
    }

    public ngOnInit(): void {
        this.loadData();
        this.loadClavesContrato();
    }

    private loadClavesContrato(): void {
        this.economicoPersonalService.obtenerClavesContrato().subscribe({
            next: (claves) => this.clavesContrato.set(claves),
            error: (err) => console.error('Error loading claves contrato:', err)
        });
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
        this.resetPersonalForm();
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
            claveOcupacion: personal.claveOcupacion || '',
            claveContrato: '',
            fechaAlta: '',
            fechaBaja: '',
            porcentajeJornada: 100,
            horasConvenio: 1720
        });
        this.mostrarModal.set(true);
    }

    public eliminarPersonal(personal: PersonalEconomico): void {
        if (!personal || !personal.idPersona) {
            this.error.set('Personal no válido para eliminar');
            return;
        }

        this.economicoPersonalService.eliminarPersonal(this.idEconomico, personal.idPersona).subscribe({
            next: () => {
                Swal.fire({
                    title: 'Personal eliminado',
                    text: 'El personal ha sido eliminado correctamente.',
                    icon: 'success',
                    confirmButtonText: 'Aceptar'
                }).then(_ => {
                    this.loadData();
                });
                this.error.set(null);
            },
            error: (err) => {
                this.error.set('Error al eliminar el personal: ' + (err.error?.message || err.message || 'Error desconocido'));
                console.error('Error deleting personal:', err);
            }
        });
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
        const formValue = this.personalForm.value;

        // Derive esContratoIndefinido from the selected clave
        const claveSelec = this.claveSeleccionada();
        const esIndefinido = claveSelec ? claveSelec.naturaleza === 'INDEFINIDO' : true;

        if (personalId) {
            const actualizarPersonal: CrearPersonalEconomico = {
                idEconomico: this.idEconomico,
                idPersona: personalId,
                nombre: formValue.nombre,
                apellidos: formValue.apellidos,
                dni: formValue.dni,
                puesto: formValue.puesto,
                departamento: formValue.departamento,
                titulacion1: formValue.titulacion1 || '',
                titulacion2: formValue.titulacion2 || '',
                titulacion3: formValue.titulacion3 || '',
                titulacion4: formValue.titulacion4 || '',
                esPersonalInvestigador: this.personalSeleccionado()!.esPersonalInvestigador,
                esContratoIndefinido: this.personalSeleccionado()!.esContratoIndefinido,
                claveOcupacion: formValue.claveOcupacion || undefined
            };
            this.economicoPersonalService.actualizarPersonalEconomico(actualizarPersonal).subscribe({
                next: () => {
                    this.guardando.set(false);
                    Swal.fire({
                        title: 'Personal actualizado',
                        text: 'El personal ha sido actualizado correctamente.',
                        icon: 'success',
                        confirmButtonText: 'Aceptar'
                    }).then(_ => {
                        this.cerrarModal();
                        this.loadData();
                        this.error.set(null);
                    });
                },
                error: (err: any) => {
                    this.guardando.set(false);
                    this.error.set('Error al actualizar el personal: ' + (err.message || 'Error desconocido'));
                    console.error('Error updating personal:', err);
                }
            });
        } else {
            const crearPersonalEconomico: CrearPersonalEconomico = {
                idEconomico: this.idEconomico,
                idPersona: 0,
                nombre: formValue.nombre,
                apellidos: formValue.apellidos,
                dni: formValue.dni,
                puesto: formValue.puesto,
                departamento: formValue.departamento,
                titulacion1: formValue.titulacion1 || '',
                titulacion2: formValue.titulacion2 || '',
                titulacion3: formValue.titulacion3 || '',
                titulacion4: formValue.titulacion4 || '',
                esPersonalInvestigador: true,
                esContratoIndefinido: esIndefinido,
                claveOcupacion: formValue.claveOcupacion || undefined
            };

            const tieneContrato = !!formValue.claveContrato && !!formValue.fechaAlta;

            if (tieneContrato) {
                // Create personal, then chain the contract period creation
                this.economicoPersonalService.crearPersonal(crearPersonalEconomico).pipe(
                    switchMap((personalCreado) => {
                        const periodoDTO: CrearPeriodoContratoDTO = {
                            idPersona: personalCreado.idPersona,
                            claveContrato: formValue.claveContrato,
                            fechaAlta: formValue.fechaAlta,
                            fechaBaja: formValue.fechaBaja || null,
                            anioFiscal: new Date(formValue.fechaAlta).getFullYear(),
                            porcentajeJornada: formValue.porcentajeJornada ?? 100,
                            horasConvenio: formValue.horasConvenio ?? 1720
                        };
                        return this.economicoPersonalService.crearPeriodoContrato(periodoDTO);
                    })
                ).subscribe({
                    next: () => {
                        this.guardando.set(false);
                        Swal.fire({
                            title: 'Personal creado',
                            text: 'El personal y su período de contrato han sido creados correctamente.',
                            icon: 'success',
                            confirmButtonText: 'Aceptar'
                        }).then(_ => {
                            this.cerrarModal();
                            this.loadData();
                            this.error.set(null);
                        });
                    },
                    error: (err: any) => {
                        this.guardando.set(false);
                        const errorMsg = err.error?.mensaje || err.error?.message || err.message || 'Error desconocido';
                        this.error.set('Error al crear el personal: ' + errorMsg);
                        Swal.fire({
                            title: 'Error',
                            text: 'No se pudo crear el personal: ' + errorMsg,
                            icon: 'error',
                            confirmButtonText: 'Aceptar'
                        });
                        console.error('Error creating personal with contract:', err);
                    }
                });
            } else {
                // Create personal without contract period
                this.economicoPersonalService.crearPersonal(crearPersonalEconomico).subscribe({
                    next: () => {
                        this.guardando.set(false);
                        Swal.fire({
                            title: 'Personal creado',
                            text: 'El personal ha sido creado correctamente.',
                            icon: 'success',
                            confirmButtonText: 'Aceptar'
                        }).then(_ => {
                            this.cerrarModal();
                            this.loadData();
                            this.error.set(null);
                        });
                    },
                    error: (err: any) => {
                        this.guardando.set(false);
                        const errorMsg = err.error?.mensaje || err.error?.message || err.message || 'Error desconocido';
                        this.error.set('Error al crear el personal: ' + errorMsg);
                        Swal.fire({
                            title: 'Error',
                            text: 'No se pudo crear el personal: ' + errorMsg,
                            icon: 'error',
                            confirmButtonText: 'Aceptar'
                        });
                        console.error('Error creating personal:', err);
                    }
                });
            }
        }
    }

    cerrarModal(): void {
        this.mostrarModal.set(false);
        this.personalSeleccionado.set(null);
        this.resetPersonalForm();
    }

    private resetPersonalForm(): void {
        this.personalForm.reset({
            nombre: 'Empleado',
            apellidos: 'Prueba 2025',
            dni: '00000000T',
            puesto: 'Técnico I+D',
            departamento: 'Innovación',
            titulacion1: 'Ingeniería Superior',
            titulacion2: '',
            titulacion3: '',
            titulacion4: '',
            claveOcupacion: '',
            claveContrato: '100',
            fechaAlta: '2025-01-01',
            fechaBaja: '2025-12-31',
            porcentajeJornada: 100,
            horasConvenio: 1720
        });
    }

    /** Called when the clave contrato changes — auto-set porcentajeJornada */
    public onClaveContratoChange(): void {
        const clave = this.claveSeleccionada();
        if (clave) {
            if (clave.jornada === 'TIEMPO_COMPLETO') {
                this.personalForm.patchValue({porcentajeJornada: 100});
            } else if (clave.jornada === 'TIEMPO_PARCIAL') {
                const current = this.personalForm.get('porcentajeJornada')?.value;
                if (current === 100) {
                    this.personalForm.patchValue({porcentajeJornada: 50});
                }
            }
        }
    }

    public esEdicion(): boolean {
        return !!this.personalSeleccionado()?.idPersona;
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
