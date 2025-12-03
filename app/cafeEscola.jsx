import React, { useEffect, useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Platform,
    FlatList,
    Text,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getItems } from './data/cafeEscolaItens.js';

// obtem lista de itens do data
function useMergedItemsForSenac() {
    const [items, setItems] = useState([]);
    useEffect(() => {
        let mounted = true;
        (async () => {
            const base = getItems();
            try {
                const raw = await AsyncStorage.getItem('@products');
                const local = raw ? JSON.parse(raw) : [];
                const localSenac = (local || []).filter(p => p.vendor === 'senac');
                if (mounted) setItems([...localSenac, ...base]);
            } catch (e) {
                if (mounted) setItems(base);
            }
        })();
        return () => { mounted = false; };
    }, []);
    return items;
}

function useAdmStats() {
    const [stats, setStats] = useState({});
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const raw = await AsyncStorage.getItem('@adm_pedidos');
                const adm = raw ? JSON.parse(raw) : [];
                const map = {};
                (adm || []).forEach(r => {
                    const pid = String(r.product_id || r.metadata?.product_id || '');
                    if (!pid) return;
                    if (!map[pid]) map[pid] = { count: 0, names: [] };
                    map[pid].count += Number(r.qty || 0);
                    if (Array.isArray(r.names) && r.names.length) map[pid].names.push(...r.names);
                    else if (r.note) map[pid].names.push(...r.note.split(',').map(s => s.trim()));
                });
                if (mounted) setStats(map);
            } catch (e) {
                if (mounted) setStats({});
            }
        })();
        return () => { mounted = false; };
    }, []);
    return stats;
}

function Navbar({ placeholder = 'Buscar no café escola...', value, onChange }) {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar" style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#222" />
                </TouchableOpacity>

                <View style={styles.titleWrap}>
                    <Text style={styles.title}>CAFÉS</Text>
                    <Text style={styles.subtitle}>Hot drinks • drinks</Text>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => router.push('/carrinho')} accessibilityLabel="Carrinho" style={styles.iconBtn}>
                        <Ionicons name="cart-outline" size={22} color="#222" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/perfil')} accessibilityLabel="Perfil" style={styles.iconBtn}>
                        <Ionicons name="person-circle-outline" size={22} color="#222" />
                    </TouchableOpacity>
                </View>
            </View>

            
            {/* Search under header to mimic the reference */}
            <View style={styles.searchWrap}>
                <Ionicons name="search" size={18} color="#999" style={{ marginLeft: 12 }} />
                <TextInput
                    placeholder={placeholder}
                    placeholderTextColor="#999"
                    style={styles.searchInput}
                    value={value}
                    onChangeText={onChange}
                    returnKeyType="search"
                    accessible
                    accessibilityLabel="Busca"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>
        </SafeAreaView>
    );
}

function InfoCard({ item, onPress, admStats }) {
    // use item.subtitle or item.price if available
    const subtitle = item.subtitle ?? item.price ?? '';

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onPress(item)}
            accessibilityRole="button"
            accessibilityLabel={item.title}
            activeOpacity={0.8}
        >
            <View style={styles.cardLeft}>
                {/* <Image source={item.image} style={styles.image} resizeMode="cover" /> */}
            </View>

            <View style={styles.cardRight}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                </Text>
                {subtitle ? <Text style={styles.cardSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
            </View>

            <View style={styles.chevWrap}>
                <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
        </TouchableOpacity>
    );
}

export default function LanchoneteScreen() {
    const router = useRouter();
    const items = useMergedItemsForSenac();
    const admStats = useAdmStats();
    const openDetail = (item) => { router.push(`/lanchonete/${item.id}`); };
    const [search, setSearch] = useState('');

    const normalized = search.trim().toLowerCase();
    const visibleItems = normalized
        ? items.filter((item) => String(item.title || '').toLowerCase().includes(normalized))
        : items;

    return (
        <View style={styles.screen}>
             <Navbar value={search} onChange={setSearch} />

            <FlatList
                data={visibleItems}
                keyExtractor={(i) => String(i.id)}
                numColumns={1}
                contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 12 }}
                renderItem={({ item }) => <InfoCard item={item} onPress={openDetail} admStats={admStats} />}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <Text style={{ textAlign: 'center', marginTop: 32, color: '#666' }}>
                        Nenhum item encontrado
                    </Text>
                )}
            />
            
        </View>

        
    );
}



const styles = StyleSheet.create({
    safe: {
        backgroundColor: '#fff',
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
    },
    header: {
        height: 72,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
		marginTop: Platform.OS === 'android' ? 25 : 0,
    },
    backBtn: {
        width: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleWrap: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#222',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 11,
        color: '#888',
        marginTop: 2,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBtn: {
        marginLeft: 6,
        padding: 6,
    },

    searchWrap: {
        marginHorizontal: 12,
        marginBottom: 12,
        backgroundColor: '#f6f6f6',
        height: 44,
        borderRadius: 22,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: '#ececec',
    },
    searchInput: {
        flex: 1,
        paddingHorizontal: 12,
        color: '#000',
        fontSize: 14,
    },

    screen: {
        flex: 1,
        backgroundColor: '#fff',
    },

    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        // subtle card shadow
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    cardLeft: {
        width: 84,
        height: 84,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    cardRight: {
        flex: 1,
        paddingLeft: 12,
        paddingRight: 6,
        justifyContent: 'center',
    },
    cardTitle: {
        color: '#222',
        fontSize: 15,
        fontWeight: '600',
    },
    cardSubtitle: {
        marginTop: 6,
        color: '#888',
        fontSize: 13,
    },
    chevWrap: {
        width: 28,
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingLeft: 6,
    },
    separator: {
        height: 12,
    },
});
