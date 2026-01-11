import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AtendimentoService } from '../atendimento.service';
import { Atendimento } from '../../../models/atendimento';
import { Paciente } from '../../../models/paciente';
import { PacienteService } from '../../pacientes/paciente.service';
import { PrimeNGConfig } from 'primeng/api';
import { AlertService } from '../../../alert.service';
import { primengPtBr } from '../../../core/locale/primeng-ptbr';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: AtendimentoService,
    private pacienteService: PacienteService,
    private cdr: ChangeDetectorRef,
    private primengConfig: PrimeNGConfig,
    private alerts: AlertService
  ) {}

  ngOnInit(): void {
    // Apply global pt-BR translation for PrimeNG components
    this.primengConfig.setTranslation(primengPtBr);

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
      terapiaRealizada: null,
      orcamento: null,
      receita: null,
      patient: null
    } as Atendimento;

    // Bind Date to calendar
    this.attendedAtLocal = this.isoToDate(this.atendimento?.attendedAt);
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

  isPatientInvalid(): boolean {
    const pid = this.atendimento?.patientId ?? 0;
    return !pid || pid <= 0;
  }

  newRecord(form?: NgForm) {
    // Se estiver editando, confirma antes de criar novo
    if (this.isEditMode) {
      const confirmed = window.confirm('Deseja realmente fazer um novo atendimento? Você está editando um no momento.');
      if (!confirmed) return;
    }

    this.isEditMode = false;
    this.saving = false;
    this.error = null;

    this.initNewAtendimento();

    if (form) {
      // reseta estado do ngForm (touched/dirty) e valores
      form.resetForm({
        patientId: this.atendimento?.patientId ?? 0,
        attendedAtLocal: this.attendedAtLocal,
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
    // Confirmação dependendo do contexto
    if (this.isEditMode) {
      const confirmed = window.confirm('Deseja realmente voltar? Você está editando um atendimento no momento.');
      if (!confirmed) return;
      this.router.navigate(['/atendimentos']);
      return;
    }

    // Se for novo registro e houver alterações, confirma
    const isDirty = form ? form.dirty : true; // se não tiver form, por segurança, pergunta
    if (isDirty) {
      const confirmed = window.confirm('Você está digitando um novo atendimento. Deseja realmente voltar?');
      if (!confirmed) return;
    }

    this.router.navigate(['/atendimentos']);
  }

  onDropdownShow() {
    // Callback quando dropdown abre
  }

  onDropdownHide() {
    // Callback quando dropdown fecha
  }

  save(form?: NgForm) {
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

    // Convert selected Date to ISO
    const iso = this.dateToIso(this.attendedAtLocal);

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
      receita: this.atendimento.receita
    };

    const obs = (this.isEditMode && this.atendimento.id !== 0)
      ? this.service.update(payload)
      : this.service.create(payload);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.saving = false;
        this.alerts.success('Atendimento salvo com sucesso');
        this.router.navigate(['/atendimentos']);
      },
      error: () => {
        this.error = 'Falha ao salvar atendimento.';
        this.saving = false;
        this.alerts.error('Falha ao salvar atendimento');
      }
    });
  }
}
