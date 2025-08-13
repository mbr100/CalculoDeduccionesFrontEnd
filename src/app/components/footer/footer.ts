import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styles: ``
})
export class Footer {
    public currentYear: number = new Date().getFullYear();

    goToPrivacy(): void {
        // Tu lógica para ir a política de privacidad
    }

    goToTerms(): void {
        // Tu lógica para ir a términos y condiciones
    }

    goToContact(): void {
        // Tu lógica para ir a contacto
    }
}
