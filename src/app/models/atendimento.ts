import {Paciente} from "./paciente";

export interface Atendimento {
  id: number;
  patientId: number;
  attendedAt: string; // ISO string
  contentHtml?: string | null;
  patient: Paciente | null;
}

