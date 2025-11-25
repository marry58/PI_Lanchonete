import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, StatusBar } from 'react-native';

const SAMPLE = [
    { id: '1', title: 'Assados', qty: 7, names: ['Giovanna Mesquita', 'Marry Shayma', 'Arthur Oliveira', 'Catia Pereira', 'Kauan Castro', 'Nathan Santos', 'Natalia Cruz'] },
    { id: '2', title: 'Bauru', qty: 6, names: ['Aluno A', 'Aluno B', 'Aluno C', 'Aluno D', 'Aluno E', 'Aluno F'] },
    { id: '3', title: 'Misto quente', qty: 7, names: ['Pessoa 1', 'Pessoa 2', 'Pessoa 3', 'Pessoa 4', 'Pessoa 5', 'Pessoa 6', 'Pessoa 7'] },
    { id: '4', title: 'Água', qty: 0, names: [] },
];

export default function AdmPedidos() {
    const [modalVisible, setModalVisible] = useState(false);
    const [selected, setSelected] = useState(null);

    function openFor(item) {
        setSelected(item);
        setModalVisible(true);
    }

    function closeModal() {
        
        setModalVisible(false);
        setSelected(null);
    }

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <Text style={styles.headerText}>Pedidos</Text>
            </View>

            <ScrollView contentContainerStyle={styles.listWrap}>
                {SAMPLE.map((it) => (
                    <View key={it.id} style={styles.rowWrap}>
                        <Text style={styles.title}>{it.title}</Text>
                        <View style={styles.rightGroup}>
                            <Text style={styles.qty}>{it.qty}</Text>
                            <TouchableOpacity style={styles.openBtn} onPress={() => openFor(it)} accessibilityLabel={`Abrir ${it.title}`}>
                                <Text style={styles.chev}>▾</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                <TouchableOpacity style={styles.clearBtn} onPress={() => { /* limpar pedidos: mock */ }}>
                    <Text style={styles.clearText}>Limpar pedidos</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{selected ? selected.title : ''}</Text>

                        <View style={styles.modalListWrap}>
                            <ScrollView>
                                {selected && selected.names.length > 0 ? (
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
    rightGroup: { flexDirection: 'row', alignItems: 'center' },
    qty: { marginRight: 8, fontWeight: '700' },
    openBtn: { width: 36, height: 28, backgroundColor: '#e1edf6', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    chev: { fontSize: 16, color: '#2a4b6f' },
    clearBtn: { marginTop: 8, backgroundColor: '#123a63', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    clearText: { color: '#fff', fontWeight: '700' },

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
