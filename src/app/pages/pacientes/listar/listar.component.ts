import { Component, OnInit } from '@angular/core';
import { Paciente } from '../../../models/paciente';
import { PacienteService } from '../paciente.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-listar',
  templateUrl: './listar.component.html',
  styleUrls: ['./listar.component.scss']
})
export class ListarComponent implements OnInit {
  pacientes: Paciente[] = [];
  loading = false;
  error: string | null = null;

  constructor(private pacienteService: PacienteService, private router: Router) { }

  ngOnInit(): void {
    this.loadPacientes();
  }

  loadPacientes() {
    this.loading = true;
    this.error = null;
    this.pacienteService.getAll().subscribe({
      next: (data) => {
        this.pacientes = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load pacientes', err);
        this.error = 'Falha ao carregar pacientes.';
        this.loading = false;
      }
    });
  }

  navigateToNovo() {
    this.router.navigate(['/pacientes/novo']);
  }

  edit(p: Paciente) {
    this.router.navigate(['/pacientes', p.id]);
  }

  // Navega para a lista de atendimentos já filtrada pelo paciente
  goToAtendimentos(p: Paciente) {
    // Passa paciente por query params para que a página de atendimentos
    // preencha o filtro e selecione o paciente no select.
    const queryParams: any = { patientId: p.id };
    if (p.fullName) queryParams.patientName = p.fullName;
    this.router.navigate(['/atendimentos'], { queryParams });
  }

  formatCpf(cpf?: string | null): string {
    if (!cpf) return '';
    const digits = String(cpf).replace(/\D/g, '').padEnd(11, '');
    if (digits.length < 11) return cpf; // fallback if not full
    return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9,11)}`;
  }
}
