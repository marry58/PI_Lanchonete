import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity style={{ position: 'absolute', left: 12, top: Platform.OS === 'android' ? 30 : 14, zIndex: 60 }} onPress={() => router.push('/home')} accessibilityLabel="Ir para home">
        <Ionicons name="home" size={24} color="#053e6b" />
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.title}>Painel de Administrador</Text>
      </View>

      <View style={styles.container}>
        <TouchableOpacity style={styles.card} onPress={() => router.push('/admPedidos')} accessibilityRole="button" accessibilityLabel="Ver pedidos">
          <Ionicons name="list" size={28} color="#053e6b" />
          <Text style={styles.cardText}>Ver lista de pedidos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push('/cadProduto')} accessibilityRole="button" accessibilityLabel="Cadastrar produto">
          <Ionicons name="add-circle" size={28} color="#053e6b" />
          <Text style={styles.cardText}>Cadastrar produto</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { height: 84, justifyContent: 'center', alignItems: 'center', paddingTop: Platform.OS === 'android' ? 24 : 0, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  title: { fontSize: 20, fontWeight: '700', color: '#053e6b' },
  container: { flex: 1, padding: 18, justifyContent: 'flex-start' },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 10, backgroundColor: '#f6f8fa', marginBottom: 12 },
  cardText: { marginLeft: 12, fontSize: 16, color: '#222', fontWeight: '600' },
});
