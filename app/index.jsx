import React from "react";
import { View, Text, ImageBackground, Image, StatusBar, StyleSheet, Platform, Dimensions, } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: WINDOW_WIDTH } = Dimensions.get("window");
const BUTTON_MAX_WIDTH = 420;
const BUTTON_WIDTH = Math.min(BUTTON_MAX_WIDTH, Math.round(WINDOW_WIDTH * 0.85));

export default function About() {
  return (
    <ImageBackground
      style={styles.container}
      source={require("../assets/background.png")}
      resizeMode="cover"
    >
      {/* camada branca semi-transparente sobre o fundo */}
      <View style={styles.overlay} />

      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safe}>
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
          {/* Usar asChild para que o TouchableOpacity receba as props de navegação */}
          <Link href="./cadastro">
            <View
              style={[styles.button, { width: BUTTON_WIDTH }]}
              accessibilityRole="button"
              accessibilityLabel="Cadastrar"
            >
              <Text style={styles.text}>Cadastrar</Text>
            </View>
          </Link>

          <Link href="./login">
            <View
              style={[styles.button, styles.buttonSecondary, { width: BUTTON_WIDTH }]}
              accessibilityRole="button"
              accessibilityLabel="Entrar"
            >
              <Text style={styles.text}>Entrar</Text>
            </View>
          </Link>
        </View>

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
    backgroundColor: "rgba(255,255,255,0.3)", // leve opacidade
  },

  safe: {
    flex: 1,
    alignItems: "center",
  },

  box1: {
    width: "100%",
    height: "33%",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 12,
  },
  box2: {
    width: "100%",
    height: "44%",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
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
