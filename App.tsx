import React, { useCallback, useEffect, useState } from 'react';
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
import { clearSession, loadSession, type Session } from './src/api/session';
import { AuthScreen } from './src/screens/AuthScreen';
import { GameScreen } from './src/screens/GameScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { OnlineGameScreen } from './src/screens/OnlineGameScreen';
import { OnlineLobbyScreen } from './src/screens/OnlineLobbyScreen';
import { colors } from './src/theme/theme';

type Screen = 'home' | 'localGame' | 'auth' | 'lobby' | 'onlineGame';

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });
  const [screen, setScreen] = useState<Screen>('home');
  const [localGame, setLocalGame] = useState<GameState | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [onlineGameId, setOnlineGameId] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    loadSession()
      .then((s) => setSession(s))
      .finally(() => setBooting(false));
  }, []);

  const startLocal = useCallback((names: [string, string]) => {
    setLocalGame(createGame(names));
    setScreen('localGame');
  }, []);

  const exitLocal = useCallback(() => {
    setScreen('home');
    setLocalGame(null);
  }, []);

  const goOnline = useCallback(() => {
    if (session) setScreen('lobby');
    else setScreen('auth');
  }, [session]);

  const logout = useCallback(async () => {
    await clearSession();
    setSession(null);
    setOnlineGameId(null);
    setScreen('home');
  }, []);

  if (!fontsLoaded || booting) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  let body: React.ReactNode = (
    <HomeScreen
      onStartLocal={startLocal}
      onOnline={goOnline}
      onlineLabel={session?.user.username ?? null}
    />
  );

  if (screen === 'auth') {
    body = (
      <AuthScreen
        onAuthed={(s) => {
          setSession(s);
          setScreen('lobby');
        }}
        onBack={() => setScreen('home')}
      />
    );
  } else if (screen === 'lobby' && session) {
    body = (
      <OnlineLobbyScreen
        session={session}
        onOpenGame={(id) => {
          setOnlineGameId(id);
          setScreen('onlineGame');
        }}
        onLogout={logout}
        onBack={() => setScreen('home')}
      />
    );
  } else if (screen === 'onlineGame' && session && onlineGameId) {
    body = (
      <OnlineGameScreen
        session={session}
        gameId={onlineGameId}
        onExit={() => {
          setOnlineGameId(null);
          setScreen('lobby');
        }}
      />
    );
  } else if (screen === 'localGame' && localGame) {
    body = (
      <GameScreen
        state={localGame}
        setState={(updater) => {
          setLocalGame((prev) => {
            if (!prev) return prev;
            return typeof updater === 'function' ? updater(prev) : updater;
          });
        }}
        onExit={exitLocal}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {body}
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
