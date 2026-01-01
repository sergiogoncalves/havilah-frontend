import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Paciente } from '../models/paciente';
import { PacienteService } from '../paciente.service';

@Component({
  selector: 'app-paciente-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit {
  paciente: Paciente = { id: 0, fullName: '', birthDate: '' };
  loading = false;
  error: string | null = null;
  isEdit = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pacienteService: PacienteService
  ) { }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      const id = Number(idParam);
      this.loadPaciente(id);
    }
  }

  private loadPaciente(id: number) {
    this.loading = true;
    this.pacienteService.getById(id).subscribe({
      next: (p) => {
        // ensure birthDate is a string 'YYYY-MM-DD' for input[type=date]
        let bd = p.birthDate;
        if (bd instanceof Date) {
          this.paciente = { ...p, birthDate: bd.toISOString().slice(0,10) };
        } else {
          this.paciente = p;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar paciente', err);
        this.error = 'Erro ao carregar paciente';
        this.loading = false;
      }
    });
  }

  save() {
    this.error = null;

    // prepare payload: birthDate should be YYYY-MM-DD string (LocalDate)
    const payload: any = {
      fullName: this.paciente.fullName,
      birthDate: typeof this.paciente.birthDate === 'string' ? this.paciente.birthDate : (this.paciente.birthDate ? (this.paciente.birthDate as Date).toISOString().slice(0,10) : '')
    };

    this.loading = true;

    if (this.isEdit && this.paciente.id) {
      this.pacienteService.update({ ...this.paciente, ...payload }).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/pacientes']);
        },
        error: (err) => {
          console.error('Erro ao atualizar paciente', err);
          this.error = 'Erro ao atualizar paciente';
          this.loading = false;
        }
      });
    } else {
      this.pacienteService.create(payload).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/pacientes']);
        },
        error: (err) => {
          console.error('Erro ao criar paciente', err);
          this.error = 'Erro ao criar paciente';
          this.loading = false;
        }
      });
    }
  }

  cancel() {
    this.router.navigate(['/pacientes']);
  }
}

