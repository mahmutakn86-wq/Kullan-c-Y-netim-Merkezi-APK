import React from 'react';
import { Cloud, Server, Database, ShieldCheck, CheckCircle2, ArrowRight, ExternalLink, Terminal, Cpu, Lock, HelpCircle } from 'lucide-react';

export const GcpDeploymentGuide: React.FC = () => {
  const steps = [
    {
      step: 1,
      title: 'Google Cloud Projesi Açma (console.cloud.google.com)',
      desc: 'Google Cloud Console üzerinde yeni bir proje oluşturun.',
      details: [
        'console.cloud.google.com adresine giriş yapın.',
        'Üst kısımdan "Select a project" > "New Project" butonuna tıklayın.',
        'Proje Adı: "akinci-cloud-licensing" olarak belirleyin ve Create deyin.',
      ],
      icon: Cloud,
    },
    {
      step: 2,
      title: 'Cloud Run veya App Engine ile API Backend Yayına Alma',
      desc: 'Bu hazırladığımız Node.js/Express lisans doğrulama ve kullanıcı takip sunucusunu tek tıkla Cloud Run servisine yükleyin.',
      details: [
        'Cloud Run, 7/24 kesintisiz çalışır ve ilk 2 milyon istek tamamen ücretsizdir.',
        'Geliştirilen bu API kodunu GitHub veya doğrudan Cloud Shell üzerinden `gcloud run deploy` komutuyla dağıtın.',
        'Size otomatik olarak `https://akinci-licensing-xyz.a.run.app` şeklinde güvenli bir HTTPS API adresi verilir.',
      ],
      icon: Server,
    },
    {
      step: 3,
      title: 'Firestore / Cloud SQL ile Kalıcı Lisans & HWID Depolama',
      desc: 'Lisans anahtarları, bitiş tarihleri, HWID cihaz kayıtları ve 5846 sayılı sözleşme imzaları bulutta güvenle saklanır.',
      details: [
        'Google Cloud Console sol menüden "Firestore Database"i seçin ve "Native Mode" olarak başlatın.',
        '`licenses`, `sessions`, `agreement_logs` koleksiyonları otomatik olarak yönetilir.',
        'Sunucu kapansa dahi tüm kullanıcı izinleri ve süreleri bulutta saklanır.',
      ],
      icon: Database,
    },
    {
      step: 4,
      title: 'Özel Alan Adı (Custom Domain) ve SSL Kurulumu',
      desc: 'API adresinizi kendi alan adınıza bağlayın (Örn: `license.akincisurfer.com`).',
      details: [
        'Cloud Run > "Manage Custom Domains" bölümünden domaininizi bağlayın.',
        'Google Cloud otomatik olarak ücretsiz SSL (HTTPS) sertifikası tahsis eder.',
      ],
      icon: Lock,
    },
    {
      step: 5,
      title: 'Python Kodunuza Cloud URL Ekleyip Exe Haline Getirme',
      desc: 'Surfer Pro Dual ve Elevation Galilo Python kodunuza API URL adresini bağlayıp Nuitka / PyInstaller ile exe yapın.',
      details: [
        'Python kodundaki `API_BASE_URL` değişkenine Cloud Run adresinizi girin.',
        'Nuitka veya PyInstaller ile exe yaptığınızda kullanıcılar her açılışta süreyi buluttan sorgulamak zorunda kalır.',
      ],
      icon: Terminal,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Affirmation Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#171a23] to-cyan-950/40 border border-emerald-500/30 space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-wide">
              EVET, KESİNLİKLE YAPABİLİRSİNİZ!
            </h3>
            <p className="text-sm text-emerald-300 font-medium">
              Google Cloud (console.cloud.google.com) altyapısı bu sistem için en güvenli, en hızlı ve en profesyonel çözümdür.
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Mevcut <strong className="text-white">AKINCI OTOMATİK SURFER PRO DUAL & ELEVATION GALILO</strong> Python Tkinter masaüstü yazılımınız, kullanıcıların bilgisayarında çalışırken her açılışta Google Cloud üzerindeki bu lisans API'sine bağlanır. Kullanıcının lisans süresi dolduğunda veya sözleşmeyi imzalamadığında program anında kilitlenir.
        </p>
      </div>

      {/* Architecture Diagram */}
      <div className="p-6 rounded-2xl bg-[#171a23] border border-[#262d3e] space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Sistem Mimarisi ve Çalışma Prensibi</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-4 rounded-xl bg-[#101217] border border-[#282f40] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center font-bold">1</div>
            <div className="font-bold text-white">Masaüstü Python (Win32)</div>
            <p className="text-[11px] text-slate-400">
              Kullanıcı bilgisayarının benzersiz Anakart/BIOS Donanım Kimliğini (HWID) okur.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#101217] border border-[#282f40] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center font-bold">2</div>
            <div className="font-bold text-white">Google Cloud API (HTTPS)</div>
            <p className="text-[11px] text-slate-400">
              Cloud Run üzerinde çalışan bu API, anahtarın geçerlilik tarihini ve 5846 onayını doğrular.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#101217] border border-[#282f40] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center font-bold">3</div>
            <div className="font-bold text-white">5846 Telif & HWID Kilidi</div>
            <p className="text-[11px] text-slate-400">
              İlk açılışta sözleşmeyi imzalatır, IP ve zaman damgasını SHA-256 ile mühürler.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#101217] border border-[#282f40] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center font-bold">4</div>
            <div className="font-bold text-white">Süre Kontrolü & Kilitleme</div>
            <p className="text-[11px] text-slate-400">
              Tarihi dolan veya askıya alınan lisanslarda Surfer ve Galilo motoru başlatılmaz.
            </p>
          </div>
        </div>
      </div>

      {/* Step-by-Step Setup Guide */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Cloud className="w-4 h-4 text-emerald-400" />
          <span>Google Cloud Console (console.cloud.google.com) Adım Adım Kurulum</span>
        </h4>

        <div className="space-y-4">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="p-5 rounded-xl bg-[#171a23] border border-[#232733] flex flex-col md:flex-row items-start gap-4 transition-all hover:border-slate-600"
              >
                <div className="p-3 rounded-xl bg-[#1e2330] border border-[#2e374b] text-emerald-400 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6" />
                </div>

                <div className="space-y-2 flex-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                      ADIM {item.step}
                    </span>
                    <h5 className="font-bold text-white text-sm">{item.title}</h5>
                  </div>
                  <p className="text-slate-400 text-xs">{item.desc}</p>

                  <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs pt-1">
                    {item.details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security & FAQ */}
      <div className="p-6 rounded-2xl bg-[#171a23] border border-[#2b3347] space-y-4 text-xs text-slate-300">
        <h4 className="font-bold text-white text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Güvenlik Avantajları ve Neden Bu Sistem Tercih Edilmelidir?</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#101217] border border-[#242b3b] space-y-1.5">
            <strong className="text-white text-xs block">🔒 Bilgisayar Saati Manipülasyonuna Karşı Koruma:</strong>
            <p className="text-slate-400">
              Kullanıcı bilgisayarının saatini geriye alsa bile, lisans süresi doğrudan Google Cloud sunucusundaki atomik saat (NTP) üzerinden kontrol edildiği için hile yapılamaz.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#101217] border border-[#242b3b] space-y-1.5">
            <strong className="text-white text-xs block">💻 HWID Tekil Cihaz Kilitleme:</strong>
            <p className="text-slate-400">
              Lisans anahtarı ilk kullanıldığı bilgisayarın anakart ve işlemcisine kilitlenir. Başka bir bilgisayara kopyalanıp çalıştırılamaz.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#101217] border border-[#242b3b] space-y-1.5">
            <strong className="text-white text-xs block">⚖️ 5846 Sayılı Kanun Uyarınca Yasal Koruma:</strong>
            <p className="text-slate-400">
              Kullanıcının sözleşmeyi imzaladığı an, IP adresi ve cihaz bilgileri kriptografik zaman damgası ile saklanır. İzinsiz paylaşımda noter onaylı delil niteliği taşır.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#101217] border border-[#242b3b] space-y-1.5">
            <strong className="text-white text-xs block">🔴 Anında Uzaktan İptal (Killswitch):</strong>
            <p className="text-slate-400">
              Ödeme yapmayan veya kötü niyetli kullanıcıların lisansını bu web panelinden tek tıkla iptal ettiğiniz anda, kullanıcının bilgisayarındaki program anında durdurulur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
