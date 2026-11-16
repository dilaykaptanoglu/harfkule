# HarfKule

Türkçe Scrabble / Kelimelik tarzı harf oyunu. Expo (React Native) ile iOS App Store hedefiyle geliştirilen yerel 2 oyunculu (pass-and-play) MVP.

## Çalıştırma

```bash
cd ~/harfkule   # veya proje dizininiz
npm install
npx expo start
```

- Telefonda: Expo Go ile QR kodu okutun (aynı ağ).
- Web önizleme: `npx expo start --web`
- iOS simülatör (macOS): `npx expo start --ios`

Typecheck:

```bash
npx tsc --noEmit
```

Oyun mantığı duman testi:

```bash
npm run smoke
```

## Oynanış (MVP)

- 15×15 klasik tahta, H²/H³/K²/K³ çarpanları
- Türkçe harf torbası (100 taş: 98 harf + 2 joker)
- Rafta 7 taş; aynı cihazda 2 oyuncu sıra sıra
- Kelime doğrulama: paketlenmiş Türkçe kelime listesi
- Pas / taş değiştir / bingo (+50) / torba bitince bitiş

## Harf puanları ve dağılım

Kaynaklar (MVP araştırması):

- [Turkish Scrabble letter table (gtoal.com)](https://gtoal.com/scrabble/details/turkish/)
- Kelimelik yardım tabloları (yaygın alıntılar; Türkçe Scrabble ile aynı dağılım olarak belirtilir)

Özet: A12(1), B2(3), C2(4), Ç2(4), D2(3), E8(1), F1(7), G1(5), Ğ1(8), H1(5), I4(2), İ7(1), J1(10), K7(1), L7(1), M4(2), N5(1), O3(2), Ö1(7), P1(5), R6(1), S3(2), Ş2(4), T5(1), U3(2), Ü2(3), V1(7), Y2(3), Z2(4), Joker2(0).

Kod: `src/game/letters.ts`

## Sözlük lisansı

Ayrıntı: [`assets/data/WORDLIST_ATTRIBUTION.md`](assets/data/WORDLIST_ATTRIBUTION.md)

- CanNuhlar/Turkce-Kelime-Listesi (TDK İmla Kılavuzu türevli; upstream SPDX yok — ticari yayın öncesi net lisanslı kaynakla değiştirin)
- hermitdave/FrequencyWords TR (içerik: **CC BY-SA 4.0**, OpenSubtitles2018)

## App Store’a giden yol (sonra)

Apple Developer Program kaydı tamamlandığında:

1. [Expo](https://expo.dev) hesabı + `eas login`
2. `eas init` ile gerçek `extra.eas.projectId` yazın (`app.json`)
3. `eas.json` içindeki `submit.production.ios` alanlarını Apple ID / ASC App ID / Team ID ile doldurun
4. Production build: `eas build -p ios --profile production`
5. Submit: `eas submit -p ios --latest` (veya App Store Connect’e manuel yükleme)
6. App Store Connect’te ekran görüntüleri, gizlilik, yaş sınırı, inceleme notları

Bu repoda henüz uzak GitHub yok; bağlayınca CI + EAS tetiklenebilir.

## TODO (MVP dışı)

- [ ] Çevrimiçi çok oyunculu (arkadaş daveti)
- [ ] Hesaplar / sıralama
- [ ] IAP
- [ ] Resmi / net lisanslı turnuva sözlüğü
- [ ] EAS projectId + Apple kimlik bilgileri
- [ ] App Store gönderimi ve inceleme

## Proje yapısı

```
App.tsx
src/game/          # torba, tahta, kurallar, motor
src/components/    # tahta, raf, taş UI
src/screens/       # menü + oyun
assets/data/       # turkish-words.json
eas.json           # EAS iskeleti
```
