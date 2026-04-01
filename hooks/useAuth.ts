import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getPerfil } from '../services/perfilService';
import { PerfilUsuario } from '../types';

type AuthState = {
  session: Session | null;
  perfil: PerfilUsuario | null;
  loading: boolean;
};

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const currentSession = data.session;
      setSession(currentSession);
      if (currentSession?.user) {
        const { perfil: p } = await getPerfil(currentSession.user.id);
        setPerfil(p);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          const { perfil: p } = await getPerfil(newSession.user.id);
          setPerfil(p);
        } else {
          setPerfil(null);
        }
      }
    );

    return () => { listener.subscription.unsubscribe(); };
  }, []);

  return { session, perfil, loading };
}