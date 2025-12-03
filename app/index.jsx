import React from "react";
import { View, Text, ImageBackground, Image, StatusBar, StyleSheet, Platform, Dimensions, TouchableOpacity, } from "react-native";
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
          <Link href="./cadastro" asChild>
            <TouchableOpacity
              style={[styles.buttonTouchable, { width: BUTTON_WIDTH }]}
              accessibilityRole="button"
              accessibilityLabel="Cadastrar"
            >
              <View style={styles.button}>
                <Text style={styles.text}>Cadastrar</Text>
              </View>
            </TouchableOpacity>
          </Link>

          <Link href="./login" asChild>
            <TouchableOpacity
              style={[styles.buttonTouchable, { width: BUTTON_WIDTH }]}
              accessibilityRole="button"
              accessibilityLabel="Entrar"
            >
              <View style={styles.button}>
                <Text style={styles.text}>Entrar</Text>
              </View>
            </TouchableOpacity>
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

  buttonTouchable: {
    width: '100%',
  },

  button: {
    width: '100%',
    height: 60,
    borderRadius: 20,
    backgroundColor: "#024281",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 23,
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
  text: {
    fontSize: 19,
    fontWeight: "700",
    color: "#FF9749",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
