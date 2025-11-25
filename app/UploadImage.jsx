import React, { useState } from 'react';
import { View, Button, Image, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import supabase from './lib/supabase';

export default function UploadImage() {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  async function pickAndUpload() {
    // 1. Abrir galeria
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;

    try {
      setLoading(true);

      // 2. Converter URI em Blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // 3. Definir nome do arquivo
  const fileName = `foto_${Date.now()}.jpg`;

      // 4. Fazer upload no Supabase
      // usar bucket existente (ex: 'itens') e subpasta 'perfil'
      const bucket = 'itens';
      const filePath = `perfil/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: false,
          cacheControl: '3600'
        });

      if (uploadError) {
        console.log('Erro ao enviar:', uploadError);
        alert("Erro ao enviar imagem");
        return;
      }

      // 5. Gerar URL pública (mesmo bucket)
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      setImageUrl(publicUrlData?.publicUrl || null);

    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ padding: 20, marginTop: 50 }}>
      <Button 
        title={loading ? "Enviando..." : "Escolher e Enviar Foto"} 
        onPress={pickAndUpload} 
      />

      {imageUrl && (
        <>
          <Text style={{ marginTop: 20 }}>Imagem enviada:</Text>
          <Image
            source={{ uri: imageUrl }}
            style={{ width: 200, height: 200, marginTop: 10 }}
          />
        </>
      )}
    </View>
  );
}
