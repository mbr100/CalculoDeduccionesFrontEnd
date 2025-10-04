import {Component, computed, effect, inject, OnInit, Signal, signal, WritableSignal} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ActualizarProyectoDTO, Calificacion, CrearProyectoDTO, Estrategia, FormProyecto, Proyecto} from '../../../models/proyecto-economico';
import {getVisiblePages, ModalMode, SavingState} from '../../../models/savingState';
import {FormsModule} from '@angular/forms';
import {Sidebar} from '../../../components/personal/sidebar/sidebar';
import {ProyectoService} from '../../../services/proyecto-service';
import {PaginacionResponse} from '../../../models/paginacion-response';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-listado-proyectos',
    imports: [
        FormsModule,
        Sidebar
    ],
    templateUrl: './listado-proyectos.html',
    styleUrl: './listado-proyectos.css'
})
export class ListadoProyectos implements OnInit {
    private route: ActivatedRoute = inject(ActivatedRoute);
    private proyectoService: ProyectoService = inject(ProyectoService);

    // ID económico obtenido de la ruta
    public economicoId: number;

    // Signals principales
    public proyectos: WritableSignal<Proyecto[]> = signal<Proyecto[]>([]);
    public loading: WritableSignal<boolean> = signal(false);
    public savingStates: WritableSignal<{ [key: string]: SavingState }> = signal<{ [key: string]: SavingState }>({});

    // Signals para paginación
    public currentPage: WritableSignal<number> = signal(0);
    public pageSize: WritableSignal<number> = signal(10);
    public totalElements: WritableSignal<number> = signal(0);
    public totalPages: WritableSignal<number> = signal(0);

    // Signals para modal
    public modalOpen: WritableSignal<boolean> = signal(false);
    public modalMode: WritableSignal<ModalMode> = signal<ModalMode>(null);
    public modalLoading: WritableSignal<boolean> = signal(false);
    public selectedProyecto: WritableSignal<Proyecto | null> = signal<Proyecto | null>(null);

    // Signals para el formulario del modal
    public formData: WritableSignal<FormProyecto> = signal({
        acronimo: '',
        titulo: '',
        fechaInicio: '',
        fechaFin: '',
        estrategia: '',
        calificacion: ''
    });

    // Computed signals
    public visiblePages: Signal<number[]> = computed((): number[] => getVisiblePages(this.currentPage(), this.totalPages()));

    // Para acceder a Math en el template
    public Math: Math = Math;

    public constructor() {
        this.economicoId = +this.route.snapshot.paramMap.get('id')!;

        // Effect para recargar datos cuando cambie la página
        effect(() => {
            const page = this.currentPage();
            if (page >= 0 && this.economicoId > 0) {
                this.loadDataInternal();
            }
        });
    }

    public ngOnInit(): void {
        this.loadData();
    }

    // Métodos de carga de datos
    public loadData(): void {
        this.currentPage.set(0);
        this.loadDataInternal();
    }

    private loadDataInternal(): void {
        if (this.economicoId === 0) {
            return;
        }

        this.loading.set(true);
        try {

            this.proyectoService.getProyectosByEconomico(this.economicoId, this.currentPage(), this.pageSize()).subscribe({
                next: (response: PaginacionResponse<Proyecto>) => {
                    this.proyectos.set(response.content);
                    this.totalElements.set(response.totalElements);
                    this.totalPages.set(response.totalPages);
                    this.loading.set(false);
                },
                error: (error) => {
                    console.error('Error cargando proyectos:', error);
                    this.loading.set(false);
                }
            });

        } catch (error) {
            console.error('Error cargando datos:', error);
            this.loading.set(false);
        }
    }

