import React, { useState } from "react";
import { ScrollView, View, Text, ImageBackground, TextInput, Image, StatusBar, StyleSheet, Platform, Dimensions, Alert, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from '@react-native-async-storage/async-storage';
import supabase from './lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const { width: WINDOW_WIDTH } = Dimensions.get("window");
const BUTTON_MAX_WIDTH = 420;
const BUTTON_WIDTH = Math.min(BUTTON_MAX_WIDTH, Math.round(WINDOW_WIDTH * 0.85));

const fields = [
  "Nome",
  "Email",
  "Senha",
  "Data de Nascimento",
  "CEP",
  "Unidade",
  "CPF",
];

// helper para mapear rótulo para chave do estado
const keyFromLabel = (label) => {
  switch (label) {
    case "Nome":
      return "nome";
    case "Email":
      return "email";
    case "Senha":
      return "senha";
    case "Data de Nascimento":
      return "nasc";
    case "CEP":
      return "cep";
    case "Unidade":
      return "unidade";
    case "CPF":
      return "cpf";
    default:
      return label.toLowerCase();
  }
};

const onlyDigits = (s) => s.replace(/\D/g, "");
const formatCPF = (value) => {
  const v = onlyDigits(value).slice(0, 11);
  return v
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};
const formatCEP = (value) => {
  const v = onlyDigits(value).slice(0, 8);
  return v.replace(/(\d{5})(\d)/, "$1-$2");
};
const formatDate = (value) => {
  const v = onlyDigits(value).slice(0, 8);
  return v.replace(/(\d{2})(\d)/, "$1/$2").replace(/(\d{2})(\d)/, "$1/$2");
};

export default function About() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    nasc: "",
    cep: "",
    unidade: "",
    cpf: "",
  });

  const handleChange = (key, value) => {
    let v = value;
    if (key === "cpf") v = formatCPF(value);
    if (key === "cep") v = formatCEP(value);
    if (key === "nasc") v = formatDate(value);
    setForm((p) => ({ ...p, [key]: v }));
  };

  const handleRegister = async () => {
    const { nome, email, senha } = form;
    if (!nome || !email || !senha) {
      Alert.alert('Preencha Nome, Email e Senha');
      return;
    }
    try {
      // criar conta no supabase auth
      const { data: signData, error: signError } = await supabase.auth.signUp({
        email: email,
        password: senha,
        options: {
          data: { nome, cep: form.cep ?? null, unidade: form.unidade ?? null, cpf: form.cpf ?? null, nasc: form.nasc ?? null }
        }
      });
      if (signError) {
        Alert.alert('Erro', signError.message || 'Não foi possível cadastrar.');
        return;
      }

      // id do auth (quando disponível)
      const authUserId = signData?.user?.id ?? null;
      // preparar objeto para inserir na tabela "usuario"
      const usuarioPayload = {
        auth_user_id: authUserId,
        nome,
        email,
        cpf: form.cpf || null,
        cep: form.cep || null,
        unidade: form.unidade || null,
        nasc: form.nasc ? (new Date(form.nasc.split('/').reverse().join('-'))).toISOString().slice(0,10) : null,
      };

      // tentar inserir/upsert na tabela "usuario"
      try {
        // upsert por email (se já existir, atualiza)
        const { data: usuarioData, error: usuarioError } = await supabase
          .from('usuario')
          .upsert(usuarioPayload, { onConflict: ['email'] })
          .select()
          .single();
        if (usuarioError) {
          console.warn('Supabase usuario upsert error:', usuarioError);
        } else {
          // opcional: salvar localmente o registro retornado
          await AsyncStorage.setItem('@usuario', JSON.stringify(usuarioData));
        }
      } catch (dbErr) {
        console.warn('Erro ao inserir usuario no Supabase:', dbErr);
        // fallback: salvar perfil localmente
        const profile = { id: authUserId ?? Date.now().toString(), nome, email, created_at: new Date().toISOString() };
        const stored = await AsyncStorage.getItem('@users');
        const arr = stored ? JSON.parse(stored) : [];
        arr.push(profile);
        await AsyncStorage.setItem('@users', JSON.stringify(arr));
      }

      Alert.alert('Sucesso', 'Cadastro efetuado. Verifique seu email (se for necessário confirmar).', [
        { text: 'Ok', onPress: () => router.push('./home') }
      ]);
    } catch (err) {
      console.error('Cadastro erro', err);
      Alert.alert('Erro', 'Não foi possível cadastrar. Tente novamente.');
    }
  };

  return (
    <ImageBackground
      style={styles.container}
      source={require("../assets/background.png")}
      resizeMode="cover"
    >
      <TouchableOpacity style={{ position: 'absolute', left: 12, top: Platform.OS === 'android' ? 30 : 14, zIndex: 60 }} onPress={() => router.push('/home')} accessibilityLabel="Ir para home">
        <Ionicons name="home" size={22} color="#024281" />
      </TouchableOpacity>
      {/* camada branca semi-transparente sobre o fundo */}
      <View style={styles.overlay} />

      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.box1}>
            <Image
              style={styles.image}
              source={require("../assets/logo-top.png")}
              resizeMode="contain"
              accessible
              accessibilityLabel="Logo"
            />
          </View>

          <View style={styles.box2}>
            {fields.map((label) => {
              const key = keyFromLabel(label);
              return (
                <View key={label} style={[styles.fieldContainer, { width: BUTTON_WIDTH }]}>
                  <Text style={styles.fieldLabel}>{label}</Text>

                  <TextInput
                    value={form[key]}
                    onChangeText={(text) => handleChange(key, text)}
                    style={styles.fieldInput}
                    placeholder={
                      label === "CPF"
                        ? "000.000.000-00"
                        : label === "CEP"
                        ? "00000-000"
                        : label === "Data de Nascimento"
                        ? "DD/MM/AAAA"
                        : ""
                    }
                    keyboardType={
                      key === "cpf" || key === "cep" || key === "nasc" ? "numeric" : key === "email" ? "email-address" : "default"
                    }
                    secureTextEntry={key === "senha"}
                    accessibilityLabel={label}
                  />
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.button, { width: BUTTON_WIDTH }]}
            accessibilityRole="button"
            accessibilityLabel="Cadastrar"
            onPress={handleRegister}
          >
            <Text style={styles.text}>Cadastrar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonNaoTenhoConta, { width: BUTTON_WIDTH }]}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => router.back()}
          >
            <Text style={styles.textVoltar}>←</Text>
          </TouchableOpacity>

          <View style={styles.box3}>
            <Image
              style={styles.bottomImage}
              source={require("../assets/logo-footer.png")}
              resizeMode="contain"
              accessible
              accessibilityLabel="Imagem inferior decorativa"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.32)",
  },
  safe: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    paddingVertical: 10,
  },
  box1: {
    width: "100%",
    height: "28%",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 12,
  },
  box2: {
    width: "100%",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingVertical: 10,
  },
  button: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#024281",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8,
  },
  text: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF9749",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  textVoltar: {
    fontSize: 16,
    fontWeight: "600",
    color: "#024281",
    letterSpacing: 2,
    marginTop: 20,
  },
  box3: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    marginTop: 10,
  },
  image: {
    width: WINDOW_WIDTH * 0.7,
    maxWidth: 300,
    height: undefined,
    aspectRatio: 1,
  },
  bottomImage: {
    width: WINDOW_WIDTH * 0.4,
    maxWidth: 160,
    height: undefined,
    aspectRatio: 1,
  },
  fieldContainer: {
    alignItems: "flex-start",
    marginVertical: 6,
  },
  fieldLabel: {
    color: "#024281",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 8,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  fieldButton: {
    width: "100%",
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.95)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  fieldInput: {
    width: "100%",
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    color: "#000",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
});







