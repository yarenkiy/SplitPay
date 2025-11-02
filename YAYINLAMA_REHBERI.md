# LetSPLIT Uygulama Yayınlama Rehberi

Bu rehber, LetSPLIT uygulamanızı Google Play Store ve Apple App Store'a yayınlamak için tüm adımları içerir.

---

## 📋 GENEL HAZIRLIKLAR

### 1. Hesap Oluşturma

#### Google Play Console
- Git: https://play.google.com/console/signup
- Bir Google hesabıyla giriş yapın
- **Tek seferlik $25 kayıt ücreti** ödemeniz gerekiyor
- Bu ücret ömür boyu geçerlidir

#### Apple App Store Connect
- Git: https://developer.apple.com/programs/
- Apple ID ile kayıt olun
- **Yıllık $99 geliştirici program üyeliği** ödemeniz gerekiyor
- Yıllık yenileme gereklidir

### 2. EAS (Expo Application Services) Kurulumu

#### EAS CLI Kurulumu
```bash
npm install -g eas-cli
```

#### EAS Giriş Yapma
```bash
eas login
```

**Not**: Eğer Expo hesap şifrenizi unuttuysanız:
1. **Expo Web Sitesi**'ne gidin: https://expo.dev
2. **"Sign In"** butonuna tıklayın
3. **"Forgot password?"** linkine tıklayın
4. E-posta adresinizi girin
5. E-posta kutunuzda şifre sıfırlama linkini kontrol edin
6. Yeni şifre belirleyin
7. Ardından `eas login` komutunu tekrar çalıştırın

Alternatif olarak, direkt şifre sıfırlama sayfası:
- https://expo.dev/accounts/password/reset/

#### EAS Projesi Başlatma
Proje dizininizde şu komutu çalıştırın:
```bash
eas init
```

Bu komut:
- Expo hesabınızla projeyi bağlar
- `eas.json` dosyası oluşturur
- `app.json` içindeki `projectId`'yi günceller

---

## 🤖 ANDROID (Google Play Store) YAYINLAMA

### ADIM 1: Android Yapılandırması

#### 1.1 app.json Kontrolü
`app.json` dosyanızda Android ayarlarınız şöyle olmalı:

```json
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/images/adaptive-icon.png",
    "backgroundColor": "#667eea"
  },
  "package": "com.splitpay.app",
  "versionCode": 1,
  "permissions": []
}
```

#### 1.2 Icon ve Splash Screen Hazırlığı
- **Icon**: En az 1024x1024 piksel, PNG formatında
- **Adaptive Icon**: Android için özel adaptive icon (foreground + background)
- Mevcut iconlarınızı kontrol edin: `assets/images/icon.png` ve `assets/images/adaptive-icon.png`

### ADIM 2: EAS Build Yapılandırması

#### 2.1 eas.json Oluşturma
Proje kök dizininde `eas.json` dosyası oluşturun:

