import { Component, OnInit } from '@angular/core';
import { Paciente, PatientContact, ContactType } from '../../../models/paciente';
import { PacienteService } from '../paciente.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from '../../../alert.service';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit {
  paciente: Paciente = { id: 0, fullName: '', birthDate: null as any, cpf: '', contacts: [] } as Paciente;
  saving = false;
  loading = false;
  error: string | null = null;
  isEdit = false;

  contactTypes: { label: string; value: ContactType }[] = [
    { label: 'Telefone', value: 'PHONE' },
    { label: 'Celular', value: 'MOBILE' },
    { label: 'E-mail', value: 'EMAIL' }
  ];

  constructor(private service: PacienteService, private route: ActivatedRoute, private router: Router, private alerts: AlertService) { }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.isEdit = !!id;
    if (id) {
      this.load(id);
    } else {
      // ensure at least one empty contact row for new patient
      if (!this.paciente.contacts || this.paciente.contacts.length === 0) {
        this.paciente.contacts = [this.blankContact(true)];
      }
    }
  }

  blankContact(primary = false): PatientContact {
    return { type: 'MOBILE', value: '', primary };
  }

  addContact() {
    this.paciente.contacts.push(this.blankContact(false));
  }

  removeContact(index: number) {
    this.paciente.contacts.splice(index, 1);
    // keep at least one row
    if (this.paciente.contacts.length === 0) this.paciente.contacts.push(this.blankContact(true));
    this.ensureSinglePrimary();
  }

  setPrimary(index: number) {
    this.paciente.contacts = this.paciente.contacts.map((c, i) => ({ ...c, primary: i === index }));
  }

  ensureSinglePrimary() {
    const firstIdx = this.paciente.contacts.findIndex(c => c.primary);
    if (firstIdx === -1 && this.paciente.contacts.length > 0) {
      this.paciente.contacts[0].primary = true;
    } else if (firstIdx !== -1) {
      this.paciente.contacts = this.paciente.contacts.map((c, i) => ({ ...c, primary: i === firstIdx }));
    }
  }

  load(id: number) {
    this.loading = true;
    this.service.getById(id).subscribe({
      next: (p) => {
        this.paciente = { ...p, contacts: Array.isArray(p.contacts) && p.contacts.length ? p.contacts : [this.blankContact(true)] };
        this.loading = false;
      },
      error: () => { this.error = 'Falha ao carregar paciente.'; this.loading = false; }
    });
  }

  save() {
    this.saving = true;
    // trim cpf and limit to 11
    if (this.paciente.cpf) this.paciente.cpf = this.paciente.cpf.replace(/\D/g, '').slice(0, 11);
    // clean empty contacts
    this.paciente.contacts = this.paciente.contacts.filter(c => (c.value || '').trim().length > 0);
    this.ensureSinglePrimary();

    const action = this.paciente.id ? this.service.update(this.paciente) : this.service.create(this.paciente);
    action.subscribe({
      next: () => { this.alerts.success('Paciente salvo com sucesso'); this.router.navigate(['/pacientes']); },
      error: () => { this.saving = false; this.alerts.error('Falha ao salvar paciente'); }
    });
  }

  cancel() {
    this.router.navigate(['/pacientes']);
  }

  newRecord() {
    this.paciente = { id: 0, fullName: '', birthDate: null as any, cpf: '', contacts: [this.blankContact(true)] } as Paciente;
    this.isEdit = false;
    this.error = null;
  }
}
