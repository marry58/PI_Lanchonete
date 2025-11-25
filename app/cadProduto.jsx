import React, { useState } from 'react';
import { SafeAreaView, View, Text, Image, TextInput, TouchableOpacity, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { Link, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CATEGORIES = [
  'Cafés',
  'Cafés gelados',
  'Bebidas refrescantes',
  'Chás',
  'Chocolates',
];

export default function CadProduto() {
  const router = useRouter();
  const [vendor, setVendor] = useState(''); // 'sesc' | 'senac'
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [price, setPrice] = useState(''); // novo estado para preço
  const [priceSetLabel, setPriceSetLabel] = useState(''); // mostra preço definido

  // converte "4,50" ou "4.50" -> 4.5 (number)
  const parsePrice = (v = '') => {
    if (!v) return NaN;
    // aceita formatos como "4,50" ou "4.50"
    const cleaned = String(v).trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : NaN;
  };

  // máscara BRL: "1234" -> "12,34", "1234567" -> "12.345,67"
  const formatBRLMask = (input = '') => {
    const digits = String(input).replace(/\D/g, '');
    if (!digits) return '';
    const cents = digits.slice(-2).padStart(2, '0');
    const intPartRaw = digits.slice(0, -2) || '0';
    const intPart = intPartRaw.replace(/^0+(?=\d)|^$/g, '') || '0';
    // inserir separador de milhares
    const intWithSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${intWithSep},${cents}`;
  };

  const onSetPrice = () => {
    const n = parsePrice(price);
    if (Number.isNaN(n)) {
      alert('Preço inválido. Use formato 4,50');
      return;
    }
    // formata para exibição em BRL
    const formatted = `R$ ${n.toFixed(2).replace('.', ',')}`;
    setPriceSetLabel(formatted);
    alert(`Preço definido: ${formatted}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Link href="..">
          <Text style={styles.back}>←</Text>
        </Link>
        <Text style={styles.headerTitle}>cadastrar produto</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Image source={require('../assets/logo-top.png')} style={styles.image} resizeMode="cover" />

        <Text style={styles.label}>Nome do produto</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} />

        <Text style={styles.label}>Ingredientes</Text>
        <TextInput value={ingredients} onChangeText={setIngredients} style={styles.input} />

        <Text style={styles.label}>Preço</Text>
        <View style={{ width: '90%', flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <TextInput
            value={price}
            onChangeText={(v) => setPrice(formatBRLMask(v))}
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            placeholder="0,00"
            keyboardType="numeric"
            accessibilityLabel="Preço do produto"
          />
          <TouchableOpacity style={[styles.addBtn, { paddingHorizontal: 12 }]} onPress={onSetPrice}>
            <Text style={styles.addBtnText}>Definir preço</Text>
          </TouchableOpacity>
        </View>
        {priceSetLabel ? <Text style={{ marginTop: 6, color: '#333' }}>Preço atual: {priceSetLabel}</Text> : null}

        <Text style={styles.label}>Selecione:</Text>
        <View style={styles.row}> 
          <TouchableOpacity style={styles.radioRow} onPress={() => { setVendor('sesc'); setShowCategories(false); }}>
            <View style={[styles.radio, vendor === 'sesc' && styles.radioSelected]} />
            <Text style={styles.radioLabel}>Sesc</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.radioRow} onPress={() => { setVendor('senac'); /* when selecting senac, reveal categories */ setShowCategories(true); }}>
            <View style={[styles.radio, vendor === 'senac' && styles.radioSelected]} />
            <Text style={styles.radioLabel}>Senac</Text>
          </TouchableOpacity>
        </View>

        {vendor === 'senac' && (
          <>
            <TouchableOpacity style={styles.categoryToggle} onPress={() => setShowCategories((s) => !s)}>
              <Text style={styles.categoryToggleText}>categoria ▾</Text>
            </TouchableOpacity>

            {showCategories && (
              <View style={styles.categoriesList}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity key={c} style={styles.categoryItem} onPress={() => setSelectedCategory(c)}>
                    <View style={[styles.catBullet, selectedCategory === c && styles.catBulletSelected]} />
                    <Text style={styles.categoryText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        <TouchableOpacity
          style={styles.addBtn}
          onPress={async () => {
            // validações básicas ao adicionar produto
            if (!name.trim()) { alert('Informe o nome do produto'); return; }
            if (!vendor) { alert('Selecione Sesc ou Senac'); return; }
            const priceNum = parsePrice(price);
            if (Number.isNaN(priceNum)) { alert('Preço inválido. Use formato 4,50'); return; }

            // monta objeto do produto (compatível com getItems)
            const prod = {
              id: Date.now().toString(),
              title: name.trim(),
              description: ingredients || '',
              category: selectedCategory || 'Outros',
              priceNum,
              priceLabel: priceSetLabel || `R$ ${priceNum.toFixed(2).replace('.', ',')}`,
              priceDisplay: `R$ ${priceNum.toFixed(2).replace('.', ',')}`,
              vendor, // 'sesc' | 'senac'
              image: { uri: `https://via.placeholder.com/320x240.png?text=${encodeURIComponent(name.trim())}` },
              created_at: new Date().toISOString(),
            };

            try {
              const raw = await AsyncStorage.getItem('@products');
              const arr = raw ? JSON.parse(raw) : [];
              arr.push(prod);
              await AsyncStorage.setItem('@products', JSON.stringify(arr));
              // reset UI
              setName(''); setIngredients(''); setPrice(''); setSelectedCategory(null); setVendor(''); setPriceSetLabel('');
              alert('Produto adicionado com sucesso.');
              // navegar para a página correspondente
              if (vendor === 'sesc') router.push('/lanchonete');
              else if (vendor === 'senac') router.push('/cafeEscola');
            } catch (e) {
              console.error('Erro ao salvar produto localmente', e);
              alert('Não foi possível salvar o produto. Tente novamente.');
            }
          }}
        >
          <Text style={styles.addBtnText}>Adicionar produto</Text>
        </TouchableOpacity>

        <View style={styles.footerLogos}>
          <Image source={require('../assets/logo-footer.png')} style={styles.footerImage} resizeMode="contain" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  header: { height: 64, backgroundColor: '#123a63', alignItems: 'center', justifyContent: 'center', paddingTop: 8, position: 'relative' },
  back: { position: 'absolute', left: 12, top: 20, color: '#fff', fontSize: 18 },
  headerTitle: { color: '#f28b3a', fontSize: 20, fontStyle: 'italic', fontWeight: '700' },
  container: { alignItems: 'center', padding: 18, paddingBottom: 40 },
  image: { width: 140, height: 140, borderRadius: 12, marginVertical: 12 },
  label: { fontSize: 16, marginTop: 12, color: '#333' },
  input: { width: '90%', height: 44, backgroundColor: '#eee', borderRadius: 8, paddingHorizontal: 12, marginTop: 8 },
  row: { flexDirection: 'row', width: '90%', justifyContent: 'flex-start', marginTop: 12 },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginRight: 18 },
  radio: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: '#bbb', marginRight: 8, backgroundColor: '#fff' },
  radioSelected: { backgroundColor: '#123a63', borderColor: '#123a63' },
  radioLabel: { fontSize: 14, color: '#333' },

  categoryToggle: { width: '90%', marginTop: 12, alignItems: 'flex-start' },
  categoryToggleText: { backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#ddd', color: '#333' },

  categoriesList: { width: '90%', marginTop: 8 },
  categoryItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eee', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 8 },
  catBullet: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: '#bbb', marginRight: 10, backgroundColor: '#fff' },
  catBulletSelected: { backgroundColor: '#123a63', borderColor: '#123a63' },
  categoryText: { fontSize: 14, color: '#333' },

  addBtn: { marginTop: 18, backgroundColor: '#123a63', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '700' },

  footerLogos: { marginTop: 24, alignItems: 'center' },
  footerImage: { width: 220, height: 50 },
});
