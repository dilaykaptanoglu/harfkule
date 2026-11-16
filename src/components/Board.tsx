import React, { useMemo } from 'react';
import { StyleSheet, Text, Pressable, View, useWindowDimensions } from 'react-native';
import { BOARD_SIZE, premiumLabel } from '../game/boardLayout';
import { displayLetter } from '../game/letters';
import type { GameState, PendingPlacement } from '../game/types';
import { colors } from '../theme/theme';
import { LetterTile } from './LetterTile';

type Props = {
  state: GameState;
  onCellPress: (row: number, col: number) => void;
};

function premiumColor(premium: string | null): string {
  switch (premium) {
    case 'TWS':
      return colors.tws;
    case 'DWS':
    case 'CENTER':
      return colors.dws;
    case 'TLS':
      return colors.tls;
    case 'DLS':
      return colors.dls;
    default:
      return colors.board;
  }
}

export function Board({ state, onCellPress }: Props) {
  const { width } = useWindowDimensions();
  const pad = 12;
  const boardWidth = Math.min(width - pad * 2, 420);
  const gap = 1;
  const cell = (boardWidth - gap * (BOARD_SIZE - 1)) / BOARD_SIZE;
  const pendingMap = useMemo(() => {
    const m = new Map<string, PendingPlacement>();
    for (const p of state.pending) m.set(`${p.row},${p.col}`, p);
    return m;
  }, [state.pending]);

  const rack = state.players[state.currentPlayer].rack;

  return (
    <View style={[styles.wrap, { width: boardWidth }]}>
      {state.board.map((row, r) => (
        <View key={r} style={[styles.row, { gap }]}>
          {row.map((cellData) => {
            const pending = pendingMap.get(`${r},${cellData.col}`);
            const placed = cellData.tile;
            let content: React.ReactNode = null;

            if (placed) {
              content = (
                <LetterTile
                  letter={displayLetter(placed.tile, placed.blankAs)}
                  points={placed.tile.points}
                  size={cell - 1}
                  muted={false}
                />
              );
            } else if (pending) {
              const tile = rack.find((t) => t.id === pending.tileId);
              content = tile ? (
                <LetterTile
                  letter={displayLetter(tile, pending.blankAs)}
                  points={tile.points}
                  size={cell - 1}
                  pending
                />
              ) : null;
            } else {
              const label = premiumLabel(cellData.premium);
              content = label ? (
                <Text style={[styles.premium, { fontSize: Math.max(7, cell * 0.28) }]}>{label}</Text>
              ) : cellData.premium === 'CENTER' ? (
                <Text style={styles.star}>★</Text>
              ) : null;
            }

            return (
              <Pressable
                key={cellData.col}
                onPress={() => onCellPress(r, cellData.col)}
                style={[
                  styles.cell,
                  {
                    width: cell,
                    height: cell,
                    backgroundColor: premiumColor(cellData.premium),
                  },
                ]}
              >
                {content}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    backgroundColor: colors.bg0,
    padding: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.mistDim,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 1,
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
  },
  premium: {
    color: colors.cream,
    fontFamily: 'DMSans_700Bold',
    opacity: 0.9,
  },
  star: {
    color: colors.cream,
    fontSize: 10,
  },
});
