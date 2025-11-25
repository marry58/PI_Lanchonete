import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getItems } from '../data/cafeEscolaItens.js';
import { Ionicons } from '@expo/vector-icons';

export default function ItemDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    // obtém itens do data e encontra o item atual
    const ITEMS = getItems();
    const item = ITEMS.find((i) => String(i.id) === String(id));
    const [qty, setQty] = useState(1);

    // formata número para BRL com fallback (usa priceNum quando disponível)
    const formatCurrency = (v) => {
        const n = Number(v) || 0;
        try {
            if (typeof Intl !== 'undefined' && Intl.NumberFormat) {
                return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
            }
        } catch (e) { /* fallback */ }
        return `R$ ${n.toFixed(2)}`;
    };

    // adiciona ao carrinho; se já existir aumenta qty
    const handleOrder = async () => {
        if (!item) {
            Alert.alert('Erro', 'Item não encontrado.');
            return;
        }
        try {
            const stored = await AsyncStorage.getItem('@cart');
            const cart = stored ? JSON.parse(stored) : [];

            const idx = cart.findIndex((c) => String(c.id) === String(item.id));
            if (idx >= 0) {
                // atualiza quantidade
                cart[idx].qty = Number(cart[idx].qty || 1) + Number(qty || 1);
            } else {
                cart.push({
                    id: item.id,
                    title: item.title,
                    qty: Number(qty || 1),
                    priceNum: Number(item.priceNum || item.price || 0),
                    priceLabel: item.priceLabel || item.priceDisplay || formatCurrency(item.priceNum),
                    image: item.image,
                });
            }

            await AsyncStorage.setItem('@cart', JSON.stringify(cart));

            Alert.alert(
                'Adicionado',
                `${qty} x ${item.title} adicionado ao carrinho.`,
                [
                    { text: 'Continuar', style: 'cancel' },
                    { text: 'Ver carrinho', onPress: () => router.push('/carrinho') },
                ]
            );
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Erro ao salvar no carrinho', err);
            Alert.alert('Erro', 'Não foi possível adicionar ao carrinho.');
        }
    };

    if (!item) {
        return (
            <View style={styles.container}>
                <Text>Item não encontrado</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <TouchableOpacity style={{ position: 'absolute', left: 12, top: Platform.OS === 'android' ? 30 : 14, zIndex: 60 }} onPress={() => router.push('/home')} accessibilityLabel="Ir para home">
                <Ionicons name="home" size={22} color="#0b4a74" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.back} onPress={() => router.back()} accessibilityLabel="Voltar">
                <Text style={styles.backText}>←</Text>
            </TouchableOpacity>

            <Text style={styles.title}>{item.title}</Text>

            {/* imagem (suporta require() ou {uri: ...}) */}
            <Image source={item.image} style={styles.image} resizeMode="contain" />

            {/* preço */}
            <Text style={styles.price}>{item.priceDisplay ?? formatCurrency(item.priceNum)}</Text>

            {/* Ingredientes */}
            <Text style={styles.sectionTitle}>Descrição</Text>
            <View style={styles.ingredientPill}>
                <Text style={styles.ingredientText}>{item.description}</Text>
            </View>

            {/* Quantidade */}
            <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Quantidade</Text>
            <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty((q) => Math.max(1, q - 1))} accessibilityLabel="Diminuir quantidade">
                    <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>

                <Text style={styles.qtyValue}>{qty}</Text>

                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty((q) => q + 1)} accessibilityLabel="Aumentar quantidade">
                    <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
            </View>

            {/* Botão adicionar ao carrinho */}
            <TouchableOpacity style={styles.orderBtn} onPress={handleOrder} accessibilityLabel="Adicionar ao carrinho">
                <Text style={styles.orderBtnText}>Adicionar ao carrinho · {item.priceDisplay ? item.priceDisplay : formatCurrency(item.priceNum)}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: 'center', padding: 20 },
    back: { alignSelf: 'flex-start', marginBottom: 12 },
    backText: { color: '#0b4a74', fontWeight: '600' },
    title: { fontSize: 30, color: '#FF9749', fontWeight: '700', marginBottom: 12 },
    image: { width: 240, height: 240, marginBottom: 12 },
    price: { fontSize: 28, color: '#024281', fontWeight: '600', marginBottom: 8 },
    desc: { fontSize: 16, color: '#333', textAlign: 'center' },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 12 },
    ingredientPill: {
        marginTop: 8,
        backgroundColor: '#eee',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        width: '90%',
        alignItems: 'center',
    },
    ingredientText: { color: '#555', textAlign: 'center' },
    qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    qtyBtn: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 18,
    },
    qtyBtnText: { fontSize: 20, fontWeight: '600' },
    qtyValue: { fontSize: 18, fontWeight: '700' },
    orderBtn: {
        marginTop: 24,
        backgroundColor: '#053e6b',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    orderBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
