import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  OnInit,
  OnDestroy,
  inject,
  effect
} from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Directiva estructural para mostrar/ocultar elementos basándose en permisos
 *
 * Uso:
 * <button *hasPermission="'USUARIOS:CREATE'">Crear Usuario</button>
 *
 * O con múltiples permisos (requiere al menos uno):
 * <div *hasPermission="['USUARIOS:READ', 'USUARIOS:LIST']">...</div>
 *
 * O requiriendo todos los permisos:
 * <div *hasPermission="['USUARIOS:READ', 'USUARIOS:UPDATE']; requireAll: true">...</div>
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);

  private permissions: string[] = [];
  private requireAll = false;
  private hasView = false;

  /**
   * Permisos requeridos (puede ser string único o array)
   */
  @Input() set hasPermission(permissions: string | string[]) {
    this.permissions = Array.isArray(permissions) ? permissions : [permissions];
    this.updateView();
  }

  /**
   * Si es true, requiere TODOS los permisos. Si es false, requiere AL MENOS UNO.
   */
  @Input() set hasPermissionRequireAll(requireAll: boolean) {
    this.requireAll = requireAll;
    this.updateView();
  }

  constructor() {
    // Usar effect para reaccionar a cambios en los permisos del usuario
    effect(() => {
      // Acceder a los permisos para que el effect se reactive cuando cambien
      this.authService.userPermissions();
      this.updateView();
    });
  }

  ngOnInit(): void {
    this.updateView();
  }

  ngOnDestroy(): void {
    this.viewContainer.clear();
  }

  /**
   * Actualiza la vista según los permisos del usuario
   */
  private updateView(): void {
    const hasPermission = this.checkPermissions();

    if (hasPermission && !this.hasView) {
      // Mostrar el elemento
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      // Ocultar el elemento
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  /**
   * Verifica si el usuario tiene los permisos necesarios
   */
  private checkPermissions(): boolean {
    if (this.permissions.length === 0) {
      return true;
    }

    if (this.requireAll) {
      return this.authService.hasAllPermissions(this.permissions);
    } else {
      return this.authService.hasAnyPermission(this.permissions);
    }
  }
}
