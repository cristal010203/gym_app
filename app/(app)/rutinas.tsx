import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, Modal, TextInput, ScrollView, Alert,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import {
  getRutinas, crearRutina, eliminarRutina,
  agregarEjercicioARutina, eliminarEjercicioDeRutina,
  Rutina, RutinaEjercicio,
} from '../../services/rutinaService';
import { getEjercicios, Ejercicio } from '../../services/ejercicioService';
import { Colors } from '../../constants';

type Modal_ = 'none' | 'nueva' | 'detalle' | 'agregarEjercicio';

export default function RutinasScreen() {
  const [rutinas, setRutinas]           = useState<Rutina[]>([]);
  const [loading, setLoading]           = useState(true);
  const [userId, setUserId]             = useState<string | null>(null);
  const [modal, setModal]               = useState<Modal_>('none');
  const [rutinaActual, setRutinaActual] = useState<Rutina | null>(null);
  const [ejercicios, setEjercicios]     = useState<Ejercicio[]>([]);

  // Campos nueva rutina
  const [nuevoNombre, setNuevoNombre]   = useState('');
  const [nuevaDesc, setNuevaDesc]       = useState('');
  const [creando, setCreando]           = useState(false);
  const [errorForm, setErrorForm]       = useState<string | null>(null);

  // Campos nuevo ejercicio en rutina
  const [ejSelected, setEjSelected]    = useState<Ejercicio | null>(null);
  const [series, setSeries]            = useState('3');
  const [reps, setReps]                = useState('10');
  const [peso, setPeso]                = useState('0');
  const [agregando, setAgregando]      = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.id) setUserId(data.session.user.id);
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

  async function handleCrearRutina() {
    if (!nuevoNombre.trim()) { setErrorForm('Ingresa un nombre.'); return; }
    if (!userId) return;
    setCreando(true);
    const { rutina, error } = await crearRutina(userId, {
      nombre: nuevoNombre.trim(),
      descripcion: nuevaDesc.trim() || undefined,
    });
    setCreando(false);
    if (error) { setErrorForm(error); return; }
    setNuevoNombre(''); setNuevaDesc(''); setErrorForm(null);
    setModal('none');
    cargarRutinas();
    if (rutina) { setRutinaActual(rutina); setModal('detalle'); }
  }

  async function handleEliminarRutina(id: string) {
    Alert.alert('Eliminar rutina', '¿Estás seguro? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          await eliminarRutina(id);
          cargarRutinas();
          if (rutinaActual?.id === id) setModal('none');
        },
      },
    ]);
  }

  async function abrirAgregarEjercicio() {
    const { ejercicios: data } = await getEjercicios();
    setEjercicios(data);
    setEjSelected(null); setSeries('3'); setReps('10'); setPeso('0');
    setModal('agregarEjercicio');
  }

  async function handleAgregarEjercicio() {
    if (!ejSelected || !rutinaActual) return;
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
    // Recargar rutina actualizada
    const { rutinas: data } = await getRutinas(userId!);
    const actualizada = data.find((r) => r.id === rutinaActual.id) ?? null;
    setRutinaActual(actualizada);
    setRutinas(data);
    setModal('detalle');
  }

  async function handleQuitarEjercicio(re: RutinaEjercicio) {
    await eliminarEjercicioDeRutina(re.id);
    const { rutinas: data } = await getRutinas(userId!);
    const actualizada = data.find((r) => r.id === rutinaActual?.id) ?? null;
    setRutinaActual(actualizada);
    setRutinas(data);
  }

  function renderRutina({ item }: { item: Rutina }) {
    const numEj = item.rutina_ejercicio?.length ?? 0;
    return (
      <TouchableOpacity
        style={styles.rutinaCard}
        onPress={() => { setRutinaActual(item); setModal('detalle'); }}
      >
        <View style={styles.rutinaCardTop}>
          <Text style={styles.rutinaNombre}>{item.nombre}</Text>
          <TouchableOpacity onPress={() => handleEliminarRutina(item.id)} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>🗑</Text>
          </TouchableOpacity>
        </View>
        {item.descripcion && <Text style={styles.rutinaDesc}>{item.descripcion}</Text>}
        <Text style={styles.rutinaInfo}>{numEj} ejercicio{numEj !== 1 ? 's' : ''}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
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

      {loading
        ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        : (
          <FlatList
            data={rutinas}
            keyExtractor={(r) => r.id}
            renderItem={renderRutina}
            contentContainerStyle={styles.lista}
            ListEmptyComponent={
              <View style={styles.vacio}>
                <Text style={styles.vacioEmoji}>📋</Text>
                <Text style={styles.vacioText}>No tienes rutinas todavía.</Text>
                <Text style={styles.vacioSub}>Crea tu primera rutina y empieza a entrenar.</Text>
              </View>
            }
          />
        )
      }

      {/* ── Modal: Nueva rutina ── */}
      <Modal visible={modal === 'nueva'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Nueva rutina</Text>
            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={styles.input}
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
              placeholder="Ej: Push Day"
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.label}>Descripción (opcional)</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={nuevaDesc}
              onChangeText={setNuevaDesc}
              placeholder="Ej: Pecho, hombros y tríceps"
              placeholderTextColor={Colors.textMuted}
              multiline
            />
            {errorForm && <Text style={styles.error}>{errorForm}</Text>}
            <View style={styles.modalBotones}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setModal('none')}>
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnPrimary, creando && styles.btnDisabled]} onPress={handleCrearRutina} disabled={creando}>
                {creando ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnPrimaryText}>Crear</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Detalle de rutina ── */}
      <Modal visible={modal === 'detalle' && !!rutinaActual} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}>
            <View style={styles.detalleHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitulo}>{rutinaActual?.nombre}</Text>
                {rutinaActual?.descripcion && <Text style={styles.detalleDesc}>{rutinaActual.descripcion}</Text>}
              </View>
              <TouchableOpacity onPress={() => setModal('none')} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {(rutinaActual?.rutina_ejercicio?.length ?? 0) === 0
                ? <Text style={styles.sinEjercicios}>Sin ejercicios aún. Agrega el primero.</Text>
                : rutinaActual?.rutina_ejercicio
                    ?.sort((a, b) => a.orden - b.orden)
                    .map((re) => (
                      <View key={re.id} style={styles.reCard}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.reNombre}>{re.ejercicio?.nombre ?? '—'}</Text>
                          <Text style={styles.reDetalle}>
                            {re.series} series × {re.repeticiones} reps
                            {re.peso_kg > 0 ? ` · ${re.peso_kg} kg` : ''}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => handleQuitarEjercicio(re)} style={styles.deleteBtn}>
                          <Text style={styles.deleteBtnText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))
              }
            </ScrollView>

            <TouchableOpacity style={[styles.btnPrimary, { marginTop: 16 }]} onPress={abrirAgregarEjercicio}>
              <Text style={styles.btnPrimaryText}>+ Agregar ejercicio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Agregar ejercicio a rutina ── */}
      <Modal visible={modal === 'agregarEjercicio'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.detalleHeader}>
              <Text style={styles.modalTitulo}>Agregar ejercicio</Text>
              <TouchableOpacity onPress={() => setModal('detalle')} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Selección de ejercicio */}
            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
              {ejercicios.map((ej) => (
                <TouchableOpacity
                  key={ej.id}
                  style={[styles.ejRow, ejSelected?.id === ej.id && styles.ejRowActivo]}
                  onPress={() => setEjSelected(ej)}
                >
                  <Text style={[styles.ejNombre, ejSelected?.id === ej.id && { color: Colors.primary }]}>
                    {ej.nombre}
                  </Text>
                  <Text style={styles.ejGrupo}>{ej.grupo_muscular}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Parámetros */}
            <View style={styles.paramRow}>
              <View style={styles.paramField}>
                <Text style={styles.label}>Series</Text>
                <TextInput style={styles.inputSmall} value={series} onChangeText={setSeries} keyboardType="number-pad" />
              </View>
              <View style={styles.paramField}>
                <Text style={styles.label}>Reps</Text>
                <TextInput style={styles.inputSmall} value={reps} onChangeText={setReps} keyboardType="number-pad" />
              </View>
              <View style={styles.paramField}>
                <Text style={styles.label}>Peso (kg)</Text>
                <TextInput style={styles.inputSmall} value={peso} onChangeText={setPeso} keyboardType="decimal-pad" />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, (!ejSelected || agregando) && styles.btnDisabled]}
              onPress={handleAgregarEjercicio}
              disabled={!ejSelected || agregando}
            >
              {agregando ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnPrimaryText}>Agregar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  titulo: { fontSize: 26, fontWeight: '800', color: Colors.text },
  subtitulo: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  btnNueva: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  btnNuevaText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  lista: { padding: 20, gap: 12 },
  rutinaCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 16, gap: 6 },
  rutinaCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rutinaNombre: { fontSize: 16, fontWeight: '700', color: Colors.text, flex: 1 },
  rutinaDesc: { fontSize: 13, color: Colors.textSecondary },
  rutinaInfo: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 16 },
  vacio: { alignItems: 'center', marginTop: 60, gap: 8 },
  vacioEmoji: { fontSize: 48 },
  vacioText: { fontSize: 16, fontWeight: '700', color: Colors.text },
  vacioSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  // Modales
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitulo: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 16 },
  detalleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  detalleDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  modalClose: { padding: 4 },
  modalCloseText: { fontSize: 18, color: Colors.textSecondary },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4, marginTop: 8 },
  input: { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.text, fontSize: 14 },
  inputMulti: { height: 72, textAlignVertical: 'top' },
  inputSmall: { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 10, color: Colors.text, fontSize: 14, textAlign: 'center' },
  error: { color: Colors.error, fontSize: 13, marginTop: 8 },
  modalBotones: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btnCancelar: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  btnCancelarText: { color: Colors.textSecondary, fontWeight: '600' },
  btnPrimary: { flex: 1, backgroundColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnPrimaryText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  sinEjercicios: { color: Colors.textMuted, textAlign: 'center', marginVertical: 24, fontSize: 13 },
  reCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, borderRadius: 12, padding: 12, marginBottom: 8 },
  reNombre: { fontSize: 14, fontWeight: '600', color: Colors.text },
  reDetalle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  ejRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: Colors.border },
  ejRowActivo: { backgroundColor: Colors.surfaceLight, borderRadius: 8, paddingHorizontal: 8 },
  ejNombre: { fontSize: 14, color: Colors.text, fontWeight: '500', flex: 1 },
  ejGrupo: { fontSize: 11, color: Colors.textMuted, textTransform: 'capitalize' },
  paramRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  paramField: { flex: 1 },
});