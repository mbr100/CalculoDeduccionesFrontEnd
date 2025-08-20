import {Component, inject, Input} from '@angular/core';
import Swal from 'sweetalert2';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
    @Input() idEconomico!: number;

    private router :Router = inject(Router)


    public goToEconomico(): void {
        this.router.navigate(['/economico/ver', this.idEconomico]).then();
    }

    goToPersonal(): void {
        this.router.navigate(['/economico/personal', this.idEconomico]).then();
    }

}
