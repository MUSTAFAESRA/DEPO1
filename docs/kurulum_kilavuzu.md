# Sosyal Medya Yöneticisi Kurulum Kılavuzu

Bu kılavuz, Sosyal Medya Yöneticisi yazılımının kurulumu ve yapılandırılması için adım adım talimatlar içerir.

## İçindekiler
1. [Sistem Gereksinimleri](#sistem-gereksinimleri)
2. [Kurulum Adımları](#kurulum-adımları)
3. [Veritabanı Kurulumu](#veritabanı-kurulumu)
4. [Sosyal Medya API Yapılandırması](#sosyal-medya-api-yapılandırması)
5. [Uygulama Başlatma](#uygulama-başlatma)
6. [Sorun Giderme](#sorun-giderme)

## Sistem Gereksinimleri

### Donanım Gereksinimleri
- **CPU**: Minimum 2 çekirdek
- **RAM**: Minimum 4GB
- **Disk**: Minimum 20GB boş alan

### Yazılım Gereksinimleri
- **İşletim Sistemi**: Windows 10/11, macOS 12+, Ubuntu 20.04+ veya diğer Linux dağıtımları
- **Node.js**: 18.0 veya üzeri
- **PostgreSQL**: 14.0 veya üzeri
- **Web Tarayıcısı**: Chrome 90+, Firefox 90+, Safari 15+, Edge 90+

## Kurulum Adımları

### 1. Node.js Kurulumu

#### Windows
1. [Node.js resmi web sitesinden](https://nodejs.org/) LTS sürümünü indirin
2. İndirilen kurulum dosyasını çalıştırın ve talimatları izleyin
3. Kurulum tamamlandıktan sonra, komut istemini açın ve aşağıdaki komutu çalıştırarak kurulumu doğrulayın:
   ```
   node --version
   ```

#### macOS
1. [Node.js resmi web sitesinden](https://nodejs.org/) LTS sürümünü indirin
2. İndirilen kurulum dosyasını çalıştırın ve talimatları izleyin
3. Alternatif olarak, Homebrew kullanıyorsanız:
   ```
   brew install node
   ```
4. Kurulum tamamlandıktan sonra, Terminal'i açın ve aşağıdaki komutu çalıştırarak kurulumu doğrulayın:
   ```
   node --version
   ```

#### Linux (Ubuntu/Debian)
1. Terminal'i açın ve aşağıdaki komutları çalıştırın:
   ```
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
2. Kurulum tamamlandıktan sonra, aşağıdaki komutu çalıştırarak kurulumu doğrulayın:
   ```
   node --version
   ```

### 2. PostgreSQL Kurulumu

#### Windows
1. [PostgreSQL resmi web sitesinden](https://www.postgresql.org/download/windows/) kurulum dosyasını indirin
2. İndirilen kurulum dosyasını çalıştırın ve talimatları izleyin
3. Kurulum sırasında belirlediğiniz şifreyi not edin
4. Kurulum tamamlandıktan sonra, pgAdmin uygulamasını açarak kurulumu doğrulayın

#### macOS
1. [PostgreSQL resmi web sitesinden](https://www.postgresql.org/download/macosx/) kurulum dosyasını indirin
2. İndirilen kurulum dosyasını çalıştırın ve talimatları izleyin
3. Alternatif olarak, Homebrew kullanıyorsanız:
   ```
   brew install postgresql
   brew services start postgresql
   ```
4. Kurulum tamamlandıktan sonra, Terminal'i açın ve aşağıdaki komutu çalıştırarak kurulumu doğrulayın:
   ```
   psql --version
   ```

#### Linux (Ubuntu/Debian)
1. Terminal'i açın ve aşağıdaki komutları çalıştırın:
   ```
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   ```
2. PostgreSQL servisini başlatın:
   ```
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```
3. Kurulum tamamlandıktan sonra, aşağıdaki komutu çalıştırarak kurulumu doğrulayın:
   ```
   psql --version
   ```

### 3. Sosyal Medya Yöneticisi Kurulumu

1. Sosyal Medya Yöneticisi yazılımını indirin ve arşivden çıkarın
2. Komut satırında (Terminal veya Komut İstemi) proje dizinine gidin:
   ```
   cd /path/to/sosyal_medya_yoneticisi
   ```
3. Bağımlılıkları yükleyin:
   ```
   npm install
   ```
4. Örnek yapılandırma dosyasını kopyalayın:
   ```
   cp .env.example .env
   ```
5. `.env` dosyasını bir metin editörü ile açın ve gerekli ayarları yapın:
   ```
   # Uygulama Ayarları
   PORT=3000
   NODE_ENV=production
   
   # Veritabanı Ayarları
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=sosyal_medya_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   
   # JWT Ayarları
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=24h
   
   # Sosyal Medya API Anahtarları
   # Facebook
   FACEBOOK_CLIENT_ID=your_facebook_client_id
   FACEBOOK_CLIENT_SECRET=your_facebook_client_secret
   
   # Instagram
   INSTAGRAM_CLIENT_ID=your_instagram_client_id
   INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
   
   # Twitter
   TWITTER_CLIENT_ID=your_twitter_client_id
   TWITTER_CLIENT_SECRET=your_twitter_client_secret
   
   # LinkedIn
   LINKEDIN_CLIENT_ID=your_linkedin_client_id
   LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
   ```

## Veritabanı Kurulumu

1. PostgreSQL komut satırına giriş yapın:
   
   **Windows**:
   ```
   psql -U postgres
   ```
   
   **macOS/Linux**:
   ```
   sudo -u postgres psql
   ```

2. Veritabanını oluşturun:
   ```sql
   CREATE DATABASE sosyal_medya_db;
   ```

3. (İsteğe bağlı) Özel bir kullanıcı oluşturun:
   ```sql
   CREATE USER sosyal_medya_user WITH ENCRYPTED PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE sosyal_medya_db TO sosyal_medya_user;
   ```

4. PostgreSQL'den çıkın:
   ```
   \q
   ```

5. Proje dizininde veritabanı şemasını oluşturun:
   ```
   npm run db:migrate
   ```

6. (İsteğe bağlı) Örnek verileri yükleyin:
   ```
   npm run db:seed
   ```

## Sosyal Medya API Yapılandırması

### Facebook ve Instagram API Yapılandırması

1. [Facebook Developers](https://developers.facebook.com/) sayfasına gidin ve giriş yapın
2. "My Apps" > "Create App" seçeneğine tıklayın
3. "Business" uygulama türünü seçin ve "Next" düğmesine tıklayın
4. Uygulama adını ve iletişim e-postasını girin, "Create App" düğmesine tıklayın
5. Oluşturulan uygulamada, "Settings" > "Basic" seçeneğine gidin
6. "App ID" ve "App Secret" değerlerini `.env` dosyasındaki `FACEBOOK_CLIENT_ID` ve `FACEBOOK_CLIENT_SECRET` alanlarına kopyalayın
7. "Products" bölümünde "Facebook Login" > "Set Up" seçeneğine tıklayın
8. "Settings" altında, "Valid OAuth Redirect URIs" alanına `http://localhost:3000/auth/facebook/callback` ekleyin
9. Instagram API için, "Products" bölümünde "Instagram Basic Display" > "Set Up" seçeneğine tıklayın
10. "Valid OAuth Redirect URIs" alanına `http://localhost:3000/auth/instagram/callback` ekleyin
11. "App Review" bölümünde uygulamanızı yayınlayın

### Twitter API Yapılandırması

1. [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard) sayfasına gidin ve giriş yapın
2. "Projects & Apps" > "Overview" > "Create Project" seçeneğine tıklayın
3. Proje adını ve kullanım durumunu girin, "Next" düğmesine tıklayın
4. Uygulama adını girin ve "Complete" düğmesine tıklayın
5. "Keys and Tokens" sekmesine gidin
6. "API Key and Secret" bölümünde "Regenerate" düğmesine tıklayın
7. Oluşturulan "API Key" ve "API Secret" değerlerini `.env` dosyasındaki `TWITTER_CLIENT_ID` ve `TWITTER_CLIENT_SECRET` alanlarına kopyalayın
8. "User authentication settings" bölümünde "Edit" düğmesine tıklayın
9. "OAuth 2.0" seçeneğini etkinleştirin
10. "Redirect URL" alanına `http://localhost:3000/auth/twitter/callback` ekleyin
11. "App permissions" bölümünde "Read and write" seçeneğini işaretleyin
12. "Save" düğmesine tıklayın

### LinkedIn API Yapılandırması

1. [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps) sayfasına gidin ve giriş yapın
2. "Create App" düğmesine tıklayın
3. Uygulama adı, şirket, logo ve uygulama açıklaması girin, "Create App" düğmesine tıklayın
4. "Auth" sekmesine gidin
5. "Client ID" ve "Client Secret" değerlerini `.env` dosyasındaki `LINKEDIN_CLIENT_ID` ve `LINKEDIN_CLIENT_SECRET` alanlarına kopyalayın
6. "OAuth 2.0 settings" bölümünde "Authorized redirect URLs" alanına `http://localhost:3000/auth/linkedin/callback` ekleyin
7. "Products" sekmesine gidin ve gerekli ürünleri (Sign In with LinkedIn, Share on LinkedIn, Marketing Developer Platform) etkinleştirin

## Uygulama Başlatma

### Geliştirme Modunda Başlatma

1. Proje dizininde aşağıdaki komutu çalıştırın:
   ```
   npm run dev
   ```
2. Tarayıcınızda `http://localhost:3000` adresine gidin
3. Varsayılan yönetici hesabıyla giriş yapın:
   - E-posta: admin@example.com
   - Şifre: admin123

### Üretim Modunda Başlatma

1. Proje dizininde aşağıdaki komutu çalıştırın:
   ```
   npm run build
   npm start
   ```
2. Tarayıcınızda `http://localhost:3000` adresine gidin (veya `.env` dosyasında belirttiğiniz port)

### PM2 ile Sürekli Çalıştırma (Linux/macOS)

1. PM2'yi global olarak yükleyin:
   ```
   npm install -g pm2
   ```
2. Uygulamayı PM2 ile başlatın:
   ```
   pm2 start npm --name "sosyal-medya-yoneticisi" -- start
   ```
3. Otomatik başlatma için PM2'yi yapılandırın:
   ```
   pm2 startup
   pm2 save
   ```

## Sorun Giderme

### Veritabanı Bağlantı Sorunları

- **Hata**: "Connection refused"
  - **Çözüm**: PostgreSQL servisinin çalıştığından emin olun:
    ```
    # Windows
    net start postgresql
    
    # macOS
    brew services start postgresql
    
    # Linux
    sudo systemctl start postgresql
    ```
  - `.env` dosyasındaki veritabanı bilgilerinin doğru olduğunu kontrol edin

- **Hata**: "Authentication failed"
  - **Çözüm**: `.env` dosyasındaki veritabanı kullanıcı adı ve şifresinin doğru olduğunu kontrol edin
  - PostgreSQL'in `pg_hba.conf` dosyasında kimlik doğrulama yöntemini kontrol edin

### API Bağlantı Sorunları

- **Hata**: "Invalid client ID" veya "Invalid redirect URI"
  - **Çözüm**: İlgili sosyal medya platformunun geliştirici portalında API anahtarlarınızı ve yönlendirme URI'larını kontrol edin
  - `.env` dosyasındaki API anahtarlarının doğru olduğunu kontrol edin

- **Hata**: "Rate limit exceeded"
  - **Çözüm**: API isteklerinizi sınırlayın veya daha yüksek limitler için platform sağlayıcısına başvurun

### Uygulama Başlatma Sorunları

- **Hata**: "Port already in use"
  - **Çözüm**: `.env` dosyasında farklı bir port belirtin veya mevcut portu kullanan işlemi sonlandırın:
    ```
    # Windows
    netstat -ano | findstr :3000
    taskkill /PID <PID> /F
    
    # macOS/Linux
    lsof -i :3000
    kill -9 <PID>
    ```

- **Hata**: "Module not found"
  - **Çözüm**: Bağımlılıkları yeniden yükleyin:
    ```
    npm install
    ```

## Yardım ve Destek

Kurulum veya yapılandırma ile ilgili sorunlar yaşıyorsanız, lütfen aşağıdaki kanallardan destek alın:

- **E-posta**: support@sosyalmedyayoneticisi.com
- **Dokümantasyon**: [https://docs.sosyalmedyayoneticisi.com](https://docs.sosyalmedyayoneticisi.com)
- **GitHub**: [https://github.com/sosyalmedyayoneticisi/sosyal-medya-app](https://github.com/sosyalmedyayoneticisi/sosyal-medya-app)

---

© 2025 Sosyal Medya Yöneticisi. Tüm hakları saklıdır.
