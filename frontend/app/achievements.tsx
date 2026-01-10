import { useAchievements } from "@/hooks/useAchievements";
import { useRouter } from "expo-router";
import { View, Text as RNText, StyleSheet, TouchableOpacity, useWindowDimensions, ImageBackground } from 'react-native';


// Исправлено: название компонента с заглавной
export default function Achievements() {
    const { state: achievementsState } = useAchievements()
    const { width, height } = useWindowDimensions();
    const router = useRouter()
    return (
        <View>
            <ImageBackground
                source={require('../assets/sprites/background-day.png')}
                style={[{ width, height }]}
                resizeMode="cover"
            />
            <View style={styles.overlay}>
                <RNText style={styles.title}>Достижения</RNText>
                <View style={styles.achList}>
                    {[
                        { id: 'first_blood', name: 'Первый шаг', desc: 'Наберите 1 очко' },
                        { id: 'five_club', name: 'Клуб пяти', desc: 'Наберите 5 очков' },
                        { id: 'ten_club', name: 'Десятка', desc: 'Наберите 10 очков' },
                        { id: 'marathon_50', name: 'Марафонец', desc: 'Наберите 50 очков' },
                        { id: 'collector_3', name: 'Коллекционер', desc: 'Владейте 3 скинами' },
                    ].map((a) => {
                        const st = achievementsState[a.id] || { unlocked: false };
                        return (
                            <View key={a.id} style={[styles.achItem, st.unlocked ? styles.achItemUnlocked : null]}>
                                <RNText style={styles.achName}>{a.name}</RNText>
                                <RNText style={styles.achDesc}>{a.desc}</RNText>
                                <RNText style={styles.achStatus}>{st.unlocked ? 'Открыто' : 'Закрыто'}</RNText>
                            </View>
                        );
                    })}
                </View>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
                    <RNText style={styles.secondaryButtonText}>Назад</RNText>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        gap: 12,
    },
    achList: {
        width: '100%',
        maxWidth: 420,
        gap: 8,
    },
    achItem: {
        backgroundColor: 'rgba(255, 244, 220, 0.6)',
        borderRadius: 12,
        padding: 12,
    },
    achItemUnlocked: {
        backgroundColor: 'rgba(188, 230, 192, 0.7)',
    },
    achName: {
        color: '#3d2c1f',
        fontWeight: '700',
        fontSize: 16,
    },
    achDesc: {
        color: '#3d2c1f',
        opacity: 0.9,
    },
    achStatus: {
        marginTop: 4,
        color: '#3d2c1f',
        fontWeight: '600',
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        color: '#fff4dc',
        textShadowColor: '#3d2c1f',
        textShadowRadius: 8,
    },
    secondaryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 244, 220, 0.7)',
    },
    secondaryButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#3d2c1f',
    },
})