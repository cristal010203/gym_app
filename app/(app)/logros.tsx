import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useEffect, useState } from 'react';
import { Colors } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardStats } from '../../services/dashboardService';
import { obtenerLogros, Logro } from '../../services/logrosService';

export default function LogrosScreen() {
  const { session } = useAuth();

  const [logros, setLogros] = useState<Logro[]>([]);
  const [monedas, setMonedas] = useState(0);
  const [reclamados, setReclamados] = useState<string[]>([]);
  const [animando, setAnimando] = useState(false);

  function reclamarLogro(logroId: string) {
    if (reclamados.includes(logroId)) return;

    setAnimando(true);
    setTimeout(() => {
      setAnimando(false);
      setMonedas((m) => m + 100);
      setReclamados((prev) => [...prev, logroId]);
    }, 1500);
  }

  useEffect(() => {
    async function cargar() {
      if (!session?.user?.id) return;

      const stats = await getDashboardStats(session.user.id);
      const logrosData = obtenerLogros({
        ...stats,
        sesiones: stats.diasActivos,
      });
      setLogros(logrosData);
    }

    cargar();
  }, [session]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Animación de monedas */}
      <Modal visible={animando} transparent animationType="fade">
        <View style={styles.animOverlay}>
          <Text style={styles.coinAnim}>🪙</Text>
          <Text style={styles.animText}>+100 monedas</Text>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Mis Logros</Text>
        <View style={styles.coinCard}>
          <Text style={styles.coinText}>🪙 {monedas}</Text>
        </View>
      </View>

      {/* Lista de logros */}
      <View style={styles.grid}>
        {logros.map((logro) => (
          <View
            key={logro.id}
            style={[
              styles.card,
              logro.desbloqueado ? styles.cardUnlocked : styles.cardLocked,
            ]}
          >
            <Text style={styles.emoji}>
              {logro.desbloqueado ? logro.emoji : '🔒'}
            </Text>

            <Text style={styles.cardTitle}>{logro.titulo}</Text>

            {logro.desbloqueado ? (
              reclamados.includes(logro.id) ? (
                <Text style={styles.claimed}>Reclamado ✅</Text>
              ) : (
                <TouchableOpacity
                  style={styles.claimBtn}
                  onPress={() => reclamarLogro(logro.id)}
                >
                  <Text style={styles.claimText}>Reclamar 🪙</Text>
                </TouchableOpacity>
              )
            ) : (
              <Text style={styles.cardStatus}>Bloqueado</Text>
            )}
          </View>
        ))}
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
    padding: 24,
    paddingTop: 60,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 18,
  },
  coinCard: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  coinText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  grid: {
    gap: 16,
  },
  card: {
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
  },
  cardUnlocked: {
    backgroundColor: Colors.surface,
    borderColor: Colors.primary,
  },
  cardLocked: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    opacity: 0.5,
  },
  emoji: {
    fontSize: 42,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  cardStatus: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  claimBtn: {
    marginTop: 14,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  claimText: {
    color: '#fff',
    fontWeight: '700',
  },
  claimed: {
    marginTop: 14,
    color: '#4ade80',
    fontWeight: '700',
  },
  animOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinAnim: {
    fontSize: 120,
  },
  animText: {
    marginTop: 20,
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
  },
});