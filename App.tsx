import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGame } from './src/game/engine';
import type { GameState } from './src/game/types';
import { GameScreen } from './src/screens/GameScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { colors } from './src/theme/theme';

type Screen = 'home' | 'game';

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });
  const [screen, setScreen] = useState<Screen>('home');
  const [game, setGame] = useState<GameState | null>(null);

  const start = useCallback((names: [string, string]) => {
    setGame(createGame(names));
    setScreen('game');
  }, []);

  const exit = useCallback(() => {
    setScreen('home');
    setGame(null);
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {screen === 'home' || !game ? (
        <HomeScreen onStart={start} />
      ) : (
        <GameScreen
          state={game}
          setState={(updater) => {
            setGame((prev) => {
              if (!prev) return prev;
              return typeof updater === 'function' ? updater(prev) : updater;
            });
          }}
          onExit={exit}
        />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.bg0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
