import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { PerfilUsuario } from '../types';

type AuthState = {
  session: Session | null;
  perfil: PerfilUsuario | null;
  loading: boolean;
};

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil]   = useState<PerfilUsuario | null>(null);
  const [loading, setLoading] = useState(true);

  async function cargarPerfil(userId: string) {
    const { data } = await supabase
      .from('perfil_usuario')
      .select('*')
      .eq('usuario_id', userId)
      .maybeSingle(); // ← clave: no lanza error si no hay fila
    setPerfil(data as PerfilUsuario | null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const s = data.session;
      setSession(s);
      if (s?.user) await cargarPerfil(s.user.id);
      setLoading(false); // ← siempre llega aquí
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          await cargarPerfil(newSession.user.id);
        } else {
          setPerfil(null);
        }
      }
    );

    return () => { listener.subscription.unsubscribe(); };
  }, []);

  return { session, perfil, loading };
}