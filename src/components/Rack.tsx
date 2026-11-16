import React from 'react';
import { StyleSheet, View } from 'react-native';
import { displayLetter } from '../game/letters';
import type { PendingPlacement, Tile } from '../game/types';
import { colors } from '../theme/theme';
import { LetterTile } from './LetterTile';

type Props = {
  rack: Tile[];
  pending: PendingPlacement[];
  selectedId: string | null;
  selectedIds?: string[];
  onSelect: (tileId: string) => void;
  tileSize?: number;
};

export function Rack({
  rack,
  pending,
  selectedId,
  selectedIds,
  onSelect,
  tileSize = 44,
}: Props) {
  const pendingIds = new Set(pending.map((p) => p.tileId));
  const multi = new Set(selectedIds ?? []);

  return (
    <View style={styles.rack}>
      {rack.map((tile) => {
        const isPending = pendingIds.has(tile.id);
        const blankAs = pending.find((p) => p.tileId === tile.id)?.blankAs;
        return (
          <LetterTile
            key={tile.id}
            letter={displayLetter(tile, blankAs)}
            points={tile.points}
            size={tileSize}
            selected={selectedId === tile.id || multi.has(tile.id)}
            muted={isPending}
            onPress={() => onSelect(tile.id)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rack: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.mistDim,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(126,200,184,0.35)',
    minHeight: 64,
  },
});
