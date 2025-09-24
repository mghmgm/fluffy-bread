/**
 * Корневой компонент навигации приложения
 * Использует Expo Router для управления навигацией между экранами
 */
import { Stack } from 'expo-router';

/**
 * RootLayout - главный компонент макета приложения
 * 
 * Настройки:
 * - headerShown: false - скрывает стандартный заголовок навигации
 * - Stack.Screen name="index" - определяет главный экран приложения
 * 
 * В данном проекте используется только один экран (игра),
 * поэтому навигация минимальна
 */
export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Скрываем заголовок для полноэкранного режима игры
      }}
    >
      <Stack.Screen name="index" /> {/* Главный экран с игрой Flappy Bird */}
    </Stack>
  );
}
