export type Usuario = {
  id: string;
  email: string;
  proveedor: string | null;
  activo: boolean;
  created_at: string;
};

export type PerfilUsuario = {
  id: string;
  usuario_id: string;
  nombre: string | null;
  foto_url: string | null;
  edad: number | null;
  peso_inicial_kg: number | null;
  estatura_cm: number | null;
  objetivo: string | null;
  perfil_completo: boolean;
  updated_at: string;
};

export type ObjetivoFitness =
  | 'perder_peso'
  | 'ganar_musculo'
  | 'mejorar_resistencia'
  | 'mantener_peso'
  | 'flexibilidad';