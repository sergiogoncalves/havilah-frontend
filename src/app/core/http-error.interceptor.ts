import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AlertService } from '../alert.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(private alerts: AlertService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // System info failing on startup is not critical; keep it silent.
        if (!req.url.includes('/system/info')) {
          const msg = this.buildMessage(error);
          this.alerts.error(msg, 'Erro de requisição');
        }
        return throwError(() => error);
      })
    );
  }

  private buildMessage(error: HttpErrorResponse): string {
    if (error.error && typeof error.error === 'string') return error.error;
    if (error.error && error.error.message) return error.error.message;
    if (error.message) return error.message;
    return `Status ${error.status}: ${error.statusText || 'Erro desconhecido'}`;
  }
}
