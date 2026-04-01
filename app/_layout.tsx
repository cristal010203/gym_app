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

    if (!session) {
      // Sin sesión → ir a login
      if (!enGrupoAuth) router.replace('/(auth)/login');
    } else if (!perfil?.perfil_completo) {
      // Sesión pero sin perfil completo → onboarding
      router.replace('/(auth)/onboarding');
    } else {
      // Sesión y perfil completo → app principal
      if (enGrupoAuth) router.replace('/(app)/home');
    }
  }, [session, perfil, loading]);

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