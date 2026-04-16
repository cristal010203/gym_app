import { supabase } from '../lib/supabase';

export async function iniciarSesion(
  usuarioId: string,
  rutinaId: string
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from('sesion')
    .insert({ usuario_id: usuarioId, rutina_id: rutinaId, inicio: new Date().toISOString() })
    .select('id')
    .single();

  if (error) return { id: null, error: error.message };
  return { id: data.id, error: null };
}

export async function finalizarSesion(
  sesionId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('sesion')
    .update({ fin: new Date().toISOString() })
    .eq('id', sesionId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function getSesionesRecientes(
  usuarioId: string,
  limite = 10
): Promise<{ sesiones: any[]; error: string | null }> {
  const { data, error } = await supabase
    .from('sesion')
    .select('*, rutina(nombre)')
    .eq('usuario_id', usuarioId)
    .not('fin', 'is', null)
    .order('inicio', { ascending: false })
    .limit(limite);

  if (error) return { sesiones: [], error: error.message };
  return { sesiones: data, error: null };
}