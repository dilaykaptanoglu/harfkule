import { Platform } from 'react-native';

/**
 * Local demo default. On a physical device, set EXPO_PUBLIC_API_URL to your
 * machine LAN IP, e.g. http://192.168.1.20:8787
 */
const fallback =
  Platform.OS === 'android' ? 'http://10.0.2.2:8787' : 'http://127.0.0.1:8787';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || fallback).replace(/\/$/, '');
