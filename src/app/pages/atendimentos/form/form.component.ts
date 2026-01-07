import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { AtendimentoService } from '../atendimento.service';
import { Atendimento } from '../../../models/atendimento';
import { Paciente } from '../../../models/paciente';
import { PacienteService } from '../../pacientes/paciente.service';

@Component({
  selector: 'app-atendimento-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit {
  atendimento: Atendimento | null = null;
  loading = false;
  saving = false;
  error: string | null = null;

  pacientes: Paciente[] = [];
  attendedAtLocal: string | null = null; // for datetime-local binding

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ header: 1 }, { header: 2 }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ align: [] }],
     // ['link', 'image'],
      ['link'],
      ['clean']
    ]
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: AtendimentoService,
    private pacienteService: PacienteService
  ) { }

  ngOnInit(): void {
    this.loadPacientes();

    // ParamMap won't contain 'id' for the explicit 'novo' path (it's not a param),
    // so check the route config path as well as URL segments.
    const idParam = this.route.snapshot.paramMap.get('id');
    const routePath = this.route.snapshot.routeConfig ? this.route.snapshot.routeConfig.path : null;
    const urlSegments = this.route.snapshot.url ? this.route.snapshot.url.map(s => s.path) : [];

    const isNovo = idParam === 'novo' || routePath === 'novo' || urlSegments.includes('novo');

    if (isNovo) {
      // Create empty atendimento object for new
      this.atendimento = {
        id: 0,
        patientId: 0,
        attendedAt: new Date().toISOString(),
        contentHtml: null,
        patient: null
      };
      this.attendedAtLocal = this.isoToLocal(this.atendimento.attendedAt);
    } else if (idParam) {
      const id = Number(idParam);
      if (!isNaN(id)) {
        this.loadById(id);
      }
    }
  }

  loadPacientes() {
    this.pacienteService.getAll().subscribe({
      next: (items) => this.pacientes = items,
      error: (err) => console.error('Failed to load pacientes', err)
    });
  }

  loadById(id: number) {
    this.loading = true;
    this.service.getById(id).subscribe({
      next: (at) => {
        // Ensure patientId is present (default to 0 so form validation kicks in)
        at.patientId = (at.patientId ?? 0) as number;
        this.atendimento = at;
        this.attendedAtLocal = this.isoToLocal(at.attendedAt);
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Falha ao carregar atendimento.';
        this.loading = false;
      }
    });
  }

  isoToLocal(iso?: string | null): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    // format to yyyy-MM-ddTHH:mm for datetime-local
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const HH = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${yyyy}-${MM}-${dd}T${HH}:${mm}`;
  }

  localToIso(local?: string | null): string | null {
    if (!local) return null;
    // local is like 'yyyy-MM-ddTHH:mm' (browser local time). Create a Date and convert to ISO
    const d = new Date(local);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  back() {
    this.router.navigate(['/atendimentos']);
  }

  save(form?: NgForm) {
    if (!this.atendimento) return;
    this.saving = true;
    this.error = null;

    // If template-driven form was passed, validate it
    if (form && form.invalid) {
      this.error = 'Por favor, preencha os campos obrigatórios.';
      this.saving = false;
      return;
    }

    // Ensure patientId is set and greater than 0
    if (!this.atendimento.patientId || this.atendimento.patientId <= 0) {
      this.error = 'Paciente é obrigatório.';
      this.saving = false;
      return;
    }

    // Ensure attendedAt is converted from local input
    const iso = this.localToIso(this.attendedAtLocal);
    const payload: Partial<Atendimento> = {
      id: this.atendimento.id,
      patientId: this.atendimento.patientId,
      attendedAt: iso ?? this.atendimento.attendedAt,
      contentHtml: this.atendimento.contentHtml ?? null
    };


    console.log('Saving atendimento payload:', payload);
    const obs = (this.atendimento.id === 0) ? this.service.create(payload) : this.service.update(payload);

    obs.subscribe({
      next: () => {
        this.saving = false;
        // navigate to the list or to the saved atendimento view
        this.router.navigate(['/atendimentos']);
      },
      error: (err) => {
        console.error(err);
        this.error = 'Falha ao salvar atendimento.';
        this.saving = false;
      }
    });
  }
}
