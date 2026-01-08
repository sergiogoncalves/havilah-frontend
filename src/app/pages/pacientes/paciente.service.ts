import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Paciente } from '../../models/paciente';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PacienteService {
  // Base URL now comes from environment config
  private baseUrl = `${environment.apiUrl}/patients`;

  constructor(private http: HttpClient) { }

  private parse(item: any): Paciente {
    const birthDate = typeof item.birthDate === 'string' && item.birthDate.length >= 10
      ? new Date(item.birthDate.substring(0, 10) + 'T00:00:00')
      : item.birthDate;

    // Map cpf from possible backend fields and normalize
    const rawCpf = item.cpf || item.document || item.documentNumber || item.taxId || null;
    const cpf = rawCpf ? String(rawCpf).replace(/\D/g, '').slice(0, 11) : undefined;

    return {
      ...item,
      birthDate,
      cpf,
      contacts: Array.isArray(item.contacts) ? item.contacts : []
    } as Paciente;
  }

  private toDto(payload: Paciente): any {
    return {
      id: payload.id || undefined,
      fullName: payload.fullName,
      birthDate: payload.birthDate ? (payload.birthDate instanceof Date ? payload.birthDate.toISOString().substring(0, 10) : String(payload.birthDate).substring(0, 10)) : null,
      cpf: payload.cpf || null,
      contacts: Array.isArray(payload.contacts) ? payload.contacts.map(c => ({
        // include id for updates of existing contacts; omit if undefined
        id: c.id ?? undefined,
        type: c.type,
        value: c.value,
        primary: c.primary
      })) : []
    };
  }

  getAll(): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(this.baseUrl).pipe(
      map((items: any[]) => items.map(it => this.parse(it)))
    );
  }

  getById(id: number): Observable<Paciente> {
    return this.http.get(`${this.baseUrl}/${id}`).pipe(
      map((it: any) => this.parse(it))
    );
  }

  create(payload: Paciente): Observable<any> {
    return this.http.post(this.baseUrl, this.toDto(payload));
  }

  update(payload: Paciente): Observable<any> {
    // payload should contain id
    return this.http.put(`${this.baseUrl}/${payload.id}`, this.toDto(payload));
  }
}
