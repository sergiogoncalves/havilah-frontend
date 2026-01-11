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
  patient: Paciente | null;
}
