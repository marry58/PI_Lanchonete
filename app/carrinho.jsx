import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import supabase from './lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function Carrinho() {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [placing, setPlacing] = useState(false);
    const router = useRouter();

    // formata número para BRL com fallback
    const formatCurrency = (v) => {
        const n = Number(v) || 0;
        try {
            if (typeof Intl !== 'undefined' && Intl.NumberFormat) {
                return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
            }
        } catch (e) { /* fallback */ }
        return `R$ ${n.toFixed(2)}`;
    };

    useEffect(() => {
        let unsub = null;
        if (router && typeof router.addListener === 'function') {
            unsub = router.addListener('focus', () => { loadCart(); });
        }
        // carregar imediatamente
        loadCart();
        return () => { if (typeof unsub === 'function') unsub(); };
    }, [router]);

    const normalizeItem = (it) => {
        // image pode ser require() ou { uri: ... }
        const image = it && it.image ? it.image : null;
        const priceNum = Number(it?.priceNum ?? it?.price ?? 0) || 0;
        const qty = Math.max(1, Number(it?.qty ?? 1) || 1);
        return { ...it, image, priceNum, qty, priceLabel: it?.priceLabel ?? it?.priceDisplay ?? formatCurrency(priceNum) };
    };

    const loadCart = async () => {
        try {
            setLoading(true);
            const stored = await AsyncStorage.getItem('@cart');
            const arr = stored ? JSON.parse(stored) : [];
            // garantir formato: priceNum (number) e qty (number)
            const normalized = (arr || []).map(it => normalizeItem(it));
            setCart(normalized);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Erro ao ler carrinho', err);
            Alert.alert('Erro', 'Não foi possível carregar o carrinho.');
            setCart([]);
        } finally {
            setLoading(false);
        }
    };

    const saveCart = async (arr) => {
        try {
            // persistir cópia serializável (evita funções/refs)
            const serializable = (arr || []).map(it => ({
                id: it.id,
                title: it.title,
                image: it.image, // aceita require() ou {uri}
                priceNum: Number(it.priceNum || 0),
                priceLabel: it.priceLabel,
                qty: Number(it.qty || 1),
            }));
            await AsyncStorage.setItem('@cart', JSON.stringify(serializable));
            // normaliza ao setar estado
            const normalized = serializable.map(it => normalizeItem(it));
            setCart(normalized);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Erro ao salvar carrinho', err);
            Alert.alert('Erro', 'Não foi possível atualizar o carrinho.');
        }
    };

    const removeItem = (index) => {
        const arr = cart.filter((_, i) => i !== index);
        saveCart(arr);
    };

    const setItemQty = (index, qty) => {
        const newQty = Math.max(1, Math.floor(Number(qty) || 1));
        const arr = cart.map((it, i) => (i === index ? { ...it, qty: newQty } : it));
        saveCart(arr);
    };

    const incrementQty = (index) => {
        const arr = cart.map((it, i) => (i === index ? { ...it, qty: Number(it.qty || 1) + 1 } : it));
        saveCart(arr);
    };

    const decrementQty = (index) => {
        const arr = cart.map((it, i) => {
            if (i !== index) return it;
            const next = Number(it.qty || 1) - 1;
            return { ...it, qty: Math.max(1, next) };
        });
        saveCart(arr);
    };

    const clearCart = () => {
        Alert.alert('Confirmar', 'Deseja limpar todo o carrinho?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Limpar', style: 'destructive', onPress: async () => { await saveCart([]); } },
        ]);
    };

    // confirma e chama placeOrder
    const checkout = () => {
        if (!cart || cart.length === 0) {
            Alert.alert('Carrinho vazio', 'Adicione itens antes de finalizar.');
            return;
        }
        const total = cart.reduce((s, it) => s + (Number(it.priceNum || 0) * Number(it.qty || 1)), 0);
        Alert.alert(
            'Confirmar pedido',
            `Total: ${formatCurrency(total)}\nDeseja confirmar o pedido?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Confirmar', onPress: () => placeOrder() },
            ]
        );
    };

    // insere pedido + itens no Supabase; fallback salva localmente em @pedidos
    const placeOrder = async () => {
        if (placing) return;
        if (!cart || cart.length === 0) {
            Alert.alert('Carrinho vazio', 'Adicione itens antes de finalizar.');
            return;
        }
        setPlacing(true);
        const total = cart.reduce((s, it) => s + (Number(it.priceNum || 0) * Number(it.qty || 1)), 0);
        try {
            // tenta obter usuário autenticado pelo Supabase
            let authUserId = null;
            try {
                const { data: userData, error: userErr } = await supabase.auth.getUser();
                if (!userErr && userData?.user) authUserId = userData.user.id;
            } catch (e) { /* noop */ }

            // fallback: tentar obter usuário salvo localmente
            if (!authUserId) {
                const storedUser = await AsyncStorage.getItem('@user');
                if (storedUser) {
                    try {
                        const parsed = JSON.parse(storedUser);
                        authUserId = parsed?.id ?? parsed?.auth_user_id ?? null;
                    } catch (e) { /* noop */ }
                }
            }

            // tentar obter usuario registrado (tabela usuario) salvo localmente
            let usuarioRecord = null;
            try {
                const storedUsuario = await AsyncStorage.getItem('@usuario');
                usuarioRecord = storedUsuario ? JSON.parse(storedUsuario) : null;
            } catch (e) { /* noop */ }

            // criar pedido no Supabase
            const pedidoPayload = {
                usuario_id: usuarioRecord?.id ?? null,
                auth_user_id: authUserId,
                total,
                status: 'pending',
                created_at: new Date().toISOString(),
            };

            let pedidoData = null;
            try {
                const { data, error } = await supabase
                    .from('pedidos')
                    .insert([pedidoPayload])
                    .select()
                    .maybeSingle();
                if (error || !data) {
                    console.warn('Supabase pedidos insert error', error);
                } else {
                    pedidoData = data;
                }
            } catch (e) {
                console.warn('Erro ao inserir pedido no Supabase', e);
            }

            // se inserção no Supabase falhar, salvar pedido localmente como fallback
            if (!pedidoData) {
                const stored = await AsyncStorage.getItem('@pedidos');
                const arr = stored ? JSON.parse(stored) : [];
                const localPedido = {
                    id: Date.now().toString(),
                    usuario_id: usuarioRecord?.id ?? null,
                    auth_user_id: authUserId ?? null,
                    total,
                    status: 'pending',
                    items: cart,
                    created_at: new Date().toISOString(),
                };
                arr.push(localPedido);
                await AsyncStorage.setItem('@pedidos', JSON.stringify(arr));
                await saveCart([]);
                Alert.alert('Pedido salvo localmente', 'Não foi possível enviar para o servidor. Pedido salvo localmente.');
                setPlacing(false);
                return;
            }

            // inserir itens do pedido no Supabase (associa ao pedido recém-criado)
            try {
                const itemsPayload = cart.map(it => ({
                    pedido_id: pedidoData.id,
                    product_id: null,
                    title: it.title,
                    price: Number(it.priceNum || 0),
                    qty: Number(it.qty || 1),
                    metadata: {},
                }));
                const { error: itemsErr } = await supabase.from('pedido_items').insert(itemsPayload);
                if (itemsErr) console.warn('Supabase pedido_items insert error', itemsErr);
            } catch (e) {
                console.warn('Erro ao inserir itens do pedido no Supabase', e);
            }

            // --- NOVO: criar registros adm_pedidos locais e tentar enviar ao Supabase ---
            try {
                // prepara registros administrativos por item
                const admRecords = [];
                // obter nome do usuário de forma sequencial (evita usar .then em valor já resolvido)
                let usuarioNome = usuarioRecord?.nome || null;
                try {
                    const localUserRaw = await AsyncStorage.getItem('@user');
                    if (localUserRaw) {
                        try {
                            const parsedLocal = JSON.parse(localUserRaw);
                            // se ainda não temos nome, tentar usar email
                            if (!usuarioNome) usuarioNome = parsedLocal?.email || null;
                        } catch { /* ignore parse errors */ }
                    }
                } catch { /* ignore storage errors */ }

                cart.forEach((it, idx) => {
                    const repeatCount = Number(it.qty || 1);
                    const namesRepeated = Array.from({ length: repeatCount }, () => usuarioNome || 'Usuário');
                    admRecords.push({
                        id: `adm_${Date.now()}_${idx}`,
                        pedido_id: pedidoData?.id ?? null,
                        admin_user_id: authUserId ?? null,
                        usuario_id: usuarioRecord?.id ?? null,
                        product_id: it.id ?? null,
                        title: it.title,
                        qty: repeatCount,
                        names: namesRepeated,
                        note: namesRepeated.join(', '),
                        action: 'order',
                        status: 'created',
                        created_at: new Date().toISOString(),
                    });
                });

                // salvar localmente (append)
                const rawAdm = await AsyncStorage.getItem('@adm_pedidos');
                const admArr = rawAdm ? JSON.parse(rawAdm) : [];
                const newAdmArr = [...admArr, ...admRecords];
                await AsyncStorage.setItem('@adm_pedidos', JSON.stringify(newAdmArr));

                // tentar enviar ao Supabase (opcional; pode falhar por RLS)
                (async () => {
                    try {
                        if (pedidoData && Array.isArray(admRecords) && admRecords.length > 0) {
                            const toInsert = admRecords.map(r => ({
                                pedido_id: r.pedido_id,
                                admin_user_id: r.admin_user_id,
                                usuario_id: r.usuario_id,
                                action: r.action,
                                note: r.note,
                                status: r.status,
                                metadata: { product_id: r.product_id, title: r.title, qty: r.qty },
                            }));
                            const { data: admResult, error: admErr } = await supabase.from('adm_pedidos').insert(toInsert);
                            if (admErr) console.warn('Supabase adm_pedidos insert error', admErr);
                        }
                    } catch (e) {
                        console.warn('Erro ao inserir adm_pedidos no Supabase', e);
                    }
                })();
            } catch (admErr) {
                console.warn('Erro ao criar adm_pedidos locais', admErr);
            }

            // sucesso: limpa carrinho e informa usuário
            await saveCart([]);
            Alert.alert('Pedido enviado', 'Seu pedido foi enviado com sucesso.');
        } catch (err) {
            console.error('placeOrder err', err);
            Alert.alert('Erro', 'Não foi possível finalizar o pedido. Tente novamente.');
        } finally {
            setPlacing(false);
        }
    };

    const renderItem = ({ item, index }) => {
        const itemTotal = Number(item.priceNum || 0) * Number(item.qty || 1);
        return (
            <View style={styles.itemRow}>
                <Image source={item.image} style={styles.thumb} resizeMode="cover" />
                <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemMeta}>{item.priceLabel ?? formatCurrency(item.priceNum)}</Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                        <TouchableOpacity onPress={() => decrementQty(index)} style={styles.qtyBtn} accessibilityLabel={`Diminuir quantidade de ${item.title}`}>
                            <Text style={styles.qtyText}>−</Text>
                        </TouchableOpacity>

                        <View style={styles.qtyDisplay}>
                            <Text accessibilityLabel={`Quantidade de ${item.title}`} style={styles.qtyNumber}>{String(item.qty ?? 1)}</Text>
                        </View>

                        <TouchableOpacity onPress={() => incrementQty(index)} style={styles.qtyBtn} accessibilityLabel={`Aumentar quantidade de ${item.title}`}>
                            <Text style={styles.qtyText}>+</Text>
                        </TouchableOpacity>

                        <Text style={{ marginLeft: 12, color: '#024281', fontWeight: '700' }}>{formatCurrency(itemTotal)}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => removeItem(index)} style={styles.removeBtn} accessibilityLabel={`Remover ${item.title}`}>
                    <Text style={styles.removeText}>Remover</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const total = cart.reduce((s, it) => s + (Number(it.priceNum || 0) * Number(it.qty || 1)), 0);

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
                    <Text style={styles.back}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Carrinho</Text>
            </View>

            <View style={styles.container}>
                {loading ? <Text>Carregando...</Text> : null}

                {!loading && (!cart || cart.length === 0) ? (
                    <View style={styles.emptyWrap}>
                        <Text style={styles.emptyText}>Seu carrinho está vazio.</Text>
                        <TouchableOpacity style={styles.continueBtn} onPress={() => router.push('/lanchonete')}>
                            <Text style={styles.continueText}>Continuar comprando</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={cart}
                        keyExtractor={(_, i) => String(i)}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingBottom: 24 }}
                    />
                )}

                <View style={styles.footer}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
                    </View>

                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={[styles.btn, styles.clearBtn]} onPress={clearCart}>
                            <Text style={styles.clearText}>Limpar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, styles.checkoutBtn]} onPress={checkout} disabled={placing}>
                            <Text style={styles.checkoutText}>{placing ? 'Enviando...' : 'Finalizar'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    header: { height: 56, backgroundColor: '#123a63', justifyContent: 'center', paddingLeft: 12 },
    back: { position: 'absolute', left: 12, top: 16, color: '#fff' },
    title: { color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 18 },
    container: { flex: 1, padding: 12 },
    itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#f6f8fa', padding: 8, borderRadius: 8 },
    thumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#eee' },
    itemInfo: { flex: 1, paddingLeft: 12 },
    itemTitle: { fontWeight: '700' },
    itemMeta: { color: '#666', marginTop: 6 },
    removeBtn: { paddingHorizontal: 8, paddingVertical: 6 },
    removeText: { color: '#c0392b' },
    footer: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#eee' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 6 },
    totalLabel: { fontSize: 16, fontWeight: '700' },
    totalValue: { fontSize: 16, fontWeight: '700', color: '#024281' },
    actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 6 },
    clearBtn: { backgroundColor: '#eee' },
    clearText: { color: '#333', fontWeight: '700' },
    checkoutBtn: { backgroundColor: '#123a63' },
    checkoutText: { color: '#fff', fontWeight: '700' },
    emptyWrap: { alignItems: 'center', marginTop: 36 },
    emptyText: { color: '#666', marginBottom: 12 },
    continueBtn: { backgroundColor: '#123a63', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    continueText: { color: '#fff', fontWeight: '700' },

    /* novos estilos de quantidade */
    qtyBtn: {
        width: 34,
        height: 34,
        borderRadius: 6,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyText: { fontSize: 20, color: '#333', fontWeight: '700' },
    qtyDisplay: {
        width: 44,
        height: 34,
        marginHorizontal: 8,
        borderRadius: 6,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyNumber: { fontSize: 15, fontWeight: '700' },
});
