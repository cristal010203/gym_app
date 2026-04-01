import { supabase } from '../lib/supabase';

export type AuthError = { message: string };

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<{ userId: string | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { userId: null, error: { message: error.message } };
  if (!data.user) return { userId: null, error: { message: 'No se pudo crear el usuario.' } };
  return { userId: data.user.id, error: null };
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: { message: traducirError(error.message) } };
  return { error: null };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

function traducirError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos.';
  if (msg.includes('Email not confirmed')) return 'Confirma tu email antes de iniciar sesión.';
  if (msg.includes('User already registered')) return 'Este email ya está registrado.';
  if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
  return msg;
}