    // Métodos CRUD
    public updateField(idProyecto: number, field: keyof Proyecto, value: string | number): void {
        const editableFields = ['acronimo', 'titulo', 'fechaInicio', 'fechaFin', 'estrategia', 'calificacion'];

        if (!editableFields.includes(field as string)) {
            console.warn(`Campo ${field} no es editable`);
            return;
        }

        const fieldKey = this.getFieldKey(idProyecto, field as string);

        this.savingStates.update(states => ({
            ...states,
            [fieldKey]: 'saving'
        }));

        try {
            let valorFinal: any;

            if (field === 'fechaInicio' || field === 'fechaFin') {
                valorFinal = value ? new Date(value as string) : null as any;
            } else if (field === 'estrategia' || field === 'calificacion') {
                valorFinal = value as string;
            } else {
                valorFinal = value;
            }

            const actualizacion: ActualizarProyectoDTO = {
                id: idProyecto,
                campoActualizado: field,
                valor: valorFinal
            };

            this.proyectoService.actualizarProyecto(actualizacion).subscribe({
                next: () => {
                    this.handleUpdateSuccess(idProyecto, field, valorFinal);
                },
                error: (error) => {
                    console.error('Error actualizando proyecto:', error);
                    this.handleSavingError(idProyecto, field);
                }
            });

        } catch (error) {
            console.error('Error actualizando campo:', error);
            this.handleSavingError(idProyecto, field);
        }
    }
    private handleUpdateSuccess(idProyecto: number, field: keyof Proyecto, valor: any): void {
        const fieldKey = this.getFieldKey(idProyecto, field as string);

        this.savingStates.update(states => ({
            ...states,
            [fieldKey]: 'success'
        }));

        // Actualizar el valor en la lista local
        this.proyectos.update(items =>
            items.map(item =>
                item.idProyecto === idProyecto
                    ? {...item, [field]: valor}
                    : item
            )
        );

        setTimeout(() => {
            this.savingStates.update(states => ({
                ...states,
                [fieldKey]: 'idle'
            }));
        }, 2000);
    }

