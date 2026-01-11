import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private router: Router) {}

  title = 'havilah-frontend';

  // Centralized menu configuration - add/remove items here
  menuItems = [
    { label: 'Pacientes', route: '/pacientes' },
    { label: 'Atendimentos', route: '/atendimentos' },
    {
      label: 'Opção',
      external: true,
      submenu: [
        {label: 'Descrição subjetiva', key: 'descricao_subjetiva'},
        {label: 'Objetivo do paciente', key: 'objetivo_paciente'},
        {label: 'Plano terapêutico', key: 'plano_terapeutico'},
        {label: 'Anotações de enfermagem', key: 'anotacoes_medicas'},
        {label: 'Terapia realizada', key: 'terapia_realizada'},
        {label: 'Orçamento', key: 'orcamento'}
      ]
    }
  ];


  // mobile menu state
  menuOpen = false;
  // mobile submenu state for 'Opção'
  submenuOpen = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
    this.submenuOpen = false;
  }

  // handle click on submenu items -> navigate to page with key
  onSubmenuSelect(key: string) {
    this.router.navigate(['/opcao', key]);
    this.closeMenu();
  }
}
