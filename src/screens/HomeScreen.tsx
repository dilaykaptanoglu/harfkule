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
  onStartLocal: (names: [string, string]) => void;
  onOnline: () => void;
  onlineLabel?: string | null;
};

export function HomeScreen({ onStartLocal, onOnline, onlineLabel }: Props) {
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
        <Text style={styles.label}>Çevrimiçi arkadaşlarla</Text>
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
          onPress={onOnline}
        >
          <Text style={styles.ctaText}>
            {onlineLabel ? `Lobi · ${onlineLabel}` : 'Çevrimiçi oyna'}
          </Text>
        </Pressable>
        <Text style={styles.hint}>Kullanıcı adıyla buluş · sıra sıra sunucuda</Text>

        <Text style={[styles.label, { marginTop: spacing.xl }]}>Yerel 2 oyunculu</Text>
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
          style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.9 }]}
          onPress={() => onStartLocal([p1.trim() || 'Oyuncu 1', p2.trim() || 'Oyuncu 2'])}
        >
          <Text style={styles.secondaryText}>Yerel oyuna başla</Text>
        </Pressable>
        <Text style={styles.hint}>Aynı cihazda sıra sıra · hesap gerekmez</Text>
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
    top: '14%',
    alignSelf: 'center',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(232,196,104,0.12)',
  },
  hero: {
    marginBottom: spacing.xl,
  },
  brand: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 58,
    lineHeight: 62,
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
  secondary: {
    marginTop: spacing.sm,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(126,200,184,0.4)',
    backgroundColor: 'rgba(247,241,227,0.06)',
  },
  secondaryText: {
    fontFamily: 'DMSans_700Bold',
    color: colors.cream,
    fontSize: 16,
  },
  hint: {
    marginTop: 2,
    textAlign: 'center',
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(247,241,227,0.55)',
    fontSize: 13,
  },
});
