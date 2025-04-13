# Sosyal Medya Yöneticisi Kullanıcı Kılavuzu

## İçindekiler
1. [Giriş](#giriş)
2. [Kurulum](#kurulum)
3. [Başlangıç](#başlangıç)
4. [Kullanıcı Yönetimi](#kullanıcı-yönetimi)
5. [Sosyal Medya Hesap Yönetimi](#sosyal-medya-hesap-yönetimi)
6. [İçerik Yönetimi](#içerik-yönetimi)
7. [Reklam Yönetimi](#reklam-yönetimi)
8. [Analitikler](#analitikler)
9. [Ayarlar](#ayarlar)
10. [Sorun Giderme](#sorun-giderme)

## Giriş

Sosyal Medya Yöneticisi, tüm sosyal medya platformlarınızı tek bir yerden yönetmenizi sağlayan kapsamlı bir araçtır. Bu yazılım ile Facebook, Instagram, Twitter ve LinkedIn gibi popüler sosyal medya platformlarında içerik paylaşabilir, reklamlar oluşturabilir, yorumları yönetebilir ve performans analizleri yapabilirsiniz.

### Temel Özellikler

- **Çoklu Platform Desteği**: Facebook, Instagram, Twitter ve LinkedIn entegrasyonu
- **İçerik Yönetimi**: İçerik oluşturma, planlama ve yayınlama
- **Reklam Yönetimi**: Reklam kampanyaları oluşturma ve yönetme
- **Analitikler**: Sosyal medya performansınızı ölçme ve raporlama
- **Yorum Yönetimi**: Tüm platformlardaki yorumları görüntüleme ve yanıtlama
- **Ekip İşbirliği**: Çoklu kullanıcı desteği ve rol tabanlı erişim kontrolü

## Kurulum

### Sistem Gereksinimleri

- Node.js 18.0 veya üzeri
- PostgreSQL 14.0 veya üzeri
- Modern bir web tarayıcısı (Chrome, Firefox, Safari, Edge)

### Kurulum Adımları

1. Yazılımı indirin ve arşivden çıkarın
2. Komut satırında proje dizinine gidin
3. Bağımlılıkları yükleyin:
   ```
   npm install
   ```
4. Veritabanını oluşturun:
   ```
   npm run db:setup
   ```
5. Yapılandırma dosyasını düzenleyin:
   ```
   cp .env.example .env
   ```
   `.env` dosyasını açın ve gerekli API anahtarlarını ve veritabanı bilgilerini girin.
6. Uygulamayı başlatın:
   ```
   npm run dev
   ```
7. Tarayıcınızda `http://localhost:3000` adresine gidin

## Başlangıç

### İlk Giriş

1. Tarayıcınızda `http://localhost:3000` adresine gidin
2. Varsayılan yönetici hesabıyla giriş yapın:
   - E-posta: admin@example.com
   - Şifre: admin123
3. İlk girişten sonra şifrenizi değiştirmeniz önerilir

### Kontrol Paneli

Giriş yaptıktan sonra kontrol panelini göreceksiniz. Kontrol paneli, sosyal medya hesaplarınızın genel durumunu, son etkileşimleri ve yaklaşan planlanmış içerikleri gösterir.

## Kullanıcı Yönetimi

### Kullanıcı Rolleri

- **Yönetici**: Tüm özelliklere tam erişim
- **Yönetici**: Kullanıcı yönetimi hariç tüm özelliklere erişim
- **Editör**: İçerik oluşturma ve düzenleme erişimi
- **İzleyici**: Sadece görüntüleme erişimi

### Kullanıcı Ekleme

1. Sol menüden "Ayarlar" > "Kullanıcılar" seçeneğine tıklayın
2. "Yeni Kullanıcı" düğmesine tıklayın
3. Gerekli bilgileri doldurun ve bir rol atayın
4. "Kaydet" düğmesine tıklayın

### Kullanıcı Düzenleme

1. Sol menüden "Ayarlar" > "Kullanıcılar" seçeneğine tıklayın
2. Düzenlemek istediğiniz kullanıcının yanındaki "Düzenle" düğmesine tıklayın
3. Bilgileri güncelleyin ve "Kaydet" düğmesine tıklayın

## Sosyal Medya Hesap Yönetimi

### Hesap Ekleme

1. Sol menüden "Hesaplar" seçeneğine tıklayın
2. "Yeni Hesap Ekle" düğmesine tıklayın
3. Eklemek istediğiniz platformu seçin (Facebook, Instagram, Twitter, LinkedIn)
4. Yetkilendirme işlemini tamamlamak için platform oturum açma sayfasına yönlendirileceksiniz
5. Gerekli izinleri verin ve uygulamaya geri dönün

### Hesap Yönetimi

1. Sol menüden "Hesaplar" seçeneğine tıklayın
2. Hesap listesinde, yönetmek istediğiniz hesaba tıklayın
3. Hesap detaylarını görüntüleyin ve düzenleyin
4. Hesabı kaldırmak için "Hesabı Kaldır" düğmesine tıklayın

## İçerik Yönetimi

### İçerik Oluşturma

1. Sol menüden "İçerik" > "Yeni İçerik" seçeneğine tıklayın
2. İçerik metnini girin
3. Medya eklemek için "Medya Ekle" düğmesine tıklayın
4. Paylaşmak istediğiniz platformları seçin
5. "Şimdi Paylaş" veya "Planla" seçeneğini belirleyin
6. "Kaydet" düğmesine tıklayın

### İçerik Planlama

1. İçerik oluşturma ekranında "Planla" seçeneğini seçin
2. Tarih ve saat belirleyin
3. "Kaydet" düğmesine tıklayın

### İçerik Takvimi

1. Sol menüden "İçerik" > "Takvim" seçeneğine tıklayın
2. Planlanmış tüm içerikleri takvim görünümünde inceleyin
3. İçeriği düzenlemek için üzerine tıklayın

## Reklam Yönetimi

### Reklam Kampanyası Oluşturma

1. Sol menüden "Reklamlar" > "Yeni Kampanya" seçeneğine tıklayın
2. Kampanya adını ve açıklamasını girin
3. Platform seçin (Facebook, Instagram, Twitter, LinkedIn)
4. Kampanya hedefini belirleyin (Erişim, Etkileşim, Dönüşüm vb.)
5. Bütçe ve süre belirleyin
6. "İleri" düğmesine tıklayın

### Reklam Oluşturma

1. Kampanya oluşturduktan sonra "Yeni Reklam" düğmesine tıklayın
2. Reklam formatını seçin
3. Reklam içeriğini oluşturun (metin, görsel, video)
4. Hedef kitleyi belirleyin
5. Teklif stratejisini seçin
6. "Kaydet ve Yayınla" veya "Kaydet ve Planla" düğmesine tıklayın

### Reklam Performansı İzleme

1. Sol menüden "Reklamlar" > "Kampanyalar" seçeneğine tıklayın
2. Kampanya listesinden izlemek istediğiniz kampanyaya tıklayın
3. Performans metriklerini görüntüleyin (Gösterim, Tıklama, CTR, Dönüşüm vb.)
4. Raporları indirmek için "Rapor İndir" düğmesine tıklayın

## Analitikler

### Genel Bakış

1. Sol menüden "Analitikler" > "Genel Bakış" seçeneğine tıklayın
2. Tüm platformların birleştirilmiş performans metriklerini görüntüleyin
3. Tarih aralığını değiştirmek için üst kısımdaki tarih seçiciyi kullanın

### Platform Analitikleri

1. Sol menüden "Analitikler" > [Platform Adı] seçeneğine tıklayın
2. Seçilen platformun detaylı metriklerini görüntüleyin
3. Grafikler ve tablolar arasında gezinin
4. Raporları indirmek için "Rapor İndir" düğmesine tıklayın

## Ayarlar

### Genel Ayarlar

1. Sol menüden "Ayarlar" > "Genel" seçeneğine tıklayın
2. Zaman dilimi, dil ve bildirim tercihlerini ayarlayın
3. "Kaydet" düğmesine tıklayın

### API Yapılandırması

1. Sol menüden "Ayarlar" > "API Yapılandırması" seçeneğine tıklayın
2. Her platform için API anahtarlarını ve gizli anahtarları girin
3. "Kaydet" düğmesine tıklayın

## Sorun Giderme

### Genel Sorunlar

- **Giriş Yapamıyorum**: Kullanıcı adı ve şifrenizi kontrol edin. Şifrenizi unuttuysanız "Şifremi Unuttum" seçeneğini kullanın.
- **Sosyal Medya Hesabı Ekleyemiyorum**: API anahtarlarınızın doğru olduğundan emin olun. Platform tarafında uygulama izinlerini kontrol edin.
- **İçerik Paylaşılamıyor**: Hesap tokenlarınızın geçerli olduğundan emin olun. Gerekirse hesabı yeniden bağlayın.

### Destek Alma

Teknik destek için support@sosyalmedyayoneticisi.com adresine e-posta gönderin veya uygulama içindeki "Destek" seçeneğini kullanın.

---

© 2025 Sosyal Medya Yöneticisi. Tüm hakları saklıdır.
