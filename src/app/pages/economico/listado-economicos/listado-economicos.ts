import {Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {EcnomicoListadoGeneralDto} from '../../../models/economico';
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

    private economicoService: EconomicoService = inject(EconomicoService);
    private router: Router = inject(Router);

    public ngOnInit(): void {
        this.loadDataWithPagination();
    }

    private loadDataWithPagination(): void {
        this.loading.set(true);
        this.error.set('');

        // Ajustar para que la página comience desde 0 en el backend
        const pageForBackend = this.currentPage() - 1;

        this.economicoService.getEconomicosListadoGeneral(pageForBackend, this.pagesize()).subscribe({
            next: (data: PaginacionResponse<EcnomicoListadoGeneralDto>) => {
                console.log('Datos recibidos:', data);
                this.economicos.set(data.content);
                this.loading.set(false);
                this.totalelements.set(data.totalElements);
                this.totalPages.set(data.totalPages);
                this.currentPage.set(data.number + 1); // Ajustar para que sea base 1
                this.pagesize.set(data.size);
            },
            error: (error) => {
                console.error('Error fetching economic listings:', error);
                this.error.set('Error al cargar los datos de empresas');
                this.economicos.set([]);
                this.loading.set(false);
            },
            complete: () => {
                console.log('Economic listings fetched successfully');
            }
        });
    }

    // Métodos para acciones
    public verEconomico(empresa: EcnomicoListadoGeneralDto): void {
        console.log('Ver empresa:', empresa);
        // Implementar navegación o modal para ver detalles
        this.economicoService.getEconomicoById(empresa.id).subscribe({
            next: (data) => {
                console.log('Detalles del económico:', data);
                this.router.navigate(['/economico/ver/', empresa.id]).then();
            },
            error: (error) => {
                console.error('Error al obtener detalles del económico:', error);
                Swal.fire('Error', 'No se pudieron cargar los detalles del económico.', 'error').then();
            }
        });
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
                this.economicoService.eliminarEconomico(economico).subscribe({
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

    public nuevoEconomico(): void {
        this.router.navigate(['/nuevoEconomico']).then();
    }

    public changePageSize(event: Event): void {
        const target = event.target as HTMLSelectElement;
        const newSize = parseInt(target.value, 10);
        this.pagesize.set(newSize);
        this.currentPage.set(1); // Volver a la primera página
        this.loadDataWithPagination();
    }

    public nextPage(): void {
        if (this.currentPage() < this.totalPages()) {
            this.currentPage.set(this.currentPage() + 1);
            this.loadDataWithPagination();
        }
    }

    public previousPage(): void {
        if (this.currentPage() > 1) {
            this.currentPage.set(this.currentPage() - 1);
            this.loadDataWithPagination();
        }
    }

    public goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
            this.currentPage.set(page);
            this.loadDataWithPagination();
        }
    }

    public getStartElement(): number {
        return (this.currentPage() - 1) * this.pagesize() + 1;
    }

    public getEndElement(): number {
        const end = this.currentPage() * this.pagesize();
        return Math.min(end, this.totalelements());
    }

    public getVisiblePages(): number[] {
        const current = this.currentPage();
        const total = this.totalPages();
        const pages: number[] = [];

        if (total <= 5) {
            // Si hay 5 páginas o menos, mostrar todas
            for (let i = 1; i <= total; i++) {
                pages.push(i);
            }
        } else {
            // Mostrar 5 páginas alrededor de la actual
            let start = Math.max(1, current - 2);
            let end = Math.min(total, current + 2);

            // Ajustar si estamos cerca del inicio
            if (current <= 3) {
                start = 1;
                end = 5;
            }

            // Ajustar si estamos cerca del final
            if (current >= total - 2) {
                start = total - 4;
                end = total;
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }

        return pages;
    }

    public refreshData(): void {
        this.loadDataWithPagination();
    }
}
