import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import supabase from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const loadPedidos = async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem('@adm_pedidos');
      const arr = raw ? JSON.parse(raw) : [];
      arr.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      setPedidos(arr);
    } catch (err) {
      console.warn('Erro ao carregar adm_pedidos', err);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPedidos();
  }, []);

  const tryDeleteRemote = async (id) => {
    if (!id || String(id).startsWith('adm_')) return;
    try {
      const { error } = await supabase.from('adm_pedidos').delete().eq('id', id);
      if (error) console.warn('Erro ao deletar adm_pedidos remoto:', error);
    } catch (e) {
      console.warn('Erro ao conectar Supabase para deletar adm_pedidos:', e);
    }
  };

  const deletePedido = (recordId) => {
    Alert.alert('Remover', 'Deseja remover este registro administrativo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            const raw = await AsyncStorage.getItem('@adm_pedidos');
            const arr = raw ? JSON.parse(raw) : [];
            const next = arr.filter((r) => String(r.id) !== String(recordId));
            await AsyncStorage.setItem('@adm_pedidos', JSON.stringify(next));
            await tryDeleteRemote(recordId);
            await loadPedidos();
          } catch (err) {
            console.warn('Erro ao remover adm_pedido', err);
            Alert.alert('Erro', 'Não foi possível remover o pedido.');
          }
        },
      },
    ]);
  };

  const clearAll = () => {
    Alert.alert('Limpar tudo', 'Deseja remover todos os registros administrativos?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpar',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            const raw = await AsyncStorage.getItem('@adm_pedidos');
            const arr = raw ? JSON.parse(raw) : [];
            for (const r of arr) {
              try { await tryDeleteRemote(r.id); } catch (e) { /* noop */ }
            }
            await AsyncStorage.removeItem('@adm_pedidos');
            setPedidos([]);
          } catch (err) {
            console.warn('Erro ao limpar adm_pedidos', err);
            Alert.alert('Erro', 'Não foi possível limpar os pedidos.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const syncFromRemote = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('adm_pedidos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) {
        console.warn('Erro ao buscar adm_pedidos remoto:', error);
        Alert.alert('Erro', 'Não foi possível sincronizar do Supabase (verifique permissões).');
      } else if (Array.isArray(data)) {
        const raw = await AsyncStorage.getItem('@adm_pedidos');
        const local = raw ? JSON.parse(raw) : [];
        const map = {};
        local.forEach(r => { map[String(r.id)] = r; });
        data.forEach(r => { map[String(r.id)] = { ...r, names: (r.metadata && r.metadata.names) || [] }; });
        const merged = Object.values(map);
        await AsyncStorage.setItem('@adm_pedidos', JSON.stringify(merged));
        setPedidos(merged.sort((a,b) => (b.created_at||'').localeCompare(a.created_at||'')));
        Alert.alert('Sincronizado', 'Dados sincronizados com sucesso.');
      }
    } catch (err) {
      console.warn('syncFromRemote err', err);
      Alert.alert('Erro', 'Falha ao sincronizar.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title ?? item.action ?? 'Registro'}</Text>
        <Text style={styles.meta}>Pedido: {item.pedido_id ?? '—'} • Qty: {item.qty ?? 1}</Text>
        <Text style={styles.metaSmall}>Nomes: {Array.isArray(item.names) ? item.names.join(', ') : (item.note ?? '')}</Text>
        <Text style={styles.metaSmall}>Criado: {item.created_at ? new Date(item.created_at).toLocaleString() : '—'}</Text>
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <TouchableOpacity style={styles.smallBtn} onPress={() => deletePedido(item.id)}>
          <Text style={styles.smallBtnText}>Remover</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pedidos administrativos</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={syncFromRemote} style={styles.headerBtn}><Text style={styles.headerBtnText}>Sincronizar</Text></TouchableOpacity>
          <TouchableOpacity onPress={clearAll} style={[styles.headerBtn, { backgroundColor: '#c0392b' }]}><Text style={styles.headerBtnText}>Limpar tudo</Text></TouchableOpacity>
        </View>
      </View>

      {loading ? <ActivityIndicator style={{ marginTop: 20 }} /> : (
        <FlatList
          data={pedidos}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ padding: 12 }}
          renderItem={renderItem}
          ListEmptyComponent={() => <Text style={{ textAlign: 'center', marginTop: 24, color: '#666' }}>Nenhum registro encontrado.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: Platform.OS === 'android' ? 28 : 12, paddingBottom: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#053e6b' },
  headerActions: { flexDirection: 'row' },
  headerBtn: { backgroundColor: '#0b4a74', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginLeft: 8 },
  headerBtnText: { color: '#fff', fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, backgroundColor: '#f6f8fa', borderRadius: 8, marginBottom: 10 },
  title: { fontWeight: '700', marginBottom: 6 },
  meta: { color: '#333' },
  metaSmall: { color: '#666', marginTop: 6, fontSize: 12 },
  smallBtn: { backgroundColor: '#eee', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  smallBtnText: { color: '#c0392b', fontWeight: '700' },
});
