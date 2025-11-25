import React, { useState } from 'react';
import {
    Text,
    Image,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import supabase from './lib/supabase';

// --- AsyncStorage: tentativa de import seguro com fallback em memória ---
let AsyncStorage;
try {
    // eslint-disable-next-line global-require
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e1) {
    try {
        // eslint-disable-next-line global-require
        AsyncStorage = require('react-native').AsyncStorage;
    } catch (e2) {
        const _store = {};
        AsyncStorage = {
            getItem: async (k) => (Object.prototype.hasOwnProperty.call(_store, k) ? _store[k] : null),
            setItem: async (k, v) => { _store[k] = v; return null; },
            removeItem: async (k) => { delete _store[k]; return null; },
        };
        // aviso em tempo de execução
        // eslint-disable-next-line no-console
        console.warn('AsyncStorage não encontrado, usando fallback em memória (dev).');
    }
}

export default function CadEscola() {
    const router = useRouter();

    const [form, setForm] = useState({
        nome: '',
        email: '',
        senha: '',
        cnpj: '',
        cep: '',
        codigo: '',
        cidade: '',
    });

    const onlyDigits = (s = '') => String(s).replace(/\D/g, '');

    const formatCNPJ = (v = '') => {
        const d = onlyDigits(v).slice(0, 14);
        return d
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    };

    const formatCEP = (v = '') => {
        const d = onlyDigits(v).slice(0, 8);
        return d.replace(/(\d{5})(\d)/, '$1-$2');
    };

    function onChange(field, value) {
        if (field === 'cnpj') value = formatCNPJ(value);
        if (field === 'cep') value = formatCEP(value);
        if (field === 'codigo') value = onlyDigits(value).slice(0, 10);
        setForm((p) => ({ ...p, [field]: value }));
    }

    const validEmail = (e = '') => /\S+@\S+\.\S+/.test(e);

    async function handleSubmit() {
        const { nome, email, senha, cnpj, cep, codigo, cidade } = form;

        if (!nome.trim() || !email.trim() || !senha.trim() || !cnpj.trim()) {
            Alert.alert('Campos obrigatórios', 'Preencha Nome, Email, Senha e CNPJ.');
            return;
        }
        if (!validEmail(email)) {
            Alert.alert('Email inválido', 'Informe um email válido.');
            return;
        }
        const cnpjDigits = onlyDigits(cnpj);
        if (cnpjDigits.length !== 14) {
            Alert.alert('CNPJ inválido', 'CNPJ deve conter 14 dígitos.');
            return;
        }
        const cepDigits = onlyDigits(cep);
        if (cep && cepDigits.length !== 8) {
            Alert.alert('CEP inválido', 'CEP deve conter 8 dígitos.');
            return;
        }

        try {
            const stored = await AsyncStorage.getItem('@schools');
            const arr = stored ? JSON.parse(stored) : [];
            const newSchool = { id: Date.now().toString(), nome, email, senha, cnpj, cep, codigo, cidade, created_at: new Date().toISOString() };
            arr.push(newSchool);
            await AsyncStorage.setItem('@schools', JSON.stringify(arr));

            // tenta inserir no Supabase (não crítico: se falhar, mantém dado local)
            (async () => {
                try {
                    const { data, error } = await supabase
                        .from('schools')
                        .insert([{ nome, email, cnpj, cep, codigo, cidade, created_at: new Date().toISOString() }]);
                    if (error) {
                        // log para depuração; não impede o fluxo
                        console.warn('Supabase insert schools error:', error);
                    } else {
                        // opcional: sync local id / data se necessário
                        // console.log('Supabase insert result:', data);
                    }
                } catch (supErr) {
                    console.warn('Erro ao conectar no Supabase:', supErr);
                }
            })();

            Alert.alert('Sucesso', 'Escola cadastrada com sucesso.', [
                { text: 'Ok', onPress: () => router.push('/home') },
            ]);
        } catch (err) {
            console.error('Erro ao salvar escola', err);
            Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.');
        }
    }

    return (
        <SafeAreaView style={styles.safe}>
            <TouchableOpacity
                style={{
                    position: 'absolute',
                    left: 12,
                    top: Platform.OS === 'android' ? 30 : 14,
                    zIndex: 60,
                }}
                onPress={() => router.push('/home')}
                accessibilityLabel="Ir para home"
            >
                <Ionicons name="home" size={24} color="#024281" />
            </TouchableOpacity>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                    <Image source={require('../assets/logo-top.png')} style={styles.logo} resizeMode="contain" />

                    <Text style={styles.label}>NOME DA UNIDADE</Text>
                    <TextInput style={styles.input} value={form.nome} onChangeText={(t) => onChange('nome', t)} placeholder="Nome da unidade" />

                    <Text style={styles.label}>EMAIL</Text>
                    <TextInput style={styles.input} value={form.email} onChangeText={(t) => onChange('email', t)} keyboardType="email-address" autoCapitalize="none" placeholder="email@exemplo.com" />

                    <Text style={styles.label}>SENHA</Text>
                    <TextInput style={styles.input} value={form.senha} onChangeText={(t) => onChange('senha', t)} secureTextEntry placeholder="Senha" />

                    <Text style={styles.label}>CNPJ</Text>
                    <TextInput style={styles.input} value={form.cnpj} onChangeText={(t) => onChange('cnpj', t)} keyboardType="numeric" placeholder="00.000.000/0000-00" />

                    <Text style={styles.label}>CEP</Text>
                    <TextInput style={styles.input} value={form.cep} onChangeText={(t) => onChange('cep', t)} keyboardType="numeric" placeholder="00000-000" />

                    <Text style={styles.label}>CÓDIGO DA UNIDADE</Text>
                    <TextInput style={styles.input} value={form.codigo} onChangeText={(t) => onChange('codigo', t)} keyboardType="numeric" placeholder="Código da unidade" />

                    <Text style={styles.label}>CIDADE</Text>
                    <TextInput style={styles.input} value={form.cidade} onChangeText={(t) => onChange('cidade', t)} placeholder="Cidade" />

                    <TouchableOpacity style={styles.btn} onPress={handleSubmit} accessibilityLabel="Cadastrar escola">
                        <Text style={styles.btnText}>CADASTRAR ESCOLA</Text>
                    </TouchableOpacity>

                    <Image source={require('../assets/logo-footer.png')} style={styles.footer} resizeMode="contain" />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f6dede' }, // painel rosa como referência
    container: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 18 },
    logo: { width: 140, height: 120, marginBottom: 10 },
    label: { alignSelf: 'stretch', color: '#024281', fontWeight: '700', fontSize: 12, marginTop: 12, marginLeft: 6 },
    input: { width: '94%', height: 44, backgroundColor: '#fff', borderRadius: 22, paddingHorizontal: 14, marginTop: 8 },
    btn: { marginTop: 20, backgroundColor: '#0b4a74', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 26, width: '70%', alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '700' },
    footer: { width: 160, height: 40, marginTop: 24 },
});
