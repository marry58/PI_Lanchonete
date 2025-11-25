import React, { useState } from "react";
import { SafeAreaView, View, Text, ImageBackground, TextInput, Image, StatusBar, StyleSheet, Platform, Dimensions, Alert, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import supabase from './lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const { width: WINDOW_WIDTH } = Dimensions.get("window");
const BUTTON_MAX_WIDTH = 420;
const BUTTON_WIDTH = Math.min(BUTTON_MAX_WIDTH, Math.round(WINDOW_WIDTH * 0.85));

const fields = [
  "Email",
  "Senha",
];

export default function About() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const onLogin = async () => {
    if (!email || !senha) {
      Alert.alert("Preencha email e senha");
      return;
    }
    try {
      // supabase auth: sign in with password
      const res = await supabase.auth.signInWithPassword({ email, password: senha });
      if (res.error) {
        Alert.alert('Erro', res.error.message || 'Não foi possível autenticar.');
        return;
      }
      const user = res.data?.user ?? null;
      if (!user) {
        Alert.alert('Erro', 'Usuário não retornado pelo provedor de autenticação.');
        return;
      }

      // tenta buscar registro na tabela 'usuario' pelo auth_user_id
      try {
        let usuarioRecord = null;
        const { data: byAuth, error: errAuth } = await supabase
          .from('usuario')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (errAuth) {
          console.warn('Erro ao buscar usuario por auth_user_id:', errAuth);
        }
        if (byAuth) {
          usuarioRecord = byAuth;
        } else {
          // tenta buscar por email como fallback
          const { data: byEmail, error: errEmail } = await supabase
            .from('usuario')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();
          if (errEmail) console.warn('Erro ao buscar usuario por email:', errEmail);
          usuarioRecord = byEmail || null;
        }

        // se não existir, cria um registro mínimo em 'usuario'
        if (!usuarioRecord) {
          const payload = {
            auth_user_id: user.id,
            nome: user.user_metadata?.nome ?? null,
            email: user.email,
            created_at: new Date().toISOString(),
          };
          const { data: created, error: createErr } = await supabase
            .from('usuario')
            .insert([payload])
            .select()
            .maybeSingle();
          if (createErr) {
            console.warn('Erro ao criar registro usuario:', createErr);
          } else {
            usuarioRecord = created;
          }
        }

        // persistir localmente o usuario (se houver), e também guardar o auth user
        await AsyncStorage.setItem('@user', JSON.stringify(user));
        if (usuarioRecord) await AsyncStorage.setItem('@usuario', JSON.stringify(usuarioRecord));
      } catch (dbErr) {
        console.warn('Erro ao sincronizar usuario localmente:', dbErr);
      }

      router.push('/home');
    } catch (err) {
      console.error('Login error', err);
      Alert.alert('Erro', 'Não foi possível autenticar. Tente novamente.');
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
        <View style={styles.box1}>
          <Image style={styles.image}
            source={require("../assets/logo-top.png")}
            resizeMode="contain"
            accessible
            accessibilityLabel="Logo"
          />
        </View>

        <View style={styles.box2}>
          {/* Email */}
          <View style={[styles.fieldContainer, { width: BUTTON_WIDTH }]}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.fieldInput}
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="Email"
            />
          </View>

          {/* Senha */}
          <View style={[styles.fieldContainer, { width: BUTTON_WIDTH }]}>
            <Text style={styles.fieldLabel}>Senha</Text>
            <TextInput
              value={senha}
              onChangeText={setSenha}
              style={styles.fieldInput}
              placeholder="Senha"
              secureTextEntry
              accessibilityLabel="Senha"
            />
          </View>
        </View>

          <TouchableOpacity
            style={[styles.button, { width: BUTTON_WIDTH }]}
            accessibilityRole="button"
            accessibilityLabel="Entrar"
            onPress={onLogin}
          >
            <Text style={styles.text}>Entrar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonNaoTenhoConta, { width: BUTTON_WIDTH }]}
            accessibilityRole="button"
            accessibilityLabel="Não tenho conta"
            onPress={() => router.push('./cadastro')}
          >
            <Text style={styles.text}>Não tenho conta</Text>
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
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // camada branca translúcida por cima do fundo
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.32)", // leve opacidade
  },

  safe: {
    flex: 1,
    alignItems: "center",
  },

  box1: {
    width: "100%",
    height: "28%" // um pouco menor para caber os campos
    , justifyContent: "center",
    alignItems: "center",
    paddingTop: 12,
  },
  box2: {
    width: "100%",
    height: "49%",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 10,
  },
  box3: {
    width: "100%",
    height: "23%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
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

  /* Campo (rótulo + caixa branca) */
  fieldContainer: {
    alignItems: "flex-start",
    marginVertical: 6,
  },
  fieldLabel: {
    color: "#024281", // azul do layout
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 8,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  fieldButton: {
    width: "100%",
    height: 46,
    borderRadius: 23, // deixa em formato de pílula arredondada
    backgroundColor: "rgba(255,255,255,0.95)", // branco quase opaco
    // sombra/elevation leve para destacar sobre o fundo
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

  buttonNaoTenhoConta: {
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8,
  }, 

  button: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#024281",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buttonSecondary: {
    backgroundColor: "#024281",
  },

  text: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF9749",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
