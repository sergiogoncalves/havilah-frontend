import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { AtendimentoService } from '../atendimento.service';
import { Atendimento } from '../../../models/atendimento';
import { Paciente } from '../../../models/paciente';
import { PacienteService } from '../../pacientes/paciente.service';
import { PrimeNGConfig } from 'primeng/api';
import { AlertService } from '../../../alert.service';
import { primengPtBr } from '../../../core/locale/primeng-ptbr';
import { ConfirmationService } from 'primeng/api';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-atendimento-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormComponent implements OnInit, OnDestroy, AfterViewInit {
  atendimento: Atendimento | null = null;

  loading = false;
  saving = false;
  error: string | null = null;

  pacientes: Paciente[] = [];
  pacientesLoaded = false;
  attendedAtLocal: Date | null = null;
  retornarContatoLocal: Date | null = null; // novo campo LocalDate controlado pelo calendário de data

  private destroy$ = new Subject<void>();

  /** Não depende de atendimento.id (porque pode vir 0); depende da rota */
  isEditMode = false;

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ header: 1 }, { header: 2 }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ align: [] }],
      ['link'],
      ['clean']
    ]
  };

  // Modal state for PDF preview (HTML legacy)
  showDialog = false;
  modalTitle: string = 'Documento';
  modalHtml: SafeHtml | null = null;
  @ViewChild('modalDocContainer') modalDocContainer?: ElementRef<HTMLDivElement>;

  // Modal state for backend PDF preview
  showPdfPreviewDialog = false;
  pdfPreviewTitle = 'PDF';
  pdfObjectUrl: string | null = null;
  pdfSafeUrl: SafeResourceUrl | null = null;
  pdfFileName = 'documento.pdf';

  // Wizard/steps
  steps: MenuItem[] = [
    { label: 'Subjetivo' },
    { label: 'Objetivo' },
    { label: 'Anotações de enfermagem' },
    { label: 'Plano' },
    { label: 'Orçamento' },
    { label: 'Receita' }
  ];
  activeStepIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private service: AtendimentoService,
    private pacienteService: PacienteService,
    private cdr: ChangeDetectorRef,
    private primengConfig: PrimeNGConfig,
    private alerts: AlertService,
    private confirmationService: ConfirmationService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    // Apply global pt-BR translation for PrimeNG components
    this.primengConfig.setTranslation(primengPtBr);

    // Steps click handler
    this.steps = this.steps.map((s, idx) => ({
      ...s,
      command: () => this.goToStep(idx)
    }));

    this.loadPacientes();

    const idParam = this.route.snapshot.paramMap.get('id');
    const routePath = this.route.snapshot.routeConfig ? this.route.snapshot.routeConfig.path : null;
    const urlSegments = this.route.snapshot.url ? this.route.snapshot.url.map(s => s.path) : [];

    const isNovo = idParam === 'novo' || routePath === 'novo' || urlSegments.includes('novo');

    if (isNovo) {
      this.isEditMode = false;
      this.initNewAtendimento();
      return;
    }

    if (idParam) {
      const id = Number(idParam);
      if (!isNaN(id)) {
        this.isEditMode = true;
        this.loadById(id);
      } else {
        this.isEditMode = false;
        this.initNewAtendimento();
      }
    } else {
      this.isEditMode = false;
      this.initNewAtendimento();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanupPdfObjectUrl();
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  private initNewAtendimento() {
    this.atendimento = {
      id: 0,
      patientId: 0,
      attendedAt: new Date().toISOString(),
      descricaoSubjetiva: null,
      objetivoPaciente: null,
      planoTerapeutico: null,
      anotacoesMedicas: null,
      // anotacoesEnfermagem removido: backend/model usam anotacoesMedicas
      terapiaRealizada: null,
      orcamento: null,
      receita: null,
      retornarContato: null,
      patient: null
    } as Atendimento;

    // Bind Date to calendar
    this.attendedAtLocal = this.isoToDate(this.atendimento?.attendedAt);
    this.retornarContatoLocal = this.localDateToDate(this.atendimento?.retornarContato);
    this.error = null;
    this.cdr.markForCheck();
  }

  loadPacientes() {
    this.pacienteService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.pacientes = Array.isArray(items) ? items : [];
          this.pacientesLoaded = true;
          this.cdr.markForCheck();
        },
        error: () => {
          this.error = 'Falha ao carregar pacientes.';
          this.pacientesLoaded = true;
          this.cdr.markForCheck();
        }
      });
  }

  loadById(id: number) {
    this.loading = true;
    this.isEditMode = true;
    this.cdr.markForCheck();

    this.service.getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (at) => {
          // Segurança: se vier null/undefined, cair pra novo
          if (!at) {
            this.loading = false;
            this.isEditMode = false;
            this.initNewAtendimento();
            return;
          }

          // Garanta patientId coerente para o dropdown
          at.patientId = (at.patientId ?? 0) as number;

          this.atendimento = at;
          this.attendedAtLocal = this.isoToDate(at.attendedAt);
          this.retornarContatoLocal = this.localDateToDate(at.retornarContato ?? null);
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.error = 'Falha ao carregar atendimento.';
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  // Convert ISO string to Date for calendar
  isoToDate(iso?: string | null): Date | null {
    if (!iso) return null;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  }

  // Convert Date back to ISO string
  dateToIso(date?: Date | null): string | null {
    if (!date) return null;
    return date.toISOString();
  }

  // Helpers para LocalDate (yyyy-MM-dd)
  localDateToDate(local?: string | null): Date | null {
    if (!local) return null;
    const [y, m, d] = local.split('-').map(n => Number(n));
    if (!y || !m || !d) return null;
    const dt = new Date(y, m - 1, d);
    return isNaN(dt.getTime()) ? null : dt;
  }

  dateToLocalDate(date?: Date | null): string | null {
    if (!date) return null;
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  isPatientInvalid(): boolean {
    const pid = this.atendimento?.patientId ?? 0;
    return !pid || pid <= 0;
  }

  newRecord(form?: NgForm) {
    // Se estiver editando, confirma antes de criar novo
    if (this.isEditMode) {
      this.confirmationService.confirm({
        message: 'Deseja realmente fazer um novo atendimento? Você está editando um no momento.',
        header: 'Confirmar novo atendimento',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sim',
        rejectLabel: 'Não',
        accept: () => {
          this.executeNewRecord(form);
        }
      });
      return;
    }

    this.executeNewRecord(form);
  }

  private executeNewRecord(form?: NgForm) {
    this.isEditMode = false;
    this.saving = false;
    this.error = null;

    this.initNewAtendimento();

    if (form) {
      form.resetForm({
        patientId: this.atendimento?.patientId ?? 0,
        attendedAtLocal: this.attendedAtLocal,
        retornarContatoLocal: this.retornarContatoLocal,
        descricaoSubjetiva: this.atendimento?.descricaoSubjetiva,
        objetivoPaciente: this.atendimento?.objetivoPaciente,
        planoTerapeutico: this.atendimento?.planoTerapeutico,
        anotacoesMedicas: this.atendimento?.anotacoesMedicas,
        terapiaRealizada: this.atendimento?.terapiaRealizada,
        orcamento: this.atendimento?.orcamento,
        receita: this.atendimento?.receita ?? null
      });
    }
  }

  back(form?: NgForm) {
    if (this.isEditMode) {
      this.confirmationService.confirm({
        message: 'Deseja realmente voltar? Você está editando um atendimento no momento.',
        header: 'Confirmar voltar',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sim',
        rejectLabel: 'Não',
        accept: () => {
          this.router.navigate(['/atendimentos']);
        }
      });
      return;
    }

    const isDirty = form ? form.dirty : true;
    if (isDirty) {
      this.confirmationService.confirm({
        message: 'Você está digitando um novo atendimento. Deseja realmente voltar?',
        header: 'Confirmar voltar',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sim',
        rejectLabel: 'Não',
        accept: () => {
          this.router.navigate(['/atendimentos']);
        }
      });
      return;
    }

    this.router.navigate(['/atendimentos']);
  }

  onDropdownShow() {
    // Callback quando dropdown abre
  }

  onDropdownHide() {
    // Callback quando dropdown fecha
  }

  /** Salva e permanece no formulário (rascunho) */
  saveDraft(form?: NgForm) {
    return this.persist(form, { navigateAfterSave: false });
  }

  /** Salva e volta para a listagem */
  saveFinal(form?: NgForm) {
    return this.persist(form, { navigateAfterSave: true });
  }

  private persist(form: NgForm | undefined, opts: { navigateAfterSave: boolean }) {
    if (!this.atendimento) return;

    this.saving = true;
    this.error = null;

    if (form && form.invalid) {
      this.error = 'Por favor, preencha os campos obrigatórios.';
      this.saving = false;
      return;
    }

    if (this.isPatientInvalid()) {
      this.error = 'Paciente é obrigatório.';
      this.saving = false;
      return;
    }

    const iso = this.dateToIso(this.attendedAtLocal);
    const retornarContatoLocalDate = this.dateToLocalDate(this.retornarContatoLocal);

    const payload: Partial<Atendimento> = {
      id: this.atendimento.id,
      patientId: this.atendimento.patientId,
      attendedAt: iso ?? this.atendimento.attendedAt,
      descricaoSubjetiva: this.atendimento.descricaoSubjetiva,
      objetivoPaciente: this.atendimento.objetivoPaciente,
      planoTerapeutico: this.atendimento.planoTerapeutico,
      anotacoesMedicas: this.atendimento.anotacoesMedicas,
      terapiaRealizada: this.atendimento.terapiaRealizada,
      orcamento: this.atendimento.orcamento,
      receita: this.atendimento.receita,
      retornarContato: retornarContatoLocalDate ?? this.atendimento.retornarContato ?? null
    };

    const obs = (this.isEditMode && this.atendimento.id !== 0)
      ? this.service.update(payload)
      : this.service.create(payload);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (saved: any) => {
        this.saving = false;

        // Se for create, é comum o backend devolver o registro com id.
        // Mantemos o usuário na tela com o id atualizado para próximos saves.
        if (!this.isEditMode && saved && typeof saved === 'object' && 'id' in saved) {
          const newId = Number((saved as any).id);
          if (!isNaN(newId) && newId > 0) {
            this.isEditMode = true;
            this.atendimento = { ...(this.atendimento as Atendimento), ...(saved as Atendimento) };
          }
        }

        this.alerts.success(opts.navigateAfterSave ? 'Atendimento salvo com sucesso' : 'Rascunho salvo');

        // Se permaneceu na tela, marca o form como "sem alterações"
        if (!opts.navigateAfterSave && form) {
          form.form.markAsPristine();
        }

        if (opts.navigateAfterSave) {
          this.router.navigate(['/atendimentos']);
        } else {
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.error = 'Falha ao salvar atendimento.';
        this.saving = false;
        this.alerts.error('Falha ao salvar atendimento');
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Fluxo novo: salva (se necessário) e abre o PDF vindo do backend em um modal fullscreen.
   */
  abrirPdfBackend(tipo: 'RECEITA' | 'ORCAMENTO' | 'PLANO_TERAPEUTICO', titulo: string, form?: NgForm) {
    if (!this.atendimento) return;

    if (this.isPatientInvalid()) {
      this.error = 'Paciente é obrigatório.';
      this.alerts.error('Paciente é obrigatório');
      this.cdr.markForCheck();
      return;
    }

    const needsSave = !this.isEditMode || this.atendimento.id === 0 || !!(form && form.dirty);

    const openPdf = (attendanceId: number) => {
      this.pdfPreviewTitle = titulo;
      this.pdfFileName = `${tipo.toLowerCase()}-${attendanceId}.pdf`;

      this.service.getReceitaPdf(attendanceId, tipo)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.cdr.markForCheck())
        )
        .subscribe({
          next: (blob) => {
            this.setPdfObjectUrl(blob);
            this.showPdfPreviewDialog = true;
            this.cdr.markForCheck();
          },
          error: () => {
            this.alerts.error('Falha ao gerar PDF');
            this.cdr.markForCheck();
          }
        });
    };

    if (!needsSave) {
      openPdf(this.atendimento.id);
      return;
    }

    // Salva primeiro e só então abre o PDF.
    this.saving = true;
    this.error = null;

    const iso = this.dateToIso(this.attendedAtLocal);
    const retornarContatoLocalDate = this.dateToLocalDate(this.retornarContatoLocal);

    const payload: Partial<Atendimento> = {
      id: this.atendimento.id,
      patientId: this.atendimento.patientId,
      attendedAt: iso ?? this.atendimento.attendedAt,
      descricaoSubjetiva: this.atendimento.descricaoSubjetiva,
      objetivoPaciente: this.atendimento.objetivoPaciente,
      planoTerapeutico: this.atendimento.planoTerapeutico,
      anotacoesMedicas: this.atendimento.anotacoesMedicas,
      terapiaRealizada: this.atendimento.terapiaRealizada,
      orcamento: this.atendimento.orcamento,
      receita: this.atendimento.receita,
      retornarContato: retornarContatoLocalDate ?? this.atendimento.retornarContato ?? null
    };

    const save$ = (this.isEditMode && this.atendimento.id !== 0)
      ? this.service.update(payload)
      : this.service.create(payload);

    save$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (saved: any) => {
        this.saving = false;

        // Atualiza estado local/id
        if (saved && typeof saved === 'object' && 'id' in saved) {
          const newId = Number((saved as any).id);
          if (!isNaN(newId) && newId > 0) {
            this.isEditMode = true;
            this.atendimento = { ...(this.atendimento as Atendimento), ...(saved as Atendimento) };

            // Se estávamos em /atendimentos/novo, só atualiza a URL (sem navegar/recriar componente),
            // para não interromper a abertura do PDF.
            const currentUrl = this.router.url;
            if (currentUrl.includes('/atendimentos/novo')) {
              this.location.replaceState(`/atendimentos/${newId}`);
            }

            if (form) {
              form.form.markAsPristine();
            }

            this.alerts.success('Atendimento salvo');
            openPdf(newId);
            return;
          }
        }

        this.alerts.error('Não foi possível obter o ID do atendimento salvo.');
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Falha ao salvar atendimento.';
        this.saving = false;
        this.alerts.error('Falha ao salvar atendimento');
        this.cdr.markForCheck();
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
    this.cdr.markForCheck();
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

  // Helper to open the Documento viewer in a modal for a given field
  abrirDocumentoComCampo(campo: 'planoTerapeutico' | 'orcamento' | 'receita', titulo?: string) {
    if (!this.atendimento) return;
    const title = titulo || {
      planoTerapeutico: 'Plano terapêutico',
      orcamento: 'Orçamento',
      receita: 'Receita'
    }[campo];

    const html = (this.atendimento as any)[campo] as string | null | undefined;
    const safeHtmlStr = html && html.trim().length ? html : `<p>Sem conteúdo em ${title?.toLowerCase()}.</p>`;

    // Use sanitizer to trust backend/editor-provided HTML
    this.modalTitle = title || 'Documento';
    this.modalHtml = this.sanitizer.bypassSecurityTrustHtml(safeHtmlStr);
    this.showDialog = true;
  }

  async gerarPdfDoModal(): Promise<void> {
    const element = this.modalDocContainer?.nativeElement;
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    } else {
      let heightLeft = imgHeight;
      let y = 0;
      while (heightLeft > 0) {
        pdf.addImage(imgData, 'PNG', 0, y, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        if (heightLeft > 0) {
          pdf.addPage();
          y = -(imgHeight - heightLeft);
        }
      }
    }

    pdf.save((this.modalTitle || 'documento') + '.pdf');
  }

  goToStep(index: number) {
    const next = Math.max(0, Math.min(index, this.steps.length - 1));
    this.activeStepIndex = next;
    this.cdr.markForCheck();
  }

  prevStep() {
    this.goToStep(this.activeStepIndex - 1);
  }

  nextStep() {
    this.goToStep(this.activeStepIndex + 1);
  }

  isFirstStep(): boolean {
    return this.activeStepIndex <= 0;
  }

  isLastStep(): boolean {
    return this.activeStepIndex >= this.steps.length - 1;
  }
}
