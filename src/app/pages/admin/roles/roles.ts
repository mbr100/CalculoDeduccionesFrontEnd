import { Component, OnInit, signal, WritableSignal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RolService } from '../../../services/rol.service';
import { PermisoService } from '../../../services/permiso.service';
import { Rol, RolDTO, Permiso } from '../../../models/usuario';
import { usePermissions, PERMISSIONS } from '../../../utils/permission.utils';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import Swal from 'sweetalert2';

/**
 * Componente de gestión de roles y permisos
 */
@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HasPermissionDirective],
  templateUrl: './roles.html',
  styleUrl: './roles.css'
})
export class Roles implements OnInit {
  private rolService = inject(RolService);
  private permisoService = inject(PermisoService);
  private fb = inject(FormBuilder);

  // Permisos
  public permissions = usePermissions();
  public PERMS = PERMISSIONS.ROLES;

  // Estado reactivo
  public roles: WritableSignal<Rol[]> = signal([]);
  public permisos: WritableSignal<Permiso[]> = signal([]);
  public permisosGrouped: WritableSignal<{ [recurso: string]: Permiso[] }> = signal({});
  public loading: WritableSignal<boolean> = signal(false);
  public showModal: WritableSignal<boolean> = signal(false);
  public isEditMode: WritableSignal<boolean> = signal(false);
  public currentRolId: WritableSignal<number | null> = signal(null);

  // Permisos seleccionados
  public selectedPermissions: WritableSignal<Set<number>> = signal(new Set());

  // Paginación
  public currentPage: WritableSignal<number> = signal(1);
  public pageSize: WritableSignal<number> = signal(10);
  public totalPages: WritableSignal<number> = signal(0);
  public totalElements: WritableSignal<number> = signal(0);

  // Búsqueda
  public searchTerm: WritableSignal<string> = signal('');

  // Formulario
  public rolForm!: FormGroup;

  // Computed
  public filteredRoles = computed(() => {
    let filtered = this.roles();
    const search = this.searchTerm().toLowerCase();

    if (search) {
      filtered = filtered.filter(r =>
        r.nombre.toLowerCase().includes(search) ||
        r.descripcion.toLowerCase().includes(search)
      );
    }

    return filtered;
  });

  // Obtener recursos únicos
  public recursos = computed(() => {
    return Object.keys(this.permisosGrouped());
  });

  ngOnInit(): void {
    this.initForm();
    this.loadRoles();
    this.loadPermisos();
  }

