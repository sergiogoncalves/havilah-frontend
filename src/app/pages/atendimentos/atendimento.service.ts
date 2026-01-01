import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Atendimento } from '../../models/atendimento';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AtendimentoService {
  // Use Portuguese endpoint path to match the app's routes
  private baseUrl = `${environment.apiUrl}/atendimentos`;

  constructor(private http: HttpClient) { }

  private parse(item: any): Atendimento {
    return {
      ...item,
      attendedAt: item.attendedAt
    };
  }

  getAll(): Observable<Atendimento[]> {
    return this.http.get<Atendimento[]>(this.baseUrl).pipe(
      map((items: any[]) => items.map(it => this.parse(it)))
    );
  }

  getById(id: number): Observable<Atendimento> {
    return this.http.get(`${this.baseUrl}/${id}`).pipe(
      map((it: any) => this.parse(it))
    );
  }
}
