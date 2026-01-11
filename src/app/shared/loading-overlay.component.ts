import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../core/loading.service';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay" *ngIf="loading.isLoading$ | async">
      <div class="panel">
        <img class="logo" width="40" alt="Havilah Logo" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTAgMjUwIj4KICA8cmVjdCB3aWR0aD0iMjUwIiBoZWlnaHQ9IjI1MCIgcng9IjQwIiBmaWxsPSIjMTExODI3Ii8+CiAgPHJlY3QgeD0iNjAiIHk9IjUwIiB3aWR0aD0iMzAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRkZGRkZGIi8+CiAgPHJlY3QgeD0iMTYwIiB5PSI1MCIgd2lkdGg9IjMwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI0ZGRkZGRiIvPgogIDxyZWN0IHg9IjkwIiB5PSIxMTAiIHdpZHRoPSI3MCIgaGVpZ2h0PSIzMCIgZmlsbD0iI0ZGRkZGRiIvPgo8L3N2Zz4=" />
        <div class="spinner" aria-label="carregando"></div>
        <div class="text">Carregando...</div>
      </div>
    </div>
  `,
  styles: [
    `
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.35);
      backdrop-filter: blur(1px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .panel {
      background: #ffffff;
      color: #333;
      border-radius: 10px;
      padding: 16px 22px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      display: flex;
      gap: 12px;
      align-items: center;
      font-weight: 500;
    }
    .logo { display: block; }
    .spinner {
      width: 22px;
      height: 22px;
      border: 3px solid #cfe1ff;
      border-top-color: #1f75fe;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0); }
      to { transform: rotate(360deg); }
    }
    .text { font-size: 14px; }
    `
  ]
})
export class LoadingOverlayComponent {
  constructor(public loading: LoadingService) {}
}
