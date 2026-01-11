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
    {
      label: 'Opção',
      external: true,
      submenu: [
        { label: 'Descrição subjetiva', key: 'descricaoSubjetiva' },
        { label: 'Objetivo do paciente', key: 'objetivoPaciente' },
        { label: 'Plano terapêutico', key: 'planoTerapeutico' },
        { label: 'Anotações de enfermagem', key: 'anotacoesEnfermagem' },
        { label: 'Terapia realizada', key: 'terapiaRealizada' },
        { label: 'Orçamento', key: 'orcamento' }
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

  // handle click on submenu items (placeholder handler)
  onSubmenuSelect(key: string) {
    // TODO: wire to actual routes or actions as needed
    console.log('Selecionado:', key);
    this.closeMenu();
  }
}
