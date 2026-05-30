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

export type NuevoEjercicio = {
  nombre: string;
  grupo_muscular: string;
  tipo: string;
  nivel: string;
  descripcion?: string;
  video_url?: string;
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

export async function crearEjercicio(
  datos: NuevoEjercicio
): Promise<{ ejercicio: Ejercicio | null; error: string | null }> {
  const { data, error } = await supabase
    .from('ejercicio')
    .insert({
      nombre:         datos.nombre.trim(),
      grupo_muscular: datos.grupo_muscular,
      tipo:           datos.tipo,
      nivel:          datos.nivel,
      descripcion:    datos.descripcion?.trim() || null,
      video_url:      datos.video_url?.trim() || null,
    })
    .select()
    .single();

  if (error) return { ejercicio: null, error: error.message };
  return { ejercicio: data as Ejercicio, error: null };
}