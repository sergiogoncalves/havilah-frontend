import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Atendimento } from '../../models/atendimento';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AtendimentoService {
  // Base API paths
  private attendancesBase = `${environment.apiUrl}/attendances`;
  private patientsBase = `${environment.apiUrl}/patients`;

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
      const url = `${this.attendancesBase}/patients/${filters.patientId}/attendances`;
      return this.http.get<Atendimento[]>(url).pipe(
        map((items: any[]) => items.map(it => this.parse(it)))
      );
    }

    // Otherwise use the generic attendances endpoint with optional query params
    let params = new HttpParams();
    if (filters && filters.patientName) {
      params = params.set('patientName', filters.patientName);
    }

    return this.http.get<Atendimento[]>(this.attendancesBase, { params }).pipe(
      map((items: any[]) => items.map(it => this.parse(it)))
    );
  }

  getById(id: number): Observable<Atendimento> {
    return this.http.get(`${this.attendancesBase}/attendances/${id}`).pipe(
      map((it: any) => this.parse(it))
    );
  }

  // Create a new atendimento. If patientId is provided, use the patient-specific endpoint
  create(payload: Partial<Atendimento>): Observable<Atendimento> {
    const url = (payload.patientId != null)
      ? `${this.patientsBase}/${payload.patientId}/attendances`
      : this.attendancesBase;

    return this.http.post<Atendimento>(url, payload).pipe(
      map((it: any) => this.parse(it))
    );
  }

  // Update an existing atendimento using PATCH to /attendances/{attendanceId}/content
  // Sends only public content fields expected by the backend DTO (AttendancePublicContentUpdateDto)
  update(payload: Partial<Atendimento>): Observable<Atendimento> {
    const attendanceId = payload.id as number | undefined;
    if (attendanceId == null) {
      throw new Error('Attendance ID (payload.id) is required to update content');
    }

    const url = `${this.attendancesBase}/attendances/${attendanceId}/content`;

    // Map payload properties to backend DTO field names
    const body: any = {
      descricaoSubjetiva: (payload as any).descricaoSubjetiva,
      objetivoPaciente: (payload as any).objetivoPaciente,
      planoTerapeutico: (payload as any).planoTerapeutico,
      anotacoesMedicas: (payload as any).anotacoesMedicas,
      terapiaRealizada: (payload as any).terapiaRealizada,
      orcamento: (payload as any).orcamento
    };

    return this.http.patch<Atendimento>(url, body).pipe(
      map((it: any) => this.parse(it))
    );
  }
}
