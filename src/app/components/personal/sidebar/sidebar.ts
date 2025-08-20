import {Component, inject, Input, OnDestroy, OnInit, signal, WritableSignal} from '@angular/core';
import Swal from 'sweetalert2';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {NgClass} from '@angular/common';
import {filter, Subscription} from 'rxjs';

@Component({
    selector: 'app-sidebar',
    imports: [],
    templateUrl: './sidebar.html',
    styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit, OnDestroy {
    @Input()
    public idEconomico!: number;

    private router: Router = inject(Router);
    public activeRoute: string = '';
    private routerSubscription?: Subscription;

    public ngOnInit(): void {
        // Obtener la ruta actual al inicializar
        this.updateActiveRoute(this.router.url);

        // Escuchar cambios de ruta
        this.routerSubscription = this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe((event: NavigationEnd) => {
                this.updateActiveRoute(event.urlAfterRedirects);
            });
    }

    public ngOnDestroy(): void {
        // Limpiar suscripción
        if (this.routerSubscription) {
            this.routerSubscription.unsubscribe();
        }
    }

    private updateActiveRoute(url: string): void {
        console.log('URL actual:', url); // Para debug

        if (url.includes('/economico/ver/')) {
            this.activeRoute = 'economico';
        } else if (url.includes('/economico/personal/')) {
            this.activeRoute = 'personal';
        } else {
            this.activeRoute = '';
        }

        console.log('Ruta activa:', this.activeRoute); // Para debug
    }

    public goToEconomico(): void {
        this.router.navigate(['/economico/ver', this.idEconomico]).then((success) => {
            if (success) {
                this.updateActiveRoute(this.router.url);
            }
        });
    }

    public goToPersonal(): void {
        this.router.navigate(['/economico/personal', this.idEconomico]).then((success) => {
            if (success) {
                this.updateActiveRoute(this.router.url);
            }
        });
    }

    public getButtonClass(buttonId: string): string {
        const baseClasses = 'w-12 h-12 flex items-center justify-center rounded-lg transition-colors duration-200';
        const activeClasses = 'bg-blue-100 text-blue-700 border-2 border-blue-300';
        const inactiveClasses = 'text-gray-700 hover:bg-blue-50 hover:text-blue-700';

        return `${baseClasses} ${this.activeRoute === buttonId ? activeClasses : inactiveClasses}`;
    }
}
