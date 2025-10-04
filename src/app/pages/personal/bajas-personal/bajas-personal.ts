import {Component, computed, effect, inject, Input, OnInit, Signal, signal, WritableSignal} from '@angular/core';
import {EconomicoPersonalService} from '../../../services/economico-personal-service';
import {PaginacionResponse} from '../../../models/paginacion-response';
import {FormsModule} from '@angular/forms';
import {ActualizarBajaLaboralDTO, BajasLaboralesDTO, CrearBajaLaboralDTO, ListadoPersonalSelectorEconomicoDTO} from '../../../models/personal-economico';
import {getVisiblePages, ModalMode, SavingState} from '../../../models/savingState';

@Component({
  selector: 'app-bajas-personal',
    imports: [
        FormsModule
    ],
  templateUrl: './bajas-personal.html',
  styleUrl: './bajas-personal.css'
})
export class BajasPersonal implements OnInit {
    @Input()
    public idEconomico!: number;
    private economicoPersonalService: EconomicoPersonalService = inject(EconomicoPersonalService);
    private personalService: EconomicoPersonalService = inject(EconomicoPersonalService);

    // Signals principales
    public bajasLaborales: WritableSignal<BajasLaboralesDTO[]> = signal<BajasLaboralesDTO[]>([]);
    public listadoPersonal: WritableSignal<ListadoPersonalSelectorEconomicoDTO[]> = signal<ListadoPersonalSelectorEconomicoDTO[]>([]);
    public loading: WritableSignal<boolean> = signal(false);
    public savingStates: WritableSignal<{ [key: number]: SavingState }> = signal<{ [key: number]: SavingState }>({});

    // Signals para paginación
    public currentPage: WritableSignal<number> = signal(0);
    public pageSize: WritableSignal<number> = signal(10);
    public totalElements: WritableSignal<number> = signal(0);
    public totalPages: WritableSignal<number> = signal(0);

    // Signals para modal
    public modalOpen: WritableSignal<boolean> = signal(false);
    public modalMode: WritableSignal<ModalMode> = signal<ModalMode>(null);
    public modalLoading: WritableSignal<boolean> = signal(false);
    public selectedBaja: WritableSignal<BajasLaboralesDTO | null> = signal<BajasLaboralesDTO | null>(null);

    // Signals para el formulario del modal
    public formData:WritableSignal<any> = signal(BajasPersonal);

    // Computed signals
    public visiblePages: Signal<number[]> = computed((): number[] => getVisiblePages(this.currentPage(), this.totalPages()));

    // Para acceder a Math en el template
    public Math: Math = Math;

    public constructor() {
        // Effect para recargar datos cuando cambie la página
        effect((): void => {
            const page = this.currentPage();
            if (page >= 0) {
                this.loadDataInternal();
            }
        });
    }

    public ngOnInit(): void {
        this.loadData();
        this.loadPersonalSelector();
    }

    // Métodos de carga de datos
    public loadData(): void {
        this.currentPage.set(0);
        this.loadDataInternal();
    }

    private loadDataInternal(): void {
        this.loading.set(true);
        try {
            this.economicoPersonalService.obtenerBajasLaboralesPorIdEconomico(this.idEconomico, this.currentPage(), this.pageSize()).subscribe({
                next: (response: PaginacionResponse<BajasLaboralesDTO>) => {
                    this.bajasLaborales.set(response.content);
                    this.totalElements.set(response.totalElements);
                    this.totalPages.set(response.totalPages);
                    this.loading.set(false);
                },
                error: (error) => {
                    console.error('Error cargando bajas laborales:', error);
                    this.loading.set(false);
                }
            });
        } catch (error) {
            console.error('Error cargando datos:', error);
            this.loading.set(false);
        }
    }

