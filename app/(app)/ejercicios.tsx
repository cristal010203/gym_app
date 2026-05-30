import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Modal, ScrollView, SafeAreaView, Alert,
} from 'react-native';
import { getEjercicios, crearEjercicio, Ejercicio } from '../../services/ejercicioService';
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

function SelectorOpciones({
  label,
  opciones,
  valor,
  onChange,
}: {
  label: string;
  opciones: string[];
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.selectorBloque}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {opciones.map((op) => (
          <TouchableOpacity
            key={op}
            style={[styles.selectorChip, valor === op && styles.selectorChipActivo]}
            onPress={() => onChange(op)}
          >
            <Text style={[styles.selectorChipText, valor === op && styles.selectorChipTextActivo]}>
              {op.charAt(0).toUpperCase() + op.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
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
  const [modalCrear, setModalCrear] = useState(false);

  // Formulario nuevo ejercicio
  const [nuevoNombre, setNuevoNombre]       = useState('');
  const [nuevoGrupo, setNuevoGrupo]         = useState('pecho');
  const [nuevoTipo, setNuevoTipo]           = useState('fuerza');
  const [nuevoNivel, setNuevoNivel]         = useState('principiante');
  const [nuevoDesc, setNuevoDesc]           = useState('');
  const [nuevoVideo, setNuevoVideo]         = useState('');
  const [guardando, setGuardando]           = useState(false);
  const [errorCrear, setErrorCrear]         = useState<string | null>(null);

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

  function abrirCrear() {
    setNuevoNombre('');
    setNuevoGrupo('pecho');
    setNuevoTipo('fuerza');
    setNuevoNivel('principiante');
    setNuevoDesc('');
    setNuevoVideo('');
    setErrorCrear(null);
    setModalCrear(true);
  }

  async function handleCrearEjercicio() {
    if (!nuevoNombre.trim()) {
      setErrorCrear('El nombre es obligatorio.');
      return;
    }
    setGuardando(true);
    const { error } = await crearEjercicio({
      nombre:         nuevoNombre,
      grupo_muscular: nuevoGrupo,
      tipo:           nuevoTipo,
      nivel:          nuevoNivel,
      descripcion:    nuevoDesc || undefined,
      video_url:      nuevoVideo || undefined,
    });
    setGuardando(false);
    if (error) {
      setErrorCrear(error);
      return;
    }
    setModalCrear(false);
    Alert.alert('✅ Ejercicio creado', 'Ya está disponible para todos los usuarios.');
    cargar();
  }

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
        <View>
          <Text style={styles.titulo}>Ejercicios</Text>
          <Text style={styles.subtitulo}>{ejercicios.length} disponibles</Text>
        </View>
        <TouchableOpacity style={styles.btnCrear} onPress={abrirCrear}>
          <Text style={styles.btnCrearText}>+ Nuevo</Text>
        </TouchableOpacity>
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

      {/* Filtros */}
      <View style={styles.filtroBloque}>
        <Text style={styles.filtroLabel}>Músculo</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtroScroll}>
          {GRUPOS.map((g) => (
            <Chip key={g} label={g} activo={grupo === g} onPress={() => setGrupo(grupo === g ? '' : g)} />
          ))}
        </ScrollView>
      </View>
      <View style={styles.filtroBloque}>
        <Text style={styles.filtroLabel}>Tipo</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtroScroll}>
          {TIPOS.map((t) => (
            <Chip key={t} label={t} activo={tipo === t} onPress={() => setTipo(tipo === t ? '' : t)} />
          ))}
        </ScrollView>
      </View>
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

      {/* ── Modal: Detalle ── */}
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

      {/* ── Modal: Crear ejercicio ── */}
      <Modal visible={modalCrear} animationType="slide" transparent onRequestClose={() => setModalCrear(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.crearHeader}>
              <Text style={styles.crearTitulo}>Nuevo ejercicio</Text>
              <TouchableOpacity onPress={() => setModalCrear(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
              {/* Nombre */}
              <Text style={styles.inputLabel}>Nombre *</Text>
              <TextInput
                style={styles.input}
                value={nuevoNombre}
                onChangeText={setNuevoNombre}
                placeholder="Ej: Press de banca"
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />

              {/* Grupo muscular */}
              <SelectorOpciones
                label="Grupo muscular *"
                opciones={GRUPOS}
                valor={nuevoGrupo}
                onChange={setNuevoGrupo}
              />

              {/* Tipo */}
              <SelectorOpciones
                label="Tipo *"
                opciones={TIPOS}
                valor={nuevoTipo}
                onChange={setNuevoTipo}
              />

              {/* Nivel */}
              <SelectorOpciones
                label="Nivel *"
                opciones={NIVELES}
                valor={nuevoNivel}
                onChange={setNuevoNivel}
              />

              {/* Descripción */}
              <Text style={styles.inputLabel}>Descripción (opcional)</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={nuevoDesc}
                onChangeText={setNuevoDesc}
                placeholder="Describe cómo realizar el ejercicio..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Video URL */}
              <Text style={styles.inputLabel}>URL de video (opcional)</Text>
              <TextInput
                style={styles.input}
                value={nuevoVideo}
                onChangeText={setNuevoVideo}
                placeholder="https://youtube.com/..."
                placeholderTextColor={Colors.textMuted}
                keyboardType="url"
                autoCapitalize="none"
              />

              {errorCrear ? (
                <Text style={styles.errorText}>{errorCrear}</Text>
              ) : null}

              {/* Botones */}
              <View style={styles.crearBotones}>
                <TouchableOpacity
                  style={styles.btnCancelar}
                  onPress={() => setModalCrear(false)}
                >
                  <Text style={styles.btnCancelarText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnGuardar, guardando && styles.btnDisabled]}
                  onPress={handleCrearEjercicio}
                  disabled={guardando}
                >
                  {guardando
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.btnGuardarText}>Guardar</Text>
                  }
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: Colors.background },
  header:              { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  titulo:              { fontSize: 26, fontWeight: '800', color: Colors.text },
  subtitulo:           { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  btnCrear:            { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  btnCrearText:        { color: '#fff', fontWeight: '700', fontSize: 14 },
  searchRow:           { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  searchInput:         { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: Colors.text, fontSize: 14 },
  clearBtn:            { backgroundColor: Colors.surfaceLight, borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' },
  clearBtnText:        { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  filtroBloque:        { marginBottom: 6 },
  filtroLabel:         { fontSize: 10, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 20, marginBottom: 4 },
  filtroScroll:        { paddingHorizontal: 20, gap: 8 },
  chip:                { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  chipActivo:          { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:            { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActivo:      { color: '#fff', fontWeight: '700' },
  lista:               { padding: 20, gap: 12 },
  card:                { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 16, gap: 8 },
  cardTop:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNombre:          { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1 },
  nivelBadge:          { fontSize: 11, fontWeight: '700', marginLeft: 8 },
  cardTags:            { flexDirection: 'row', gap: 8 },
  tagPill:             { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border },
  tagText:             { fontSize: 11, color: Colors.textSecondary, textTransform: 'capitalize' },
  cardDesc:            { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  vacio:               { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
  // Modal base
  modalOverlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard:           { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalClose:          { alignSelf: 'flex-end', padding: 4, marginBottom: 12 },
  modalCloseText:      { fontSize: 18, color: Colors.textSecondary },
  modalNombre:         { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  modalTags:           { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 20 },
  modalSeccion:        { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  modalTexto:          { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: 20 },
  sinVideo:            { fontSize: 13, color: Colors.textMuted, fontStyle: 'italic', marginTop: 4 },
  // Modal crear
  crearHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  crearTitulo:         { fontSize: 20, fontWeight: '800', color: Colors.text },
  inputLabel:          { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 12, marginBottom: 6 },
  input:               { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: Colors.text, fontSize: 14 },
  inputMultiline:      { height: 80, textAlignVertical: 'top' },
  selectorBloque:      { marginTop: 12 },
  selectorLabel:       { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  selectorChip:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border },
  selectorChipActivo:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  selectorChipText:    { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  selectorChipTextActivo: { color: '#fff', fontWeight: '700' },
  errorText:           { color: '#FF4D6D', fontSize: 13, marginTop: 8 },
  crearBotones:        { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 8 },
  btnCancelar:         { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  btnCancelarText:     { color: Colors.textSecondary, fontWeight: '600' },
  btnGuardar:          { flex: 1, backgroundColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  btnGuardarText:      { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnDisabled:         { opacity: 0.4 },
});