```json
{
  "cli": {
    "version": ">= 5.9.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### ADIM 3: Google Play Console'da Uygulama Oluşturma

1. **Google Play Console**'a giriş yapın
2. **"Uygulama oluştur"** butonuna tıklayın
3. Uygulama bilgilerini doldurun:
   - **Uygulama adı**: LetSPLIT
   - **Varsayılan dil**: Türkçe
   - **Uygulama türü**: Uygulama
   - **Ücretsiz mi, ücretli mi**: Ücretsiz
4. **Gizlilik politikası URL'i** eklemeniz gerekecek (önemli!)

### ADIM 4: Android App Bundle (AAB) Oluşturma

```bash
eas build --platform android --profile production
```

Bu komut:
- Bulut sunucularda build oluşturur
- Yaklaşık 15-30 dakika sürer
- Tamamlandığında AAB dosyası indirme linki verir

### ADIM 5: Google Play Console'a Yükleme

1. **Production** sekmesine gidin
2. **"Yeni sürüm oluştur"** tıklayın
3. İndirdiğiniz **AAB dosyasını** yükleyin
4. **Sürüm notları** ekleyin (örn: "İlk sürüm - SplitPay uygulaması")

### ADIM 6: Uygulama İçeriği Bilgileri

Doldurmanız gereken bölümler:

#### 6.1 Mağaza Girişi
- **Kısa açıklama**: 80 karakter (örn: "Arkadaşlarınızla masrafları kolayca bölün")
- **Tam açıklama**: 4000 karakter
- **Grafikler**:
  - Ekran görüntüleri: En az 2 adet (telefon için)
  - Yüksek kaliteli ikon: 512x512 piksel
  - Özellik grafiği: 1024x500 piksel (opsiyonel)

#### 6.2 İçerik Derecelendirmesi
- Yaş uygunluk anketini doldurun
- Genellikle "Herkes" kategorisinde olacak

#### 6.3 Gizlilik Politikası
**ÖNEMLİ**: Mutlaka bir gizlilik politikası URL'i eklemelisiniz. İki seçenek:
- Kendi web siteniz varsa oraya ekleyin
- Veya ücretsiz servisler kullanın:
  - https://www.freeprivacypolicy.com/
  - https://www.privacypolicygenerator.info/

### ADIM 7: İnceleme ve Yayınlama

1. Tüm bilgileri tamamladıktan sonra **"Gönder"** butonuna tıklayın
2. Google incelemesi **2-7 gün** sürebilir
3. Onaylandıktan sonra uygulama yayınlanır

---

## 🍎 iOS (Apple App Store) YAYINLAMA

### ADIM 1: iOS Yapılandırması

#### 1.1 Apple Developer Program Üyeliği
- Apple Developer hesabı: $99/yıl
- Hesap oluşturduktan sonra 48 saat içinde aktif olur

#### 1.2 app.json Kontrolü
`app.json` dosyanızda iOS ayarlarınız:

```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.splitpay.app",
  "buildNumber": "1.0.0"
}
```

### ADIM 2: App Store Connect'te Uygulama Oluşturma

1. **App Store Connect**'e giriş yapın: https://appstoreconnect.apple.com
2. **"Uygulamalarım"** > **"+"** > **"Yeni Uygulama"**
3. Bilgileri doldurun:
   - **Platform**: iOS
   - **Ad**: LetSPLIT
   - **Birincil Dil**: Türkçe
   - **Paket Kimliği**: com.splitpay.app
   - **Kullanıcı Erişimi**: Tam Erişim
   - **SKU**: splitpay-app-001 (benzersiz bir kod)

### ADIM 3: Sertifikalar ve Profiller

EAS build otomatik olarak hallediyor, ancak bilmeniz gerekenler:

#### 3.1 Otomatik Yönetim (Önerilen)
EAS, sertifikaları otomatik oluşturur ve yönetir. Ekstra bir şey yapmanıza gerek yok.

#### 3.2 Manuel Yönetim (İleri seviye)
Eğer kendi sertifikalarınızı kullanmak isterseniz, `eas.json`'da ayarlayabilirsiniz.

### ADIM 4: iOS Build Oluşturma

```bash
eas build --platform ios --profile production
```

Bu komut:
- Sizi Apple Developer hesabınıza bağlamak için yönlendirebilir
- 2FA (İki Faktörlü Doğrulama) kodu isteyebilir
- Build işlemi 20-40 dakika sürebilir

### ADIM 5: App Store Connect'e Yükleme

#### 5.1 TestFlight (Önerilen İlk Adım)
Önce TestFlight ile test edin:

```bash
eas submit --platform ios --latest
```

Bu komut:
- Build'i otomatik olarak App Store Connect'e yükler
- TestFlight'a ekler
- Test kullanıcıları ekleyebilirsiniz

#### 5.2 Doğrudan App Store'a Gönderme
TestFlight'tan memnun kaldıktan sonra, App Store Connect'te:
1. **"App Store"** sekmesine gidin
2. **"+ Sürüm veya Platform Ekle"**
3. Build'i seçin
4. Tüm bilgileri doldurun

### ADIM 6: App Store İçerik Bilgileri

#### 6.1 App Store Girişi
- **Ad**: LetSPLIT (30 karakter)
- **Alt başlık**: 30 karakter (örn: "Masrafları Kolayca Böl")
- **Açıklama**: 4000 karakter
- **Anahtar Kelimeler**: Virgülle ayrılmış (100 karakter)
- **Destek URL'i**: Web siteniz veya GitHub repo
- **Marketing URL'i**: (Opsiyonel)

#### 6.2 Görseller
- **Ekran görüntüleri**: 
  - iPhone: En az 1 set (6.7", 6.5", 5.5" ekranlar için)
  - iPad: (Opsiyonel)
  - Minimum çözünürlük: 1242x2688 piksel
- **App Icon**: 1024x1024 piksel (şeffaf olmamalı)
- **Uygulama önizlemesi**: (Opsiyonel video)

#### 6.3 Uygulama Bilgileri
- **Kategori**: Utilities veya Finance
- **Yaş derecelendirmesi**: 4+ (genellikle)
- **Lisans anlaşması**: Apple'ın standart anlaşmasını kabul edin
- **Gizlilik Politikası URL'i**: (Zorunlu)

#### 6.4 Fiyatlandırma ve Kullanılabilirlik
- **Fiyat**: Ücretsiz veya ücretli
- **Kullanılabilirlik**: Hangi ülkelerde yayınlanacağı

### ADIM 7: İnceleme Gönderme

1. **"İncelemeye Gönder"** butonuna tıklayın
2. Son kontrolleri yapın
3. Gönderin

### ADIM 8: Apple İnceleme Süreci

- İnceleme süresi: **1-3 gün** (bazen daha uzun)
- Apple, uygulamanızı test eder
- Sorun varsa size bildirir
- Onaylandıktan sonra otomatik yayınlanır (veya manuel yayınlama seçebilirsiniz)

---

## 🔧 YAYINLAMA ÖNCESİ KONTROL LİSTESİ

### Teknik Kontroller
- [ ] Tüm özellikler test edildi
- [ ] Backend API production'da çalışıyor
- [ ] Hata yönetimi düzgün çalışıyor
- [ ] Performans optimizasyonu yapıldı
- [ ] Memory leak'ler kontrol edildi

### Görsel Kontroller
- [ ] App icon hazır (Android ve iOS için)
- [ ] Splash screen hazır
- [ ] Ekran görüntüleri hazır
- [ ] Adaptive icon hazır (Android)

### Dokümantasyon
- [ ] Gizlilik politikası hazır ve yayınlandı
- [ ] Kullanıcı anlaşması hazır (gerekirse)
- [ ] Destek e-posta adresi hazır

### Yapılandırma
- [ ] `app.json` doğru yapılandırıldı
- [ ] `eas.json` oluşturuldu
- [ ] API URL'leri production'a işaret ediyor
- [ ] Environment variables doğru ayarlandı

---

## 🚀 HIZLI BAŞLANGIÇ KOMUTLARI

### İlk Kurulum
```bash
# EAS CLI kurulumu
npm install -g eas-cli

