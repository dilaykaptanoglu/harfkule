import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Board } from '../components/Board';
import { BlankPicker } from '../components/BlankPicker';
import { Rack } from '../components/Rack';
import { api, ApiError, type GamePayload } from '../api/client';
import type { Session } from '../api/session';
import type { OnlineGameView } from '../game/onlineView';
import type { GameState, Letter, PendingPlacement } from '../game/types';
import { colors, spacing } from '../theme/theme';

type Props = {
  session: Session;
  gameId: string;
  onExit: () => void;
};

function toBoardState(view: OnlineGameView, pending: PendingPlacement[]): GameState {
  return {
    board: view.board,
    bag: [],
    players: [
      {
        id: 0,
        name: view.players[0].name,
        score: view.players[0].score,
        rack: view.players[0].isYou ? view.players[0].rack : [],
      },
      {
        id: 1,
        name: view.players[1].name,
        score: view.players[1].score,
        rack: view.players[1].isYou ? view.players[1].rack : [],
      },
    ],
    currentPlayer: view.yourSeat,
    pending,
    consecutivePasses: view.consecutivePasses,
    phase: view.phase,
    lastMoveScore: view.lastMoveScore,
    lastWords: view.lastWords,
    message: view.message,
    moveCount: view.moveCount,
    winner: view.winner,
  };
}

