import React, { useMemo, useState } from 'react';
import {
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
import {
  acknowledgePassPhone,
  confirmPlay,
  exchangeTiles,
  passTurn,
  placePending,
  recallAll,
  recallTile,
} from '../game/engine';
import type { GameState, Letter } from '../game/types';
import { colors, spacing } from '../theme/theme';

type Props = {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  onExit: () => void;
};

export function GameScreen({ state, setState, onExit }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [blankFor, setBlankFor] = useState<{ tileId: string; row: number; col: number } | null>(
    null,
  );
  const [exchangeMode, setExchangeMode] = useState(false);
  const [exchangeIds, setExchangeIds] = useState<string[]>([]);

  const current = state.players[state.currentPlayer];
  const other = state.players[state.currentPlayer === 0 ? 1 : 0];

  const preview = useMemo(() => {
    // lightweight — message already carries validation feedback
    return null;
  }, []);

  function onSelectTile(tileId: string) {
    if (exchangeMode) {
      setExchangeIds((ids) =>
        ids.includes(tileId) ? ids.filter((id) => id !== tileId) : [...ids, tileId],
      );
      return;
    }
    const pending = state.pending.find((p) => p.tileId === tileId);
    if (pending) {
      setState((s) => recallTile(s, tileId));
      setSelectedId(tileId);
      return;
    }
    setSelectedId((id) => (id === tileId ? null : tileId));
  }

  function onCellPress(row: number, col: number) {
    if (state.phase !== 'playing' || exchangeMode) return;
    const existingPending = state.pending.find((p) => p.row === row && p.col === col);
    if (existingPending) {
      setState((s) => recallTile(s, existingPending.tileId));
      setSelectedId(existingPending.tileId);
      return;
    }
    if (!selectedId) return;
    const tile = current.rack.find((t) => t.id === selectedId);
    if (!tile) return;
    if (tile.isBlank) {
      setBlankFor({ tileId: selectedId, row, col });
      return;
    }
    setState((s) => placePending(s, selectedId, row, col));
    setSelectedId(null);
  }

  function onBlankPick(letter: Letter) {
    if (!blankFor) return;
    setState((s) => placePending(s, blankFor.tileId, blankFor.row, blankFor.col, letter));
    setBlankFor(null);
    setSelectedId(null);
  }

  return (
    <LinearGradient colors={[colors.bg0, colors.bg1]} style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable onPress={onExit} hitSlop={8}>
            <Text style={styles.link}>← Menü</Text>
          </Pressable>
          <Text style={styles.brandMini}>HarfKule</Text>
          <Text style={styles.bag}>Torba {state.bag.length}</Text>
        </View>

        <View style={styles.scores}>
          {state.players.map((p, i) => (
            <View
              key={p.id}
              style={[styles.scoreCard, i === state.currentPlayer && styles.scoreActive]}
            >
              <Text style={styles.scoreName} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={styles.scoreValue}>{p.score}</Text>
            </View>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Board state={state} onCellPress={onCellPress} />

          <Text style={styles.turn}>
            Sıra: <Text style={styles.turnName}>{current.name}</Text>
          </Text>
          {state.message ? <Text style={styles.message}>{state.message}</Text> : null}
          {preview}

          <Rack
            rack={current.rack}
            pending={state.pending}
            selectedId={exchangeMode ? exchangeIds[exchangeIds.length - 1] ?? null : selectedId}
            selectedIds={exchangeMode ? exchangeIds : undefined}
            onSelect={onSelectTile}
          />
          {exchangeMode ? (
            <Text style={styles.exchangeHint}>
              Değiştirmek için taş seç ({exchangeIds.length}) — torbada {state.bag.length}
            </Text>
          ) : (
            <Text style={styles.hint}>Taş seç → tahtaya dokun · tekrar dokunarak geri al</Text>
          )}

          <View style={styles.actions}>
            {exchangeMode ? (
              <>
                <Action
                  label="Değiştir & Pas"
                  primary
                  onPress={() => {
                    setState((s) => exchangeTiles(s, exchangeIds));
                    setExchangeMode(false);
                    setExchangeIds([]);
                    setSelectedId(null);
                  }}
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
                  onPress={() => {
                    setState((s) => confirmPlay(s));
                    setSelectedId(null);
                  }}
                />
                <Action label="Geri Al" onPress={() => setState((s) => recallAll(s))} />
                <Action
                  label="Pas"
                  onPress={() => {
                    setState((s) => passTurn(s));
                    setSelectedId(null);
                  }}
                />
                <Action
                  label="Değiş"
                  onPress={() => {
                    setState((s) => recallAll(s));
                    setExchangeMode(true);
                    setSelectedId(null);
                  }}
                />
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <BlankPicker
        visible={!!blankFor}
        onPick={onBlankPick}
        onCancel={() => setBlankFor(null)}
      />

      <Modal visible={state.phase === 'passPhone'} transparent animationType="fade">
        <View style={styles.passPhone}>
          <Text style={styles.passBrand}>HarfKule</Text>
          <Text style={styles.passTitle}>Telefonu ver</Text>
          <Text style={styles.passBody}>
            Sıra <Text style={{ color: colors.gold }}>{current.name}</Text> adlı oyuncuda.
            {'\n'}
            {other.name} ekranı görmesin.
          </Text>
          {state.lastMoveScore > 0 ? (
            <Text style={styles.passScore}>Son hamle +{state.lastMoveScore}</Text>
          ) : null}
          <Pressable
            style={styles.passCta}
            onPress={() => setState((s) => acknowledgePassPhone(s))}
          >
            <Text style={styles.passCtaText}>Ben {current.name} — Devam</Text>
          </Pressable>
        </View>
      </Modal>

      <Modal visible={state.phase === 'ended'} transparent animationType="fade">
        <View style={styles.passPhone}>
          <Text style={styles.passBrand}>HarfKule</Text>
          <Text style={styles.passTitle}>Oyun bitti</Text>
          <Text style={styles.passBody}>{state.message}</Text>
          <View style={{ gap: 8, marginVertical: 16 }}>
            {state.players.map((p) => (
              <Text key={p.id} style={styles.finalScore}>
                {p.name}: {p.score}
              </Text>
            ))}
          </View>
          <Pressable style={styles.passCta} onPress={onExit}>
            <Text style={styles.passCtaText}>Ana menü</Text>
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
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        primary && styles.actionPrimary,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={[styles.actionText, primary && styles.actionTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  link: {
    fontFamily: 'DMSans_500Medium',
    color: colors.mist,
    fontSize: 15,
    width: 72,
  },
  brandMini: {
    fontFamily: 'Fraunces_700Bold',
    color: colors.gold,
    fontSize: 20,
  },
  bag: {
    fontFamily: 'DMSans_500Medium',
    color: colors.cream,
    fontSize: 13,
    width: 72,
    textAlign: 'right',
    opacity: 0.8,
  },
  scores: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: 'rgba(247,241,227,0.06)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  scoreActive: {
    borderColor: colors.mist,
    backgroundColor: colors.mistDim,
  },
  scoreName: {
    fontFamily: 'DMSans_500Medium',
    color: colors.cream,
    fontSize: 13,
    opacity: 0.85,
  },
  scoreValue: {
    fontFamily: 'Fraunces_700Bold',
    color: colors.gold,
    fontSize: 24,
  },
  scroll: {
    paddingBottom: 28,
    gap: 10,
  },
  turn: {
    textAlign: 'center',
    fontFamily: 'DMSans_400Regular',
    color: colors.cream,
    fontSize: 15,
  },
  turnName: {
    fontFamily: 'DMSans_700Bold',
    color: colors.mist,
  },
  message: {
    textAlign: 'center',
    fontFamily: 'DMSans_500Medium',
    color: colors.gold,
    fontSize: 14,
    paddingHorizontal: 16,
  },
  hint: {
    textAlign: 'center',
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(247,241,227,0.5)',
    fontSize: 12,
  },
  exchangeHint: {
    textAlign: 'center',
    fontFamily: 'DMSans_500Medium',
    color: colors.mist,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    marginTop: 4,
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
  actionPrimary: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  actionText: {
    fontFamily: 'DMSans_700Bold',
    color: colors.cream,
    fontSize: 14,
  },
  actionTextPrimary: {
    color: colors.ink,
  },
  passPhone: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: 28,
  },
  passBrand: {
    fontFamily: 'Fraunces_700Bold',
    color: colors.gold,
    fontSize: 36,
    marginBottom: 8,
  },
  passTitle: {
    fontFamily: 'Fraunces_700Bold',
    color: colors.cream,
    fontSize: 28,
  },
  passBody: {
    marginTop: 12,
    fontFamily: 'DMSans_400Regular',
    color: colors.cream,
    fontSize: 17,
    lineHeight: 26,
    opacity: 0.9,
  },
  passScore: {
    marginTop: 10,
    fontFamily: 'DMSans_500Medium',
    color: colors.mist,
  },
  passCta: {
    marginTop: 28,
    backgroundColor: colors.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  passCtaText: {
    fontFamily: 'DMSans_700Bold',
    color: colors.ink,
    fontSize: 16,
  },
  finalScore: {
    fontFamily: 'DMSans_700Bold',
    color: colors.cream,
    fontSize: 18,
  },
});