  /**
   * Inicializar formulario
   */
  private initForm(): void {
    this.rolForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required]],
      activo: [true]
    });
  }

  /**
   * Cargar roles
   */
  public loadRoles(): void {
    this.loading.set(true);

    this.rolService.getRoles(this.currentPage() - 1, this.pageSize()).subscribe({
      next: (response) => {
        this.roles.set(response.content);
        this.totalPages.set(response.totalPages);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar roles:', err);
        this.loading.set(false);
        Swal.fire('Error', 'No se pudieron cargar los roles', 'error');
      }
    });
  }

  /**
   * Cargar permisos
   */
  private loadPermisos(): void {
    this.permisoService.getPermisosGroupedByResource().subscribe({
      next: (grouped) => {
        this.permisosGrouped.set(grouped);

        // Aplanar permisos
        const allPermisos: Permiso[] = [];
        Object.values(grouped).forEach(permisos => {
          allPermisos.push(...permisos);
        });
        this.permisos.set(allPermisos);
      },
      error: (err) => {
        console.error('Error al cargar permisos:', err);
      }
    });
  }

  /**
   * Abrir modal para crear rol
   */
  public openCreateModal(): void {
    this.isEditMode.set(false);
    this.currentRolId.set(null);
    this.rolForm.reset({ activo: true });
    this.selectedPermissions.set(new Set());
    this.showModal.set(true);
  }

  /**
   * Abrir modal para editar rol
   */
  public openEditModal(rol: Rol): void {
    this.isEditMode.set(true);
    this.currentRolId.set(rol.id);
    this.rolForm.patchValue({
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      activo: rol.activo
    });

    // Cargar permisos del rol
    const permisosIds = new Set(rol.permisos.map(p => p.id));
    this.selectedPermissions.set(permisosIds);

    this.showModal.set(true);
  }

  /**
   * Cerrar modal
   */
  public closeModal(): void {
    this.showModal.set(false);
    this.rolForm.reset();
    this.selectedPermissions.set(new Set());
  }

  /**
   * Guardar rol (crear o actualizar)
   */
  public saveRol(): void {
    if (this.rolForm.invalid) {
      this.markFormAsTouched();
      return;
    }

    const rolDTO: RolDTO = {
      ...this.rolForm.value,
      permisosIds: Array.from(this.selectedPermissions())
    };

    this.loading.set(true);

    const operation = this.isEditMode() && this.currentRolId()
      ? this.rolService.updateRol(this.currentRolId()!, rolDTO)
      : this.rolService.createRol(rolDTO);

    operation.subscribe({
      next: () => {
        this.loading.set(false);
        Swal.fire({
          icon: 'success',
          title: this.isEditMode() ? 'Rol actualizado' : 'Rol creado',
          text: 'La operación se realizó correctamente',
          timer: 2000,
          showConfirmButton: false
        });
        this.closeModal();
        this.loadRoles();
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Error al guardar rol:', err);
        Swal.fire('Error', err.error?.message || 'No se pudo guardar el rol', 'error');
      }
    });
  }

  /**
   * Eliminar rol
   */
  public deleteRol(rol: Rol): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará el rol ${rol.nombre}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading.set(true);

        this.rolService.deleteRol(rol.id).subscribe({
          next: () => {
            this.loading.set(false);
            Swal.fire('Eliminado', 'El rol ha sido eliminado', 'success');
            this.loadRoles();
          },
          error: (err) => {
            this.loading.set(false);
            console.error('Error al eliminar rol:', err);
            Swal.fire('Error', 'No se pudo eliminar el rol', 'error');
          }
        });
      }
    });
  }

  /**
   * Toggle permiso
   */
  public togglePermission(permisoId: number): void {
    const selected = new Set(this.selectedPermissions());

    if (selected.has(permisoId)) {
      selected.delete(permisoId);
    } else {
      selected.add(permisoId);
    }

    this.selectedPermissions.set(selected);
  }

  /**
   * Verificar si un permiso está seleccionado
   */
  public isPermissionSelected(permisoId: number): boolean {
    return this.selectedPermissions().has(permisoId);
  }

  /**
   * Seleccionar todos los permisos de un recurso
   */
  public toggleAllResourcePermissions(recurso: string): void {
    const permisos = this.permisosGrouped()[recurso];
    const selected = new Set(this.selectedPermissions());

    const allSelected = permisos.every(p => selected.has(p.id));

    if (allSelected) {
      // Deseleccionar todos
      permisos.forEach(p => selected.delete(p.id));
    } else {
      // Seleccionar todos
      permisos.forEach(p => selected.add(p.id));
    }

    this.selectedPermissions.set(selected);
  }

  /**
   * Verificar si todos los permisos de un recurso están seleccionados
   */
  public areAllResourcePermissionsSelected(recurso: string): boolean {
    const permisos = this.permisosGrouped()[recurso];
    const selected = this.selectedPermissions();
    return permisos.every(p => selected.has(p.id));
  }

  /**
   * Cambiar página
   */
  public goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadRoles();
    }
  }

  /**
   * Cambiar tamaño de página
   */
  public changePageSize(event: Event): void {
    const size = parseInt((event.target as HTMLSelectElement).value);
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadRoles();
  }

  /**
   * Obtener páginas visibles para la paginación
   */
  public getVisiblePages(): number[] {
    const current = this.currentPage();
    const total = this.totalPages();
    const pages: number[] = [];

    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  /**
   * Marcar formulario como touched
   */
  private markFormAsTouched(): void {
    Object.keys(this.rolForm.controls).forEach(key => {
      this.rolForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Obtener conteo de permisos por rol
   */
  public getPermissionCount(rol: Rol): number {
    return rol.permisos?.length || 0;
  }

  /**
   * Obtener badge de estado
   */
  public getStatusBadge(activo: boolean): string {
    return activo
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  }

  /**
   * Formatear nombre del recurso
   */
  public formatResourceName(recurso: string): string {
    return recurso.charAt(0) + recurso.slice(1).toLowerCase().replace(/_/g, ' ');
  }
}
