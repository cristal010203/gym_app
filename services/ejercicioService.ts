import { supabase } from '../lib/supabase';

export type Ejercicio = {
  id: string;
  nombre: string;
  grupo_muscular: string;
  tipo: string;
  nivel: string;
  descripcion: string | null;
  video_url: string | null;
};

export type FiltrosEjercicio = {
  busqueda?: string;
  grupo_muscular?: string;
  tipo?: string;
  nivel?: string;
};

export async function getEjercicios(
  filtros: FiltrosEjercicio = {}
): Promise<{ ejercicios: Ejercicio[]; error: string | null }> {
  let query = supabase.from('ejercicio').select('*').order('nombre');

  if (filtros.grupo_muscular) query = query.eq('grupo_muscular', filtros.grupo_muscular);
  if (filtros.tipo)           query = query.eq('tipo', filtros.tipo);
  if (filtros.nivel)          query = query.eq('nivel', filtros.nivel);
  if (filtros.busqueda)       query = query.ilike('nombre', `%${filtros.busqueda}%`);

  const { data, error } = await query;
  if (error) return { ejercicios: [], error: error.message };
  return { ejercicios: data as Ejercicio[], error: null };
}