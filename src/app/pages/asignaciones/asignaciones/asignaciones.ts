import {Component, inject, signal, WritableSignal} from '@angular/core';
import {Sidebar} from "../../../components/personal/sidebar/sidebar";
import {AsignarPersonalProyecto} from '../asignar-personal-proyecto/asignar-personal-proyecto';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-asignaciones',
    imports: [
        Sidebar,
        AsignarPersonalProyecto
    ],
  templateUrl: './asignaciones.html',
  styleUrl: './asignaciones.css'
})
export class Asignaciones {
    private route: ActivatedRoute = inject(ActivatedRoute);
    public activeTab: WritableSignal<string> = signal<string>('personal');

    public economicoId: number;

    public tabs = [
        { id: 'personal', label: 'Asignar Personal a Proyecto', icon: 'fas fa-user' },
    ] as const;

    public constructor() {
        this.economicoId = +this.route.snapshot.paramMap.get('id')!;
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
