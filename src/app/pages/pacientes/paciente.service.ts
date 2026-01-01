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
    return {
      ...item,
      birthDate: typeof item.birthDate === 'string' && item.birthDate.length === 10
        ? new Date(item.birthDate + 'T00:00:00')
        : item.birthDate
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

  create(payload: any): Observable<any> {
    return this.http.post(this.baseUrl, payload);
  }

  update(payload: any): Observable<any> {
    // payload should contain id
    return this.http.put(`${this.baseUrl}/${payload.id}`, payload);
  }
}
