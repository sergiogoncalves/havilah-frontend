import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Atendimento } from '../../models/atendimento';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AtendimentoService {
  // Use Portuguese endpoint path to match the app's routes
  private baseUrl = `${environment.apiUrl}/attendances`;

  constructor(private http: HttpClient) { }

  private parse(item: any): Atendimento {
    return {
      ...item,
      attendedAt: item.attendedAt
    };
  }

  // Accept optional filters (patientId or patientName) and send as query params
  getAll(filters?: { patientId?: number; patientName?: string }): Observable<Atendimento[]> {
    // If a patientId is provided, call the patient-specific endpoint
    if (filters && filters.patientId != null) {
      const url = `${this.baseUrl}/patients/${filters.patientId}/attendances`;
      return this.http.get<Atendimento[]>(url).pipe(
        map((items: any[]) => items.map(it => this.parse(it)))
      );
    }

    // Otherwise use the generic attendances endpoint with optional query params
    let params = new HttpParams();
    if (filters && filters.patientName) {
      params = params.set('patientName', filters.patientName);
    }

    return this.http.get<Atendimento[]>(this.baseUrl, { params }).pipe(
      map((items: any[]) => items.map(it => this.parse(it)))
    );
  }

  getById(id: number): Observable<Atendimento> {
    return this.http.get(`${this.baseUrl}/attendances/${id}`).pipe(
      map((it: any) => this.parse(it))
    );
  }

  // Create a new atendimento. If patientId is provided, use the patient-specific endpoint
  create(payload: Partial<Atendimento>, patientId?: number): Observable<Atendimento> {


    const url = (payload.patientId != null)
      ? `${this.baseUrl}/patients/${payload.patientId}/attendances`
      : this.baseUrl;

    return this.http.post<Atendimento>(url, payload).pipe(
      map((it: any) => this.parse(it))
    );
  }

  // Update an existing atendimento. When a patientId is available use the POST (create) endpoint
  // to create/replace the attendance according to backend behavior; otherwise fall back to PUT by id.
  update(payload: Partial<Atendimento>): Observable<Atendimento> {
    const patientId = (payload as any).patientId as number | undefined;

    if (patientId != null) {
      // Backend expects POST to /patients/{patientId}/attendances for creation
      const url = `${this.baseUrl}/patients/${patientId}/attendances`;
      return this.http.post<Atendimento>(url, payload).pipe(
        map((it: any) => this.parse(it))
      );
    }

    // Fallback to existing PUT behavior when no patientId is available
    return this.http.put<Atendimento>(`${this.baseUrl}/${payload.id}`, payload).pipe(
      map((it: any) => this.parse(it))
    );
  }
}
