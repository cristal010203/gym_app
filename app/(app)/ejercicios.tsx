import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Modal, ScrollView, SafeAreaView,
} from 'react-native';
import { getEjercicios, Ejercicio } from '../../services/ejercicioService';
import { Colors } from '../../constants';

const GRUPOS  = ['pecho','espalda','piernas','hombros','brazos','core','cardio'];
const TIPOS   = ['fuerza','cardio','flexibilidad'];
const NIVELES = ['principiante','intermedio','avanzado'];

const NIVEL_COLOR: Record<string, string> = {
  principiante: '#16C47F',
  intermedio:   '#FFB347',
  avanzado:     '#FF4D6D',
};

function Chip({ label, activo, onPress }: { label: string; activo: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, activo && styles.chipActivo]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, activo && styles.chipTextActivo]}>
        {label.charAt(0).toUpperCase() + label.slice(1)}
      </Text>
    </TouchableOpacity>
  );
}

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
      busqueda, grupo_muscular: grupo || undefined,
      tipo: tipo || undefined, nivel: nivel || undefined,
    });
    setEjercicios(data);
    setLoading(false);
  }, [busqueda, grupo, tipo, nivel]);

  useEffect(() => { cargar(); }, [cargar]);

  const hayFiltros = !!(grupo || tipo || nivel || busqueda);

  function renderEjercicio({ item }: { item: Ejercicio }) {
    return (
      <TouchableOpacity style={styles.card} onPress={() => setDetalle(item)} activeOpacity={0.8}>
        <View style={styles.cardTop}>
          <Text style={styles.cardNombre} numberOfLines={1}>{item.nombre}</Text>
          <Text style={[styles.nivelBadge, { color: NIVEL_COLOR[item.nivel] ?? Colors.textSecondary }]}>
            {item.nivel.charAt(0).toUpperCase() + item.nivel.slice(1)}
          </Text>
        </View>
        <View style={styles.cardTags}>
          <View style={styles.tagPill}><Text style={styles.tagText}>{item.grupo_muscular}</Text></View>
          <View style={styles.tagPill}><Text style={styles.tagText}>{item.tipo}</Text></View>
        </View>
        {item.descripcion ? (
          <Text style={styles.cardDesc} numberOfLines={2}>{item.descripcion}</Text>
        ) : null}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
          placeholder="Buscar ejercicio..."
          placeholderTextColor={Colors.textMuted}
        />
        {hayFiltros && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => { setBusqueda(''); setGrupo(''); setTipo(''); setNivel(''); }}
          >
            <Text style={styles.clearBtnText}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros — Grupo muscular */}
      <View style={styles.filtroBloque}>
        <Text style={styles.filtroLabel}>Músculo</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtroScroll}>
          {GRUPOS.map((g) => (
            <Chip key={g} label={g} activo={grupo === g} onPress={() => setGrupo(grupo === g ? '' : g)} />
          ))}
        </ScrollView>
      </View>

      {/* Filtros — Tipo */}
      <View style={styles.filtroBloque}>
        <Text style={styles.filtroLabel}>Tipo</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtroScroll}>
          {TIPOS.map((t) => (
            <Chip key={t} label={t} activo={tipo === t} onPress={() => setTipo(tipo === t ? '' : t)} />
          ))}
        </ScrollView>
      </View>

      {/* Filtros — Nivel */}
      <View style={styles.filtroBloque}>
        <Text style={styles.filtroLabel}>Nivel</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtroScroll}>
          {NIVELES.map((n) => (
            <Chip key={n} label={n} activo={nivel === n} onPress={() => setNivel(nivel === n ? '' : n)} />
          ))}
        </ScrollView>
      </View>

      {/* Lista */}
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={ejercicios}
          keyExtractor={(e) => e.id}
          renderItem={renderEjercicio}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <Text style={styles.vacio}>No se encontraron ejercicios.</Text>
          }
        />
      )}

      {/* Modal de detalle */}
      <Modal visible={!!detalle} animationType="slide" transparent onRequestClose={() => setDetalle(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setDetalle(null)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            {detalle && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalNombre}>{detalle.nombre}</Text>
                <View style={styles.modalTags}>
                  <View style={styles.tagPill}><Text style={styles.tagText}>{detalle.grupo_muscular}</Text></View>
                  <View style={styles.tagPill}><Text style={styles.tagText}>{detalle.tipo}</Text></View>
                  <View style={[styles.tagPill, { borderColor: NIVEL_COLOR[detalle.nivel] }]}>
                    <Text style={[styles.tagText, { color: NIVEL_COLOR[detalle.nivel] }]}>{detalle.nivel}</Text>
                  </View>
                </View>
                {detalle.descripcion ? (
                  <>
                    <Text style={styles.modalSeccion}>Descripción</Text>
                    <Text style={styles.modalTexto}>{detalle.descripcion}</Text>
                  </>
                ) : null}
                <Text style={styles.sinVideo}>
                  {detalle.video_url ? detalle.video_url : '📹 Sin video disponible aún'}
                </Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.background },
  header:         { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  titulo:         { fontSize: 26, fontWeight: '800', color: Colors.text },
  subtitulo:      { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  searchRow:      { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  searchInput:    { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: Colors.text, fontSize: 14 },
  clearBtn:       { backgroundColor: Colors.surfaceLight, borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' },
  clearBtnText:   { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  filtroBloque:   { marginBottom: 6 },
  filtroLabel:    { fontSize: 10, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 20, marginBottom: 4 },
  filtroScroll:   { paddingHorizontal: 20, gap: 8 },
  chip:           { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  chipActivo:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:       { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActivo: { color: Colors.white, fontWeight: '700' },
  lista:          { padding: 20, gap: 12 },
  card:           { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 16, gap: 8 },
  cardTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNombre:     { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1 },
  nivelBadge:     { fontSize: 11, fontWeight: '700', marginLeft: 8 },
  cardTags:       { flexDirection: 'row', gap: 8 },
  tagPill:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border },
  tagText:        { fontSize: 11, color: Colors.textSecondary, textTransform: 'capitalize' },
  cardDesc:       { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  vacio:          { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard:      { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalClose:     { alignSelf: 'flex-end', padding: 4, marginBottom: 12 },
  modalCloseText: { fontSize: 18, color: Colors.textSecondary },
  modalNombre:    { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  modalTags:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 20 },
  modalSeccion:   { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  modalTexto:     { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: 20 },
  sinVideo:       { fontSize: 13, color: Colors.textMuted, fontStyle: 'italic', marginTop: 4 },
});