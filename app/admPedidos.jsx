import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, StatusBar, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import supabase from './lib/supabase';

const ADMIN_STORAGE_KEY = '@adm_pedidos';

const parseNamesFromNote = (note) => {
    if (Array.isArray(note)) return note;
    if (typeof note !== 'string') return [];
    return note
        .split(',')
        .map((n) => n.trim())
        .filter((n) => n.length > 0);
};

const normalizeAdminRecord = (record) => {
    if (!record) return null;
    const metadata = record.metadata || {};
    const names = Array.isArray(record.names) ? record.names : parseNamesFromNote(record.note);
    const qtyRaw = record.qty ?? metadata.qty ?? names.length ?? 0;
    const qty = Number(qtyRaw) > 0 ? Number(qtyRaw) : Math.max(1, names.length);
    const title = record.title || metadata.title || 'Pedido';
    const createdAt = record.created_at || new Date().toISOString();
    return {
        id: record.id || record.pedido_id || `${title}_${createdAt}`,
        title,
        qty,
        names,
        created_at: createdAt,
    };
};

const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    const day = date.toLocaleDateString('pt-BR');
    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${day} ${time}`;
};

export default function AdmPedidos() {
    const router = useRouter();
    const [modalVisible, setModalVisible] = useState(false);
    const [selected, setSelected] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    function openFor(item) {
        setSelected(item);
        setModalVisible(true);
    }

    function closeModal() {
        setModalVisible(false);
        setSelected(null);
    }

    const fetchRemoteOrders = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('adm_pedidos')
                .select('id,pedido_id,usuario_id,admin_user_id,note,metadata,status,created_at')
                .order('created_at', { ascending: false })
                .limit(200);
            if (error) {
                console.warn('Supabase adm_pedidos error:', error);
                return [];
            }
            return data || [];
        } catch (err) {
            console.warn('Erro ao buscar pedidos no Supabase:', err);
            return [];
        }
    }, []);

    const loadOrders = useCallback(async () => {
        setLoading(true);
        try {
            const [remote, localRaw] = await Promise.all([
                fetchRemoteOrders(),
                AsyncStorage.getItem(ADMIN_STORAGE_KEY),
            ]);
            const localList = localRaw ? JSON.parse(localRaw) : [];
            const merged = [...(remote || []), ...(localList || [])]
                .map((item) => normalizeAdminRecord(item))
                .filter(Boolean)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setOrders(merged);
        } catch (err) {
            console.error('Erro ao carregar pedidos do admin:', err);
            Alert.alert('Erro', 'Não foi possível carregar os pedidos.');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [fetchRemoteOrders]);

    useEffect(() => {
        let unsubscribe = null;
        if (router && typeof router.addListener === 'function') {
            unsubscribe = router.addListener('focus', loadOrders);
        }
        loadOrders();
        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, [router, loadOrders]);

    const clearLocalOrders = useCallback(async () => {
        Alert.alert('Limpar pedidos', 'Deseja remover os pedidos salvos localmente?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Limpar',
                style: 'destructive',
                onPress: async () => {
                    await AsyncStorage.removeItem(ADMIN_STORAGE_KEY);
                    await loadOrders();
                },
            },
        ]);
    }, [loadOrders]);

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <Text style={styles.headerText}>Pedidos</Text>
            </View>

            <ScrollView contentContainerStyle={styles.listWrap}>
                {loading ? (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator color="#123a63" size="small" />
                        <Text style={styles.loadingText}>Carregando pedidos...</Text>
                    </View>
                ) : orders.length === 0 ? (
                    <Text style={styles.empty}>Nenhum pedido recebido ainda.</Text>
                ) : (
                    orders.map((it) => (
                        <View key={it.id} style={styles.rowWrap}>
                            <View>
                                <Text style={styles.title}>{it.title}</Text>
                                <Text style={styles.subtitle}>{formatDateTime(it.created_at)}</Text>
                            </View>
                            <View style={styles.rightGroup}>
                                <Text style={styles.qty}>{it.qty}</Text>
                                <TouchableOpacity style={styles.openBtn} onPress={() => openFor(it)} accessibilityLabel={`Abrir ${it.title}`}>
                                    <Text style={styles.chev}>▾</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}

                <TouchableOpacity style={styles.clearBtn} onPress={clearLocalOrders}>
                    <Text style={styles.clearText}>Limpar pedidos locais</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{selected ? selected.title : ''}</Text>

                        <View style={styles.modalListWrap}>
                            <ScrollView>
                                {selected && selected.names && selected.names.length > 0 ? (
                                    selected.names.map((n, idx) => (
                                        <Text key={idx} style={styles.modalItem}>{idx + 1}. {n}</Text>
                                    ))
                                ) : (
                                    <Text style={styles.empty}>Nenhum pedido</Text>
                                )}
                            </ScrollView>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={closeModal} style={styles.modalClose}>
                                <Text style={styles.modalCloseText}>Fechar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // fundo neutro: removida a moldura rosa solicitada
    safe: { flex: 1, backgroundColor: '#ffffff' },
    header: { height: 56, backgroundColor: '#123a63', justifyContent: 'center', paddingLeft: 12 },
    headerText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    listWrap: { padding: 12, paddingBottom: 40 },
    // cartão mais claro para os itens
    rowWrap: { backgroundColor: '#e9f0f6', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontSize: 14, fontStyle: 'italic' },
    subtitle: { fontSize: 11, color: '#5a6b7f', marginTop: 2 },
    rightGroup: { flexDirection: 'row', alignItems: 'center' },
    qty: { marginRight: 8, fontWeight: '700' },
    openBtn: { width: 36, height: 28, backgroundColor: '#e1edf6', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    chev: { fontSize: 16, color: '#2a4b6f' },
    clearBtn: { marginTop: 8, backgroundColor: '#123a63', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    clearText: { color: '#fff', fontWeight: '700' },
    loadingWrap: { paddingVertical: 32, alignItems: 'center' },
    loadingText: { marginTop: 8, color: '#555' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalCard: { width: '100%', maxWidth: 420, backgroundColor: '#ffffff', borderRadius: 8, padding: 12 },
    modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
    modalListWrap: { maxHeight: 220, borderRadius: 6, backgroundColor: '#f7fafb', padding: 10 },
    modalItem: { paddingVertical: 6, fontSize: 14, color: '#333' },
    empty: { padding: 12, color: '#666' },
    modalActions: { marginTop: 10, alignItems: 'flex-end' },
    modalClose: { paddingHorizontal: 12, paddingVertical: 8 },
    modalCloseText: { color: '#123a63', fontWeight: '700' },
});
