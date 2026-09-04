import React, { useState, useEffect } from 'react';
import { Terminal, Copy, Check, Play, ShieldAlert, ShieldCheck, Scale, Laptop, RefreshCw, KeyRound, AlertCircle, Download, FileText, PackageCheck, Wrench } from 'lucide-react';
import { LicenseKey } from '../types';

interface PythonIntegrationHubProps {
  licenses: LicenseKey[];
  onRefresh: () => void;
}

export const PythonIntegrationHub: React.FC<PythonIntegrationHubProps> = ({ licenses, onRefresh }) => {
  const [pythonCode, setPythonCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedPip, setCopiedPip] = useState(false);
  const [loadingCode, setLoadingCode] = useState(true);

  // Interactive Simulator state
  const [simKey, setSimKey] = useState('');
  const [simHwid, setSimHwid] = useState('BFEBFBFF000906EA-DEV-TEST');
  const [simDeviceName, setSimDeviceName] = useState('GEOLOGY-WORKSTATION (Win11)');
  const [simResult, setSimResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

  // Agreement Modal simulation state
  const [showSimAgreementModal, setShowSimAgreementModal] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [agreementSubmitting, setAgreementSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/python-code')
      .then((res) => res.text())
      .then((code) => {
        setPythonCode(code);
        setLoadingCode(false);
      })
      .catch((err) => {
        console.error('Python kodu çekilemedi:', err);
        setLoadingCode(false);
      });

    if (licenses.length > 0 && !simKey) {
      setSimKey(licenses[0].key);
    }
  }, [licenses]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRunSimulator = async () => {
    if (!simKey.trim()) return;
    setSimLoading(true);
    setSimResult(null);

    try {
      const res = await fetch('/api/license/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: simKey.trim(),
          hwid: simHwid.trim(),
          deviceName: simDeviceName.trim(),
          appVersion: '9.5 Ultimate',
          osVersion: 'Windows 11 Pro',
          currentModule: 'SURFER PRO DUAL + ELEVATION GALILO',
        }),
      });

      const data = await res.json();
      setSimResult(data);

      if (data.agreementRequired) {
        setShowSimAgreementModal(true);
      }

      onRefresh();
    } catch (err) {
      setSimResult({ valid: false, message: 'Bulut sunucusuna bağlanılamadı: ' + String(err) });
    } finally {
      setSimLoading(false);
    }
  };

  const handleAcceptAgreementSim = async () => {
    if (!signerName.trim() || !agreementChecked) return;
    setAgreementSubmitting(true);

    try {
      const res = await fetch('/api/license/agreement/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: simKey.trim(),
          signerName: signerName.trim(),
          signerEmail: 'simulated_user@geo.com',
          hwid: simHwid.trim(),
          deviceName: simDeviceName.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowSimAgreementModal(false);
        // Re-run verify
        await handleRunSimulator();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Sözleşme gönderilemedi: ' + String(err));
    } finally {
      setAgreementSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-[#171a23] to-[#1d2333] border border-[#272e40]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Python Tkinter Masaüstü Entegrasyon Kiti & Canlı Test Simülatörü
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Mevcut <strong className="text-emerald-400">SURFER PRO DUAL & ELEVATION GALILO</strong> Python kodunuza ekleyeceğiniz hazır güvenlik modülü.
            </p>
          </div>
        </div>
      </div>

      {/* Simulator Section */}
      <div className="p-6 rounded-2xl bg-[#171a23] border border-[#2b3347] space-y-5">
        <div className="flex items-center justify-between border-b border-[#232733] pb-3">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-cyan-400" />
            <h4 className="text-sm font-bold text-white">
              Canlı Python Başlatma & Lisans Doğrulama Simülatörü
            </h4>
          </div>
          <span className="text-xs text-slate-400">
            Masaüstü kullanıcısının göreceği ekranları buradan test edin
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Inputs */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Test Edilecek Lisans Anahtarı:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={simKey}
                  onChange={(e) => setSimKey(e.target.value)}
                  placeholder="Örn: AKN-SURF-9821-XPRO"
                  className="flex-1 px-3 py-2 bg-[#101217] border border-[#282f40] rounded-lg text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Quick Pick Keys */}
            <div>
              <span className="text-[11px] text-slate-500 mb-1 block">Örnek Anahtarlardan Seç:</span>
              <div className="flex flex-wrap gap-1.5">
                {licenses.map((lic) => (
                  <button
                    key={lic.id}
                    onClick={() => setSimKey(lic.key)}
                    className={`px-2 py-1 rounded text-[11px] font-mono border transition-all ${
                      simKey === lic.key
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                        : 'bg-[#101217] text-slate-400 border-[#242b3b] hover:text-white'
                    }`}
                  >
                    {lic.customerName.split(' ')[0]} ({lic.status})
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Test Bilgisayarı HWID (Donanım Kimliği):
              </label>
              <input
                type="text"
                value={simHwid}
                onChange={(e) => setSimHwid(e.target.value)}
                className="w-full px-3 py-2 bg-[#101217] border border-[#282f40] rounded-lg text-slate-300 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Cihaz Adı:
              </label>
              <input
                type="text"
                value={simDeviceName}
                onChange={(e) => setSimDeviceName(e.target.value)}
                className="w-full px-3 py-2 bg-[#101217] border border-[#282f40] rounded-lg text-slate-300 text-xs"
              />
            </div>

            <button
              id="btn-run-sim"
              onClick={handleRunSimulator}
              disabled={simLoading}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 text-xs transition-all"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>{simLoading ? 'Sorgulanıyor...' : 'Python Başlangıç Kontrolünü Simüle Et'}</span>
            </button>
          </div>

          {/* Simulated GUI Output Screen */}
          <div className="lg:col-span-2 p-4 rounded-xl bg-[#0f1117] border border-[#232733] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#202533] text-xs">
                <span className="font-mono text-slate-400">Windows Tkinter Dialog Simülasyonu</span>
                <span className="px-2 py-0.5 rounded bg-[#1c212d] text-emerald-400 font-mono text-[10px]">
                  Python 3.11 / Win32
                </span>
              </div>

              {simResult ? (
                <div
                  className={`p-4 rounded-xl border space-y-3 ${
                    simResult.valid
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                      : simResult.agreementRequired
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                      : 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {simResult.valid ? (
                      <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    ) : simResult.agreementRequired ? (
                      <Scale className="w-6 h-6 text-amber-400" />
                    ) : (
                      <ShieldAlert className="w-6 h-6 text-rose-400" />
                    )}

                    <div>
                      <h5 className="font-bold text-sm">
                        {simResult.valid
                          ? '✅ LİSANS DOĞRULANDI - YAZILIM AÇILIYOR'
                          : simResult.agreementRequired
                          ? '⚠️ 5846 TELİF SÖZLEŞMESİ ONAYI GEREKİYOR'
                          : '❌ LİSANS REDDEDİLDİ / SÜRESİ DOLDU'}
                      </h5>
                      <p className="text-xs opacity-90">{simResult.message}</p>
                    </div>
                  </div>

                  {simResult.valid && (
                    <div className="mt-3 p-3 rounded-lg bg-[#141822] border border-[#242b3b] grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Kullanıcı:</span>
                        <strong className="text-white">{simResult.customerName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Kalan Süre:</span>
                        <strong className="text-emerald-400">{simResult.daysRemaining} Gün</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Bitiş Tarihi:</span>
                        <strong className="text-white">{simResult.expiresAt?.substring(0, 10)}</strong>
                      </div>
                    </div>
                  )}

                  {simResult.agreementRequired && (
                    <button
                      onClick={() => setShowSimAgreementModal(true)}
                      className="mt-2 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
                    >
                      📜 5846 Sayılı Sözleşmeyi İmzala ve Başlat
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Sol taraftan bir lisans anahtarı seçin ve <strong className="text-slate-400">"Simüle Et"</strong> butonuna tıklayarak Python uygulamasındaki lisans & süre kontrolünü test edin.
                </div>
              )}
            </div>

            {/* Simulated Raw JSON Log */}
            {simResult && (
              <div className="mt-4 pt-3 border-t border-[#1f2433]">
                <span className="text-[10px] font-mono text-slate-500 block mb-1">
                  Bulut Sunucu Yanıtı (JSON Paylaşımı):
                </span>
                <pre className="p-2.5 rounded-lg bg-[#07080b] font-mono text-[11px] text-cyan-300 overflow-x-auto">
                  {JSON.stringify(simResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Code Snippet Card */}
      <div className="p-6 rounded-2xl bg-[#171a23] border border-[#2b3347] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#232733] pb-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Python Koduna Eklenecek Hazır Güvenlik Modülü</span>
            </h4>
            <p className="text-xs text-slate-400">
              Bu kod Kullanıcı Yönetim Merkezi ile tam entegre, HWID kilitli ve 5846 sözleşme onaylı çalışır.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              id="btn-download-requirements"
              href="/api/download-python?file=requirements.txt"
              download="requirements.txt"
              className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>requirements.txt İndir</span>
            </a>

            <a
              id="btn-download-akinci-cloud"
              href="/api/download-python?file=Akinci_Cloud_Lisans.py"
              download="Akinci_Cloud_Lisans.py"
              className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Akinci_Cloud_Lisans.py İndir (.py)</span>
            </a>

            <a
              id="btn-download-python"
              href="/api/download-python?file=AKINCI_SURFER_PRO_DUAL_GALILO_V10.py"
              download="AKINCI_SURFER_PRO_DUAL_GALILO_V10.py"
              className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>AKINCI Surfer Ultimate v10 İndir (.py)</span>
            </a>

            <button
              id="btn-copy-python-code"
              onClick={handleCopyCode}
              className="px-4 py-2 bg-[#202636] hover:bg-[#2b3347] text-slate-300 border border-[#2b3347] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Kopyalandı!' : 'Kodu Kopyala'}</span>
            </button>
          </div>
        </div>

        {/* Missing Libraries & Pip Installation Quick Guide (Sarı Uyarı Çözümü) */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#1c1913] to-[#171a23] border border-amber-500/30 text-xs text-slate-300 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-amber-400" />
              <h5 className="font-bold text-amber-300 text-xs">
                ⚠️ IDE / Python Ortamında Sarı Renkte Görünen Eksik Kütüphanelerin Kurulumu:
              </h5>
            </div>
            <button
              id="btn-copy-pip-cmd"
              onClick={() => {
                navigator.clipboard.writeText('pip install google-auth google-auth-oauthlib google-auth-httplib2 cryptography keyring python-dotenv pywin32 wmi keyboard pyautogui pynput watchdog simplekml pyperclip requests pillow');
                setCopiedPip(true);
                setTimeout(() => setCopiedPip(false), 2000);
              }}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all"
            >
              {copiedPip ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPip ? 'Komut Kopyalandı!' : 'Pip Komutunu Kopyala'}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            VSCode veya PyCharm gibi editörlerde sarı dalgalı çizgiyle uyarı veren Google OAuth ve güvenlik kütüphanelerini tek komutla kurmak için terminalinizde çalıştırın:
          </p>

          <pre className="p-2.5 rounded-lg bg-[#08090d] border border-[#262c3d] font-mono text-amber-300 text-[11px] overflow-x-auto select-all">
            pip install google-auth google-auth-oauthlib google-auth-httplib2 cryptography keyring python-dotenv pywin32 wmi keyboard pyautogui pynput watchdog simplekml pyperclip requests pillow
          </pre>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="p-2 rounded-lg bg-[#11131a] border border-[#212738] text-[10px]">
              <span className="font-bold text-amber-300 block">1. google-auth</span>
              <span className="text-slate-400">Google Service Account & OAuth2 kimlik doğrulama.</span>
            </div>
            <div className="p-2 rounded-lg bg-[#11131a] border border-[#212738] text-[10px]">
              <span className="font-bold text-cyan-300 block">2. cryptography</span>
              <span className="text-slate-400">config.enc dosyasını AES-Fernet ile şifreler.</span>
            </div>
            <div className="p-2 rounded-lg bg-[#11131a] border border-[#212738] text-[10px]">
              <span className="font-bold text-cyan-300 block">3. keyring</span>
              <span className="text-slate-400">Windows Credential Manager kasa entegrasyonu.</span>
            </div>
            <div className="p-2 rounded-lg bg-[#11131a] border border-[#212738] text-[10px]">
              <span className="font-bold text-cyan-300 block">4. python-dotenv</span>
              <span className="text-slate-400">.env dosyasından gizli anahtarları okur.</span>
            </div>
            <div className="p-2 rounded-lg bg-[#11131a] border border-[#212738] text-[10px]">
              <span className="font-bold text-emerald-300 block">5. pywin32</span>
              <span className="text-slate-400">Surfer OLE/COM otomasyonu ve Registry erişimi.</span>
            </div>
            <div className="p-2 rounded-lg bg-[#11131a] border border-[#212738] text-[10px]">
              <span className="font-bold text-emerald-300 block">6. WMI</span>
              <span className="text-slate-400">Anakart, CPU ve Disk HWID donanım kilidi.</span>
            </div>
            <div className="p-2 rounded-lg bg-[#11131a] border border-[#212738] text-[10px]">
              <span className="font-bold text-emerald-300 block">7. keyboard / pynput</span>
              <span className="text-slate-400">Masaüstü kısayolları ve fare/klavye otomasyonu.</span>
            </div>
            <div className="p-2 rounded-lg bg-[#11131a] border border-[#212738] text-[10px]">
              <span className="font-bold text-indigo-300 block">8. requests / pillow</span>
              <span className="text-slate-400">REST API iletişimi ve arayüz görsel işleme.</span>
            </div>
          </div>
        </div>

        {/* Integration Instructions */}
        <div className="p-4 rounded-xl bg-[#101217] border border-[#242b3b] text-xs text-slate-300 space-y-2">
          <h5 className="font-bold text-white text-xs">🚀 Gerçek EXE Olarak Derleme ve Dağıtım Adımları:</h5>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 leading-relaxed">
            <li>
              İndirdiğiniz veya kopyaladığınız <strong className="text-emerald-400">AKINCI_SURFER_PRO_DUAL_GALILO_V10.py</strong> dosyasını PyInstaller veya Nuitka ile tek bir EXE'ye dönüştürün:
            </li>
          </ol>
          <pre className="p-3 rounded-lg bg-[#07080b] font-mono text-emerald-400 text-[11px] overflow-x-auto">
{`pyinstaller --onefile --noconsole --name="AKINCI_Surfer_Pro_Dual_Galilo_v10" AKINCI_SURFER_PRO_DUAL_GALILO_V10.py`}
          </pre>
          <p className="text-[11px] text-slate-400">
            Kullanıcı bu EXE'yi açtığında doğrudan <strong className="text-cyan-400">Lisans Aktivasyon Penceresi</strong> açılır. Kullanıcı Yönetim Merkezi'nde kayıtlı geçerli bir anahtar girdiğinde sistem donanımını eşleştirir, 5846 sözleşmesini imzalatır ve ana programa giriş izni verir.
          </p>
        </div>

        {/* Code Box */}
        <div className="relative">
          <pre className="p-4 rounded-xl bg-[#0b0c10] border border-[#212634] font-mono text-xs text-slate-300 overflow-x-auto max-h-[500px] overflow-y-auto leading-relaxed">
            {loadingCode ? 'Python kodu yükleniyor...' : pythonCode}
          </pre>
        </div>
      </div>

      {/* Simulated Agreement Dialog Modal */}
      {showSimAgreementModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#171a23] border border-[#2e364a] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#242b3b] pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-400" />
                <h4 className="text-base font-bold text-white">
                  5846 Sayılı FSEK Telif ve Kullanıcı Sözleşmesi
                </h4>
              </div>
              <button
                onClick={() => setShowSimAgreementModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-lg bg-[#0f1117] border border-[#222838] text-[11px] font-mono text-slate-300 max-h-48 overflow-y-auto leading-relaxed">
              <strong>AKINCI OTOMATİK SURFER & ELEVATION GALILO TELİF SÖZLEŞMESİ:</strong><br /><br />
              1. Yazılımın tüm fikri ve mülkiyet hakları Mahmut Akın'a aittir (5846 Sayılı FSEK).<br />
              2. Kodların kopyalanması, tersine mühendislik uygulanması veya izinsiz dağıtılması durumunda yasal işlem başlatılacaktır.<br />
              3. Kullanım süresi tanımlanan lisans tarihi ile sınırlıdır. Süre bitiminde yazılım otomatik kilitlenecektir.
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Adınız Soyadınız (Dijital İmza):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ahmet Yılmaz"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#101217] border border-[#2b3244] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <label className="flex items-start gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreementChecked}
                  onChange={(e) => setAgreementChecked(e.target.checked)}
                  className="mt-0.5 accent-emerald-500"
                />
                <span className="text-[11px] leading-tight">
                  5846 sayılı telif hakları ve lisans süresi sınırlaması şartlarını okudum, donanım kimliğimin ve IP adresimin kayıt altına alınmasını kabul ediyorum.
                </span>
              </label>
            </div>

            <div className="pt-3 border-t border-[#242b3b] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSimAgreementModal(false)}
                className="px-4 py-2 bg-[#202636] text-slate-300 rounded-lg text-xs font-semibold"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={!signerName.trim() || !agreementChecked || agreementSubmitting}
                onClick={handleAcceptAgreementSim}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                {agreementSubmitting ? 'İmzalanıyor...' : '✅ Sözleşmeyi İmzala ve Onayla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
