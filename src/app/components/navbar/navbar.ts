import {Component, inject} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styles: ``
})
export class Navbar {

    private router: Router = inject(Router);

    irAInicio() {
        this.router.navigate(['']).then(r => {
            console.log('Navigated to home successfully');
        }).catch(error => {
            console.error('Error navigating to home:', error);
        });
    }
}
