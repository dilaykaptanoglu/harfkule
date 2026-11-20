import { Platform } from 'react-native';

/**
 * Production / preview builds set EXPO_PUBLIC_API_URL in eas.json (HTTPS).
 * Local demo fallback: simulator/emulator loopback. Physical devices need the
 * env var or a LAN IP — localhost will not reach a Mac from TestFlight.
 */
const fromEnv = (process.env.EXPO_PUBLIC_API_URL || '').trim().replace(/\/$/, '');

const fallback =
  Platform.OS === 'android' ? 'http://10.0.2.2:8787' : 'http://127.0.0.1:8787';

/** True when the build still has the deploy placeholder instead of a real host. */
export const API_URL_UNCONFIGURED =
  !fromEnv ||
  /TODO_HOSTED_API_URL/i.test(fromEnv) ||
  fromEnv === 'https://' ||
  fromEnv === 'http://';

export const API_URL = API_URL_UNCONFIGURED ? fallback : fromEnv;