    private loadPersonalSelector(): void {
        this.personalService.obtenerListadoPersonalSelector(this.idEconomico).subscribe({
            next: (response: ListadoPersonalSelectorEconomicoDTO[]) => {
                console.log(response);
                this.listadoPersonal.set(response);
            },
            error: (error) => {
                console.error('Error cargando listado personal:', error);
            }
        });
    }

    // Métodos CRUD
    public updateField(idBajaLaboral: number, field: keyof BajasLaboralesDTO, value: string | number): void {
        const editableFields = ['fechaInicio', 'fechaFin'];

        if (!editableFields.includes(field as string)) {
            console.warn(`Campo ${field} no es editable`);
            return;
        }

        this.savingStates.update(states => ({
            ...states,
            [idBajaLaboral]: 'saving'
        }));

        try {
            let valorFinal: Date | number;
            if (field === 'fechaInicio' || field === 'fechaFin') {
                valorFinal = value ? new Date(value as string) : null as any;
            } else {
                valorFinal = this.parseNumberValue(value);
            }

            const actualizacion: ActualizarBajaLaboralDTO = {
                idBajaLaboral: idBajaLaboral,
                campoActualizado: field,
                valor: valorFinal
            };

            this.economicoPersonalService.actualizarBajaLaboral(actualizacion).subscribe({
                next: () => {
                    this.savingStates.update(states => ({
                        ...states,
                        [idBajaLaboral]: 'success'
                    }));

                    // Actualizar el valor en la lista local
                    this.bajasLaborales.update(items =>
                        items.map(item =>
                            item.idBajaLaboral === idBajaLaboral
                                ? { ...item, [field]: valorFinal }
                                : item
                        )
                    );
                    this.loadDataInternal();

                    setTimeout(() => {
                        this.savingStates.update(states => ({
                            ...states,
                            [idBajaLaboral]: 'idle'
                        }));
                    }, 2000);
                },
                error: (error) => {
                    console.error('Error actualizando baja laboral:', error);
                    this.handleSavingError(idBajaLaboral);
                }
            });

            console.log(`Actualizando campo ${field} para baja ID ${idBajaLaboral} con valor ${value}`);
        } catch (error) {
            console.error('Error actualizando campo:', error);
            this.handleSavingError(idBajaLaboral);
        }
    }

    public deleteBaja(idBajaLaboral: number): void {
        if (!confirm('¿Estás seguro de que quieres eliminar esta baja laboral?')) {
            return;
        }

        this.savingStates.update(states => ({
            ...states,
            [idBajaLaboral]: 'saving'
        }));

        this.economicoPersonalService.eliminarBajaLaboral(idBajaLaboral).subscribe({
            next: () => {
                this.bajasLaborales.update(items =>
                    items.filter(item => item.idBajaLaboral !== idBajaLaboral)
                );
                this.savingStates.update(states => {
                    const newStates = { ...states };
                    delete newStates[idBajaLaboral];
                    return newStates;
                });
            },
            error: (error) => {
                console.error('Error eliminando baja laboral:', error);
                this.handleSavingError(idBajaLaboral);
            }
        });
    }

    // Métodos del modal
    public openCreateModal(): void {
        this.resetForm();
        this.modalMode.set('create');
        this.modalOpen.set(true);
        // Prevenir scroll del body cuando el modal está abierto
        document.body.style.overflow = 'hidden';
    }

    public openEditModal(baja: BajasLaboralesDTO): void {
        this.selectedBaja.set(baja);
        this.formData.set({
            idPersona: baja.idPersona,
            fechaInicio: this.formatDateForInput(baja.fechaInicio),
            fechaFin: this.formatDateForInput(baja.fechaFin),
            nombre: baja.nombre
        });
        this.modalMode.set('edit');
        this.modalOpen.set(true);
        // Prevenir scroll del body cuando el modal está abierto
        document.body.style.overflow = 'hidden';
    }

