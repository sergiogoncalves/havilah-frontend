import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'havilah-frontend';

  // Centralized menu configuration - add/remove items here
  menuItems = [
    { label: 'Pacientes', route: '/pacientes' },
    { label: 'Atendimentos', route: '/atendimentos' },
    { label: 'Opção', route: '#', external: true }
  ];

  // mobile menu state
  menuOpen = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }
}
