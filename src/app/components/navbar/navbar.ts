import { Component, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { PERMISSIONS } from '../../utils/permission.utils';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, HasPermissionDirective],
  templateUrl: './navbar.html',
  styles: ``
})
export class Navbar {
  public router: Router = inject(Router);
  private authService = inject(AuthService);

  // Permisos para gestión de usuarios y roles
  public PERMS = {
    USUARIOS: PERMISSIONS.USUARIOS,
    ROLES: PERMISSIONS.ROLES
  };

  // Datos del usuario actual
  public currentUser = this.authService.currentUser;
  public isAuthenticated = this.authService.isAuthenticated;

  // Computed para las iniciales del usuario
  public userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) return 'U';

    const firstInitial = user.nombre?.charAt(0) || '';
    const lastInitial = user.apellidos?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase() || 'U';
  });

  // Computed para el nombre completo
  public fullName = computed(() => {
    const user = this.currentUser();
    if (!user) return 'Usuario';
    return `${user.nombre} ${user.apellidos}`;
  });

  // Computed para el rol
  public userRole = computed(() => {
    const user = this.currentUser();
    return user?.rol?.nombre || 'Sin rol';
  });

  /**
   * Navegar a inicio
   */
  irAInicio() {
    this.router.navigate(['']).then(r => {
      console.log('Navigated to home successfully');
    }).catch(error => {
      console.error('Error navigating to home:', error);
    });
  }

  /**
   * Ir a perfil de usuario
   */
  goToProfile() {
    this.router.navigate(['/perfil']);
  }

  /**
   * Ir a gestión de usuarios
   */
  goToUsuarios() {
    this.router.navigate(['/admin/usuarios']);
  }

  /**
   * Ir a gestión de roles
   */
  goToRoles() {
    this.router.navigate(['/admin/roles']);
  }

  /**
   * Cerrar sesión
   */
  logout() {
    this.authService.logout();
  }
}
