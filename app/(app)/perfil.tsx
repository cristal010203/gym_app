import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useEffect, useState } from 'react';
import { Colors } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { completarPerfil } from '../../services/perfilService';

const OBJETIVOS = [
  { value: 'perder_peso',         label: '🔥 Perder peso' },
  { value: 'ganar_musculo',       label: '💪 Ganar músculo' },
  { value: 'mejorar_resistencia', label: '🏃 Mejorar resistencia' },
  { value: 'mantener_peso',       label: '⚖️ Mantener peso' },
  { value: 'flexibilidad',        label: '🧘 Flexibilidad' },
];

export default function PerfilScreen() {
  const { perfil, session } = useAuth();

  const [nombre, setNombre]     = useState('');
  const [edad, setEdad]         = useState('');
  const [peso, setPeso]         = useState('');
  const [estatura, setEstatura] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [loading, setLoading]   = useState(false);

  // Pre-cargar datos actuales del perfil
  useEffect(() => {
    if (!perfil) return;
    setNombre(perfil.nombre ?? '');
    setEdad(perfil.edad ? String(perfil.edad) : '');
    setPeso(perfil.peso_inicial_kg ? String(perfil.peso_inicial_kg) : '');
    setEstatura(perfil.estatura_cm ? String(perfil.estatura_cm) : '');
    setObjetivo(perfil.objetivo ?? '');
  }, [perfil]);

  async function guardarPerfil() {
    if (!session?.user?.id) return;

    setLoading(true);
    const { error } = await completarPerfil(session.user.id, {
      nombre,
      edad: Number(edad),
      peso_inicial_kg: Number(peso),
      estatura_cm: Number(estatura),
      objetivo,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error);
      return;
    }

    Alert.alert('Perfil actualizado', 'Los cambios fueron guardados correctamente');
  }

  const inicial = nombre ? nombre.charAt(0).toUpperCase() : '?';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Loading overlay */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Guardando cambios...</Text>
          </View>
        </View>
      </Modal>

      <View style={styles.content}>

        {/* Avatar con inicial */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{inicial}</Text>
        </View>

        <Text style={styles.title}>Mi Perfil</Text>

        {/* Formulario */}
        <View style={styles.form}>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              value={nombre}
              onChangeText={setNombre}
              placeholder="Tu nombre"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Edad</Text>
            <TextInput
              value={edad}
              onChangeText={setEdad}
              keyboardType="numeric"
              placeholder="18"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Peso (kg)</Text>
            <TextInput
              value={peso}
              onChangeText={setPeso}
              keyboardType="numeric"
              placeholder="70"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Estatura (cm)</Text>
            <TextInput
              value={estatura}
              onChangeText={setEstatura}
              keyboardType="numeric"
              placeholder="175"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />
          </View>

          {/* Selector de objetivo */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Objetivo fitness</Text>
            <View style={styles.objetivosContainer}>
              {OBJETIVOS.map((item) => {
                const activo = objetivo === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    onPress={() => setObjetivo(item.value)}
                    style={[styles.objetivoBtn, activo && styles.objetivoBtnActivo]}
                  >
                    <Text style={[styles.objetivoText, activo && styles.objetivoTextActivo]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Botón guardar */}
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnLoading]}
            onPress={guardarPerfil}
            disabled={loading}
          >
            <Text style={styles.saveText}>
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </Text>
          </TouchableOpacity>

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
    padding: 24,
    paddingTop: 60,
    paddingBottom: 120,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 40,
    paddingVertical: 32,
    borderRadius: 24,
    alignItems: 'center',
    gap: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadingText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 28,
  },
  form: {
    width: '100%',
    gap: 18,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.text,
    fontSize: 15,
  },
  objetivosContainer: {
    gap: 10,
  },
  objetivoBtn: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  objetivoBtnActivo: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  objetivoText: {
    color: Colors.text,
    fontWeight: '600',
  },
  objetivoTextActivo: {
    color: '#fff',
  },
  saveBtn: {
    marginTop: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
  },
  saveBtnLoading: {
    opacity: 0.7,
  },
  saveText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});