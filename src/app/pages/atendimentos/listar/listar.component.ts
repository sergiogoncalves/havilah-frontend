import { Component, OnInit } from '@angular/core';
import { Atendimento } from '../../../models/atendimento';
import { AtendimentoService } from '../atendimento.service';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PacienteService } from '../../pacientes/paciente.service';
import { Paciente } from '../../../models/paciente';

@Component({
  selector: 'app-listar-atendimentos',
  templateUrl: './listar.component.html',
  styleUrls: ['./listar.component.scss']
})
export class ListarComponent implements OnInit {
  atendimentos: Atendimento[] = [];
  loading = false;
  error: string | null = null;

  // Patients for the combo and filter state
  pacientes: Paciente[] = [];
  selectedPatientId: number | null = null;
  patientNameFilter: string = '';

  constructor(
    private service: AtendimentoService,
    private pacienteService: PacienteService,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    // Load patients for combo immediately
    this.loadPacientes();

    // Read query params to pre-fill filter if provided
    this.route.queryParamMap.subscribe(params => {
      const patientIdParam = params.get('patientId');
      const patientNameParam = params.get('patientName');

      this.selectedPatientId = patientIdParam ? Number(patientIdParam) : null;
      this.patientNameFilter = patientNameParam ?? '';

      // Load atendimentos with the filters from the URL
      this.load();
    });
  }

  loadPacientes() {
    this.pacienteService.getAll().subscribe({
      next: (items) => {
        this.pacientes = items;
        // If a patientId is already selected (e.g., via URL) but patientNameFilter is empty,
        // try to populate the patientNameFilter from the loaded pacientes so the UI shows the name
        if (this.selectedPatientId != null && (!this.patientNameFilter || this.patientNameFilter.trim().length === 0)) {
          const found = this.pacientes.find(p => p.id === this.selectedPatientId);
          if (found) {
            this.patientNameFilter = found.fullName;
          }
        }
      },
      error: (err) => console.error('Failed to load pacientes', err)
    });
  }

  load() {
    this.loading = true;
    this.error = null;

    const filters: { patientId?: number; patientName?: string } = {};
    if (this.selectedPatientId != null) filters.patientId = this.selectedPatientId;
    if (this.patientNameFilter && this.patientNameFilter.trim().length > 0) filters.patientName = this.patientNameFilter.trim();

    // If no filters were set, call without filters
    const obs = Object.keys(filters).length ? this.service.getAll(filters) : this.service.getAll();

    obs.subscribe({
      next: (data) => {
        this.atendimentos = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load atendimentos', err);
        this.error = 'Falha ao carregar atendimentos.';
        this.loading = false;
      }
    });
  }

  applyFilter() {
    // Update URL query params to enable shareable links
    const queryParams: any = {};
    if (this.selectedPatientId != null) {
      queryParams.patientId = this.selectedPatientId;
      // also include patientName derived from selectedPaciente so backend can filter by name if desired
      const found = this.pacientes.find(p => p.id === this.selectedPatientId);
      if (found) queryParams.patientName = found.fullName;
    }
    // prefer explicit typed-in name if present
    if (this.patientNameFilter && this.patientNameFilter.trim().length > 0) {
      queryParams.patientName = this.patientNameFilter.trim();
    }

    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
    // load() will be triggered by route.queryParamMap subscription
  }

  onPatientFilterChange() {
    // Se selectedPatientId for null, significa que o dropdown foi limpo
    if (this.selectedPatientId === null || this.selectedPatientId === undefined) {
      this.clearFilter();
    } else {
      this.applyFilter();
    }
  }

  clearFilter() {
    this.selectedPatientId = null;
    this.patientNameFilter = '';
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
    // load() will be triggered by route.queryParamMap subscription
  }

  navigateToNovo() {
    this.router.navigate(['/atendimentos/novo']);
  }

  view(a: Atendimento) {
    this.router.navigate(['/atendimentos', a.id]);
  }

  sanitizedContent(a: Atendimento): SafeHtml | null {
    if (!a || !a.contentHtml) return null;
    return this.sanitizer.bypassSecurityTrustHtml(a.contentHtml);
  }
}
