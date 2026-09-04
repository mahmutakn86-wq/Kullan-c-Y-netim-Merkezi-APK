import React from 'react';
import { KeyRound, ShieldAlert, Clock, Radio, FileCheck, CheckCircle2, DollarSign, Wallet, CreditCard, AlertCircle } from 'lucide-react';
import { DashboardStats } from '../types';

interface StatsCardsProps {
  stats: DashboardStats;
  onFilterStatus?: (status: string) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, onFilterStatus }) => {
  const cards = [
    {
      id: 'active',
      label: 'Aktif Lisanslar',
      value: stats.activeLicenses,
      total: stats.totalLicenses,
      icon: CheckCircle2,
      color: 'emerald',
      bgGradient: 'from-emerald-500/10 to-emerald-950/20',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      description: 'Aktif ve geçerli lisans anahtarı',
    },
    {
      id: 'online',
      label: 'Canlı Çevrimiçi Kullanıcı',
      value: stats.onlineUsersNow,
      total: null,
      icon: Radio,
      color: 'cyan',
      bgGradient: 'from-cyan-500/10 to-cyan-950/20',
      borderColor: 'border-cyan-500/30',
      iconColor: 'text-cyan-400',
      description: 'Masaüstü yazılımında aktif çalışanlar',
    },
    {
      id: 'expiring',
      label: 'Süresi Yaklaşanlar (≤ 7 Gün)',
      value: stats.expiringIn7Days,
      total: null,
      icon: Clock,
      color: 'amber',
      bgGradient: 'from-amber-500/10 to-amber-950/20',
      borderColor: 'border-amber-500/30',
      iconColor: 'text-amber-400',
      description: 'Yenileme uyarısı gönderilecekler',
    },
    {
      id: 'expired',
      label: 'Süresi Dolan / İptal',
      value: stats.expiredLicenses + stats.revokedLicenses,
      total: null,
      icon: ShieldAlert,
      color: 'rose',
      bgGradient: 'from-rose-500/10 to-rose-950/20',
      borderColor: 'border-rose-500/30',
      iconColor: 'text-rose-400',
      description: `${stats.expiredLicenses} süresi dolan, ${stats.revokedLicenses} kara liste`,
    },
    {
      id: 'agreements',
      label: '5846 İmzalı Sözleşmeler',
      value: stats.signedAgreements,
      total: null,
      icon: FileCheck,
      color: 'indigo',
      bgGradient: 'from-indigo-500/10 to-indigo-950/20',
      borderColor: 'border-indigo-500/30',
      iconColor: 'text-indigo-400',
      description: 'Dijital imzalı FSEK kayıtları',
    },
  ];

  const formatCurrency = (val?: number) => {
    return (val || 0).toLocaleString('tr-TR') + ' TL';
  };

  return (
    <div className="space-y-4">
      {/* Primary Operation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              id={`stat-card-${card.id}`}
              onClick={() => onFilterStatus && onFilterStatus(card.id)}
              className={`p-4 rounded-xl bg-[#171a23] border ${card.borderColor} shadow-lg relative overflow-hidden transition-all hover:translate-y-[-2px] cursor-pointer`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  {card.label}
                </span>
                <div className={`p-2 rounded-lg bg-[#1f2433] ${card.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{card.value}</span>
                {card.total !== null && (
                  <span className="text-xs text-slate-400">/ {card.total} toplam</span>
                )}
              </div>

              <p className="mt-1 text-[11px] text-slate-400 truncate">{card.description}</p>
            </div>
          );
        })}
      </div>

      {/* Financial & Payment Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Toplam Satış / Ciro */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#151922] to-[#12141a] border border-[#262f44] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Toplam Lisans Cirosu
            </span>
            <div className="text-lg font-black text-cyan-300">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-[10px] text-slate-400">Tanımlanan lisans bedelleri</p>
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Tahsil Edilen */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#151922] to-[#12141a] border border-emerald-500/30 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              Tahsil Edilen Tutar
            </span>
            <div className="text-lg font-black text-emerald-400">
              {formatCurrency(stats.totalCollected)}
            </div>
            <p className="text-[10px] text-slate-400">Peşin ve ödenmiş taksitler</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Kalan / Bekleyen Alacak */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#151922] to-[#12141a] border border-amber-500/30 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
              Kalan / Bekleyen Tutar
            </span>
            <div className="text-lg font-black text-amber-300">
              {formatCurrency(stats.totalPending)}
            </div>
            <p className="text-[10px] text-slate-400">Gelecek vadeli taksitler</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Vadesi Gelen / Geciken Taksitler */}
        <div
          onClick={() => onFilterStatus && onFilterStatus('due_installments')}
          className={`p-3.5 rounded-xl bg-gradient-to-br from-[#151922] to-[#12141a] border ${
            (stats.dueInstallmentCount || 0) > 0 ? 'border-rose-500/50 bg-rose-950/10' : 'border-[#262f44]'
          } flex items-center justify-between cursor-pointer hover:border-rose-500 transition-colors`}
        >
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1">
              {(stats.dueInstallmentCount || 0) > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
              Vadesi Gelen / Geciken
            </span>
            <div className="text-lg font-black text-rose-300">
              {stats.dueInstallmentCount || 0} Adet ({formatCurrency(stats.dueInstallmentTotal)})
            </div>
            <p className="text-[10px] text-slate-400">Tıklayarak vadesi gelenleri filtreleyin</p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
