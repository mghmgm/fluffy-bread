import { Stack } from 'expo-router';

export default function RootLayout() {


  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name='achievements' options={{
          presentation: 'transparentModal',
          animation: 'slide_from_right', // Переопределяем анимацию для этого экрана
        }} />
      <Stack.Screen name='skins'options={{
          presentation: 'transparentModal',
          animation: 'slide_from_right', // Переопределяем анимацию для этого экрана
        }}  />
    </Stack>
  );
}
