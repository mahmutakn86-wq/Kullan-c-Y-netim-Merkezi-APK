import React from 'react';
import { ShieldCheck, Server, RefreshCw, KeyRound, Radio, FileText, Terminal, Cloud, Globe, LogOut, UserCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onlineCount: number;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenRemoteModal: () => void;
  onLogout: () => void;
  adminUser?: any;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onlineCount,
  onRefresh,
  isRefreshing,
  onOpenRemoteModal,
  onLogout,
  adminUser,
}) => {
  const navItems = [
    { id: 'licenses', label: 'Lisans Yönetimi', icon: KeyRound, badge: null },
    { id: 'telemetry', label: 'Canlı Kullanıcı Takibi', icon: Radio, badge: onlineCount > 0 ? `${onlineCount} Canlı` : null },
    { id: 'agreements', label: '5846 Telif & EULA Kayıtları', icon: FileText, badge: null },
    { id: 'app-check', label: 'Firebase App Check & Güvenlik', icon: ShieldCheck, badge: 'Yeni Kalkan' },
    { id: 'integration', label: 'Python Entegrasyon & Simülatör', icon: Terminal, badge: 'Hazır Kod' },
    { id: 'gcp-guide', label: 'Google Cloud Kurulum Rehberi', icon: Cloud, badge: 'GCP' },
  ];

  return (
    <header id="main-header" className="bg-[#12141a] border-b border-[#232733] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30">
              <ShieldCheck className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-base tracking-wide">AKINCI CLOUD</span>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/30">
                  Firebase Firestore Aktif
                </span>
              </div>
              <p className="text-[12px] text-slate-400">
                Surfer Pro Dual & Elevation Galilo • Google Cloud Firestore & 5846 FSEK Koruması
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            {/* Live Cloud Broadcast URL button */}
            <button
              onClick={onOpenRemoteModal}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-950/60 to-emerald-950/60 hover:from-cyan-900/80 hover:to-emerald-900/80 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Başka cihazdan (telefon/PC) paneli açmak için canlı yayın linki"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Canlı Yayın URL'si</span>
            </button>

            {/* Refresh button */}
            <button
              id="btn-refresh-data"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-[#1e2330] hover:bg-[#282f42] text-slate-300 hover:text-white border border-[#2e364a] transition-all flex items-center gap-1.5 text-xs font-medium"
              title="Verileri Yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden sm:inline">Yenile</span>
            </button>

            {/* Admin User Badge & Logout */}
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-[#242b3a]">
              <div className="px-2.5 py-1 rounded-lg bg-[#171b24] border border-[#262f42] text-[11px] text-slate-300 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-white font-medium truncate max-w-[130px]">
                  {adminUser?.name?.split(' ')[0] || 'Mahmut Akın'}
                </span>
              </div>

              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg bg-[#221a1d] hover:bg-[#382025] text-rose-300 hover:text-rose-200 border border-rose-900/40 text-xs transition-colors"
                title="Güvenli Çıkış Yap (Oturumu Kapat)"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto no-scrollbar py-2 -mb-px border-t border-[#1e2330]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-btn-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1e29]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] rounded font-semibold ${
                      item.id === 'telemetry' && onlineCount > 0
                        ? 'bg-emerald-500/20 text-emerald-300 animate-pulse'
                        : 'bg-cyan-500/20 text-cyan-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
