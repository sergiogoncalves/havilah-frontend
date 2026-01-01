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

}
