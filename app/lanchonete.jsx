import React, { useEffect, useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Platform, FlatList, Image, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { getItems } from './data/cafeEscolaItens.js';

// obtem lista inicial de itens do data e mescla com itens locais (vendor='sesc')
function useMergedItemsForSesc() {
	const [items, setItems] = useState([]);
	useEffect(() => {
		let mounted = true;
		(async () => {
			const base = getItems();
			try {
				const raw = await AsyncStorage.getItem('@products');
				const local = raw ? JSON.parse(raw) : [];
				const localSesc = (local || []).filter(p => p.vendor === 'sesc');
				if (mounted) setItems([...localSesc, ...base]);
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
					// adicionar nomes repetidos (já armazenados)
					if (Array.isArray(r.names) && r.names.length) {
						map[pid].names.push(...r.names);
					} else if (r.note) {
						map[pid].names.push(...r.note.split(',').map(s => s.trim()));
					}
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

function Navbar({ placeholder = 'Buscar no café escola...' }) {
	const router = useRouter();

	return (
		<SafeAreaView style={styles.safe}>
			<View style={styles.container}>
				<TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
					<Ionicons name="arrow-back" size={24} color="#fff" />
				</TouchableOpacity>

				<View style={styles.searchWrap}>
					<Ionicons name="search" size={18} color="#999" style={{ marginLeft: 8 }} />
					<TextInput
						placeholder={placeholder}
						placeholderTextColor="#999"
						style={styles.searchInput}
						returnKeyType="search"
						accessible
						accessibilityLabel="Busca"
					/>
				</View>

				<View style={styles.actions}>
					<TouchableOpacity onPress={() => router.push('/carrinho')} style={styles.iconBtn} accessibilityLabel="Carrinho">
						<Ionicons name="cart-outline" size={22} color="#fff" />
					</TouchableOpacity>
					<TouchableOpacity onPress={() => router.push('/perfil')} style={styles.iconBtn} accessibilityLabel="Perfil">
						<Ionicons name="person-circle-outline" size={22} color="#fff" />
					</TouchableOpacity>
				</View>
			</View>
		</SafeAreaView>
	);
}

function InfoCard({ item, onPress, admStats }) {
	const stat = admStats?.[String(item.id)] || { count: 0, names: [] };

	return (
		<TouchableOpacity style={styles.card} onPress={() => onPress(item)} accessibilityRole="button" accessibilityLabel={item.title}>
			<View style={styles.imageWrap}>
				<Image source={item.image} style={styles.image} resizeMode="cover" />
				{/* badge */}
				{stat.count > 0 ? (
					<TouchableOpacity
						style={{ position: 'absolute', right: 8, top: 8, backgroundColor: '#e8f4fb', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10 }}
						onPress={() => Alert.alert(item.title, (stat.names.length ? stat.names : [String(stat.count)]).join('\n'))}
					>
						<Text style={{ color: '#024281', fontWeight: '700' }}>{stat.count}</Text>
					</TouchableOpacity>
				) : null}
			</View>
			<Text style={styles.cardTitle}>{item.title}</Text>
		</TouchableOpacity>
	);
}

export default function LanchoneteScreen() {
	const router = useRouter();
	const items = useMergedItemsForSesc();
	const admStats = useAdmStats();
	const openDetail = (item) => { router.push(`/lanchonete/${item.id}`); };

	return (
		<View style={{ flex: 1 }}>
			<Navbar />

			<FlatList
				data={items}
				keyExtractor={(i) => i.id}
				numColumns={2}
				columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
				contentContainerStyle={{ paddingVertical: 18 }}
				renderItem={({ item }) => <InfoCard item={item} onPress={openDetail} admStats={admStats} />}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	safe: { backgroundColor: '#0b4a74' },
	container: {
		height: 56,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		marginTop: Platform.OS === 'android' ? 25 : 0,
	},
	searchWrap: {
		flex: 1,
		marginHorizontal: 12,
		backgroundColor: '#fff',
		height: 40,
		borderRadius: 20,
		flexDirection: 'row',
		alignItems: 'center',
	},
	searchInput: {
		flex: 1,
		paddingHorizontal: 8,
		color: '#000',
		fontSize: 14,
	},
	actions: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	iconBtn: {
		marginLeft: 8,
		padding: 4,
	},
	card: {
		flex: 1,
		alignItems: 'center',
		marginBottom: 18,
		marginHorizontal: 8,
	},
	imageWrap: {
		width: 120,
		height: 120,
		borderRadius: 20,
		overflow: 'hidden',
		backgroundColor: '#fff',
		justifyContent: 'center',
		alignItems: 'center',
		...Platform.select({
			ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 12 },
			android: { elevation: 6 },
		}),
	},
	image: {
		width: '100%',
		height: '100%',
	},
	cardTitle: {
		marginTop: 8,
		color: '#222',
		fontSize: 14,
		textAlign: 'center',
	},
});
