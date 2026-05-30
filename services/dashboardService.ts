import { supabase } from '../lib/supabase';

export async function getDashboardStats(usuarioId: string) {
  // Rutinas del usuario
  const { count: rutinasCount } = await supabase
    .from('rutina')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', usuarioId);

  // Sesiones completadas
  const { data: sesiones } = await supabase
    .from('sesion')
    .select('inicio')
    .eq('usuario_id', usuarioId)
    .not('fin', 'is', null);

  // Días activos únicos (distintos)
  const diasUnicos = new Set(
    sesiones?.map((s) => new Date(s.inicio).toDateString()) ?? []
  );

  // Total de ejercicios en rutinas del usuario
  const { data: rutinaEj } = await supabase
    .from('rutina_ejercicio')
    .select('id, rutina!inner(usuario_id)')
    .eq('rutina.usuario_id', usuarioId);

  return {
    rutinas: rutinasCount ?? 0,
    ejercicios: rutinaEj?.length ?? 0,
    diasActivos: diasUnicos.size,
  };
}