export function OnlineGameScreen({ session, gameId, onExit }: Props) {
  const [payload, setPayload] = useState<GamePayload | null>(null);
  const [pending, setPending] = useState<PendingPlacement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [blankFor, setBlankFor] = useState<{ tileId: string; row: number; col: number } | null>(null);
  const [exchangeMode, setExchangeMode] = useState(false);
  const [exchangeIds, setExchangeIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await api.getGame(session.token, gameId);
      setPayload(res.game);
      setError(null);
      // clear local pending if turn flipped away or move count advanced
      setPending((prev) => {
        const view = res.game.view;
        if (!view || !view.isYourTurn) return [];
        return prev;
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Oyun yüklenemedi.');
    }
  }, [gameId, session.token]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 2000);
    return () => clearInterval(t);
  }, [refresh]);

  const view = payload?.view ?? null;
  const myRack = view?.players[view.yourSeat].rack ?? [];
  const boardState = useMemo(
    () => (view ? toBoardState(view, pending) : null),
    [view, pending],
  );

  function onSelectTile(tileId: string) {
    if (!view?.isYourTurn) return;
    if (exchangeMode) {
      setExchangeIds((ids) =>
        ids.includes(tileId) ? ids.filter((id) => id !== tileId) : [...ids, tileId],
      );
      return;
    }
    if (pending.some((p) => p.tileId === tileId)) {
      setPending((ps) => ps.filter((p) => p.tileId !== tileId));
      setSelectedId(tileId);
      return;
    }
    setSelectedId((id) => (id === tileId ? null : tileId));
  }

  function onCellPress(row: number, col: number) {
    if (!view?.isYourTurn || exchangeMode) return;
    const existing = pending.find((p) => p.row === row && p.col === col);
    if (existing) {
      setPending((ps) => ps.filter((p) => p.tileId !== existing.tileId));
      setSelectedId(existing.tileId);
      return;
    }
    if (!selectedId) return;
    if (view.board[row][col].tile) {
      setError('Kare dolu.');
      return;
    }
    const tile = myRack.find((t) => t.id === selectedId);
    if (!tile) return;
    if (tile.isBlank) {
      setBlankFor({ tileId: selectedId, row, col });
      return;
    }
    setPending((ps) => {
      const without = ps.filter((p) => p.tileId !== selectedId && !(p.row === row && p.col === col));
      return [...without, { tileId: selectedId, row, col }];
    });
    setSelectedId(null);
  }

  function onBlankPick(letter: Letter) {
    if (!blankFor) return;
    setPending((ps) => {
      const without = ps.filter(
        (p) => p.tileId !== blankFor.tileId && !(p.row === blankFor.row && p.col === blankFor.col),
      );
      return [...without, { ...blankFor, blankAs: letter }];
    });
    setBlankFor(null);
    setSelectedId(null);
  }

  async function submit(
    body:
      | { type: 'play'; pending: PendingPlacement[] }
      | { type: 'pass' }
      | { type: 'exchange'; tileIds: string[] },
  ) {
    setBusy(true);
    setError(null);
    try {
      const res = await api.move(session.token, gameId, body);
      setPayload(res.game);
      setPending([]);
      setExchangeMode(false);
      setExchangeIds([]);
      setSelectedId(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Hamle gönderilemedi.');
    } finally {
      setBusy(false);
    }
  }

  if (!payload || !view || !boardState) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.gold} size="large" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable onPress={onExit} style={{ marginTop: 16 }}>
          <Text style={styles.link}>← Lobi</Text>
        </Pressable>
      </View>
    );
  }

  const opponent = view.players[view.yourSeat === 0 ? 1 : 0];

  return (
    <LinearGradient colors={[colors.bg0, colors.bg1]} style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable onPress={onExit} hitSlop={8}>
            <Text style={styles.link}>← Lobi</Text>
          </Pressable>
          <Text style={styles.brandMini}>HarfKule</Text>
          <Text style={styles.bag}>Torba {view.bagCount}</Text>
        </View>

        <View style={styles.scores}>
          {view.players.map((p) => (
            <View key={p.id} style={[styles.scoreCard, p.isYou && view.isYourTurn && styles.scoreActive]}>
              <Text style={styles.scoreName} numberOfLines={1}>
                {p.name}
                {p.isYou ? ' (sen)' : ''}
              </Text>
              <Text style={styles.scoreValue}>{p.score}</Text>
              <Text style={styles.rackMeta}>{p.isYou ? `${p.rack.length} taş` : `${p.rackCount} taş`}</Text>
            </View>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <Board state={boardState} onCellPress={onCellPress} />
          <Text style={styles.turn}>
            {view.phase === 'ended'
              ? view.message
              : view.isYourTurn
                ? 'Sıra sende'
                : `${opponent.name} oynuyor…`}
          </Text>
          {view.message && view.phase !== 'ended' ? (
            <Text style={styles.message}>{view.message}</Text>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Rack
            rack={myRack}
            pending={pending}
            selectedId={exchangeMode ? exchangeIds[exchangeIds.length - 1] ?? null : selectedId}
            selectedIds={exchangeMode ? exchangeIds : undefined}
            onSelect={onSelectTile}
          />

          {view.isYourTurn && view.phase !== 'ended' ? (
            <View style={styles.actions}>
              {exchangeMode ? (
                <>
                  <Action
                    label="Değiştir"
                    primary
                    disabled={busy}
                    onPress={() => submit({ type: 'exchange', tileIds: exchangeIds })}
                  />
                  <Action
                    label="İptal"
                    onPress={() => {
                      setExchangeMode(false);
                      setExchangeIds([]);
                    }}
                  />
                </>
              ) : (
                <>
                  <Action
                    label="Onayla"
                    primary
                    disabled={busy}
                    onPress={() => submit({ type: 'play', pending })}
                  />
                  <Action label="Geri Al" onPress={() => setPending([])} />
                  <Action label="Pas" disabled={busy} onPress={() => submit({ type: 'pass' })} />
                  <Action
                    label="Değiş"
                    onPress={() => {
                      setPending([]);
                      setExchangeMode(true);
                    }}
                  />
                </>
              )}
            </View>
          ) : (
            <Text style={styles.hint}>Güncellemeler otomatik yenilenir.</Text>
          )}
          {busy ? <ActivityIndicator color={colors.gold} /> : null}
        </ScrollView>
      </SafeAreaView>

      <BlankPicker visible={!!blankFor} onPick={onBlankPick} onCancel={() => setBlankFor(null)} />

      <Modal visible={view.phase === 'ended'} transparent animationType="fade">
        <View style={styles.end}>
          <Text style={styles.brandMini}>HarfKule</Text>
          <Text style={styles.endTitle}>Oyun bitti</Text>
          <Text style={styles.endBody}>{view.message}</Text>
          <Pressable style={styles.endCta} onPress={onExit}>
            <Text style={styles.endCtaText}>Lobiye dön</Text>
          </Pressable>
        </View>
      </Modal>
    </LinearGradient>
  );
}

function Action({
  label,
  onPress,
  primary,
  disabled,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.action,
        primary && styles.actionPrimary,
        (pressed || disabled) && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.actionText, primary && styles.actionTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  boot: {
    flex: 1,
    backgroundColor: colors.bg0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  link: { fontFamily: 'DMSans_500Medium', color: colors.mist, fontSize: 15, width: 72 },
  brandMini: { fontFamily: 'Fraunces_700Bold', color: colors.gold, fontSize: 20 },
  bag: {
    fontFamily: 'DMSans_500Medium',
    color: colors.cream,
    fontSize: 13,
    width: 72,
    textAlign: 'right',
    opacity: 0.8,
  },
  scores: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  scoreCard: {
    flex: 1,
    backgroundColor: 'rgba(247,241,227,0.06)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  scoreActive: { borderColor: colors.mist, backgroundColor: colors.mistDim },
  scoreName: { fontFamily: 'DMSans_500Medium', color: colors.cream, fontSize: 13 },
  scoreValue: { fontFamily: 'Fraunces_700Bold', color: colors.gold, fontSize: 24 },
  rackMeta: { fontFamily: 'DMSans_400Regular', color: 'rgba(247,241,227,0.5)', fontSize: 11 },
  scroll: { paddingBottom: 28, gap: 10 },
  turn: {
    textAlign: 'center',
    fontFamily: 'DMSans_700Bold',
    color: colors.mist,
    fontSize: 15,
  },
  message: {
    textAlign: 'center',
    fontFamily: 'DMSans_500Medium',
    color: colors.gold,
    fontSize: 14,
    paddingHorizontal: 16,
  },
  error: {
    textAlign: 'center',
    fontFamily: 'DMSans_500Medium',
    color: colors.danger,
    fontSize: 14,
  },
  hint: {
    textAlign: 'center',
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(247,241,227,0.5)',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
  },
  action: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(126,200,184,0.35)',
    backgroundColor: 'rgba(247,241,227,0.06)',
    minWidth: 88,
    alignItems: 'center',
  },
  actionPrimary: { backgroundColor: colors.gold, borderColor: colors.gold },
  actionText: { fontFamily: 'DMSans_700Bold', color: colors.cream, fontSize: 14 },
  actionTextPrimary: { color: colors.ink },
  end: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: 28,
  },
  endTitle: { fontFamily: 'Fraunces_700Bold', color: colors.cream, fontSize: 28, marginTop: 8 },
  endBody: { fontFamily: 'DMSans_400Regular', color: colors.cream, fontSize: 17, marginTop: 12 },
  endCta: {
    marginTop: 28,
    backgroundColor: colors.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  endCtaText: { fontFamily: 'DMSans_700Bold', color: colors.ink, fontSize: 16 },
});
