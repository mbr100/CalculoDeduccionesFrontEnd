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
    public collapsed: boolean = false;
    public partidasGastoOpen: boolean = false;
    public personalSubOpen: boolean = false;
    private routerSubscription?: Subscription;

    public ngOnInit(): void {
        this.updateActiveRoute(this.router.url);

        this.routerSubscription = this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe((event: NavigationEnd) => {
                this.updateActiveRoute(event.urlAfterRedirects);
            });
    }

    public ngOnDestroy(): void {
        if (this.routerSubscription) {
            this.routerSubscription.unsubscribe();
        }
    }

    private updateActiveRoute(url: string): void {
        if (url.includes('/economico/ver/')) {
            this.activeRoute = 'economico';
        } else if (url.includes('/economico/personal/')) {
            this.activeRoute = 'personal';
            this.partidasGastoOpen = true;
            this.personalSubOpen = true;
        } else if (url.includes('/economico/proyectos/')) {
            this.activeRoute = 'proyectos';
        } else if (url.includes('/economico/colaboraciones/')) {
            this.activeRoute = 'colaboraciones';
            this.partidasGastoOpen = true;
        } else if (url.includes('/economico/materiales/')) {
            this.activeRoute = 'materiales';
            this.partidasGastoOpen = true;
        } else if (url.includes('/economico/amortizacion/')) {
            this.activeRoute = 'amortizacion';
            this.partidasGastoOpen = true;
        } else if (url.includes('/economico/otros-gastos/')) {
            this.activeRoute = 'otrosgastos';
            this.partidasGastoOpen = true;
        } else if (url.includes('/economico/asignaciones/')) {
            this.activeRoute = 'asignaciones';
            this.partidasGastoOpen = true;
            this.personalSubOpen = true;
        } else if (url.includes('/economico/resumen/')) {
            this.activeRoute = 'resumen';
        } else {
            this.activeRoute = '';
        }
    }

    public toggleCollapsed(): void {
        this.collapsed = !this.collapsed;
    }

    public togglePartidasGasto(): void {
        this.partidasGastoOpen = !this.partidasGastoOpen;
        if (!this.partidasGastoOpen) {
            this.personalSubOpen = false;
        }
    }

    public togglePersonalSub(): void {
        this.personalSubOpen = !this.personalSubOpen;
    }

    public isPartidasGastoActive(): boolean {
        return ['personal', 'colaboraciones', 'materiales', 'amortizacion', 'otrosgastos', 'asignaciones']
            .includes(this.activeRoute);
    }

    public isPersonalActive(): boolean {
        return ['personal', 'asignaciones'].includes(this.activeRoute);
    }

    public getNavButtonClass(buttonId: string): string {
        const base = 'nav-btn';
        return `${base}${this.activeRoute === buttonId ? ' nav-btn--active' : ''}`;
    }

    public getGroupButtonClass(active: boolean): string {
        return `nav-group-btn${active ? ' nav-group-btn--active' : ''}`;
    }

    public getSubButtonClass(buttonId: string): string {
        return `nav-sub-btn${this.activeRoute === buttonId ? ' nav-sub-btn--active' : ''}`;
    }

    public goToEconomico(): void {
        this.router.navigate(['/economico/ver', this.idEconomico]);
    }

    public goToPersonal(): void {
        this.router.navigate(['/economico/personal', this.idEconomico]);
    }

    public goToProyectos(): void {
        this.router.navigate(['/economico/proyectos', this.idEconomico]);
    }

    public goToColaboraciones(): void {
        this.router.navigate(['/economico/colaboraciones', this.idEconomico]);
    }

    public goToMateriales(): void {
        this.router.navigate(['/economico/materiales', this.idEconomico]);
    }

    public goToAmortizacion(): void {
        this.router.navigate(['/economico/amortizacion', this.idEconomico]);
    }

    public goToOtrosGastos(): void {
        this.router.navigate(['/economico/otros-gastos', this.idEconomico]);
    }

    public goToAsignaciones(): void {
        this.router.navigate(['/economico/asignaciones', this.idEconomico]);
    }

    public goToResumen(): void {
        this.router.navigate(['/economico/resumen', this.idEconomico]);
    }
}