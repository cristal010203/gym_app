import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { getEjercicios, Ejercicio } from '../../services/ejercicioService';
import { Colors } from '../../constants';

const GRUPOS = ['pecho', 'espalda', 'piernas', 'hombros', 'brazos', 'core', 'cardio'];
const TIPOS  = ['fuerza', 'cardio', 'flexibilidad'];
const NIVELES = ['principiante', 'intermedio', 'avanzado'];

const NIVEL_COLOR: Record<string, string> = {
  principiante: '#16C47F',
  intermedio:   '#FFB347',
  avanzado:     '#FF4D6D',
};

export default function EjerciciosScreen() {
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [loading, setLoading]       = useState(true);
  const [busqueda, setBusqueda]     = useState('');
  const [grupo, setGrupo]           = useState('');
  const [tipo, setTipo]             = useState('');
  const [nivel, setNivel]           = useState('');
  const [detalle, setDetalle]       = useState<Ejercicio | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    const { ejercicios: data } = await getEjercicios({
      busqueda, grupo_muscular: grupo, tipo, nivel,
    });
    setEjercicios(data);
    setLoading(false);
  }, [busqueda, grupo, tipo, nivel]);

  useEffect(() => { cargar(); }, [cargar]);

  function limpiarFiltros() {
    setBusqueda(''); setGrupo(''); setTipo(''); setNivel('');
  }

  const hayFiltros = !!(grupo || tipo || nivel);

  function renderEjercicio({ item }: { item: Ejercicio }) {
    return (
      <TouchableOpacity style={styles.card} onPress={() => setDetalle(item)}>
        <View style={styles.cardTop}>
          <Text style={styles.cardNombre}>{item.nombre}</Text>
          <Text style={[styles.nivelBadge, { color: NIVEL_COLOR[item.nivel] ?? Colors.textSecondary }]}>
            {item.nivel}
          </Text>
        </View>
        <View style={styles.cardTags}>
          <Text style={styles.tag}>{item.grupo_muscular}</Text>
          <Text style={styles.tag}>{item.tipo}</Text>
        </View>
        {item.descripcion && (
          <Text style={styles.cardDesc} numberOfLines={2}>{item.descripcion}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Ejercicios</Text>
        <Text style={styles.subtitulo}>{ejercicios.length} disponibles</Text>
      </View>

      {/* Búsqueda */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="🔍  Buscar ejercicio..."
          placeholderTextColor={Colors.textMuted}
        />
        {hayFiltros && (
          <TouchableOpacity style={styles.clearBtn} onPress={limpiarFiltros}>
            <Text style={styles.clearBtnText}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros — Grupo muscular */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtroRow} contentContainerStyle={styles.filtroContent}>
        {GRUPOS.map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.chip, grupo === g && styles.chipActivo]}
            onPress={() => setGrupo(grupo === g ? '' : g)}
          >
            <Text style={[styles.chipText, grupo === g && styles.chipTextActivo]}>
              {g}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filtros — Tipo y Nivel */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtroRow} contentContainerStyle={styles.filtroContent}>
        {TIPOS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, tipo === t && styles.chipActivo]}
            onPress={() => setTipo(tipo === t ? '' : t)}
          >
            <Text style={[styles.chipText, tipo === t && styles.chipTextActivo]}>{t}</Text>
          </TouchableOpacity>
        ))}
        {NIVELES.map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.chip, nivel === n && styles.chipActivo]}
            onPress={() => setNivel(nivel === n ? '' : n)}
          >
            <Text style={[styles.chipText, nivel === n && styles.chipTextActivo]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista */}
      {loading
        ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        : (
          <FlatList
            data={ejercicios}
            keyExtractor={(e) => e.id}
            renderItem={renderEjercicio}
            contentContainerStyle={styles.lista}
            ListEmptyComponent={
              <Text style={styles.vacio}>No se encontraron ejercicios.</Text>
            }
          />
        )
      }

      {/* Modal de detalle */}
      <Modal visible={!!detalle} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setDetalle(null)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            {detalle && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalNombre}>{detalle.nombre}</Text>
                <View style={styles.modalTags}>
                  <Text style={styles.tag}>{detalle.grupo_muscular}</Text>
                  <Text style={styles.tag}>{detalle.tipo}</Text>
                  <Text style={[styles.tag, { color: NIVEL_COLOR[detalle.nivel] }]}>{detalle.nivel}</Text>
                </View>
                {detalle.descripcion && (
                  <>
                    <Text style={styles.modalSeccion}>Descripción</Text>
                    <Text style={styles.modalTexto}>{detalle.descripcion}</Text>
                  </>
                )}
                {detalle.video_url
                  ? (
                    <>
                      <Text style={styles.modalSeccion}>Video / GIF</Text>
                      <Text style={styles.modalTexto}>{detalle.video_url}</Text>
                    </>
                  )
                  : <Text style={styles.sinVideo}>Sin video disponible aún</Text>
                }
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  titulo: { fontSize: 26, fontWeight: '800', color: Colors.text },
  subtitulo: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 10 },
  searchInput: {
    flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, padding: 12, color: Colors.text, fontSize: 14,
  },
  clearBtn: {
    backgroundColor: Colors.surfaceLight, borderRadius: 12,
    paddingHorizontal: 14, justifyContent: 'center',
  },
  clearBtnText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  filtroRow: { maxHeight: 44, marginBottom: 4 },
  filtroContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  chipActivo: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', textTransform: 'capitalize' },
  chipTextActivo: { color: Colors.white, fontWeight: '700' },
  lista: { padding: 20, gap: 12 },
  card: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 16, padding: 16, gap: 8,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardNombre: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1 },
  nivelBadge: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize', marginLeft: 8 },
  cardTags: { flexDirection: 'row', gap: 8 },
  tag: {
    fontSize: 11, color: Colors.textSecondary, backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, textTransform: 'capitalize',
  },
  cardDesc: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  vacio: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '80%',
  },
  modalClose: { alignSelf: 'flex-end', padding: 4, marginBottom: 12 },
  modalCloseText: { fontSize: 18, color: Colors.textSecondary },
  modalNombre: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  modalTags: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  modalSeccion: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  modalTexto: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: 20 },
  sinVideo: { fontSize: 13, color: Colors.textMuted, fontStyle: 'italic', marginTop: 8 },
});