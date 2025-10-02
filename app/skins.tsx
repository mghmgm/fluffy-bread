import { useSkins } from "@/hooks/useSkins"
import { View, Text as RNText, TouchableOpacity, StyleSheet, ImageBackground, useWindowDimensions } from 'react-native'
import { Canvas, Image, useImage } from "@shopify/react-native-skia";
import { SkinId } from "@/services/gameApi";
import { useRouter } from "expo-router";

export default function Skins() {
    const router = useRouter();
    const { ownedSkins, activeSkin, setActiveSkin } = useSkins(); // refreshOwned больше не нужен здесь
    const birdDefault = useImage(require('../assets/sprites/Item_Bread1.png'));
    const birdAlt = useImage(require('../assets/sprites/Item_Bread.png'));
    const { width, height } = useWindowDimensions();

    const handleSkinSelect = async (id: SkinId) => {
        await setActiveSkin(id);
        router.back(); // Можно сразу возвращаться, состояние синхронизировано
    };

    return (
        <View>
            <ImageBackground
                source={require('../assets/sprites/background-day.png')}
                style={[{ width, height }]}
                resizeMode="cover"
            />
            <View style={styles.overlay}>
                <RNText style={styles.title}>Скины</RNText>
                <RNText style={styles.tip}>Выберите внешний вид хлебушка</RNText>
                <View style={styles.skinsGrid}>
                    {(ownedSkins.length > 0 ? ownedSkins : (['bread_default'] as SkinId[])).map((id) => (
                        <TouchableOpacity
                            key={id}
                            style={[styles.skinCard, activeSkin === id ? styles.skinCardActive : null]}
                            onPress={() => handleSkinSelect(id)}
                        >
                            <Canvas style={{ width: 96, height: 72 }}>
                                <Image
                                    image={id === 'bread_alt' ? birdAlt : birdDefault}
                                    x={16}
                                    y={12}
                                    width={64}
                                    height={48}
                                />
                            </Canvas>
                            <RNText style={styles.skinLabel}>
                                {id === 'bread_default' ? 'Обычный' :
                                    id === 'bread_alt' ? 'Альтернативный' : id}
                            </RNText>
                        </TouchableOpacity>
                    ))}
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
    title: {
        fontSize: 36,
        fontWeight: '800',
        color: '#fff4dc',
        textShadowColor: '#3d2c1f',
        textShadowRadius: 8,
    },
    tip: {
        fontSize: 16,
        color: '#fff4dc',
        textAlign: 'center',
    },
    skinRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    skinPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    skinsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    },
    skinCard: {
        width: 120,
        height: 120,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 244, 220, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    skinCardActive: {
        backgroundColor: 'rgba(241, 194, 125, 0.8)',
    },
    skinLabel: {
        marginTop: 4,
        color: '#3d2c1f',
        fontWeight: '600',
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