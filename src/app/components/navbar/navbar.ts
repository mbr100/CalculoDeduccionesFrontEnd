import {Component, HostListener, inject, signal} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styles: `:host { display: block; position: relative; z-index: 50; }`
})
export class Navbar {

    private router: Router = inject(Router);
    public mantOpen = signal(false);
    public userOpen = signal(false);

    irAInicio() {
        this.router.navigate(['']).then();
    }

    irATiposCotizacion() {
        this.mantOpen.set(false);
        this.router.navigate(['/mantenimientos/tipos-cotizacion']).then();
    }

    toggleMant() {
        this.mantOpen.update(v => !v);
        this.userOpen.set(false);
    }

    toggleUser() {
        this.userOpen.update(v => !v);
        this.mantOpen.set(false);
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.dropdown-mant') && !target.closest('.dropdown-user')) {
            this.mantOpen.set(false);
            this.userOpen.set(false);
        }
    }
}
