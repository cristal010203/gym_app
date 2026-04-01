import { supabase } from '../lib/supabase';
import { Ejercicio } from './ejercicioService';

export type RutinaEjercicio = {
  id: string;
  rutina_id: string;
  ejercicio_id: string;
  series: number;
  repeticiones: number;
  peso_kg: number;
  orden: number;
  ejercicio?: Ejercicio;
};

export type Rutina = {
  id: string;
  usuario_id: string;
  nombre: string;
  descripcion: string | null;
  created_at: string;
  rutina_ejercicio?: RutinaEjercicio[];
};

export type NuevaRutina = {
  nombre: string;
  descripcion?: string;
};

export type NuevoRutinaEjercicio = {
  ejercicio_id: string;
  series: number;
  repeticiones: number;
  peso_kg: number;
  orden: number;
};

// ── Listar rutinas del usuario ──────────────────────────────
export async function getRutinas(
  usuarioId: string
): Promise<{ rutinas: Rutina[]; error: string | null }> {
  const { data, error } = await supabase
    .from('rutina')
    .select(`*, rutina_ejercicio(*, ejercicio(*))`)
    .eq('usuario_id', usuarioId)
    .order('created_at', { ascending: false });

  if (error) return { rutinas: [], error: error.message };
  return { rutinas: data as Rutina[], error: null };
}

// ── Crear rutina vacía ──────────────────────────────────────
export async function crearRutina(
  usuarioId: string,
  datos: NuevaRutina
): Promise<{ rutina: Rutina | null; error: string | null }> {
  const { data, error } = await supabase
    .from('rutina')
    .insert({ usuario_id: usuarioId, ...datos })
    .select()
    .single();

  if (error) return { rutina: null, error: error.message };
  return { rutina: data as Rutina, error: null };
}

// ── Agregar ejercicio a rutina ──────────────────────────────
export async function agregarEjercicioARutina(
  rutinaId: string,
  ejercicio: NuevoRutinaEjercicio
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('rutina_ejercicio')
    .insert({ rutina_id: rutinaId, ...ejercicio });

  if (error) return { error: error.message };
  return { error: null };
}

// ── Eliminar ejercicio de rutina ────────────────────────────
export async function eliminarEjercicioDeRutina(
  rutinaEjercicioId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('rutina_ejercicio')
    .delete()
    .eq('id', rutinaEjercicioId);

  if (error) return { error: error.message };
  return { error: null };
}

// ── Eliminar rutina completa ────────────────────────────────
export async function eliminarRutina(
  rutinaId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('rutina')
    .delete()
    .eq('id', rutinaId);

  if (error) return { error: error.message };
  return { error: null };
}