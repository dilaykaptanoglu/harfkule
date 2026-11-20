import React, { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ApiError, sessionFromRegister } from '../api/client';
import { saveSession, type Session } from '../api/session';
import { colors, spacing } from '../theme/theme';

type Props = {
  onAuthed: (session: Session) => void;
  onBack: () => void;
};

export function AuthScreen({ onAuthed, onBack }: Props) {
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    Keyboard.dismiss();
    setError(null);
    setBusy(true);
    try {
      const session = await sessionFromRegister(username.trim());
      await saveSession(session);
      onAuthed(session);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : 'Bağlantı hatası. Yerel oyun çevrimdışı çalışır; API adresi yapılandırılmamış olabilir.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={[colors.bg0, colors.bg1]} style={styles.flex}>
        <Pressable style={styles.root} onPress={Keyboard.dismiss} accessible={false}>
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              onBack();
            }}
            hitSlop={8}
          >
            <Text style={styles.back}>← Geri</Text>
          </Pressable>
          <Text style={styles.brand}>HarfKule</Text>
          <Text style={styles.title}>Kullanıcı adını seç</Text>
          <Text style={styles.sub}>
            Arkadaşların seni bu isimle bulur. Şifre yok — cihazında saklanır.
          </Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
            placeholder="ornek_oyuncu"
            placeholderTextColor="rgba(247,241,227,0.35)"
            maxLength={20}
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={submit}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            style={({ pressed }) => [
              styles.cta,
              pressed && { opacity: 0.9 },
              busy && { opacity: 0.6 },
            ]}
            onPress={submit}
            disabled={busy || username.trim().length < 3}
          >
            {busy ? (
              <ActivityIndicator color={colors.ink} />
            ) : (
              <Text style={styles.ctaText}>Devam</Text>
            )}
          </Pressable>
        </Pressable>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  back: { fontFamily: 'DMSans_500Medium', color: colors.mist, marginBottom: spacing.lg },
  brand: { fontFamily: 'Fraunces_700Bold', color: colors.gold, fontSize: 40 },
  title: {
    fontFamily: 'Fraunces_700Bold',
    color: colors.cream,
    fontSize: 26,
    marginTop: spacing.md,
  },
  sub: {
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(247,241,227,0.7)',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    lineHeight: 22,
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
  error: { color: colors.danger, marginTop: 10, fontFamily: 'DMSans_500Medium' },
  cta: {
    marginTop: spacing.lg,
    backgroundColor: colors.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: { fontFamily: 'DMSans_700Bold', color: colors.ink, fontSize: 17 },
});
