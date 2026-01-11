import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { PacienteService } from '../../pages/pacientes/paciente.service';
import { Paciente } from '../../models/paciente';
import { Subscription } from 'rxjs';
import { AtendimentoService } from '../atendimentos/atendimento.service';
import { AttendanceFieldValuesByPatientResponseDto } from '../../models/attendance-field-values';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-opcao-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, DropdownModule, FormsModule],
  templateUrl: './opcao.component.html',
  styleUrls: ['./opcao.component.scss']
})
export class OpcaoPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private pacienteService = inject(PacienteService);
  private atendimentoService = inject(AtendimentoService);
  private sanitizer = inject(DomSanitizer);

  private sub?: Subscription;

  // option key + label shown on header pill
  key = '';
  label = 'Desconhecida';

  // patients dropdown state
  pacientes: Paciente[] = [];
  selectedPacienteId?: number;
  loading = true;
  error: string | null = null;

  // field values state
  values?: AttendanceFieldValuesByPatientResponseDto | null = null;
  valuesLoading = false;
  valuesError: string | null = null;

  private labels: Record<string, string> = {
    descricao_subjetiva: 'Descrição subjetiva',
    objetivo_paciente: 'Objetivo do paciente',
    plano_terapeutico: 'Plano terapêutico',
    anotacoes_medicas: 'Anotações médicas',
    terapia_realizada: 'Terapia realizada',
    orcamento: 'Orçamento',
    receita: 'Receita'
  };

  private toBackendKey(k: string): string {
    // Accept camelCase or snake_case; normalize to snake_case expected by backend
    const map: Record<string, string> = {
      descricaoSubjetiva: 'descricao_subjetiva',
      objetivoPaciente: 'objetivo_paciente',
      planoTerapeutico: 'plano_terapeutico',
      anotacoesMedicas: 'anotacoes_medicas',
      terapiaRealizada: 'terapia_realizada',
      orcamento: 'orcamento',
      receita: 'receita',
      privateNotesHtml: 'receita'
    };
    if (!k) return '';
    if (map[k]) return map[k];
    // if already snake_case, return as is
    return k;
  }

  ngOnInit(): void {
    // react to route param changes
    this.sub = this.route.paramMap.subscribe(pm => {
      this.key = pm.get('key') ?? '';
      const backendKey = this.toBackendKey(this.key);
      this.label = this.labels[backendKey] ?? 'Desconhecida';
      // refetch values when key changes and a patient is selected
      if (this.selectedPacienteId) {
        this.fetchValues();
      }
    });

    // load patients for dropdown
    this.loading = true;
    this.error = null;
    this.pacienteService.getAll().subscribe({
      next: (list) => {
        this.pacientes = list;
        this.loading = false;
      },
      error: () => {
        this.error = 'Falha ao carregar pacientes.';
        this.loading = false;
      }
    });
  }

  onPacienteChange(): void {
    if (!this.selectedPacienteId || !this.key) {
      this.values = null;
      return;
    }
    this.fetchValues();
  }

  private fetchValues(): void {
    const patientId = this.selectedPacienteId as number;
    this.valuesLoading = true;
    this.valuesError = null;
    this.values = null;

    const backendKey = this.toBackendKey(this.key);
    this.atendimentoService.listFieldValuesByPatient(patientId, backendKey).subscribe({
      next: (resp) => {
        this.values = resp;
        this.valuesLoading = false;
      },
      error: () => {
        this.valuesError = 'Falha ao carregar valores.';
        this.valuesLoading = false;
      }
    });
  }

  toHtml(value: string | null | undefined): SafeHtml {
    const v = (value ?? '').trim();
    if (!v) {
      // return simple text wrapped in a paragraph to keep layout consistent
      return this.sanitizer.bypassSecurityTrustHtml(`<p>Nesse dia não houve ${this.label.toLowerCase()}.</p>`);
    }
    // Trust backend-provided HTML. If you prefer strict sanitization, replace with:
    // return this.sanitizer.sanitize(SecurityContext.HTML, v) ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(v);
  }

  isEmpty(value: string | null | undefined): boolean {
    return !(value && value.trim().length);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
