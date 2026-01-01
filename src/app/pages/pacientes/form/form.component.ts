import { Component, OnInit } from '@angular/core';
import { Paciente } from '../../../models/paciente';
import { PacienteService } from '../paciente.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit {
  paciente: Paciente = { id: 0, fullName: '', birthDate: '' } as Paciente;
  saving = false;
  loading = false;
  error: string | null = null;
  isEdit = false;

  constructor(private service: PacienteService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.isEdit = !!id;
    if (id) {
      this.load(id);
    }
  }

  load(id: number) {
    this.loading = true;
    this.service.getById(id).subscribe({ next: (p) => { this.paciente = p; this.loading = false; }, error: (err) => { this.error = 'Falha ao carregar paciente.'; this.loading = false; } });
  }

  save() {
    this.saving = true;
    const action = this.paciente.id ? this.service.update(this.paciente) : this.service.create(this.paciente);
    action.subscribe({
      next: () => this.router.navigate(['/pacientes']),
      error: () => this.saving = false
    });
  }

  cancel() {
    this.router.navigate(['/pacientes']);
  }
}
