import React, { useState, useEffect } from 'react';
import { Radio, Laptop, MapPin, Activity, Clock, ShieldCheck, RefreshCw, Cpu, Trash2, CheckCircle2, AlertCircle, Filter, Sparkles, CreditCard, DollarSign } from 'lucide-react';
import { UserSession, LicenseKey } from '../types';

interface LiveTelemetryProps {
  sessions: UserSession[];
  licenses?: LicenseKey[];
  onRefresh: () => void;
}

export const LiveTelemetry: React.FC<LiveTelemetryProps> = ({ sessions, licenses = [], onRefresh }) => {
  const [filter, setFilter] = useState<'all' | 'online' | 'idle' | 'offline'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [purging, setPurging] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Real-time ticking for relative ping times
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getRelativeTime = (isoString: string) => {
    if (!isoString) return 'Bilinmiyor';
    const diffSec = Math.floor((currentTime - new Date(isoString).getTime()) / 1000);
    if (diffSec < 10) return 'Az önce (Canlı)';
    if (diffSec < 60) return `${diffSec} saniye önce`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} dakika önce`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} saat önce`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay} gün önce`;
  };

  const getSessionDuration = (startedAtIso: string) => {
    if (!startedAtIso) return 'Bilinmiyor';
    const diffMin = Math.floor((currentTime - new Date(startedAtIso).getTime()) / (1000 * 60));
    if (diffMin < 1) return 'Yeni başladı';
    if (diffMin < 60) return `${diffMin} dakika`;
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return `${h} saat ${m} dk`;
  };

  const handleDeleteSession = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" adlı kullanıcının oturum kaydını kaldırmak istiyor musunuz?`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/sessions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setActionMsg(`✅ "${name}" oturumu başarıyla silindi.`);
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
      setTimeout(() => setActionMsg(''), 4000);
    }
  };

  const handlePurgeOffline = async () => {
    if (!window.confirm('Tüm çevrimdışı ve eski oturum kayıtlarını temizlemek istiyor musunuz?')) {
      return;
    }
    setPurging(true);
    try {
      const res = await fetch('/api/admin/sessions/purge-offline', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionMsg(`✅ ${data.message}`);
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPurging(false);
      setTimeout(() => setActionMsg(''), 4000);
    }
  };

  const onlineSessions = sessions.filter((s) => s.status === 'online');
  const idleSessions = sessions.filter((s) => s.status === 'idle');
  const offlineSessions = sessions.filter((s) => s.status === 'offline');

  const filteredSessions = sessions.filter((s) => {
    if (filter === 'online') return s.status === 'online';
    if (filter === 'idle') return s.status === 'idle';
    if (filter === 'offline') return s.status === 'offline';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Action notification banner */}
      {actionMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionMsg}</span>
          </div>
          <button onClick={() => setActionMsg('')} className="text-slate-400 hover:text-white text-xs cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header Info */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-[#171a23] to-[#1a202c] border border-[#232733] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h3 className="text-base font-bold text-white">Canlı Kullanıcı & Oturum Takip Paneli</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Windows masaüstünde açık olan Surfer Pro Dual ve Elevation Galilo yazılımlarının anlık oturum, IP, donanım ve ödeme telemetrisi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-lg bg-[#101217] border border-[#272e3f] text-xs text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>
              Çevrimiçi: <strong className="text-emerald-400">{onlineSessions.length} Kullanıcı</strong>
            </span>
          </div>

          <button
            onClick={handlePurgeOffline}
            disabled={purging || offlineSessions.length === 0}
            className="px-3 py-1.5 rounded-lg bg-[#241a1a] hover:bg-[#382323] text-rose-300 hover:text-rose-200 border border-rose-900/40 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
            title="Eski ve çevrimdışı oturumları temizler"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{purging ? 'Temizleniyor...' : 'Çevrimdışıları Temizle'}</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-[#202636] hover:bg-[#2b3347] text-slate-300 hover:text-white border border-[#2d3547] text-xs font-semibold flex items-center gap-1 cursor-pointer"
            title="Verileri Yenile"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Yenile</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#212736] pb-3 overflow-x-auto no-scrollbar">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          Filtrele:
        </span>

        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#181d29]'
          }`}
        >
          Tümü ({sessions.length})
        </button>

        <button
          onClick={() => setFilter('online')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
            filter === 'online'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#181d29]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Canlı Çevrimiçi ({onlineSessions.length})</span>
        </button>

        <button
          onClick={() => setFilter('idle')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
            filter === 'idle'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#181d29]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Boşta ({idleSessions.length})</span>
        </button>

        <button
          onClick={() => setFilter('offline')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
            filter === 'offline'
              ? 'bg-slate-700/50 text-slate-200 border border-slate-600'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#181d29]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-500" />
          <span>Çevrimdışı ({offlineSessions.length})</span>
        </button>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSessions.length === 0 ? (
          <div className="col-span-2 p-12 text-center rounded-xl bg-[#171a23] border border-[#232733] text-slate-400">
            <Activity className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <h4 className="text-base font-semibold text-slate-300">
              {filter === 'online'
                ? 'Şu Anda Aktif Çevrimiçi Kullanıcı Yok'
                : 'Bu Kriterde Oturum Kaydı Bulunamadı'}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Kullanıcılar masaüstü yazılımını açtığında veya işlem yaptığında oturum bilgileri burada canlı güncellenir.
            </p>
          </div>
        ) : (
          filteredSessions.map((sess) => {
            const isOnline = sess.status === 'online';
            const isIdle = sess.status === 'idle';

            // Find matching license if available
            const matchedLicense = licenses.find(
              (l) => l.key === sess.licenseKey || l.customerName === sess.customerName
            );
            const pay = matchedLicense?.paymentInfo;

            return (
              <div
                key={sess.id}
                id={`session-card-${sess.id}`}
                className={`p-5 rounded-xl bg-[#171a23] border transition-all relative ${
                  isOnline
                    ? 'border-emerald-500/50 shadow-lg shadow-emerald-950/30'
                    : isIdle
                    ? 'border-amber-500/30'
                    : 'border-[#242a38] opacity-75'
                }`}
              >
                {/* Top Row: User & Online status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-lg bg-[#202636] border border-[#2d3547] flex items-center justify-center text-slate-300">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <span
                        className={`w-2.5 h-2.5 rounded-full absolute -top-0.5 -right-0.5 ring-2 ring-[#171a23] ${
                          isOnline ? 'bg-emerald-400 animate-pulse' : isIdle ? 'bg-amber-400' : 'bg-slate-500'
                        }`}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white truncate max-w-[200px]">
                        {sess.customerName || 'İsimsiz Kullanıcı'}
                      </h4>
                      <p className="text-[11px] font-mono text-cyan-400">{sess.licenseKey}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md border ${
                        isOnline
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                          : isIdle
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-slate-700/50 text-slate-400 border-slate-600'
                      }`}
                    >
                      {isOnline ? '● Canlı Çevrimiçi' : isIdle ? '⏳ Boşta (Idle)' : '○ Çevrimdışı'}
                    </span>

                    <button
                      onClick={() => handleDeleteSession(sess.id, sess.customerName)}
                      disabled={deletingId === sess.id}
                      className="p-1.5 rounded-md bg-[#241a1a] hover:bg-[#3d1f1f] text-rose-400 border border-rose-900/40 text-xs transition-colors cursor-pointer"
                      title="Oturumu Sil / Kaldır"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Financial status summary row if available */}
                {pay && (
                  <div className="mt-3 p-2 rounded-lg bg-[#101217] border border-[#232b3d] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {pay.paymentType === 'cash' ? (
                        <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span className="font-semibold text-slate-300">
                        {pay.paymentType === 'cash' ? 'Peşin Ödeme' : `${pay.installmentCount || pay.installments?.length || 0} Taksit (Her ayın ${pay.dayOfMonth || 15}'i)`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">
                        {pay.totalPrice.toLocaleString('tr-TR')} TL
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          pay.status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : pay.status === 'overdue'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {pay.status === 'paid'
                          ? '✓ Ödendi'
                          : pay.status === 'overdue'
                          ? '🚨 Gecikmiş'
                          : `Kalan: ${pay.remainingAmount.toLocaleString('tr-TR')} TL`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Details Section */}
                <div className="mt-3 p-3.5 bg-[#101217] rounded-lg border border-[#222838] space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      Aktif Çalışılan Modül:
                    </span>
                    <strong className="text-emerald-400 text-right truncate max-w-[220px]">
                      {sess.activeModule || 'SURFER PRO DUAL & GALILO'}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                      Cihaz & İşletim Sistemi:
                    </span>
                    <span className="text-slate-300 truncate max-w-[220px]">
                      {sess.deviceName} • {sess.osVersion}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      IP & Konum:
                    </span>
                    <span className="font-mono text-cyan-300 text-[11px]">
                      {sess.ip && sess.ip !== 'DirectCloud' && sess.ip !== '127.0.0.1' ? sess.ip : 'Bağlı'} ({sess.location || 'Türkiye'})
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">Donanım HWID:</span>
                    <span className="font-mono text-slate-400 text-[10px] truncate max-w-[200px]" title={sess.hwid}>
                      {sess.hwid}
                    </span>
                  </div>
                </div>

                {/* Footer Times */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Oturum Süresi: <strong className="text-slate-200">{getSessionDuration(sess.sessionStartedAt)}</strong>
                  </span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>Son Sinyal: <strong className="text-cyan-300">{getRelativeTime(sess.lastPingAt)}</strong></span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
