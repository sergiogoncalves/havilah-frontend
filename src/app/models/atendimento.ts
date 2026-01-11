import {Paciente} from "./paciente";

export interface Atendimento {
  id: number;
  patientId: number;
  attendedAt: string; // ISO string
  descricaoSubjetiva: string | null;
  objetivoPaciente: string | null;
  planoTerapeutico: string | null;
  anotacoesMedicas: string | null;
  terapiaRealizada: string | null;
  orcamento: string | null;
  receita: string | null;
  retornarContato?: string | null; // Novo campo LocalDate (yyyy-MM-dd) vindo do backend
  patient: Paciente | null;
}
