# 🛡️ AKINCI Cloud Lisans ve Kullanıcı Yönetim Merkezi

Google Cloud tabanlı **Surfer Pro Dual** ve **Elevation Galilo** masaüstü yazılımları için anlık donanım kimliği (HWID) doğrulama, canlı kullanıcı/oturum takibi, uzaktan lisans kilitleme ve 5846 sayılı FSEK telif sözleşmesi merkezi yönetim paneli.

---

## 🚀 Canlı Sunucu ve Erişim Bilgileri

* **Canlı Web & Mobil Portalı:** `https://ais-dev-l2fembifbbwustocfsa7x6-781806603085.europe-west2.run.app`
* **Firestore Veritabanı:** `ai-studio-akincicloudlisan-3a34fed4-0751-41f0-88cf-b4ceecd716b7`

### 🔑 Yönetici Giriş Bilgileri
* **Kullanıcı Adı:** `PotakOğlu` (veya `potakoglu`)
* **E-Posta:** `akincisurfer1@gmail.com`
* **Şifre:** `Akinci_B1927A38`

---

## 📱 Mobil Kurulum (Android APK ve PWA)

Bu yönetim merkezini cep telefonunuzda bağımsız bir mobil uygulama olarak kullanabilirsiniz:

### 1. Yöntem: Anında Mobil Kurulum (Web APK / PWA - Önerilen)
1. Android telefonunuzda **Google Chrome** ile canlı portala gidin.
2. Sağ üstteki **üç noktaya (⋮)** dokunun.
3. **"Uygulamayı Yükle"** veya **"Ana Ekrana Ekle"** seçeneğini seçin.
4. Telefonunuzun ana ekranında **AKINCI Cloud** logolu yerel uygulama oluşacaktır.

### 2. Yöntem: GitHub Actions ile .APK Dosyası İndirme
1. Bu projeyi GitHub reponuza yükleyin.
2. Reponun `.github/workflows/main.yml` dosyasındaki GitHub Actions otomasyonu otomatik olarak çalışır.
3. GitHub reponuzda **Actions** sekmesine gidin.
4. Tamamlanan derlemenin altındaki **Artifacts** kısmından **`AKINCI-Cloud-Admin-Android-APK`** dosyasını tek tıkla telefonunuza `.apk` olarak indirin.

---

## ⚙️ Masaüstü Yazılımı ile Entegrasyon (Python API)

Surfer ve Galilo masaüstü yazılımları lisans kontrolü için bu sunucuya HTTP istekleri gönderir:

* **Lisans Doğrulama & HWID:** `POST /api/license/verify`
* **Canlı Oturum Heartbeat:** `POST /api/session/ping`
* **5846 FSEK Sözleşme Metni:** `GET /api/license/agreement-text`
* **Sözleşme İmza Kaydı:** `POST /api/license/sign-agreement`
* **Sağlık & Canlılık Testi:** `GET /api/health`

---

## 🛠️ Yerel Geliştirme (Local Development)

```bash
# Bağımlılıkları kurun
npm install

# Geliştirme sunucusunu başlatın
npm run dev

# Üretim derlemesi oluşturun
npm run build
```

---

## ⚖️ Hukuki & Telif Hakları
Bu yazılım 5846 Sayılı Fikir ve Sanat Eserleri Kanunu (FSEK) ve Türk Ticaret Kanunu hükümleri kapsamında koruma altındadır. Tüm hakları Mahmut Akın'a aittir.
