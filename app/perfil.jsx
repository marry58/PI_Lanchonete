import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, Image, TextInput, TouchableOpacity, StyleSheet, StatusBar, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Perfil() {
  const router = useRouter();
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/home');
    }
  };
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    nome: 'Giovanna Mesquita',
    email: 'giovannaMesquita@gmail.com',
    senha: '28112008',
    turma: "3º ano",
    unidade: 'Sesc Senac Matinhos Caioba',
    cpf: '',
    nasc: '',
    cep: '',
    telefone: '',
  });

  const STORAGE_KEY = '@user_profile';

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProfile((p) => ({ ...p, ...JSON.parse(stored) }));
      }
    } catch (err) {
      console.error('Erro ao carregar perfil', err);
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile(data) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setProfile((p) => ({ ...p, ...data }));
      Alert.alert('Perfil salvo', 'As alterações foram salvas localmente.');
    } catch (err) {
      console.error('Erro ao salvar perfil', err);
      Alert.alert('Erro', 'Não foi possível salvar o perfil.');
    }
  }

  async function clearProfile() {
    Alert.alert('Confirmar', 'Deseja excluir os dados do perfil?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem(STORAGE_KEY);
            setProfile({
              nome: '',
              email: '',
              senha: '',
              turma: '',
              unidade: '',
              cpf: '',
              nasc: '',
              cep: '',
              telefone: '',
            });
            setEditing(true);
          } catch (err) {
            console.error('Erro ao limpar perfil', err);
          }
        },
      },
    ]);
  }

  function onChange(field, value) {
    setProfile((p) => ({ ...p, [field]: value }));
  }

  const onlyDigits = (s = '') => String(s).replace(/\D/g, '');

  const formatCPF = (v = '') => {
    const d = onlyDigits(v).slice(0, 11);
    return d
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatCEP = (v = '') => {
    const d = onlyDigits(v).slice(0, 8);
    return d.replace(/(\d{5})(\d)/, '$1-$2');
  };

  const formatDate = (v = '') => {
    const d = onlyDigits(v).slice(0, 8);
    return d.replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2');
  };

  const formatPhone = (v = '') => {
    const d = onlyDigits(v).slice(0, 11);
    if (d.length <= 10) {
      return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
    }
    return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
  };

  function validEmail(e) {
    return /\S+@\S+\.\S+/.test(e);
  }

  async function handleAlterarSalvar() {
    if (editing) {
      if (profile.email && !validEmail(profile.email)) {
        Alert.alert('Email inválido', 'Por favor insira um email válido.');
        return;
      }
      await saveProfile(profile);
      setEditing(false);
    } else {
      setEditing(true);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.container}>
          <Text>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          accessibilityLabel="Voltar"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <Text style={[styles.title, { marginTop: 6 }]}>{editing ? 'Editar perfil' : 'Meu perfil'}</Text>

        <Image source={require('../assets/logo-top.png')} style={styles.avatar} />

        <Text style={styles.fieldLabel}>Nome</Text>
        <TextInput style={styles.input} value={profile.nome} onChangeText={(t) => onChange('nome', t)} editable={editing} />

        <Text style={styles.fieldLabel}>Email</Text>
        <TextInput style={styles.input} value={profile.email} onChangeText={(t) => onChange('email', t)} editable={editing} keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.fieldLabel}>Senha</Text>
        <TextInput style={styles.input} value={profile.senha} onChangeText={(t) => onChange('senha', t)} editable={editing} secureTextEntry={!editing} />

        <Text style={styles.fieldLabel}>Turma</Text>
        <TextInput style={styles.input} value={profile.turma} onChangeText={(t) => onChange('turma', t)} editable={editing} />

        <Text style={styles.fieldLabel}>Unidade</Text>
        <TextInput style={styles.input} value={profile.unidade} onChangeText={(t) => onChange('unidade', t)} editable={editing} />

        <Text style={styles.fieldLabel}>CPF</Text>
        <TextInput style={styles.input} value={profile.cpf} onChangeText={(t) => onChange('cpf', formatCPF(t))} editable={editing} keyboardType="numeric" placeholder="000.000.000-00" />

        <Text style={styles.fieldLabel}>Data de Nascimento</Text>
        <TextInput style={styles.input} value={profile.nasc} onChangeText={(t) => onChange('nasc', formatDate(t))} editable={editing} keyboardType="numeric" placeholder="DD/MM/AAAA" />

        <Text style={styles.fieldLabel}>CEP</Text>
        <TextInput style={styles.input} value={profile.cep} onChangeText={(t) => onChange('cep', formatCEP(t))} editable={editing} keyboardType="numeric" placeholder="00000-000" />

        <Text style={styles.fieldLabel}>Telefone</Text>
        <TextInput style={styles.input} value={profile.telefone} onChangeText={(t) => onChange('telefone', formatPhone(t))} editable={editing} keyboardType="phone-pad" placeholder="(00) 00000-0000" />

        <View style={{ flexDirection: 'row', marginTop: 16 }}>
          <TouchableOpacity style={styles.btn} onPress={handleAlterarSalvar} accessibilityLabel={editing ? 'Salvar' : 'Alterar'}>
            <Text style={styles.btnText}>{editing ? 'Salvar' : 'Alterar'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, { marginLeft: 12, backgroundColor: '#c0392b' }]} onPress={clearProfile} accessibilityLabel="Excluir perfil">
            <Text style={styles.btnText}>Excluir</Text>
          </TouchableOpacity>
        </View>

        <Image source={require('../assets/logo-footer.png')} style={styles.footer} resizeMode="contain" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    height: 68,
    backgroundColor: '#123a63',
    justifyContent: 'flex-end',
    paddingLeft: 16,
    paddingBottom: 6,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  container: { flex: 1, alignItems: 'center', padding: 18 },
  title: { color: '#f28b3a', fontSize: 20, fontStyle: 'italic', fontWeight: '700', marginBottom: 8 },
  avatar: { width: 120, height: 120, borderRadius: 16, marginVertical: 10 },
  fieldLabel: { alignSelf: 'flex-start', color: '#333', marginLeft: 6, marginTop: 12, fontSize: 12 },
  input: { width: '94%', height: 44, backgroundColor: '#eee', borderRadius: 8, paddingHorizontal: 12, marginTop: 8 },
  btn: { marginTop: 0, backgroundColor: '#123a63', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
  footer: { width: 220, height: 50, marginTop: 24 },
});
