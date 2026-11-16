import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../theme/theme';

const nativeDriver = Platform.OS !== 'web';

type Props = {
  onStart: (names: [string, string]) => void;
};

export function HomeScreen({ onStart }: Props) {
  const [p1, setP1] = React.useState('Oyuncu 1');
  const [p2, setP2] = React.useState('Oyuncu 2');
  const float = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: nativeDriver }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2800, useNativeDriver: nativeDriver }),
        Animated.timing(float, { toValue: 0, duration: 2800, useNativeDriver: nativeDriver }),
      ]),
    ).start();
  }, [fade, float]);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  return (
    <LinearGradient colors={[colors.bg0, colors.bg1, '#163E2F']} style={styles.root}>
      <View style={styles.glow} />
      <Animated.View style={[styles.hero, { opacity: fade, transform: [{ translateY }] }]}>
        <Text style={styles.brand}>HarfKule</Text>
        <Text style={styles.tagline}>Türkçe harf kulesini birlikte yükseltin.</Text>
      </Animated.View>

      <Animated.View style={[styles.panel, { opacity: fade }]}>
        <Text style={styles.label}>Yerel 2 oyunculu</Text>
        <TextInput
          style={styles.input}
          value={p1}
          onChangeText={setP1}
          placeholder="Oyuncu 1"
          placeholderTextColor="rgba(247,241,227,0.4)"
        />
        <TextInput
          style={styles.input}
          value={p2}
          onChangeText={setP2}
          placeholder="Oyuncu 2"
          placeholderTextColor="rgba(247,241,227,0.4)"
        />
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
          onPress={() => onStart([p1.trim() || 'Oyuncu 1', p2.trim() || 'Oyuncu 2'])}
        >
          <Text style={styles.ctaText}>Oyuna Başla</Text>
        </Pressable>
        <Text style={styles.hint}>Aynı cihazda sıra sıra oynayın · hesap gerekmez</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    top: '18%',
    alignSelf: 'center',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(232,196,104,0.12)',
  },
  hero: {
    marginBottom: spacing.xxl,
  },
  brand: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 64,
    lineHeight: 68,
    color: colors.gold,
    letterSpacing: -1.5,
  },
  tagline: {
    marginTop: spacing.sm,
    fontFamily: 'DMSans_400Regular',
    fontSize: 17,
    lineHeight: 24,
    color: colors.cream,
    maxWidth: 280,
    opacity: 0.9,
  },
  panel: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: 'DMSans_500Medium',
    color: colors.mist,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'rgba(247,241,227,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(126,200,184,0.28)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.cream,
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
  },
  cta: {
    marginTop: spacing.sm,
    backgroundColor: colors.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: 'DMSans_700Bold',
    color: colors.ink,
    fontSize: 17,
  },
  hint: {
    marginTop: spacing.sm,
    textAlign: 'center',
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(247,241,227,0.55)',
    fontSize: 13,
  },
});
