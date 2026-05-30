import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants';

export default function RootLayout() {
  const { session, perfil, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const enGrupoAuth = segments[0] === '(auth)';
    const enOnboarding = segments[1] === 'onboarding';

    if (!session) {
      // Sin sesión → login
      if (!enGrupoAuth) router.replace('/(auth)/login');
      return;
    }

    // Sesión existe pero perfil aún no cargó → no redirigir todavía
    if (perfil === null && !enOnboarding) {
      return;
    }

    if (!perfil?.perfil_completo) {
      // Perfil incompleto → onboarding (solo si no está ya ahí)
      if (!enOnboarding) router.replace('/(auth)/onboarding');
      return;
    }

    // Perfil completo → app principal
    if (enGrupoAuth) router.replace('/(app)/home');

  }, [session, perfil, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}