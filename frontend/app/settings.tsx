import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useAudioSettings } from '@/hooks/useAudioSettings';

export default function SettingsScreen() {
  const router = useRouter();
  const { musicVolume, sfxVolume, setMusicVolume, setSfxVolume } = useAudioSettings();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Настройки</Text>

      <View style={styles.block}>
        <Text style={styles.label}>Громкость музыки: {Math.round(musicVolume * 100)}%</Text>
        <Slider
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          value={musicVolume}
          onValueChange={setMusicVolume}
        />
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>Громкость звуков: {Math.round(sfxVolume * 100)}%</Text>
        <Slider
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          value={sfxVolume}
          onValueChange={setSfxVolume}
        />
      </View>

      <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
        <Text style={styles.btnText}>Закрыть</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff4dc', padding: 16, gap: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#3d2c1f' },
  block: { gap: 8, padding: 12, borderRadius: 12, backgroundColor: 'rgba(241, 194, 125, 0.25)' },
  label: { color: '#3d2c1f', fontWeight: '700' },
  btn: { backgroundColor: '#3d2c1f', padding: 12, borderRadius: 10, alignSelf: 'flex-start' },
  btnText: { color: '#fff4dc', fontWeight: '700' },
});