    public closeModal(): void {
        this.modalOpen.set(false);
        this.modalMode.set(null);
        this.selectedBaja.set(null);
        this.resetForm();
        // Restaurar scroll del body
        document.body.style.overflow = 'auto';
    }

    // Metodo para cerrar el modal solo cuando se hace clic en el backdrop
    public onBackdropClick(event: Event): void {
        // Solo cerrar si el clic fue directamente en el backdrop
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
            this.createBaja();
        } else if (this.modalMode() === 'edit') {
            this.updateBajaFromModal();
        }
    }

    private createBaja(): void {
        const form = this.formData();
        const nuevaBaja: CrearBajaLaboralDTO = {
            idPersona: form.idPersona,
            fechaInicio: new Date(form.fechaInicio),
            fechaFin: form.fechaFin ? new Date(form.fechaFin) : null as any
        };

        this.economicoPersonalService.crearBajaLaboral(nuevaBaja).subscribe({
            next: () => {
                this.modalLoading.set(false);
                this.closeModal();
                this.loadData(); // Recargar datos
            },
            error: (error) => {
                console.error('Error creando baja laboral:', error);
                this.modalLoading.set(false);
            }
        });
    }

    private updateBajaFromModal(): void {
        // Implementar si necesitas edición completa desde modal
        this.modalLoading.set(false);
        this.closeModal();
    }

    // Métodos auxiliares
    private resetForm(): void {
        this.formData.set({
            idPersona: 0,
            fechaInicio: '',
            fechaFin: '',
            nombre: ''
        });
    }

    private validateForm(): boolean {
        const form = this.formData();

        if (form.idPersona === 0) {
            alert('Debe seleccionar un empleado');
            return false;
        }

        if (!form.fechaInicio) {
            alert('La fecha de inicio es obligatoria');
            return false;
        }

        if (form.fechaFin && new Date(form.fechaFin) < new Date(form.fechaInicio)) {
            alert('La fecha de fin no puede ser anterior a la fecha de inicio');
            return false;
        }

        return true;
    }

    private handleSavingError(idBajaLaboral: number): void {
        this.savingStates.update(states => ({
            ...states,
            [idBajaLaboral]: 'error'
        }));

        setTimeout(() => {
            this.savingStates.update(states => ({
                ...states,
                [idBajaLaboral]: 'idle'
            }));
        }, 3000);
    }

    public onKeyPress(event: KeyboardEvent, idBajaLaboral: number, field: keyof BajasLaboralesDTO, value: string | number): void {
        if (event.key === 'Enter') {
            (event.target as HTMLInputElement).blur();
            this.updateField(idBajaLaboral, field, value);
        }
    }

    public getInputClass(idBajaLaboral: number): string {
        const savingState = this.savingStates()[idBajaLaboral] || 'idle';
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

    public getDiasBaja(baja: BajasLaboralesDTO): number {
        const fechaInicio = new Date(baja.fechaInicio);
        const fechaFin = baja.fechaFin ? new Date(baja.fechaFin) : new Date();

        const diffTime = Math.abs(fechaFin.getTime() - fechaInicio.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

    public parseNumberValue(value: string | number): number {
        if (value === null || value === undefined || value === '') {
            return 0;
        }
        if (typeof value === 'number') {
            return value;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
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

    // Métodos de conveniencia para el template
    public isLoading(): boolean {
        return this.loading();
    }

    public hasBajasLaborales(): boolean {
        return this.bajasLaborales().length > 0;
    }

    public canGoPrevious(): boolean {
        return this.currentPage() > 0;
    }

    public canGoNext(): boolean {
        return this.currentPage() < this.totalPages() - 1;
    }

    public onPersonalChange(): void {
        const form = this.formData();
        const personalSeleccionado = this.listadoPersonal().find(p => p.idPersona === form.idPersona);

        if (personalSeleccionado) {
            this.formData.update(current => ({
                ...current,
                nombre: personalSeleccionado.nombre
            }));
        }
    }
}
