import { Component, OnInit, signal, WritableSignal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';

/**
 * Componente de Login
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Estado reactivo
  public loginForm!: FormGroup;
  public loading: WritableSignal<boolean> = signal(false);
  public showPassword: WritableSignal<boolean> = signal(false);
  public error: WritableSignal<string | null> = signal(null);

  // URL de retorno después del login
  private returnUrl: string = '/';

  ngOnInit(): void {
    // Si ya está autenticado, redirigir
    if (this.authService.isAuthenticated() && !this.authService.isTokenExpired()) {
      this.router.navigate(['/']);
      return;
    }

    // Obtener URL de retorno de los query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    // Inicializar formulario
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  /**
   * Enviar formulario de login
   */
  public onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const credentials = {
      username: this.loginForm.value.username,
      password: this.loginForm.value.password
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.loading.set(false);

        // Mostrar mensaje de bienvenida
        Swal.fire({
          icon: 'success',
          title: '¡Bienvenido!',
          text: `Hola ${response.usuario.nombre}`,
          timer: 2000,
          showConfirmButton: false
        });

        // Redirigir a la URL de retorno
        setTimeout(() => {
          this.router.navigate([this.returnUrl]);
        }, 2000);
      },
      error: (err) => {
        this.loading.set(false);

        let errorMessage = 'Usuario o contraseña incorrectos';

        if (err.status === 0) {
          errorMessage = 'No se pudo conectar con el servidor';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }

        this.error.set(errorMessage);

        Swal.fire({
          icon: 'error',
          title: 'Error de Autenticación',
          text: errorMessage,
          confirmButtonText: 'Intentar de nuevo',
          confirmButtonColor: '#dc2626'
        });
      }
    });
  }

  /**
   * Alternar visibilidad de la contraseña
   */
  public togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  /**
   * Marcar todos los campos del formulario como touched para mostrar errores
   */
  private markFormAsTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Verificar si un campo tiene error
   */
  public hasError(field: string, error: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.hasError(error) && control.touched);
  }

  /**
   * Obtener mensaje de error para un campo
   */
  public getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio';
    }

    if (control.hasError('minlength')) {
      const minLength = control.errors['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }

    return 'Campo inválido';
  }
}
