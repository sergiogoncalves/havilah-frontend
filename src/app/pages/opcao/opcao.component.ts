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
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-opcao-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, DropdownModule, FormsModule, DialogModule],
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

  // Modal state for backend PDF preview
  showPdfPreviewDialog = false;
  pdfPreviewTitle = 'PDF';
  pdfObjectUrl: string | null = null;
  pdfSafeUrl: SafeResourceUrl | null = null;
  pdfFileName = 'documento.pdf';

  /** Apenas estes campos têm endpoint de PDF via enum no backend */
  private enumPdfByBackendKey: Record<string, 'RECEITA' | 'ORCAMENTO' | 'PLANO_TERAPEUTICO'> = {
    plano_terapeutico: 'PLANO_TERAPEUTICO',
    orcamento: 'ORCAMENTO',
    receita: 'RECEITA'
  };

  private labels: Record<string, string> = {
    descricao_subjetiva: 'Descrição subjetiva',
    objetivo_paciente: 'Objetivo do paciente',
    plano_terapeutico: 'Plano terapêutico',
    anotacoes_medicas: 'Anotações de enfermagem',
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

  isEmpty(value: string | null | undefined): boolean {
    return !(value && value.trim().length);
  }

  abrirModalComHtml(html: string, title?: string): void {
    // legacy removed; keep method as no-op to avoid template references (there are none now)
    void html;
    void title;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.cleanupPdfObjectUrl();
  }

  /** true quando o campo atual suporta PDF via enum */
  canShowPdfButton(): boolean {
    const backendKey = this.toBackendKey(this.key);
    return !!this.enumPdfByBackendKey[backendKey];
  }

  private getPdfEnumForCurrentKey(): 'RECEITA' | 'ORCAMENTO' | 'PLANO_TERAPEUTICO' | null {
    const backendKey = this.toBackendKey(this.key);
    return this.enumPdfByBackendKey[backendKey] ?? null;
  }

  abrirPdfBackend(attendanceId: number): void {
    const tipo = this.getPdfEnumForCurrentKey();
    if (!tipo) return;

    this.pdfPreviewTitle = this.label || 'PDF';
    this.pdfFileName = `${tipo.toLowerCase()}-${attendanceId}.pdf`;

    this.atendimentoService.getReceitaPdf(attendanceId, tipo).subscribe({
      next: (blob) => {
        this.setPdfObjectUrl(blob);
        this.showPdfPreviewDialog = true;
      },
      error: () => {
        this.valuesError = 'Falha ao gerar PDF.';
      }
    });
  }

  baixarPdfPreview() {
    if (!this.pdfObjectUrl) return;
    const a = document.createElement('a');
    a.href = this.pdfObjectUrl;
    a.download = this.pdfFileName || 'documento.pdf';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  onHidePdfPreview() {
    this.showPdfPreviewDialog = false;
    this.cleanupPdfObjectUrl();
  }

  private setPdfObjectUrl(blob: Blob) {
    this.cleanupPdfObjectUrl();
    this.pdfObjectUrl = URL.createObjectURL(blob);
    this.pdfSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfObjectUrl);
  }

  private cleanupPdfObjectUrl() {
    if (this.pdfObjectUrl) {
      URL.revokeObjectURL(this.pdfObjectUrl);
      this.pdfObjectUrl = null;
    }
    this.pdfSafeUrl = null;
  }
}
