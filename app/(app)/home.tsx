import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from '../../services/authService';
import { Colors } from '../../constants';
import { useAuth } from '../../hooks/useAuth';

const OBJETIVO_LABELS: Record<string, { label: string; emoji: string }> = {
  perder_peso:        { label: 'Perder peso',        emoji: '🔥' },
  ganar_musculo:      { label: 'Ganar músculo',       emoji: '💪' },
  mejorar_resistencia:{ label: 'Mejorar resistencia', emoji: '🏃' },
  mantener_peso:      { label: 'Mantener peso',       emoji: '⚖️' },
  flexibilidad:       { label: 'Flexibilidad',        emoji: '🧘' },
};

export default function HomeScreen() {
  const { perfil } = useAuth();
  const router = useRouter();
  const objetivo = perfil?.objetivo ? OBJETIVO_LABELS[perfil.objetivo] : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>

      {/* Header saludo */}
      <View style={styles.header}>
        <View>
          <Text style={styles.saludo}>¡Hola, {perfil?.nombre ?? 'atleta'}! 👋</Text>
          <Text style={styles.fecha}>{new Date().toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Tarjeta de objetivo */}
      {objetivo && (
        <View style={styles.objetivoCard}>
          <Text style={styles.objetivoEmoji}>{objetivo.emoji}</Text>
          <View>
            <Text style={styles.objetivoTitulo}>Tu objetivo</Text>
            <Text style={styles.objetivoLabel}>{objetivo.label}</Text>
          </View>
        </View>
      )}

      {/* Accesos rápidos */}
      <Text style={styles.seccionTitulo}>Accesos rápidos</Text>
      <View style={styles.accesoGrid}>
        <TouchableOpacity style={styles.accesoCard} onPress={() => router.push('/(app)/ejercicios')}>
          <Text style={styles.accesoEmoji}>🏋️</Text>
          <Text style={styles.accesoLabel}>Ejercicios</Text>
          <Text style={styles.accesoDesc}>Ver catálogo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.accesoCard} onPress={() => router.push('/(app)/rutinas')}>
          <Text style={styles.accesoEmoji}>📋</Text>
          <Text style={styles.accesoLabel}>Rutinas</Text>
          <Text style={styles.accesoDesc}>Mis rutinas</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingTop: 60 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  saludo: { fontSize: 22, fontWeight: '800', color: Colors.text },
  fecha: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoutText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  objetivoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
  },
  objetivoEmoji: { fontSize: 36 },
  objetivoTitulo: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  objetivoLabel: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 2 },
  seccionTitulo: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  accesoGrid: { flexDirection: 'row', gap: 12 },
  accesoCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 18,
    gap: 4,
  },
  accesoEmoji: { fontSize: 28, marginBottom: 4 },
  accesoLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  accesoDesc: { fontSize: 12, color: Colors.textSecondary },
});