    public deleteProyecto(idProyecto: number): void {
        Swal.fire({
            title: '¿Estás seguro?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.proyectoService.eliminarProyecto(idProyecto).subscribe({
                    next: () => {
                        this.proyectos.update(items =>
                            items.filter(item => item.idProyecto !== idProyecto)
                        );
                        this.savingStates.update(states => {
                            const newStates = { ...states };
                            delete newStates[idProyecto];
                            return newStates;
                        });
                        this.updatePaginationAfterDelete();
                        Swal.fire({
                            title: 'Eliminado',
                            text: 'El proyecto ha sido eliminado.',
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        }).then()
                    },
                    error: (error) => {
                        console.error('Error eliminando proyecto:', error);
                        this.handleSavingError(idProyecto);
                    }
                });
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                Swal.fire({
                    title: 'Cancelado',
                    text: 'El proyecto no ha sido eliminado.',
                    icon: 'info',
                    timer: 2000,
                    showConfirmButton: false
                }).then();
            }
        });
    }

    private updatePaginationAfterDelete(): void {
        const newTotal = this.proyectos().length;
        this.totalElements.set(newTotal);
        this.totalPages.set(Math.ceil(newTotal / this.pageSize()));

        // Si estamos en la última página y no hay elementos, ir a la página anterior
        if (this.currentPage() >= this.totalPages() && this.totalPages() > 0) {
            this.currentPage.set(this.totalPages() - 1);
        }
    }

    // Métodos del modal
    public openCreateModal(): void {
        this.resetForm();
        this.modalMode.set('create');
        this.modalOpen.set(true);
        document.body.style.overflow = 'hidden';
    }

    public openEditModal(proyecto: Proyecto): void {
        this.selectedProyecto.set(proyecto);
        this.formData.set({
            acronimo: proyecto.acronimo,
            titulo: proyecto.titulo,
            fechaInicio: this.formatDateForInput(proyecto.fechaInicio),
            fechaFin: this.formatDateForInput(proyecto.fechaFin),
            estrategia: proyecto.estrategia,
            calificacion: proyecto.calificacion
        });
        this.modalMode.set('edit');
        this.modalOpen.set(true);
        document.body.style.overflow = 'hidden';
    }

    public closeModal(): void {
        this.modalOpen.set(false);
        this.modalMode.set(null);
        this.selectedProyecto.set(null);
        this.resetForm();
        document.body.style.overflow = 'auto';
    }

    public onBackdropClick(event: Event): void {
        if (event.target === event.currentTarget) {
            this.closeModal();
        }
    }

    public saveModal(): void {
        if (!this.validateForm()) {
            return;
        }

        this.modalLoading.set(true);

        if (this.modalMode() === 'create') {
            this.createProyecto();
        } else if (this.modalMode() === 'edit') {
            this.updateProyectoFromModal();
        }
    }

    private createProyecto(): void {
        const form = this.formData();
        const nuevoProyecto: CrearProyectoDTO = {
            idEconomico: this.economicoId,
            acronimo: form.acronimo,
            titulo: form.titulo,
            fechaInicio: new Date(form.fechaInicio),
            fechaFin: new Date(form.fechaFin),
            estrategia: form.estrategia as Estrategia,
            calificacion: form.calificacion as Calificacion
        };

        this.proyectoService.crearProyecto(nuevoProyecto).subscribe({
            next: () => {
                this.modalLoading.set(false);
                this.closeModal();
                this.loadData();
            },
            error: (error) => {
                console.error('Error creando proyecto:', error);
                this.modalLoading.set(false);
            }
        });

    }

    private updateProyectoFromModal(): void {
        const form = this.formData();
        const proyecto = this.selectedProyecto();

        if (!proyecto) return;

        // Actualizar cada campo modificado
        const fieldsToUpdate: (keyof Proyecto)[] = ['acronimo', 'titulo', 'fechaInicio', 'fechaFin', 'estrategia', 'calificacion'];

        fieldsToUpdate.forEach(field => {
            const newValue = form[field as keyof typeof form];
            if (newValue !== proyecto[field]) {
                this.updateField(proyecto.idProyecto!, field, newValue);
            }
        });

        this.modalLoading.set(false);
        this.closeModal();
    }

    // Métodos auxiliares
    private resetForm(): void {
        this.formData.set({
            acronimo: '',
            titulo: '',
            fechaInicio: '',
            fechaFin: '',
            estrategia: '',
            calificacion: ''
        });
    }

    private validateForm(): boolean {
        const form = this.formData();

        if (!form.acronimo.trim()) {
            alert('El acrónimo es obligatorio');
            return false;
        }

        if (!form.titulo.trim()) {
            alert('El título es obligatorio');
            return false;
        }

        if (!form.fechaInicio) {
            alert('La fecha de inicio es obligatoria');
            return false;
        }

        if (!form.fechaFin) {
            alert('La fecha de fin es obligatoria');
            return false;
        }

        if (new Date(form.fechaFin) < new Date(form.fechaInicio)) {
            alert('La fecha de fin no puede ser anterior a la fecha de inicio');
            return false;
        }

        if (!form.estrategia) {
            alert('Debe seleccionar una estrategia');
            return false;
        }

        if (!form.calificacion) {
            alert('Debe seleccionar una calificación');
            return false;
        }

        return true;
    }

    private handleSavingError(idProyecto: number, field?: keyof Proyecto): void {
        if (field) {
            const fieldKey = this.getFieldKey(idProyecto, field as string);
            this.savingStates.update(states => ({
                ...states,
                [fieldKey]: 'error'
            }));

            setTimeout(() => {
                this.savingStates.update(states => ({
                    ...states,
                    [fieldKey]: 'idle'
                }));
            }, 3000);
        }
    }

    public onKeyPress(event: KeyboardEvent, idProyecto: number, field: keyof Proyecto, value: string | number): void {
        if (event.key === 'Enter') {
            (event.target as HTMLInputElement).blur();
            this.updateField(idProyecto, field, value);
        }
    }

    public getInputClass(idProyecto: number, field: string): string {
        const fieldKey = this.getFieldKey(idProyecto, field);
        const savingState = this.savingStates()[fieldKey] || 'idle';
        let borderColor: string;

        switch (savingState) {
            case 'saving':
                borderColor = 'border-blue-400';
                break;
            case 'success':
                borderColor = 'border-green-400';
                break;
            case 'error':
                borderColor = 'border-red-400';
                break;
            default:
                borderColor = 'border-gray-200';
        }

        return `w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${borderColor}`;
    }

    public getSelectClass(idProyecto: number, field: string): string {
        return this.getInputClass(idProyecto, field) + ' cursor-pointer';
    }

    public formatDateForInput(date: Date | string | null): string {
        if (!date) return '';
        try {
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';
            return d.toISOString().split('T')[0];
        } catch {
            return '';
        }
    }

    public getFieldSavingState(idProyecto: number, field: string): SavingState {
        const fieldKey = this.getFieldKey(idProyecto, field);
        return this.savingStates()[fieldKey] || 'idle';
    }

    // Métodos de paginación
    public previousPage(): void {
        if (this.currentPage() > 0) {
            this.currentPage.update(page => page - 1);
        }
    }

    public nextPage(): void {
        if (this.currentPage() < this.totalPages() - 1) {
            this.currentPage.update(page => page + 1);
        }
    }

    public goToPage(page: number): void {
        this.currentPage.set(page);
    }

    public getPageButtonClass(page: number): string {
        const baseClass = 'relative inline-flex items-center px-4 py-2 border text-sm font-medium';
        if (this.currentPage() === page) {
            return `${baseClass} z-10 bg-blue-50 border-blue-500 text-blue-600`;
        }
        return `${baseClass} bg-white border-gray-300 text-gray-500 hover:bg-gray-50`;
    }

    public isLoading(): boolean {
        return this.loading();
    }

    public hasProyectos(): boolean {
        return this.proyectos().length > 0;
    }

    public canGoPrevious(): boolean {
        return this.currentPage() > 0;
    }

    public canGoNext(): boolean {
        return this.currentPage() < this.totalPages() - 1;
    }

    private getFieldKey(idProyecto: number, field: string): string {
        return `${idProyecto}-${field}`;
    }

}
