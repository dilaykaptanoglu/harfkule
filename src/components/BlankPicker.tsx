import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ALL_LETTERS } from '../game/letters';
import type { Letter } from '../game/types';
import { colors } from '../theme/theme';

type Props = {
  visible: boolean;
  onPick: (letter: Letter) => void;
  onCancel: () => void;
};

export function BlankPicker({ visible, onPick, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Joker harfi seç</Text>
          <View style={styles.grid}>
            {ALL_LETTERS.map((L) => (
              <Pressable key={L} style={styles.cell} onPress={() => onPick(L)}>
                <Text style={styles.letter}>{L}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={onCancel} style={styles.cancel}>
            <Text style={styles.cancelText}>Vazgeç</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.bg1,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.mistDim,
  },
  title: {
    fontFamily: 'Fraunces_700Bold',
    color: colors.cream,
    fontSize: 22,
    marginBottom: 14,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  cell: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.tileFace,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontFamily: 'Fraunces_700Bold',
    color: colors.ink,
    fontSize: 18,
  },
  cancel: {
    marginTop: 16,
    alignSelf: 'center',
    padding: 10,
  },
  cancelText: {
    fontFamily: 'DMSans_500Medium',
    color: colors.mist,
    fontSize: 16,
  },
});