# Giriş yapma
eas login

# Proje başlatma
eas init

# Build yapılandırması kontrol
eas build:configure
```

### Android Build ve Gönderme
```bash
# Production build
eas build --platform android --profile production

# Gönderme (manuel)
# Build tamamlandıktan sonra Google Play Console'dan yükleyin

# Veya otomatik gönderme
eas submit --platform android --latest
```

### iOS Build ve Gönderme
```bash
# Production build
eas build --platform ios --profile production

# TestFlight'a gönderme
eas submit --platform ios --latest

# Veya manuel App Store Connect'ten yükleyin
```

---

## 📝 ÖNEMLİ NOTLAR

### Version Management
- **Android**: `versionCode` her build'de artırılmalı
- **iOS**: `buildNumber` her build'de artırılmalı
- **Her ikisi için**: `version` (örn: 1.0.0) kullanıcıya gösterilen versiyon

### Güncelleme Gönderme
1. `app.json` içinde versiyon numaralarını artırın
2. Yeni build oluşturun
3. Store'lara yükleyin

### Gizlilik Politikası
Her iki platform için de **gizlilik politikası URL'i zorunludur**. Uygulamanız kullanıcı verisi topluyorsa (e-posta, isim, vs.) mutlaka eklemelisiniz.

### Backend API
Backend'inizin Railway'de production'da çalıştığından ve erişilebilir olduğundan emin olun:
- CORS ayarları doğru mu?
- SSL sertifikası geçerli mi?
- Rate limiting var mı?

---

## 🆘 YAYGIN SORUNLAR VE ÇÖZÜMLERİ

### Build Başarısız Oluyor
- `eas.json` dosyasını kontrol edin
- `app.json` yapılandırmasını kontrol edin
- Expo sürümünüzün güncel olduğundan emin olun

### iOS Sertifika Sorunları
- EAS genellikle otomatik halleder
- Sorun olursa, Apple Developer hesabınızda sertifikaları kontrol edin

### Google Play İnceleme Reddedildi
- İnceleme geri bildirimini okuyun
- Gerekli düzeltmeleri yapın
- Yeni build gönderin

### App Store İnceleme Reddedildi
- Apple'ın geri bildirimini inceleyin
- Genellikle App Review Guidelines'a uygun olmayan bir şey vardır
- Düzeltip tekrar gönderin

---

## 📚 FAYDALI KAYNAKLAR

- **Expo EAS Dokümantasyonu**: https://docs.expo.dev/build/introduction/
- **Google Play Console Yardım**: https://support.google.com/googleplay/android-developer
- **App Store Connect Yardım**: https://developer.apple.com/app-store-connect/
- **Apple App Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Google Play Policies**: https://play.google.com/about/developer-content-policy/

---

## ✅ SON ADIMLAR

1. ✅ EAS CLI kuruldu ve giriş yapıldı
2. ✅ `eas.json` oluşturuldu
3. ✅ Google Play Console hesabı açıldı
4. ✅ Apple Developer Program üyeliği alındı
5. ✅ Gizlilik politikası hazırlandı
6. ✅ App icon ve görseller hazır
7. ✅ Production build oluşturuldu
8. ✅ Store'lara yüklendi
9. ✅ İnceleme için gönderildi
10. ✅ Yayınlandı! 🎉

---

**Not**: Bu rehber genel bir kılavuzdur. Her platformun kendi özel gereksinimleri olabilir. Her adımı dikkatle takip edin ve gerekirse platform dokümantasyonlarını kontrol edin.

