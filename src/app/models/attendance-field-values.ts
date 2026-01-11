export interface AttendanceFieldValueItemDto {
  attendanceId: number;
  attendedAt: string; // ISO datetime from backend
  value: string;
}

export interface AttendanceFieldValuesByPatientResponseDto {
  patientId: number;
  field: string;
  items: AttendanceFieldValueItemDto[];
}

