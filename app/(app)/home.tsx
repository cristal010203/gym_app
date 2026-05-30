import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Colors } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from '../../services/authService';
import { getDashboardStats } from '../../services/dashboardService';
import { getSesionesRecientes } from '../../services/sesionService';

const OBJETIVO_LABELS: Record<string, { label: string; emoji: string }> = {
  perder_peso:         { label: 'Perder peso',         emoji: '🔥' },
  ganar_musculo:       { label: 'Ganar músculo',        emoji: '💪' },
  mejorar_resistencia: { label: 'Mejorar resistencia',  emoji: '🏃' },
  mantener_peso:       { label: 'Mantener peso',        emoji: '⚖️' },
  flexibilidad:        { label: 'Flexibilidad',         emoji: '🧘' },
};

export default function HomeScreen() {
  const { perfil, session } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({
    rutinas: 0,
    ejercicios: 0,
    diasActivos: 0,
  });
  const [actividad, setActividad] = useState<any[]>([]);

  const objetivo = perfil?.objetivo ? OBJETIVO_LABELS[perfil.objetivo] : null;

  useEffect(() => {
    async function cargarStats() {
      if (!session?.user?.id) return;

      const data = await getDashboardStats(session.user.id);
      setStats(data);

      const recientes = await getSesionesRecientes(session.user.id, 3);
      setActividad(recientes.sesiones);
    }

    cargarStats();
  }, [session]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.saludo}>
              Hola, {perfil?.nombre ?? 'atleta'} 👋
            </Text>
            <Text style={styles.subtitulo}>¿Listo para entrenar hoy?</Text>
            <Text style={styles.fecha}>
              {new Date().toLocaleDateString('es-GT', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => router.push('/(app)/logros')}
              style={styles.trophyBtn}
            >
              <Text style={styles.trophyText}>🏆</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Salir</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tarjetas de estadísticas */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🏋️</Text>
            <Text style={styles.statNumber}>{stats.rutinas}</Text>
            <Text style={styles.statLabel}>Rutinas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⚡</Text>
            <Text style={styles.statNumber}>{stats.ejercicios}</Text>
            <Text style={styles.statLabel}>Ejercicios</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statNumber}>{stats.diasActivos}</Text>
            <Text style={styles.statLabel}>Días activos</Text>
          </View>
        </View>

        {/* Objetivo actual */}
        {objetivo && (
          <View style={styles.objetivoCard}>
            <View style={styles.objetivoIconContainer}>
              <Text style={styles.objetivoEmoji}>{objetivo.emoji}</Text>
            </View>
            <View>
              <Text style={styles.objetivoTitulo}>Objetivo actual</Text>
              <Text style={styles.objetivoLabel}>{objetivo.label}</Text>
            </View>
          </View>
        )}

        {/* Accesos rápidos */}
        <Text style={styles.seccionTitulo}>Accesos rápidos</Text>
        <View style={styles.accesoGrid}>
          <TouchableOpacity
            style={styles.accesoCard}
            onPress={() => router.push('/(app)/ejercicios')}
          >
            <Text style={styles.accesoEmoji}>🏋️</Text>
            <Text style={styles.accesoLabel}>Ejercicios</Text>
            <Text style={styles.accesoDesc}>Ver catálogo completo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.accesoCard}
            onPress={() => router.push('/(app)/rutinas')}
          >
            <Text style={styles.accesoEmoji}>📋</Text>
            <Text style={styles.accesoLabel}>Rutinas</Text>
            <Text style={styles.accesoDesc}>Administrar rutinas</Text>
          </TouchableOpacity>
        </View>

        {/* Actividad reciente */}
        <Text style={styles.seccionTitulo}>Actividad reciente</Text>
        <View style={styles.activityCard}>
          {actividad.length === 0 ? (
            <Text style={styles.activityItem}>Aún no hay actividad reciente</Text>
          ) : (
            actividad.map((sesion, index) => (
              <Text key={index} style={styles.activityItem}>
                🏋️ {sesion.rutina?.nombre} completada
              </Text>
            ))
          )}
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 120,
  },
  content: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  headerActions: {
    alignItems: 'flex-end',
    gap: 10,
  },
  saludo: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitulo: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  fecha: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 6,
    textTransform: 'capitalize',
  },
  trophyBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyText: {
    fontSize: 20,
  },
  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  logoutText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 18,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  objetivoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
  },
  objetivoIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 16,
  },
  objetivoEmoji: {
    fontSize: 32,
  },
  objetivoTitulo: {
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  objetivoLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 4,
  },
  seccionTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
  },
  accesoGrid: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 28,
  },
  accesoCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 20,
  },
  accesoEmoji: {
    fontSize: 30,
    marginBottom: 12,
  },
  accesoLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  accesoDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  activityCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  activityItem: {
    color: Colors.text,
    fontSize: 14,
  },
});