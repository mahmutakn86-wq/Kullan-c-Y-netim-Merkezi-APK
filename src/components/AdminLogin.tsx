import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Mail, KeyRound, ArrowRight, CheckCircle2, AlertTriangle, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (adminData: any, token: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  // Üç alan da başlangıçta tamamen boştur (yönetici kendisi yazar veya yapıştırır)
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Durum değişkenleri
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Doğrudan 3 Alanlı Yönetici Girişi
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanUser = username.trim();
    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanEmail || !cleanPass) {
      setError('Lütfen Kullanıcı Adı, E-posta ve Şifre alanlarının üçünü de doldurunuz.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUser,
          email: cleanEmail,
          password: cleanPass,
          rememberMe,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Geçersiz giriş bilgileri! Lütfen Kullanıcı Adı, E-posta ve Şifrenizi kontrol ediniz.');
        setLoading(false);
        return;
      }

      // Token'ı ve 30 günlük süreyi localStorage'a kaydet
      if (typeof window !== 'undefined' && data.token) {
        localStorage.setItem('akinci_admin_token', data.token);
        localStorage.setItem('akinci_admin_user', JSON.stringify(data.admin));
        if (data.admin?.expiresAt) {
          localStorage.setItem('akinci_admin_expiry', data.admin.expiresAt);
        }
      }

      setSuccessMsg('✅ Giriş başarılı! Yönetim Merkezine yönlendiriliyorsunuz...');
      setTimeout(() => {
        onLoginSuccess(data.admin, data.token);
      }, 350);
    } catch (err: any) {
      setError('Sunucu bağlantı hatası oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-100 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-black">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-xl shadow-emerald-950/50 ring-2 ring-emerald-400/40 mb-3.5">
            <ShieldCheck className="w-9 h-9 text-slate-950 font-bold" />
          </div>
          <h1 className="text-2xl font-black tracking-wide text-white uppercase">
            AKINCI CLOUD
          </h1>
          <p className="text-xs text-emerald-400 font-semibold tracking-wider uppercase mt-1">
            Kullanıcı Yönetim Merkezi & Bulut Lisans Sunucusu
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            5846 Sayılı FSEK Korumalı • Mahmut Akın
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-[#12151e] border border-[#232a3d] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-md">
          {/* Status Indicator */}
          <div className="mb-5 flex items-center justify-between pb-3.5 border-b border-[#1f2638]">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Yönetici Girişi
              </span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/30">
              Yetkili Erişim Kapısı
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 3-INPUT LOGIN FORM */}
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            {/* Input 1: Kullanıcı Adı */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kullanıcı Adı:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Kullanıcı adınızı giriniz"
                  className="w-full bg-[#181d2a] border border-[#2b344a] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors select-text"
                />
              </div>
            </div>

            {/* Input 2: E-Posta */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                E-Posta:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-posta giriniz"
                  className="w-full bg-[#181d2a] border border-[#2b344a] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors select-text"
                />
              </div>
            </div>

            {/* Input 3: Şifre */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Şifre:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Şifrenizi giriniz"
                  className="w-full bg-[#181d2a] border border-[#2b344a] rounded-xl pl-10 pr-11 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors select-text"
                />
                {/* Şifre Gizli / Görünür Butonu */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  title={showPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#181d2a] border-[#2b344a] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                />
                <span className="text-xs text-slate-300">Beni bu cihazda hatırla (30 Gün)</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-950/40 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Doğrulanıyor...</span>
                </>
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Footer Notice */}
        <div className="mt-6 text-center text-[11px] text-slate-500 space-y-1">
          <p>🔒 256-Bit SSL & Google Cloud Firestore Güvenli Altyapısı</p>
          <p>Yalnızca yetkili yönetici (Mahmut Akın) erişebilir.</p>
        </div>
      </div>
    </div>
  );
};
