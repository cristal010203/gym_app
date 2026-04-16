import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, Modal, TextInput, ScrollView, Alert, SafeAreaView,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import {
  getRutinas, crearRutina, eliminarRutina,
  agregarEjercicioARutina, eliminarEjercicioDeRutina,
  Rutina, RutinaEjercicio,
} from '../../services/rutinaService';
import { getEjercicios, Ejercicio } from '../../services/ejercicioService';
import { iniciarSesion, finalizarSesion } from '../../services/sesionService';
import { Colors } from '../../constants';

type ModalType = 'none' | 'nueva' | 'detalle' | 'agregarEjercicio' | 'sesion';

// Rutinas predefinidas según objetivo (RF-03.5)
const RUTINAS_SUGERIDAS: Record<string, { nombre: string; desc: string }[]> = {
  ganar_musculo:       [{ nombre: 'Push Day', desc: 'Pecho, hombros y tríceps' }, { nombre: 'Pull Day', desc: 'Espalda y bíceps' }, { nombre: 'Leg Day', desc: 'Cuádriceps, isquiotibiales y glúteos' }],
  perder_peso:         [{ nombre: 'Cardio HIIT', desc: 'Alta intensidad, intervalos cortos' }, { nombre: 'Full Body', desc: 'Todo el cuerpo en una sesión' }],
  mejorar_resistencia: [{ nombre: 'Cardio Base', desc: 'Resistencia aeróbica de bajo impacto' }, { nombre: 'Circuit Training', desc: 'Circuito de ejercicios sin descanso' }],
  mantener_peso:       [{ nombre: 'Mantenimiento Full Body', desc: 'Rutina equilibrada de mantenimiento' }],
  flexibilidad:        [{ nombre: 'Movilidad Articular', desc: 'Trabajo de rango de movimiento' }, { nombre: 'Stretching', desc: 'Estiramientos profundos' }],
};

