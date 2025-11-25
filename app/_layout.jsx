// app/_layout.js  ou app/about/_layout.js
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // remove para todas as telas do Stack
      }}
    />
  );
}