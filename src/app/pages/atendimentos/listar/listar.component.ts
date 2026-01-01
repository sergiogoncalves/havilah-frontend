import { Component, OnInit } from '@angular/core';
import { Atendimento } from '../../../models/atendimento';
import { AtendimentoService } from '../atendimento.service';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-listar-atendimentos',
  templateUrl: './listar.component.html',
  styleUrls: ['./listar.component.scss']
})
export class ListarComponent implements OnInit {
  atendimentos: Atendimento[] = [];
  loading = false;
  error: string | null = null;

  constructor(private service: AtendimentoService, private router: Router, private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = null;
    this.service.getAll().subscribe({
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
