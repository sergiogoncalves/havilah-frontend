export interface SystemInfoResponseDto {
  applicationName: string;
  environment: string;
  /** Versão do backend (ex.: "7"). Opcional para manter compatibilidade. */
  versao?: string;
  activeProfiles: string[];
}
