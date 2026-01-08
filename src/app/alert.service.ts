import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

export type AlertType = 'success' | 'error' | 'warn' | 'info';

@Injectable({ providedIn: 'root' })
export class AlertService {
  constructor(private messageService: MessageService) {}

  show(message: string, type: AlertType = 'info', summary?: string) {
    const severity = type;
    this.messageService.add({ severity, summary: summary || this.defaultSummary(type), detail: message, life: 4000 });
  }

  success(message: string, summary?: string) { this.show(message, 'success', summary); }
  error(message: string, summary?: string) { this.show(message, 'error', summary); }
  warn(message: string, summary?: string) { this.show(message, 'warn', summary); }
  info(message: string, summary?: string) { this.show(message, 'info', summary); }

  clear() { this.messageService.clear(); }

  private defaultSummary(type: AlertType): string {
    switch (type) {
      case 'success': return 'Sucesso';
      case 'error': return 'Erro';
      case 'warn': return 'Atenção';
      default: return 'Info';
    }
  }
}

