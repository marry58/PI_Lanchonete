import React from "react";
import { SafeAreaView, View, Text, ImageBackground, TouchableOpacity, Image, StatusBar, StyleSheet, Platform, Dimensions, } from "react-native";
import { Link } from "expo-router";

const { width: WINDOW_WIDTH } = Dimensions.get("window");
const BUTTON_MAX_WIDTH = 420;
const BUTTON_WIDTH = Math.min(BUTTON_MAX_WIDTH, Math.round(WINDOW_WIDTH * 0.85));
// manter largura padrão dos botões (cada um na sua linha)

const fields = [
    "sesc",
    "senac",
];

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
                    <Image style={styles.image}
                        source={require("../assets/logo-top.png")}
                        resizeMode="contain"
                        accessible
                        accessibilityLabel="Logo"
                    />
                </View>

                <View style={styles.box2}>
                    <Link href="./lanchonete">
                        <View style={[styles.button, { width: BUTTON_WIDTH }]}
                            accessibilityRole="button"
                            accessibilityLabel="Lanchonete"
                        >
                            <Text style={styles.text}>Lanchonete</Text>
                            
                        </View>
                        
                    </Link>
                    <Text style={styles.fieldLabel}>Sesc</Text>
                    <Link href="./cafeEscola">
                        <View
                            style={[styles.button, styles.buttonSpacing, { width: BUTTON_WIDTH }]}
                            accessibilityRole="button"
                            accessibilityLabel="Café escola"
                        >
                            <Text style={styles.text}>Café escola</Text>
                        </View>
                    </Link>
                    <Text style={styles.fieldLabel}>Pedidos</Text>
                    <Link href="./admin">
                        <View
                            style={[styles.button, styles.buttonSpacing, { width: BUTTON_WIDTH }]}
                            accessibilityRole="button"
                            accessibilityLabel="Pedidos"
                        >
                            <Text style={styles.text}>Cadastrar escola</Text>
                        </View>
                    </Link>
                    <Text style={styles.fieldLabel}>Senac</Text>
                </View>


                <View style={styles.box3}>
                    <Image
                        style={styles.bottomImage}
                        source={require("../assets/logo-footer.png")}
                        resizeMode="contain"
                        accessible
                        accessibilityLabel="Imagem i   nferior decorativa"
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
        ,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 12,
    },
    box2: {
        width: "100%",
        height: "49%",
        justifyContent: "center",
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
        marginBottom: 16,
        marginTop: 10,
        textTransform: "uppercase",
    },
    fieldButton: {
        width: "100%",
        height: 46,
        borderRadius: 23, // deixa em formato de pílula arredondada
        backgroundColor: "#ffffffff", // branco quase opaco
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
        backgroundColor: "#ffffffff",
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

    buttonSpacing: {
        marginTop: 20,
    },

    text: {
        fontSize: 18,
        fontWeight: "700",
        color: "#024281",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
});
