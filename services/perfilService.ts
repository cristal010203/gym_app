import { supabase } from '../lib/supabase';
import { PerfilUsuario } from '../types';

export async function getPerfil(
  usuarioId: string
): Promise<{ perfil: PerfilUsuario | null; error: string | null }> {
  const { data, error } = await supabase
    .from('perfil_usuario')
    .select('*')
    .eq('usuario_id', usuarioId)
    .single();
  if (error) return { perfil: null, error: error.message };
  return { perfil: data as PerfilUsuario, error: null };
}

export type DatosPerfil = {
  nombre: string;
  edad: number;
  peso_inicial_kg: number;
  estatura_cm: number;
  objetivo: string;
};

export async function completarPerfil(
  usuarioId: string,
  datos: DatosPerfil
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('perfil_usuario')
    .upsert({
      usuario_id: usuarioId,
      ...datos,
      perfil_completo: true,
      updated_at: new Date().toISOString(),
    });
  if (error) return { error: error.message };
  return { error: null };
}