export default function RutinasScreen() {
  const [rutinas, setRutinas]               = useState<Rutina[]>([]);
  const [loading, setLoading]               = useState(true);
  const [userId, setUserId]                 = useState<string | null>(null);
  const [objetivo, setObjetivo]             = useState<string>('');
  const [modal, setModal]                   = useState<ModalType>('none');
  const [rutinaActual, setRutinaActual]     = useState<Rutina | null>(null);
  const [ejercicios, setEjercicios]         = useState<Ejercicio[]>([]);

  // Nueva rutina
  const [nuevoNombre, setNuevoNombre]       = useState('');
  const [nuevaDesc, setNuevaDesc]           = useState('');
  const [creando, setCreando]               = useState(false);
  const [errorForm, setErrorForm]           = useState<string | null>(null);

  // Agregar ejercicio
  const [ejSelected, setEjSelected]         = useState<Ejercicio | null>(null);
  const [series, setSeries]                 = useState('3');
  const [reps, setReps]                     = useState('10');
  const [peso, setPeso]                     = useState('0');
  const [agregando, setAgregando]           = useState(false);

  // Sesión en tiempo real (RF-03.2 / RF-03.3)
  const [sesionId, setSesionId]             = useState<string | null>(null);
  const [sesionActiva, setSesionActiva]     = useState(false);
  const [pausada, setPausada]               = useState(false);
  const [segundos, setSegundos]             = useState(0);
  const [seriesCompletadas, setSeriesComp]  = useState<Record<string, boolean[]>>({});
  const intervalRef                         = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (user?.id) {
        setUserId(user.id);
        // Obtener objetivo del perfil para sugerencias
        supabase.from('perfil_usuario').select('objetivo').eq('usuario_id', user.id).single()
          .then(({ data: p }) => { if (p?.objetivo) setObjetivo(p.objetivo); });
      }
    });
  }, []);

  const cargarRutinas = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { rutinas: data } = await getRutinas(userId);
    setRutinas(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => { cargarRutinas(); }, [cargarRutinas]);

  // Temporizador de sesión
  useEffect(() => {
    if (sesionActiva && !pausada) {
      intervalRef.current = setInterval(() => setSegundos((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [sesionActiva, pausada]);

  function formatTiempo(s: number) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }

  async function handleIniciarSesion() {
    if (!rutinaActual || !userId) return;
    const { id, error } = await iniciarSesion(userId, rutinaActual.id);
    if (error || !id) { Alert.alert('Error', error ?? 'No se pudo iniciar la sesión'); return; }
    setSesionId(id);
    setSesionActiva(true);
    setPausada(false);
    setSegundos(0);
    // Inicializar series completadas
    const init: Record<string, boolean[]> = {};
    rutinaActual.rutina_ejercicio?.forEach((re) => {
      init[re.id] = Array(re.series).fill(false);
    });
    setSeriesComp(init);
    setModal('sesion');
  }

  async function handleFinalizarSesion() {
    if (!sesionId) return;
    setSesionActiva(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    await finalizarSesion(sesionId);
    Alert.alert('¡Sesión completada! 🎉', `Duración: ${formatTiempo(segundos)}`, [
      { text: 'OK', onPress: () => { setSesionId(null); setSegundos(0); setModal('detalle'); } },
    ]);
  }

  function toggleSerie(reId: string, idx: number) {
    setSeriesComp((prev) => {
      const arr = [...(prev[reId] ?? [])];
      arr[idx] = !arr[idx];
      return { ...prev, [reId]: arr };
    });
  }

  async function handleCrearRutina(sugerida?: { nombre: string; desc: string }) {
    const nombre = sugerida ? sugerida.nombre : nuevoNombre.trim();
    const desc   = sugerida ? sugerida.desc   : nuevaDesc.trim();
    if (!nombre) { setErrorForm('Ingresa un nombre.'); return; }
    if (!userId) return;
    setCreando(true);
    const { rutina, error } = await crearRutina(userId, { nombre, descripcion: desc || undefined });
    setCreando(false);
    if (error) { setErrorForm(error); return; }
    setNuevoNombre(''); setNuevaDesc(''); setErrorForm(null);
    setModal('none');
    cargarRutinas();
    if (rutina) { setRutinaActual(rutina); setModal('detalle'); }
  }

  async function handleEliminarRutina(id: string) {
    Alert.alert('Eliminar rutina', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await eliminarRutina(id);
        cargarRutinas();
        if (rutinaActual?.id === id) setModal('none');
      }},
    ]);
  }

  async function abrirAgregarEjercicio() {
    const { ejercicios: data } = await getEjercicios();
    setEjercicios(data);
    setEjSelected(null); setSeries('3'); setReps('10'); setPeso('0');
    setModal('agregarEjercicio');
  }

  async function handleAgregarEjercicio() {
    if (!ejSelected || !rutinaActual || !userId) return;
    const orden = (rutinaActual.rutina_ejercicio?.length ?? 0) + 1;
    setAgregando(true);
    await agregarEjercicioARutina(rutinaActual.id, {
      ejercicio_id: ejSelected.id,
      series: parseInt(series) || 3,
      repeticiones: parseInt(reps) || 10,
      peso_kg: parseFloat(peso) || 0,
      orden,
    });
    setAgregando(false);
    const { rutinas: data } = await getRutinas(userId);
    setRutinas(data);
    setRutinaActual(data.find((r) => r.id === rutinaActual.id) ?? null);
    setModal('detalle');
  }

  async function handleQuitarEjercicio(re: RutinaEjercicio) {
    if (!userId) return;
    await eliminarEjercicioDeRutina(re.id);
    const { rutinas: data } = await getRutinas(userId);
    setRutinas(data);
    setRutinaActual(data.find((r) => r.id === rutinaActual?.id) ?? null);
  }

  const sugeridas = RUTINAS_SUGERIDAS[objetivo] ?? [];

  function renderRutina({ item }: { item: Rutina }) {
    const numEj = item.rutina_ejercicio?.length ?? 0;
    return (
      <TouchableOpacity style={styles.rutinaCard} onPress={() => { setRutinaActual(item); setModal('detalle'); }} activeOpacity={0.8}>
        <View style={styles.rutinaCardTop}>
          <Text style={styles.rutinaNombre}>{item.nombre}</Text>
          <TouchableOpacity onPress={() => handleEliminarRutina(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ fontSize: 16 }}>🗑</Text>
          </TouchableOpacity>
        </View>
        {item.descripcion ? <Text style={styles.rutinaDesc}>{item.descripcion}</Text> : null}
        <Text style={styles.rutinaInfo}>{numEj} ejercicio{numEj !== 1 ? 's' : ''}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Mis Rutinas</Text>
          <Text style={styles.subtitulo}>{rutinas.length} rutina{rutinas.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.btnNueva} onPress={() => { setNuevoNombre(''); setNuevaDesc(''); setErrorForm(null); setModal('nueva'); }}>
          <Text style={styles.btnNuevaText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={rutinas}
          keyExtractor={(r) => r.id}
          renderItem={renderRutina}
          contentContainerStyle={styles.lista}
          ListHeaderComponent={sugeridas.length > 0 ? (
            <View style={styles.sugeridosBloque}>
              <Text style={styles.sugeridosTitulo}>💡 Sugeridas para tu objetivo</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {sugeridas.map((s) => (
                  <TouchableOpacity key={s.nombre} style={styles.sugeridaCard} onPress={() => handleCrearRutina(s)}>
                    <Text style={styles.sugeridaNombre}>{s.nombre}</Text>
                    <Text style={styles.sugeridaDesc}>{s.desc}</Text>
                    <Text style={styles.sugeridaAction}>+ Crear</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Text style={styles.vacioEmoji}>📋</Text>
              <Text style={styles.vacioText}>No tienes rutinas todavía</Text>
              <Text style={styles.vacioSub}>Crea tu primera rutina o usa una sugerida.</Text>
            </View>
          }
        />
      )}

      {/* ── Modal: Nueva rutina ── */}
      <Modal visible={modal === 'nueva'} animationType="slide" transparent onRequestClose={() => setModal('none')}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Nueva rutina</Text>
            <Text style={styles.label}>Nombre *</Text>
            <TextInput style={styles.input} value={nuevoNombre} onChangeText={setNuevoNombre} placeholder="Ej: Push Day" placeholderTextColor={Colors.textMuted} autoFocus />
            <Text style={styles.label}>Descripción (opcional)</Text>
            <TextInput style={[styles.input, { height: 64, textAlignVertical: 'top' }]} value={nuevaDesc} onChangeText={setNuevaDesc} placeholder="Ej: Pecho, hombros y tríceps" placeholderTextColor={Colors.textMuted} multiline />
            {errorForm ? <Text style={styles.error}>{errorForm}</Text> : null}
            <View style={styles.modalBotones}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setModal('none')}>
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnPrimary, creando && styles.btnDisabled]} onPress={() => handleCrearRutina()} disabled={creando}>
                {creando ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnPrimaryText}>Crear</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Detalle de rutina ── */}
      <Modal visible={modal === 'detalle' && !!rutinaActual} animationType="slide" transparent onRequestClose={() => setModal('none')}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Cabecera */}
            <View style={styles.detalleHeader}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.modalTitulo} numberOfLines={1}>{rutinaActual?.nombre}</Text>
                {rutinaActual?.descripcion ? <Text style={styles.detalleDesc}>{rutinaActual.descripcion}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => setModal('none')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.closeX}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Lista de ejercicios */}
            <ScrollView style={styles.detalleScroll} showsVerticalScrollIndicator={false}>
              {(rutinaActual?.rutina_ejercicio?.length ?? 0) === 0 ? (
                <Text style={styles.sinEjercicios}>Sin ejercicios. Agrega el primero 👇</Text>
              ) : (
                rutinaActual?.rutina_ejercicio
                  ?.sort((a, b) => a.orden - b.orden)
                  .map((re) => (
                    <View key={re.id} style={styles.reCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reNombre}>{re.ejercicio?.nombre ?? '—'}</Text>
                        <Text style={styles.reDetalle}>
                          {re.series} series × {re.repeticiones} reps{re.peso_kg > 0 ? ` · ${re.peso_kg} kg` : ''}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleQuitarEjercicio(re)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={{ color: Colors.textMuted, fontSize: 16 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))
              )}
            </ScrollView>

            {/* Botones de acción */}
            <View style={styles.detalleBotones}>
              <TouchableOpacity style={styles.btnSecundario} onPress={abrirAgregarEjercicio}>
                <Text style={styles.btnSecundarioText}>+ Ejercicio</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnPrimary, { flex: 2 }, (rutinaActual?.rutina_ejercicio?.length ?? 0) === 0 && styles.btnDisabled]}
                onPress={handleIniciarSesion}
                disabled={(rutinaActual?.rutina_ejercicio?.length ?? 0) === 0}
              >
                <Text style={styles.btnPrimaryText}>▶ Iniciar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Agregar ejercicio ── */}
      <Modal visible={modal === 'agregarEjercicio'} animationType="slide" transparent onRequestClose={() => setModal('detalle')}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.detalleHeader}>
              <Text style={styles.modalTitulo}>Agregar ejercicio</Text>
              <TouchableOpacity onPress={() => setModal('detalle')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.closeX}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
              {ejercicios.map((ej) => (
                <TouchableOpacity key={ej.id} style={[styles.ejRow, ejSelected?.id === ej.id && styles.ejRowActivo]} onPress={() => setEjSelected(ej)}>
                  <Text style={[styles.ejNombre, ejSelected?.id === ej.id && { color: Colors.primary }]}>{ej.nombre}</Text>
                  <Text style={styles.ejGrupo}>{ej.grupo_muscular}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.paramRow}>
              {[['Series', series, setSeries], ['Reps', reps, setReps], ['Peso kg', peso, setPeso]].map(([lbl, val, fn]) => (
                <View key={lbl as string} style={{ flex: 1 }}>
                  <Text style={styles.label}>{lbl as string}</Text>
                  <TextInput style={styles.inputSmall} value={val as string} onChangeText={fn as (v: string) => void} keyboardType="decimal-pad" />
                </View>
              ))}
            </View>
            <TouchableOpacity style={[styles.btnPrimary, { marginTop: 16 }, (!ejSelected || agregando) && styles.btnDisabled]} onPress={handleAgregarEjercicio} disabled={!ejSelected || agregando}>
              {agregando ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnPrimaryText}>Agregar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Sesión en tiempo real (RF-03.2 / RF-03.3) ── */}
      <Modal visible={modal === 'sesion'} animationType="fade" transparent onRequestClose={() => {}}>
        <View style={styles.sesionOverlay}>
          <View style={styles.sesionCard}>
            {/* Timer */}
            <Text style={styles.sesionRutinaNombre}>{rutinaActual?.nombre}</Text>
            <Text style={styles.timer}>{formatTiempo(segundos)}</Text>
            <View style={styles.timerBotones}>
              <TouchableOpacity style={styles.btnPausa} onPress={() => setPausada((p) => !p)}>
                <Text style={styles.btnPausaText}>{pausada ? '▶ Reanudar' : '⏸ Pausar'}</Text>
              </TouchableOpacity>
            </View>

            {/* Ejercicios con check de series */}
            <ScrollView style={styles.sesionScroll} showsVerticalScrollIndicator={false}>
              {rutinaActual?.rutina_ejercicio?.sort((a, b) => a.orden - b.orden).map((re) => (
                <View key={re.id} style={styles.sesionEjCard}>
                  <Text style={styles.sesionEjNombre}>{re.ejercicio?.nombre}</Text>
                  <Text style={styles.sesionEjDetalle}>{re.series} × {re.repeticiones} reps{re.peso_kg > 0 ? ` · ${re.peso_kg}kg` : ''}</Text>
                  <View style={styles.seriesRow}>
                    {Array.from({ length: re.series }).map((_, i) => {
                      const completada = seriesCompletadas[re.id]?.[i] ?? false;
                      return (
                        <TouchableOpacity
                          key={i}
                          style={[styles.serieBubble, completada && styles.serieBubbleActiva]}
                          onPress={() => toggleSerie(re.id, i)}
                        >
                          <Text style={[styles.serieBubbleText, completada && styles.serieBubbleTextActiva]}>
                            {completada ? '✓' : String(i + 1)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Finalizar */}
            <TouchableOpacity style={styles.btnFinalizar} onPress={() => {
              Alert.alert('Finalizar sesión', '¿Terminar el entrenamiento?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Finalizar', onPress: handleFinalizarSesion },
              ]);
            }}>
              <Text style={styles.btnFinalizarText}>⏹ Finalizar sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: Colors.background },
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  titulo:             { fontSize: 26, fontWeight: '800', color: Colors.text },
  subtitulo:          { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  btnNueva:           { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  btnNuevaText:       { color: Colors.white, fontWeight: '700', fontSize: 14 },
  lista:              { padding: 20, gap: 12, paddingBottom: 40 },
  rutinaCard:         { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 16, gap: 6 },
  rutinaCardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rutinaNombre:       { fontSize: 16, fontWeight: '700', color: Colors.text, flex: 1 },
  rutinaDesc:         { fontSize: 13, color: Colors.textSecondary },
  rutinaInfo:         { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  sugeridosBloque:    { marginBottom: 20 },
  sugeridosTitulo:    { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 10 },
  sugeridaCard:       { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 14, width: 160, gap: 4 },
  sugeridaNombre:     { fontSize: 14, fontWeight: '700', color: Colors.text },
  sugeridaDesc:       { fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },
  sugeridaAction:     { fontSize: 12, color: Colors.primary, fontWeight: '700', marginTop: 6 },
  vacio:              { alignItems: 'center', marginTop: 40, gap: 8 },
  vacioEmoji:         { fontSize: 48 },
  vacioText:          { fontSize: 16, fontWeight: '700', color: Colors.text },
  vacioSub:           { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  // Modal base
  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard:          { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36, maxHeight: '88%' },
  modalTitulo:        { fontSize: 20, fontWeight: '800', color: Colors.text, flex: 1 },
  detalleHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  detalleDesc:        { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  detalleScroll:      { maxHeight: 280, marginBottom: 16 },
  closeX:             { fontSize: 18, color: Colors.textSecondary, paddingLeft: 8 },
  detalleBotones:     { flexDirection: 'row', gap: 10, marginTop: 4 },
  label:              { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4, marginTop: 10 },
  input:              { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.text, fontSize: 14 },
  inputSmall:         { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 10, color: Colors.text, fontSize: 14, textAlign: 'center' },
  error:              { color: Colors.error, fontSize: 13, marginTop: 8 },
  modalBotones:       { flexDirection: 'row', gap: 12, marginTop: 20 },
  btnCancelar:        { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  btnCancelarText:    { color: Colors.textSecondary, fontWeight: '600' },
  btnPrimary:         { flex: 1, backgroundColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  btnSecundario:      { flex: 1, backgroundColor: Colors.surfaceLight, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  btnSecundarioText:  { color: Colors.text, fontWeight: '600', fontSize: 14 },
  btnDisabled:        { opacity: 0.4 },
  btnPrimaryText:     { color: Colors.white, fontWeight: '700', fontSize: 15 },
  sinEjercicios:      { color: Colors.textMuted, textAlign: 'center', marginVertical: 24, fontSize: 13 },
  reCard:             { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, borderRadius: 12, padding: 12, marginBottom: 8 },
  reNombre:           { fontSize: 14, fontWeight: '600', color: Colors.text },
  reDetalle:          { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  ejRow:              { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: Colors.border },
  ejRowActivo:        { backgroundColor: Colors.surfaceLight, borderRadius: 8, paddingHorizontal: 8 },
  ejNombre:           { fontSize: 14, color: Colors.text, fontWeight: '500', flex: 1 },
  ejGrupo:            { fontSize: 11, color: Colors.textMuted, textTransform: 'capitalize' },
  paramRow:           { flexDirection: 'row', gap: 10, marginTop: 4 },
  // Sesión en tiempo real
  sesionOverlay:      { flex: 1, backgroundColor: Colors.background },
  sesionCard:         { flex: 1, padding: 24, paddingTop: 60 },
  sesionRutinaNombre: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center', marginBottom: 8 },
  timer:              { fontSize: 72, fontWeight: '800', color: Colors.primary, textAlign: 'center', fontVariant: ['tabular-nums'] },
  timerBotones:       { flexDirection: 'row', justifyContent: 'center', marginBottom: 28, marginTop: 12 },
  btnPausa:           { backgroundColor: Colors.surfaceLight, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border },
  btnPausaText:       { color: Colors.text, fontWeight: '700', fontSize: 15 },
  sesionScroll:       { flex: 1 },
  sesionEjCard:       { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  sesionEjNombre:     { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  sesionEjDetalle:    { fontSize: 12, color: Colors.textSecondary, marginBottom: 10 },
  seriesRow:          { flexDirection: 'row', gap: 8 },
  serieBubble:        { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  serieBubbleActiva:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  serieBubbleText:    { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  serieBubbleTextActiva: { color: Colors.white },
  btnFinalizar:       { backgroundColor: Colors.error, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 16 },
  btnFinalizarText:   { color: Colors.white, fontWeight: '800', fontSize: 16 },
});