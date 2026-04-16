import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { completarPerfil } from '../../services/perfilService';
import { Colors, ObjetivosOptions } from '../../constants';
import { ObjetivoFitness } from '../../types';

type Paso = 1 | 2 | 3;

export default function OnboardingScreen() {
  const [paso, setPaso] = useState<Paso>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [peso, setPeso] = useState('');
  const [estatura, setEstatura] = useState('');
  const [objetivo, setObjetivo] = useState<ObjetivoFitness | null>(null);

  function validarPaso1(): boolean {
    if (!nombre.trim()) { setError('Ingresa tu nombre.'); return false; }
    const edadNum = parseInt(edad);
    if (isNaN(edadNum) || edadNum < 10 || edadNum > 100) { setError('Ingresa una edad válida.'); return false; }
    return true;
  }

  function validarPaso2(): boolean {
    const pesoNum = parseFloat(peso);
    if (isNaN(pesoNum) || pesoNum < 30 || pesoNum > 300) { setError('Ingresa un peso válido (kg).'); return false; }
    const estaturaNum = parseFloat(estatura);
    if (isNaN(estaturaNum) || estaturaNum < 100 || estaturaNum > 250) { setError('Ingresa una estatura válida (cm).'); return false; }
    return true;
  }

  function siguientePaso() {
    setError(null);
    if (paso === 1 && !validarPaso1()) return;
    if (paso === 2 && !validarPaso2()) return;
    setPaso((prev) => (prev + 1) as Paso);
  }

  async function handleGuardar() {
    if (!objetivo) { setError('Selecciona un objetivo.'); return; }

    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    if (!userId) { setError('Error de sesión. Vuelve a iniciar sesión.'); return; }

    setLoading(true);
    setError(null);

    const { error: perfilError } = await completarPerfil(userId, {
      nombre: nombre.trim(),
      edad: parseInt(edad),
      peso_inicial_kg: parseFloat(peso),
      estatura_cm: parseFloat(estatura),
      objetivo,
    });

    if (perfilError) {
      setLoading(false);
      setError(perfilError);
      return;
    }

    // Forzar refresh para que _layout detecte perfil_completo = true
    await supabase.auth.refreshSession();
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Indicador de progreso */}
        <View style={styles.progreso}>
          {([1, 2, 3] as Paso[]).map((p) => (
            <View key={p} style={[styles.progresoPunto, paso >= p && styles.progresoPuntoActivo]} />
          ))}
        </View>

        {/* Paso 1 */}
        {paso === 1 && (
          <View style={styles.pasoContainer}>
            <Text style={styles.emoji}>👋</Text>
            <Text style={styles.titulo}>¡Hola! Cuéntanos sobre ti</Text>
            <Text style={styles.subtitulo}>Esto nos ayuda a personalizar tu experiencia</Text>
            <Text style={styles.label}>¿Cómo te llamas?</Text>
            <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Tu nombre" placeholderTextColor={Colors.textMuted} autoCapitalize="words" />
            <Text style={styles.label}>¿Cuántos años tienes?</Text>
            <TextInput style={styles.input} value={edad} onChangeText={setEdad} placeholder="Ej: 22" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" />
          </View>
        )}

        {/* Paso 2 */}
        {paso === 2 && (
          <View style={styles.pasoContainer}>
            <Text style={styles.emoji}>📏</Text>
            <Text style={styles.titulo}>Tus medidas iniciales</Text>
            <Text style={styles.subtitulo}>Solo para calcular tu progreso. Puedes actualizarlas después.</Text>
            <Text style={styles.label}>Peso actual (kg)</Text>
            <TextInput style={styles.input} value={peso} onChangeText={setPeso} placeholder="Ej: 70.5" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />
            <Text style={styles.label}>Estatura (cm)</Text>
            <TextInput style={styles.input} value={estatura} onChangeText={setEstatura} placeholder="Ej: 170" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />
          </View>
        )}

        {/* Paso 3 */}
        {paso === 3 && (
          <View style={styles.pasoContainer}>
            <Text style={styles.emoji}>🎯</Text>
            <Text style={styles.titulo}>¿Cuál es tu objetivo?</Text>
            <Text style={styles.subtitulo}>Elige el principal. Podrás cambiarlo después.</Text>
            <View style={styles.objetivosGrid}>
              {ObjetivosOptions.map((op) => (
                <TouchableOpacity
                  key={op.value}
                  style={[styles.objetivoCard, objetivo === op.value && styles.objetivoCardActivo]}
                  onPress={() => setObjetivo(op.value as ObjetivoFitness)}
                >
                  <Text style={styles.objetivoEmoji}>{op.emoji}</Text>
                  <Text style={[styles.objetivoLabel, objetivo === op.value && styles.objetivoLabelActivo]}>
                    {op.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        {/* Botones */}
        <View style={styles.botones}>
          {paso > 1 && (
            <TouchableOpacity
              style={styles.btnVolver}
              onPress={() => { setError(null); setPaso((prev) => (prev - 1) as Paso); }}
            >
              <Text style={styles.btnVolverText}>← Volver</Text>
            </TouchableOpacity>
          )}
          {paso < 3 ? (
            <TouchableOpacity style={styles.btnPrimary} onPress={siguientePaso}>
              <Text style={styles.btnPrimaryText}>Siguiente →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleGuardar}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.btnPrimaryText}>¡Empezar! 🚀</Text>
              }
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:             { flex: 1, backgroundColor: Colors.background },
  scroll:                { flexGrow: 1, padding: 24, paddingTop: 60 },
  progreso:              { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 40 },
  progresoPunto:         { width: 32, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  progresoPuntoActivo:   { backgroundColor: Colors.primary },
  pasoContainer:         { flex: 1, gap: 8 },
  emoji:                 { fontSize: 52, marginBottom: 8 },
  titulo:                { fontSize: 26, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  subtitulo:             { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 16 },
  label:                 { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4, marginTop: 8 },
  input:                 { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.text, fontSize: 15 },
  objetivosGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  objetivoCard:          { width: '46%', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 16, alignItems: 'center', gap: 8 },
  objetivoCardActivo:    { borderColor: Colors.primary, backgroundColor: Colors.surfaceLight },
  objetivoEmoji:         { fontSize: 32 },
  objetivoLabel:         { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center' },
  objetivoLabelActivo:   { color: Colors.primary },
  error:                 { color: Colors.error, fontSize: 13, marginTop: 16, textAlign: 'center' },
  botones:               { flexDirection: 'row', gap: 12, marginTop: 32, justifyContent: 'flex-end', alignItems: 'center' },
  btnVolver:             { padding: 16 },
  btnVolverText:         { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },
  btnPrimary:            { flex: 1, backgroundColor: Colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  btnDisabled:           { opacity: 0.6 },
  btnPrimaryText:        { color: Colors.white, fontWeight: '700', fontSize: 16 },
});