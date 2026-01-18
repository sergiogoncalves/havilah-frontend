import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { SystemInfoResponseDto } from '../models/system-info';

@Injectable({
  providedIn: 'root'
})
export class SystemInfoService {
  private readonly url = `${environment.apiUrl}/system/info`;

  private readonly cached$: Observable<SystemInfoResponseDto | null> = this.http
    .get<SystemInfoResponseDto>(this.url)
    .pipe(
      catchError(() => of(null)),
      shareReplay({ bufferSize: 1, refCount: true })
    );

  constructor(private http: HttpClient) {}

  getSystemInfo(): Observable<SystemInfoResponseDto | null> {
    return this.cached$;
  }
}

