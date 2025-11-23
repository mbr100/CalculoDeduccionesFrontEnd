import { Component, OnInit, signal, WritableSignal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UsuarioService } from '../../../services/usuario.service';
import { RolService } from '../../../services/rol.service';
import { AuthService } from '../../../services/auth.service';
import { Usuario, UsuarioDTO, Rol } from '../../../models/usuario';
import { usePermissions, PERMISSIONS } from '../../../utils/permission.utils';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import Swal from 'sweetalert2';

/**
 * Componente de gestión de usuarios
 */
@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HasPermissionDirective],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class Usuarios implements OnInit {
  private usuarioService = inject(UsuarioService);
  private rolService = inject(RolService);
  private fb = inject(FormBuilder);

  // Permisos
  public permissions = usePermissions();
  public PERMS = PERMISSIONS.USUARIOS;

  // Estado reactivo
  public usuarios: WritableSignal<Usuario[]> = signal([]);
  public roles: WritableSignal<Rol[]> = signal([]);
  public loading: WritableSignal<boolean> = signal(false);
  public showModal: WritableSignal<boolean> = signal(false);
  public isEditMode: WritableSignal<boolean> = signal(false);
  public currentUsuarioId: WritableSignal<number | null> = signal(null);

  // Paginación
  public currentPage: WritableSignal<number> = signal(1);
  public pageSize: WritableSignal<number> = signal(10);
  public totalPages: WritableSignal<number> = signal(0);
  public totalElements: WritableSignal<number> = signal(0);

  // Búsqueda y filtros
  public searchTerm: WritableSignal<string> = signal('');
  public selectedRole: WritableSignal<number | null> = signal(null);

  // Formulario
  public usuarioForm!: FormGroup;

  // Computed
  public filteredUsuarios = computed(() => {
    let filtered = this.usuarios();
    const search = this.searchTerm().toLowerCase();
    const roleId = this.selectedRole();

    if (search) {
      filtered = filtered.filter(u =>
        u.nombre.toLowerCase().includes(search) ||
        u.apellidos.toLowerCase().includes(search) ||
        u.username.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
      );
    }

    if (roleId) {
      filtered = filtered.filter(u => u.roleId === roleId);
    }

    return filtered;
  });

  ngOnInit(): void {
    this.initForm();
    this.loadUsuarios();
    this.loadRoles();
  }

  /**
   * Inicializar formulario
   */
  private initForm(): void {
    this.usuarioForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      nombre: ['', [Validators.required]],
      apellidos: ['', [Validators.required]],
      password: ['', [Validators.minLength(6)]],
      roleId: [null, [Validators.required]],
      activo: [true]
    });
  }

  /**
   * Cargar usuarios
   */
  public loadUsuarios(): void {
    this.loading.set(true);

    this.usuarioService.getUsuarios(this.currentPage() - 1, this.pageSize()).subscribe({
      next: (response) => {
        this.usuarios.set(response.content);
        this.totalPages.set(response.totalPages);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.loading.set(false);
        Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
      }
    });
  }

  /**
   * Cargar roles
   */
  private loadRoles(): void {
    this.rolService.getAllRoles().subscribe({
      next: (roles) => {
        this.roles.set(roles);
      },
      error: (err) => {
        console.error('Error al cargar roles:', err);
      }
    });
  }

  /**
   * Abrir modal para crear usuario
   */
  public openCreateModal(): void {
    this.isEditMode.set(false);
    this.currentUsuarioId.set(null);
    this.usuarioForm.reset({ activo: true });
    this.usuarioForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.usuarioForm.get('password')?.updateValueAndValidity();
    this.showModal.set(true);
  }

  /**
   * Abrir modal para editar usuario
   */
  public openEditModal(usuario: Usuario): void {
    this.isEditMode.set(true);
    this.currentUsuarioId.set(usuario.id);
    this.usuarioForm.patchValue({
      username: usuario.username,
      email: usuario.email,
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      roleId: usuario.roleId,
      activo: usuario.activo
    });
    this.usuarioForm.get('password')?.clearValidators();
    this.usuarioForm.get('password')?.updateValueAndValidity();
    this.showModal.set(true);
  }

  /**
   * Cerrar modal
   */
  public closeModal(): void {
    this.showModal.set(false);
    this.usuarioForm.reset();
  }

  /**
   * Guardar usuario (crear o actualizar)
   */
  public saveUsuario(): void {
    if (this.usuarioForm.invalid) {
      this.markFormAsTouched();
      return;
    }

    const usuarioDTO: UsuarioDTO = this.usuarioForm.value;

    // Si es edición y no se cambió la contraseña, no enviarla
    if (this.isEditMode() && !usuarioDTO.password) {
      delete usuarioDTO.password;
    }

    this.loading.set(true);

    const operation = this.isEditMode() && this.currentUsuarioId()
      ? this.usuarioService.updateUsuario(this.currentUsuarioId()!, usuarioDTO)
      : this.usuarioService.createUsuario(usuarioDTO);

    operation.subscribe({
      next: () => {
        this.loading.set(false);
        Swal.fire({
          icon: 'success',
          title: this.isEditMode() ? 'Usuario actualizado' : 'Usuario creado',
          text: 'La operación se realizó correctamente',
          timer: 2000,
          showConfirmButton: false
        });
        this.closeModal();
        this.loadUsuarios();
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Error al guardar usuario:', err);
        Swal.fire('Error', err.error?.message || 'No se pudo guardar el usuario', 'error');
      }
    });
  }

  /**
   * Eliminar usuario
   */
  public deleteUsuario(usuario: Usuario): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará el usuario ${usuario.username}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading.set(true);

        this.usuarioService.deleteUsuario(usuario.id).subscribe({
          next: () => {
            this.loading.set(false);
            Swal.fire('Eliminado', 'El usuario ha sido eliminado', 'success');
            this.loadUsuarios();
          },
          error: (err) => {
            this.loading.set(false);
            console.error('Error al eliminar usuario:', err);
            Swal.fire('Error', 'No se pudo eliminar el usuario', 'error');
          }
        });
      }
    });
  }

  /**
   * Cambiar estado activo/inactivo
   */
  public toggleStatus(usuario: Usuario): void {
    this.usuarioService.toggleUsuarioStatus(usuario.id, !usuario.activo).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Estado actualizado',
          timer: 1500,
          showConfirmButton: false
        });
        this.loadUsuarios();
      },
      error: (err) => {
        console.error('Error al cambiar estado:', err);
        Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
      }
    });
  }

  /**
   * Resetear contraseña
   */
  public resetPassword(usuario: Usuario): void {
    Swal.fire({
      title: 'Resetear Contraseña',
      input: 'password',
      inputLabel: 'Nueva contraseña',
      inputPlaceholder: 'Ingresa la nueva contraseña',
      showCancelButton: true,
      confirmButtonText: 'Resetear',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || value.length < 6) {
          return 'La contraseña debe tener al menos 6 caracteres';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.usuarioService.resetPassword(usuario.id, result.value).subscribe({
          next: () => {
            Swal.fire('Éxito', 'Contraseña reseteada correctamente', 'success');
          },
          error: (err) => {
            console.error('Error al resetear contraseña:', err);
            Swal.fire('Error', 'No se pudo resetear la contraseña', 'error');
          }
        });
      }
    });
  }

  /**
   * Cambiar página
   */
  public goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadUsuarios();
    }
  }

  /**
   * Cambiar tamaño de página
   */
  public changePageSize(event: Event): void {
    const size = parseInt((event.target as HTMLSelectElement).value);
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadUsuarios();
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
    Object.keys(this.usuarioForm.controls).forEach(key => {
      this.usuarioForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Obtener nombre del rol
   */
  public getRoleName(roleId: number): string {
    const role = this.roles().find(r => r.id === roleId);
    return role?.nombre || 'Sin rol';
  }

  /**
   * Obtener badge de estado
   */
  public getStatusBadge(activo: boolean): string {
    return activo
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  }
}
