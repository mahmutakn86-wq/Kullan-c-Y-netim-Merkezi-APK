import React, { useState, useEffect } from 'react';
import { AlertCircle, Calendar, CheckCircle2, Clock, DollarSign, Phone, ChevronDown, ChevronUp, Bell, Sparkles } from 'lucide-react';
import { InstallmentNotification } from '../types';

interface InstallmentAlertBannerProps {
  onRefresh: () => void;
  onFilterCustomer?: (customerName: string) => void;
}

export const InstallmentAlertBanner: React.FC<InstallmentAlertBannerProps> = ({
  onRefresh,
  onFilterCustomer,
}) => {
  const [notifications, setNotifications] = useState<InstallmentNotification[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/notifications/installments');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.dueInstallments || []);
        setTotalAmount(data.totalAmount || 0);
      }
    } catch (err) {
      console.error('Taksit bildirimleri alınamadı:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkPaid = async (notif: InstallmentNotification) => {
    setProcessingId(notif.installmentId);
    try {
      const res = await fetch(
        `/api/admin/licenses/${notif.licenseId}/installments/${notif.installmentId}/status`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paid: true, note: 'Bildirim çubuğundan tahsil edildi' }),
        }
      );

      if (res.ok) {
        setSuccessMsg(`✓ ${notif.customerName} - ${notif.installmentNo}. Taksit (${notif.amount.toLocaleString('tr-TR')} TL) ödendi olarak kaydedildi.`);
        setTimeout(() => setSuccessMsg(null), 4000);
        await fetchNotifications();
        onRefresh();
      }
    } catch (err) {
      console.error('Taksit ödeme durumu güncellenemedi:', err);
    } finally {
      setProcessingId(null);
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  const overdueCount = notifications.filter((n) => n.urgency === 'overdue').length;
  const todayCount = notifications.filter((n) => n.urgency === 'today').length;
  const upcomingCount = notifications.filter((n) => n.urgency === 'upcoming').length;

  return (
    <div className="rounded-2xl bg-gradient-to-r from-[#1b1419] via-[#1a1722] to-[#121622] border border-amber-500/40 p-4 shadow-xl shadow-amber-950/20 space-y-3">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Taksit Ödeme Vade Bildirimleri</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950">
                  {notifications.length} Bildirim
                </span>
              </h3>
            </div>
            <p className="text-xs text-amber-200/80">
              Vadesi gelen veya geciken toplam:{' '}
              <strong className="text-white font-mono text-sm">
                {totalAmount.toLocaleString('tr-TR')} TL
              </strong>
              {overdueCount > 0 && (
                <span className="ml-2 text-rose-400 font-semibold">
                  ({overdueCount} gecikmiş)
                </span>
              )}
              {todayCount > 0 && (
                <span className="ml-2 text-amber-300 font-semibold">
                  ({todayCount} bugün vadesi)
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-lg bg-[#222838] hover:bg-[#2c344a] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#313a52]"
          >
            {isExpanded ? (
              <>
                <span>Gizle</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Detayları Göster ({notifications.length})</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success alert message */}
      {successMsg && (
        <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Expanded Notifications List */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {notifications.map((notif) => {
            const isOverdue = notif.urgency === 'overdue';
            const isToday = notif.urgency === 'today';
            const isProcessing = processingId === notif.installmentId;

            return (
              <div
                key={notif.id}
                className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 transition-all ${
                  isOverdue
                    ? 'bg-rose-950/30 border-rose-500/40 hover:border-rose-500'
                    : isToday
                    ? 'bg-amber-950/30 border-amber-500/40 hover:border-amber-500'
                    : 'bg-[#151924] border-[#293246] hover:border-cyan-500/40'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onFilterCustomer && onFilterCustomer(notif.customerName)}
                      className="text-xs font-bold text-white hover:text-cyan-300 text-left truncate underline-offset-2 hover:underline"
                      title="Müşteriyi listede filtrele"
                    >
                      {notif.customerName}
                    </button>

                    {isOverdue ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500 text-white uppercase tracking-wider shrink-0 animate-pulse">
                        {Math.abs(notif.daysLeft)} Gün Gecikti!
                      </span>
                    ) : isToday ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-slate-950 uppercase tracking-wider shrink-0">
                        Bugün Son Gün!
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                        {notif.daysLeft} Gün Kaldı
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">
                      {notif.installmentNo}. Taksit / {notif.totalInstallments} (Her ayın {notif.dayOfMonth}'i)
                    </span>
                    <span className="font-mono font-black text-amber-300 text-sm">
                      {notif.amount.toLocaleString('tr-TR')} TL
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      Vade: {new Date(notif.dueDate).toLocaleDateString('tr-TR')}
                    </span>

                    {notif.customerPhone && (
                      <a
                        href={`https://wa.me/${notif.customerPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                        title="WhatsApp'tan Yaz"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{notif.customerPhone}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Direct Action Button */}
                <div className="pt-2 border-t border-[#232a3b] flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {notif.licenseKey.substring(0, 12)}...
                  </span>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleMarkPaid(notif)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isProcessing ? 'Kaydediliyor...' : 'Ödendi Yap'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
