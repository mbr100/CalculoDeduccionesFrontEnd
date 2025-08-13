import {Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {EcnomicoListadoGeneralDto} from '../../../models/empresa';
import {EconomicoService} from '../../../services/economico-service';
import {ReactiveFormsModule} from '@angular/forms';
import Swal from 'sweetalert2';
import {Router} from '@angular/router';
import {PaginacionResponse} from '../../../models/paginacion-response';

@Component({
    selector: 'app-listado-economicos',
    imports: [
        ReactiveFormsModule
    ],
    templateUrl: './listado-economicos.html',
    styleUrl: './listado-economicos.css'
})
export class ListadoEconomicos implements OnInit {
    public economicos: WritableSignal<EcnomicoListadoGeneralDto[]> = signal<EcnomicoListadoGeneralDto[]>([]);
    public loading: WritableSignal<boolean> = signal<boolean>(false);
    public error: WritableSignal<string> = signal<string>(''); // Corregido: string en minúscula
    public pagesize: WritableSignal<number> = signal<number>(10);
    public currentPage: WritableSignal<number> = signal<number>(1);
    public totalPages: WritableSignal<number> = signal<number>(2);
    public totalelements: WritableSignal<number> = signal<number>(0);
    // public searchTerm: WritableSignal<string> = signal<string>(''); // Corregido: string en minúscula

    private empresaService: EconomicoService = inject(EconomicoService);
    private router: Router = inject(Router);

    public ngOnInit(): void {
        this.loadData();
    }

    // // Computed signal para datos filtrados y ordenados - MEJORADO CON VALIDACIÓN
    // public filteredEconomicos: Signal<EcnomicoListadoGeneralDto[]> = computed((): EcnomicoListadoGeneralDto[] => {
    //     return this.economicos().filter((economico) => {
    //         // Validación de datos antes de aplicar el filtro
    //         if (!economico || !economico.nombre || !economico.anualidad) {
    //             console.warn('Datos incompletos para el económico:', economico);
    //             return false; // Excluir este elemento del filtro
    //         }
    //         const searchTerm = this.searchTerm().toLowerCase();
    //         return economico.nombre.toLowerCase().includes(searchTerm) ||
    //                economico.anualidad.toString().toLowerCase().includes(searchTerm);
    //
    //     })
    // });

    public loadData(): void {
        this.loading.set(true);
        this.error.set('');

        this.empresaService.getEmpresasListadoGeneral().subscribe({
            next: (data: PaginacionResponse<EcnomicoListadoGeneralDto>) => {
                console.log('Datos recibidos:', data);
                this.economicos.set(data.content)
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error fetching economic listings:', error);
                this.error.set('Error al cargar los datos de empresas');
                this.economicos.set([]); // Asegurar que sea un array vacío
                this.loading.set(false);
            },
            complete: () => {
                console.log('Economic listings fetched successfully');
            }
        });
    }

    // Metodo para actualizar el término de búsqueda
    // public onSearchChange(event: Event): void {
    //     const target = event.target as HTMLInputElement;
    //     this.searchTerm.set(target.value);
    // }

    // Métodos para ordenar datos

    // public sortData(column: string): void {
    //     if (this.sortColumn() === column) {
    //         this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    //     } else {
    //         this.sortColumn.set(column);
    //         this.sortDirection.set('asc');
    //     }
    // }

    // Métodos para acciones
    public verEconomico(empresa: EcnomicoListadoGeneralDto): void {
        console.log('Ver empresa:', empresa);
        // Implementar navegación o modal para ver detalles
    }

    public editarEconomico(empresa: EcnomicoListadoGeneralDto): void {
        console.log('Editar empresa:', empresa);
        // Implementar navegación a formulario de edición
    }

    public eliminarEconomico(economico: EcnomicoListadoGeneralDto): void {
        Swal.fire({
            title: '¿Estás seguro?',
            text: `¿Deseas eliminar el económico ${economico.nombre} - ${economico.anualidad}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.empresaService.eliminarEconomico(economico).subscribe({
                    next: () => {
                        Swal.fire('Eliminado', `El económico ${economico.nombre} - ${economico.anualidad} ha sido eliminado.`, 'success')
                            .then(_ =>  this.refreshData());

                    },
                    error: (error) => {
                        Swal.fire('Error', 'No se pudo eliminar el económico.', 'error')
                            .then(_ => console.error('Error al eliminar el económico:', error));
                    }
                });
            }
        })
    }

    public refreshData(): void {
        this.loadData();
    }

    public nuevoEconomico(): void {
        this.router.navigate(['/nuevoEconomico']).then();
    }
}
