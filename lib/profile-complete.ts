import type { RolUsuario } from '@/lib/auth';

export type KycEstado = 'pendiente' | 'verificado' | 'rechazado';

export type OwnProfile = {
  rol: RolUsuario;
  nombre: string | null;
  alias: string | null;
  edad: number | null;
  genero: string | null;
  profesion: string | null;
  foto_url: string | null;
  hobbies: string[];
  intereses: string[];
  kyc_estado: KycEstado;
};

const REQUIRED_FIELDS = ['nombre', 'alias', 'edad', 'genero', 'profesion', 'foto_url'] as const;

/** True once the onboarding form (Fase 1.3) has been filled in. */
export function isProfileComplete(profile: OwnProfile | null): boolean {
  if (!profile) return false;
  return REQUIRED_FIELDS.every((field) => profile[field] !== null && profile[field] !== '');
}
