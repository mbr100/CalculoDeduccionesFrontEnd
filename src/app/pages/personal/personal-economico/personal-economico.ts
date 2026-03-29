import {Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {ListadoPersonal} from '../listado-personal/listado-personal';
import {Sidebar} from '../../../components/personal/sidebar/sidebar';
import {RetribucionesPersonal} from '../retribuciones-personal/retribuciones-personal';
import {BasesCotizacionPersonal} from '../bases-cotizacion-personal/bases-cotizacion-personal';
import {BajasPersonal} from '../bajas-personal/bajas-personal';
import {ActivatedRoute} from '@angular/router';
import {BonificacionesPersonal} from '../bonificaciones-personal/bonificaciones-personal';
import {ResumenCosteHoraPersonal} from '../resumen-coste-hora-personal/resumen-coste-hora-personal';
import {PeriodosContratoPersonal} from '../periodos-contrato-personal/periodos-contrato-personal';
import {EconomicoService} from '../../../services/economico-service';


@Component({
  selector: 'app-personal-economico',
    imports: [
        ListadoPersonal,
        Sidebar,
        RetribucionesPersonal,
        BasesCotizacionPersonal,
        BonificacionesPersonal,
        BajasPersonal,
        ResumenCosteHoraPersonal,
        PeriodosContratoPersonal,
    ],
  templateUrl: './personal-economico.html',
  styleUrl: './personal-economico.css'
})
export class PersonalEconomico implements OnInit {
    private route: ActivatedRoute = inject(ActivatedRoute);
    private economicoService: EconomicoService = inject(EconomicoService);
    public activeTab: WritableSignal<string> = signal<string>('personal');

    public economicoId: number;
    public anualidad: WritableSignal<number> = signal<number>(new Date().getFullYear());

    public tabs = [
        { id: 'personal', label: 'Personal', icon: 'fas fa-user' },
        { id: 'periodos', label: 'Períodos contrato', icon: 'fas fa-file-contract' },
        { id: 'retribuciones', label: 'Retribuciones', icon: 'fas fa-sack-dollar' },
        { id: 'rnts', label: 'RNTs', icon: 'fas fa-file-invoice' },
        { id: 'bajas', label: 'Bajas', icon: 'fas fa-user-injured' },
        { id: 'bonificaciones', label: 'Bonificaciones', icon: 'fas fa-percent' },
        { id: 'resumen', label: 'Resumen', icon: 'fas fa-chart-pie' },
    ] as const;

    public constructor() {
        this.economicoId = +this.route.snapshot.paramMap.get('id')!;
    }

    public ngOnInit(): void {
        this.economicoService.getEconomicoById(this.economicoId).subscribe({
            next: (economico) => {
                this.anualidad.set(economico.anualidad);
            },
            error: (error) => {
                console.error('Error fetching economico details:', error);
            }
        });
    }

    public setActiveTab(tabId: string): void {
        this.activeTab.set(tabId);
    }

   public getTabButtonClass(tabId: string): string {
        const baseClasses = 'flex items-center space-x-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200';
        const activeClasses = 'bg-white text-blue-600 shadow-sm';
        const inactiveClasses = 'text-gray-600 hover:text-gray-900 hover:bg-gray-200';

        return `${baseClasses} ${this.activeTab() === tabId ? activeClasses : inactiveClasses}`;
    }


}
