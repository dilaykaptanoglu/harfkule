import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, ApiError, type GameSummary, type PublicUser } from '../api/client';
import type { Session } from '../api/session';
import { colors, spacing } from '../theme/theme';

type Props = {
  session: Session;
  onOpenGame: (gameId: string) => void;
  onLogout: () => void;
  onBack: () => void;
};

export function OnlineLobbyScreen({ session, onOpenGame, onLogout, onBack }: Props) {
  const [friends, setFriends] = useState<PublicUser[]>([]);
  const [games, setGames] = useState<GameSummary[]>([]);
  const [recent, setRecent] = useState<Array<PublicUser & { gameId: string; status: string }>>([]);
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<(PublicUser & { isFriend: boolean }) | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [f, g, r] = await Promise.all([
        api.friends(session.token),
        api.games(session.token),
        api.recent(session.token),
      ]);
      setFriends(f.friends);
      setGames(g.games);
      setRecent(r.recent);
      setMessage(null);
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : 'Sunucuya ulaşılamadı.');
    } finally {
      setLoading(false);
    }
  }, [session.token]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, [refresh]);

  async function search() {
    setBusy(true);
    setFound(null);
    try {
      const res = await api.searchUser(session.token, query.trim());
      setFound({ ...res.user, isFriend: res.isFriend });
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : 'Arama başarısız.');
    } finally {
      setBusy(false);
    }
  }

  async function addFriend(username: string) {
    setBusy(true);
    try {
      await api.addFriend(session.token, username);
      setMessage(`${username} eklendi.`);
      setFound((f) => (f ? { ...f, isFriend: true } : f));
      await refresh();
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : 'Eklenemedi.');
    } finally {
      setBusy(false);
    }
  }

  async function challenge(username: string) {
    setBusy(true);
    try {
      const res = await api.challenge(session.token, username);
      setMessage(`Davet gönderildi → ${username}`);
      await refresh();
      if (res.game.status === 'active') onOpenGame(res.game.id);
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : 'Davet gönderilemedi.');
    } finally {
      setBusy(false);
    }
  }

  async function accept(gameId: string) {
    setBusy(true);
    try {
      const res = await api.accept(session.token, gameId);
      onOpenGame(res.game.id);
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : 'Kabul edilemedi.');
    } finally {
      setBusy(false);
    }
  }

  async function decline(gameId: string) {
    try {
      await api.decline(session.token, gameId);
      await refresh();
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : 'Reddedilemedi.');
    }
  }

  const invites = games.filter((g) => g.status === 'pending' && g.opponent.id === session.user.id);
  const outgoing = games.filter((g) => g.status === 'pending' && g.challenger.id === session.user.id);
  const active = games.filter((g) => g.status === 'active' || g.status === 'ended');

  return (
    <LinearGradient colors={[colors.bg0, colors.bg1]} style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.top}>
          <Pressable onPress={onBack}>
            <Text style={styles.link}>← Menü</Text>
          </Pressable>
          <Text style={styles.brand}>HarfKule</Text>
          <Pressable onPress={onLogout}>
            <Text style={styles.linkRight}>Çıkış</Text>
          </Pressable>
        </View>
        <Text style={styles.hello}>Merhaba, {session.user.username}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}

        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.gold} />}
        >
          <Text style={styles.section}>Arkadaş bul</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              autoCapitalize="none"
              value={query}
              onChangeText={setQuery}
              placeholder="Tam kullanıcı adı"
              placeholderTextColor="rgba(247,241,227,0.35)"
            />
            <Pressable style={styles.smallBtn} onPress={search} disabled={busy}>
              <Text style={styles.smallBtnText}>Ara</Text>
            </Pressable>
          </View>
          {found ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{found.username}</Text>
              <View style={styles.row}>
                {!found.isFriend ? (
                  <Pressable style={styles.smallBtn} onPress={() => addFriend(found.username)}>
                    <Text style={styles.smallBtnText}>Ekle</Text>
                  </Pressable>
                ) : null}
                <Pressable style={[styles.smallBtn, styles.primaryBtn]} onPress={() => challenge(found.username)}>
                  <Text style={[styles.smallBtnText, styles.primaryBtnText]}>Meydan oku</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {invites.length > 0 ? (
            <>
              <Text style={styles.section}>Gelen davetler</Text>
              {invites.map((g) => (
                <View key={g.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{g.challenger.username} seni bekliyor</Text>
                  <View style={styles.row}>
                    <Pressable style={[styles.smallBtn, styles.primaryBtn]} onPress={() => accept(g.id)}>
                      <Text style={[styles.smallBtnText, styles.primaryBtnText]}>Kabul</Text>
                    </Pressable>
                    <Pressable style={styles.smallBtn} onPress={() => decline(g.id)}>
                      <Text style={styles.smallBtnText}>Reddet</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </>
          ) : null}

          {outgoing.length > 0 ? (
            <>
              <Text style={styles.section}>Giden davetler</Text>
              {outgoing.map((g) => (
                <View key={g.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{g.opponent.username} — bekleniyor</Text>
                  <Pressable style={styles.smallBtn} onPress={() => decline(g.id)}>
                    <Text style={styles.smallBtnText}>İptal</Text>
                  </Pressable>
                </View>
              ))}
            </>
          ) : null}

          <Text style={styles.section}>Aktif / son oyunlar</Text>
          {active.length === 0 ? <Text style={styles.empty}>Henüz çevrimiçi oyun yok.</Text> : null}
          {active.map((g) => {
            const other =
              g.challenger.username === session.user.username ? g.opponent.username : g.challenger.username;
            return (
              <Pressable key={g.id} style={styles.card} onPress={() => onOpenGame(g.id)}>
                <Text style={styles.cardTitle}>
                  vs {other} · {g.status === 'ended' ? 'bitti' : g.waitingOnYou ? 'sira sende' : 'rakip'}
                </Text>
              </Pressable>
            );
          })}

          <Text style={styles.section}>Arkadaşlar</Text>
          {friends.length === 0 ? <Text style={styles.empty}>Arkadaş listesi boş.</Text> : null}
          {friends.map((f) => (
            <View key={f.id} style={styles.card}>
              <Text style={styles.cardTitle}>{f.username}</Text>
              <Pressable style={[styles.smallBtn, styles.primaryBtn]} onPress={() => challenge(f.username)}>
                <Text style={[styles.smallBtnText, styles.primaryBtnText]}>Meydan oku</Text>
              </Pressable>
            </View>
          ))}

          <Text style={styles.section}>Son rakipler</Text>
          {recent.length === 0 ? <Text style={styles.empty}>Yok.</Text> : null}
          {recent.map((r) => (
            <View key={`${r.gameId}-${r.id}`} style={styles.card}>
              <Text style={styles.cardTitle}>{r.username}</Text>
              <View style={styles.row}>
                <Pressable style={styles.smallBtn} onPress={() => onOpenGame(r.gameId)}>
                  <Text style={styles.smallBtnText}>Aç</Text>
                </Pressable>
                <Pressable style={[styles.smallBtn, styles.primaryBtn]} onPress={() => challenge(r.username)}>
                  <Text style={[styles.smallBtnText, styles.primaryBtnText]}>Yeniden</Text>
                </Pressable>
              </View>
            </View>
          ))}

          {busy ? <ActivityIndicator color={colors.gold} style={{ marginTop: 12 }} /> : null}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  brand: { fontFamily: 'Fraunces_700Bold', color: colors.gold, fontSize: 22 },
  link: { fontFamily: 'DMSans_500Medium', color: colors.mist, width: 72 },
  linkRight: { fontFamily: 'DMSans_500Medium', color: colors.mist, width: 72, textAlign: 'right' },
  hello: {
    fontFamily: 'DMSans_500Medium',
    color: colors.cream,
    paddingHorizontal: spacing.md,
    marginTop: 4,
    marginBottom: 4,
  },
  message: {
    color: colors.gold,
    fontFamily: 'DMSans_500Medium',
    paddingHorizontal: spacing.md,
    marginBottom: 6,
  },
  scroll: { padding: spacing.md, paddingBottom: 40, gap: 8 },
  section: {
    marginTop: 12,
    marginBottom: 4,
    fontFamily: 'DMSans_700Bold',
    color: colors.mist,
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 0.6,
  },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  input: {
    backgroundColor: 'rgba(247,241,227,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(126,200,184,0.28)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.cream,
    fontFamily: 'DMSans_500Medium',
  },
  card: {
    backgroundColor: 'rgba(247,241,227,0.06)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(126,200,184,0.2)',
    gap: 8,
  },
  cardTitle: { fontFamily: 'DMSans_700Bold', color: colors.cream, fontSize: 15 },
  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(126,200,184,0.35)',
  },
  smallBtnText: { fontFamily: 'DMSans_700Bold', color: colors.cream, fontSize: 13 },
  primaryBtn: { backgroundColor: colors.gold, borderColor: colors.gold },
  primaryBtnText: { color: colors.ink },
  empty: { fontFamily: 'DMSans_400Regular', color: 'rgba(247,241,227,0.45)' },
});
