export interface Paciente {
  id: number;
  fullName: string;
  // birthDate may be a string (raw) or a Date object after parsing
  birthDate: string | Date;
}

