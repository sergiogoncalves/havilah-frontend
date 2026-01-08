export type ContactType = string; // keep in sync with backend enum values (e.g., 'PHONE', 'MOBILE', 'EMAIL')

export interface PatientContact {
  // optional id for existing contacts returned by backend; undefined for new contacts
  id?: number;
  type: ContactType;
  value: string;
  primary: boolean;
}

export interface Paciente {
  id: number;
  fullName: string;
  // birthDate may be a string (raw) or a Date object after parsing
  birthDate: string | Date;
  cpf?: string;
  contacts: PatientContact[];
}
