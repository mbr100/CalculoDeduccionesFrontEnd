import {Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
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
        if (url.includes('/economico/ver/')) {
            this.activeRoute = 'economico';
        } else if (url.includes('/economico/personal/')) {
            this.activeRoute = 'personal';
        } else if (url.includes('/economico/proyectos/')) {
            this.activeRoute = 'proyectos';
        } else if (url.includes('/economico/asignaciones/')) {
            this.activeRoute = 'asignaciones';
        } else if (url.includes('/economico/resumen/')) {
            this.activeRoute = 'resumen';
        } else {
            this.activeRoute = '';
        }
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

    public goToProyectos(): void {
        this.router.navigate(['/economico/proyectos', this.idEconomico]).then((success) => {
            if (success) {
                this.updateActiveRoute(this.router.url);
            }
        });
    }

    public goToAsignaciones(): void {
        this.router.navigate(['/economico/asignaciones', this.idEconomico]).then((success) => {
            if (success) {
                this.updateActiveRoute(this.router.url);
            }
        });
    }

    goToResumen() {
        this.router.navigate(['/economico/resumen', this.idEconomico]).then((success) => {
            if (success) {
                this.updateActiveRoute(this.router.url);
            }
        });
    }
}
