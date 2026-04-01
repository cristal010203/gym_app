import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants';

export default function PerfilScreen() {
  const { perfil } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Perfil</Text>
      <Text style={styles.nombre}>{perfil?.nombre}</Text>
      <Text style={styles.sub}>Próximamente: editar perfil y medidas corporales</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 8 },
  titulo: { fontSize: 26, fontWeight: '800', color: Colors.text },
  nombre: { fontSize: 18, color: Colors.primary, fontWeight: '600' },
  sub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 8 },
});