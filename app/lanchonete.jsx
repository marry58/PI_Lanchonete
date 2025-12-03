import React, { useEffect, useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Platform, FlatList, Image, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getItems } from './data/cafeEscolaItens.js';

const BLOCKED_TITLES = ['moranguinho'];
const isBlocked = (title) => {
	if (!title) return false;
	const normalized = String(title).toLowerCase();
	return BLOCKED_TITLES.some((ban) => normalized.includes(ban));
};

// obtem lista inicial de itens do data e mescla com itens locais (vendor='sesc')
function useMergedItemsForSesc() {
	const [items, setItems] = useState([]);
	useEffect(() => {
		let mounted = true;
		(async () => {
			const base = getItems().filter((item) => !isBlocked(item.title));
			try {
				const raw = await AsyncStorage.getItem('@products');
				const local = raw ? JSON.parse(raw) : [];
				const localSesc = (local || []).filter(p => p.vendor === 'sesc' && !isBlocked(p.title));
				if (mounted) setItems([...localSesc, ...base]);
			} catch (e) {
				if (mounted) setItems(base);
			}
		})();
		return () => { mounted = false; };
	}, []);
	return items;
}

function Navbar({ placeholder = 'Buscar na lanchonete...', value, onChange }) {
	const router = useRouter();
	const handleBack = () => {
		if (router.canGoBack()) {
			router.back();
		} else {
			router.push('/home');
		}
	};

	return (
		<SafeAreaView style={styles.safe}>
			<View style={styles.container}>
				<TouchableOpacity onPress={handleBack} accessibilityLabel="Voltar" style={{ marginRight: 8 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
					<Ionicons name="arrow-back" size={24} color="#fff" />
				</TouchableOpacity>

				<View style={styles.searchWrap}>
					<Ionicons name="search" size={18} color="#999" style={{ marginLeft: 8 }} />
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

function InfoCard({ item, onPress }) {

	return (
		<TouchableOpacity style={styles.card} onPress={() => onPress(item)} accessibilityRole="button" accessibilityLabel={item.title}>
			<View style={styles.imageWrap}>
				<Image source={item.image} style={styles.image} resizeMode="cover" />
			</View>
			<Text style={styles.cardTitle}>{item.title}</Text>
		</TouchableOpacity>
	);
}

export default function LanchoneteScreen() {
	const router = useRouter();
	const items = useMergedItemsForSesc();
	const [search, setSearch] = useState('');
	const openDetail = (item) => { router.push(`/lanchonete/${item.id}`); };

	const normalizedQuery = search.trim().toLowerCase();
	const visibleItems = normalizedQuery
		? items.filter((item) => String(item.title || '').toLowerCase().includes(normalizedQuery))
		: items;

	return (
		<View style={{ flex: 1 }}>
			<Navbar value={search} onChange={setSearch} />

			<FlatList
				data={visibleItems}
				keyExtractor={(i) => i.id}
				numColumns={2}
				columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
				contentContainerStyle={{ paddingVertical: 18 }}
				renderItem={({ item }) => <InfoCard item={item} onPress={openDetail} />}
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
