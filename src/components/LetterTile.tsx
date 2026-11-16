import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../theme/theme';

type Props = {
  letter: string;
  points: number;
  size: number;
  selected?: boolean;
  pending?: boolean;
  muted?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

export function LetterTile({
  letter,
  points,
  size,
  selected,
  pending,
  muted,
  onPress,
  style,
}: Props) {
  const radius = Math.max(4, size * 0.14);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: radius,
          opacity: muted ? 0.45 : pressed ? 0.85 : 1,
          transform: [{ scale: selected ? 1.08 : 1 }],
          borderColor: selected ? colors.mist : pending ? colors.goldDeep : colors.tileEdge,
          borderWidth: selected || pending ? 2 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.letter, { fontSize: size * 0.48 }]}>{letter}</Text>
      <Text style={[styles.points, { fontSize: Math.max(8, size * 0.2) }]}>{points}</Text>
      {pending ? <View style={styles.pendingDot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.tileFace,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  letter: {
    fontFamily: 'Fraunces_700Bold',
    color: colors.ink,
    marginTop: 1,
  },
  points: {
    position: 'absolute',
    right: 3,
    bottom: 1,
    fontFamily: 'DMSans_500Medium',
    color: colors.inkSoft,
  },
  pendingDot: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.goldDeep,
  },
});
