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

  // Locale config for PrimeNG Calendar in pt-BR
  ptBrLocale = {
    firstDayOfWeek: 0,
    dayNames: ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'],
    dayNamesShort: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
    dayNamesMin: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
    monthNames: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
    monthNamesShort: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
    today: 'Hoje',
    clear: 'Limpar',
    dateFormat: 'dd/mm/yy'
  };

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
    private primengConfig: PrimeNGConfig
  ) {}

  ngOnInit(): void {
    // Apply global pt-BR translation for PrimeNG components
    this.primengConfig.setTranslation(this.ptBrLocale);

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
      patient: null
    };

    // Bind Date to calendar
    this.attendedAtLocal = this.isoToDate(this.atendimento.attendedAt);
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
        orcamento: this.atendimento?.orcamento
      });
    }
  }

  back() {
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
      orcamento: this.atendimento.orcamento
    };

    alert(this.isEditMode ? 'Atualizando atendimento...' : 'Criando novo atendimento...');
    alert(this.atendimento.id);

    const obs = (this.isEditMode && this.atendimento.id !== 0)
      ? this.service.update(payload)
      : this.service.create(payload);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/atendimentos']);
      },
      error: () => {
        this.error = 'Falha ao salvar atendimento.';
        this.saving = false;
      }
    });
  }
}
