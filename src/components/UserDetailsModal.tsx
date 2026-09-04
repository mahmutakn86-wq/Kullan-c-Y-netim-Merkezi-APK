import React, { useState } from 'react';
import {
  User, KeyRound, Calendar, Laptop, ShieldCheck, CreditCard, DollarSign,
  Clock, Phone, Mail, FileText, CheckCircle2, AlertTriangle, XCircle,
  Copy, Check, Edit3, Trash2, Ban, ExternalLink, RefreshCw, Globe, Printer
} from 'lucide-react';
import { LicenseKey, Currency } from '../types';
import { printAuditReceipt } from './AgreementAuditLogs';

interface UserDetailsModalProps {
  license: LicenseKey;
  onClose: () => void;
  onOpenReport: (license: LicenseKey) => void;
  onOpenEdit: (license: LicenseKey) => void;
  onOpenExtend: (license: LicenseKey) => void;
  onOpenPayment: (license: LicenseKey) => void;
  onUnbindDevice: (license: LicenseKey, hwid?: string) => void;
  onToggleStatus: (license: LicenseKey) => void;
  onRefresh: () => void;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  license,
  onClose,
  onOpenReport,
  onOpenEdit,
  onOpenExtend,
  onOpenPayment,
  onUnbindDevice,
  onToggleStatus,
  onRefresh,
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedIp, setCopiedIp] = useState(false);
  const [updatingInstId, setUpdatingInstId] = useState<string | null>(null);

  const primaryIp = (license.agreementIp && license.agreementIp !== '-' && license.agreementIp !== 'DirectCloud' && license.agreementIp !== '127.0.0.1')
    ? license.agreementIp
    : (license.boundDevices && license.boundDevices.length > 0 && license.boundDevices[0].ip && license.boundDevices[0].ip !== '-' && license.boundDevices[0].ip !== 'DirectCloud' && license.boundDevices[0].ip !== '127.0.0.1')
      ? license.boundDevices[0].ip
      : 'Henüz Bağlanmadı';

  const handlePrintAudit = () => {
    const logData: any = {
      id: `audit-${license.id}`,
      licenseKey: license.key,
      customerName: license.customerName,
      customerEmail: license.customerEmail || 'Belirtilmedi',
      hwid: (license.boundDevices && license.boundDevices[0]?.hwid) || 'HWID-STANDALONE-PC',
      ipAddress: primaryIp,
      acceptedAt: license.firstActivatedAt || license.createdAt || new Date().toISOString(),
      agreementVersion: 'v2026.1 (5846 FSEK)',
      legalHash: license.legalHash || `SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069`,
    };
    printAuditReceipt(logData, false);
  };

  const handleCopyIp = () => {
    navigator.clipboard.writeText(primaryIp);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  const pay = license.paymentInfo;
  const currencyCode = pay?.currency === 'USD' ? 'USD' : 'TL';
  const currencySymbol = pay?.currency === 'USD' ? '$' : '₺';

  const formatPrice = (val?: number) => {
    return `${(val || 0).toLocaleString('tr-TR')} ${currencyCode}`;
  };

  const getDaysLeft = (expiresAtStr: string): number => {
    if (!expiresAtStr) return 0;
    const dateStr = expiresAtStr.includes('T') ? expiresAtStr : `${expiresAtStr}T23:59:59.999Z`;
    const expiresAt = new Date(dateStr).getTime();
    if (isNaN(expiresAt)) return 0;
    const now = Date.now();
    const diff = expiresAt - now;
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const formatPlanLabel = (plan: string): string => {
    switch (plan) {
      case '7days':
      case 'trial':
        return '7 Günlük Lisans';
      case 'monthly':
        return '1 Aylık (30 Gün)';
      case 'quarterly':
        return '3 Aylık (90 Gün)';
      case 'semi_annual':
        return '6 Aylık (180 Gün)';
      case 'annual':
        return '1 Yıllık (365 Gün)';
      case 'lifetime':
        return 'Süresiz (Ömür Boyu)';
      case 'custom':
        return 'Özel Süreli';
      default:
        return plan;
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(license.key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleToggleInstallment = async (instId: string, currentPaid: boolean) => {
    if (!pay || !pay.installments) return;
    setUpdatingInstId(instId);
    try {
      const nextStatus = currentPaid ? 'unpaid' : 'paid';
      const updatedInstallments = pay.installments.map((inst) => {
        if (inst.id === instId) {
          return {
            ...inst,
            status: nextStatus as 'paid' | 'unpaid',
            paidAt: nextStatus === 'paid' ? new Date().toISOString() : undefined,
          };
        }
        return inst;
      });

      const downPayment = pay.downPayment || 0;
      const installmentsPaidSum = updatedInstallments
        .filter((i) => i.status === 'paid')
        .reduce((sum, i) => sum + (i.amount || 0), 0);
      const totalPaid = downPayment + installmentsPaidSum;
      const remaining = Math.max(0, pay.totalPrice - totalPaid);

      const updatedPayment: any = {
        ...pay,
        paidAmount: totalPaid,
        remainingAmount: remaining,
        status: totalPaid >= pay.totalPrice ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid',
        installments: updatedInstallments,
      };

      const res = await fetch(`/api/admin/licenses/${license.id}/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentInfo: updatedPayment }),
      });

      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingInstId(null);
    }
  };

  const daysLeft = getDaysLeft(license.expiresAt);
  const isExpired = license.status === 'expired' || daysLeft <= 0;
  const isRevoked = license.status === 'revoked';

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#171a23] border border-[#2d364c] rounded-2xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#242b3b] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{license.customerName}</h3>
                <span
                  className={`px-2.5 py-0.5 text-xs font-bold rounded-md border ${
                    license.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {license.status === 'active' ? '● AKTİF' : '○ PASİF (KİLİTLİ)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kullanıcı Lisans Detayları, Donanım Kilidi, Finans ve Taksit Takip Paneli
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Rapor Al Button */}
            <button
              type="button"
              onClick={() => onOpenReport(license)}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              title="Müşteriye Gönderilecek Hesap Ekstresi & Lisans Raporunu Al"
            >
              <FileText className="w-4 h-4" />
              <span>Rapor Al (Döküman)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white text-lg font-bold p-1 ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* License Key & Duration Ribbon */}
        <div className="p-4 rounded-xl bg-[#10131a] border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              Lisans Anahtarı
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white text-base tracking-wider">
                {license.key}
              </span>
              <button
                type="button"
                onClick={handleCopyKey}
                className="p-1.5 rounded-lg bg-[#202636] hover:bg-[#2c344a] text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Kopyala"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="text-right">
              <div className="text-slate-400">Paket: <strong className="text-cyan-300">{formatPlanLabel(license.plan)}</strong></div>
              <div className="text-slate-400">Bitiş: <strong className="text-white">{new Date(license.expiresAt).toLocaleDateString('tr-TR')}</strong></div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-[#181d29] border border-[#2b3548] text-center">
              <span className="text-[10px] text-slate-400 block">Kalan Süre</span>
              <span className="text-sm font-black text-emerald-400">{daysLeft} Gün</span>
            </div>
          </div>
        </div>

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Contact & Agreement */}
          <div className="p-4 rounded-xl bg-[#12151e] border border-[#242c3d] space-y-3">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5 border-b border-[#222938] pb-2">
              <User className="w-4 h-4 text-cyan-400" />
              <span>İletişim & Onay Durumu</span>
            </h4>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  Telefon / WhatsApp:
                </span>
                {license.customerPhone ? (
                  <a
                    href={`https://wa.me/${license.customerPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline font-mono font-bold flex items-center gap-1"
                  >
                    <span>{license.customerPhone}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-500 italic">Belirtilmedi</span>
                )}
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  E-Posta:
                </span>
                <span className="text-slate-300 font-mono font-medium">{license.customerEmail || 'Belirtilmedi'}</span>
              </div>

              {/* Kullanıcı IP Adresi (Görünür) */}
              <div className="flex items-center justify-between text-slate-300 p-2 rounded-lg bg-[#0e1017] border border-[#1e2536]">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  Kullanıcı IP Adresi:
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-emerald-400 font-bold text-xs">{primaryIp}</span>
                  <button
                    type="button"
                    onClick={handleCopyIp}
                    className="p-1 rounded bg-[#1c2230] hover:bg-[#283247] text-slate-300 transition-colors"
                    title="IP Adresini Kopyala"
                  >
                    {copiedIp ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  5846 EULA Sözleşmesi:
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      license.agreementAccepted
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {license.agreementAccepted ? '✓ Onaylandı' : '⏳ Bekleniyor'}
                  </span>
                  {license.agreementAccepted && (
                    <button
                      type="button"
                      onClick={handlePrintAudit}
                      className="px-2 py-0.5 bg-[#202738] hover:bg-[#2b354d] text-cyan-300 border border-cyan-700/50 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors"
                      title="Bu kullanıcının 5846 Sayılı Resmi Lisans Denetim Tutanağını Yazdır"
                    >
                      <Printer className="w-3 h-3 text-cyan-400" />
                      <span>Tutanak</span>
                    </button>
                  )}
                </div>
              </div>

              {license.firstActivatedAt && (
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">İlk Kurulum Zamanı:</span>
                  <span className="text-emerald-400 font-medium">
                    {new Date(license.firstActivatedAt).toLocaleString('tr-TR')}
                  </span>
                </div>
              )}

              {license.notes && (
                <div className="pt-2 border-t border-[#202738] text-slate-400">
                  <span className="font-semibold text-slate-300">Notlar: </span>
                  <span>{license.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bound Hardware & PC Slots */}
          <div className="p-4 rounded-xl bg-[#12151e] border border-[#242c3d] space-y-3">
            <div className="flex items-center justify-between border-b border-[#222938] pb-2">
              <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-cyan-400" />
                <span>Kayıtlı Cihazlar & Donanım Kilidi</span>
              </h4>
              <span className="text-[11px] font-bold text-emerald-400">
                {license.boundDevices.length} / {license.maxDevices || 1} PC Kota
              </span>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {license.boundDevices.length === 0 ? (
                <div className="p-3 rounded-lg bg-[#0e1017] text-slate-500 italic text-[11px]">
                  Henüz bağlı cihaz yok. ({license.maxDevices || 1} bilgisayar açılışta sırayla otomatik kilitlenecektir.)
                </div>
              ) : (
                license.boundDevices.map((dev, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-[#0e1017] border border-[#232b3b] flex items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="text-cyan-400">PC {idx + 1}:</span>
                        <span>{dev.deviceName}</span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 truncate max-w-[200px]" title={dev.hwid}>
                        HWID: {dev.hwid}
                      </div>
                      <div className="text-[10px] text-emerald-400">
                        IP: {dev.ip && dev.ip !== 'DirectCloud' && dev.ip !== '127.0.0.1' ? dev.ip : 'Henüz Bağlanmadı'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onUnbindDevice(license, dev.hwid)}
                      className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                      title="Bu cihazın donanım kilidini kaldır"
                    >
                      Kilidi Sıfırla
                    </button>
                  </div>
                ))
              )}
            </div>

            {license.boundDevices.length > 0 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => onUnbindDevice(license)}
                  className="w-full py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Tüm Cihaz Kilitlerini Sıfırla ({license.boundDevices.length} Cihaz)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Financial & Installments Section */}
        <div className="p-4 rounded-xl bg-[#12151e] border border-[#242c3d] space-y-4">
          <div className="flex items-center justify-between border-b border-[#222938] pb-2">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <h4 className="font-bold text-white text-xs">
                Ödeme ve Taksit Takip Detayları ({currencyCode})
              </h4>
            </div>

            <button
              type="button"
              onClick={() => onOpenPayment(license)}
              className="px-2.5 py-1 rounded-lg bg-[#202636] hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Ödeme Planını Düzenle</span>
            </button>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#0e1017] border border-[#22293b]">
              <span className="text-slate-400 text-[11px]">Toplam Lisans Tutarı:</span>
              <div className="text-base font-black text-cyan-300 mt-0.5">
                {formatPrice(pay?.totalPrice)}
              </div>
              <span className="text-[10px] text-slate-500">
                Ödeme Şekli: {pay?.paymentType === 'cash' ? 'Peşin' : 'Taksitli'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#0e1017] border border-emerald-500/30">
              <span className="text-emerald-400 text-[11px] font-semibold">Tahsil Edilen (Ödenen):</span>
              <div className="text-base font-black text-emerald-400 mt-0.5">
                {formatPrice(
                  pay?.paymentType === 'cash'
                    ? (pay.status === 'paid' ? pay.totalPrice : 0)
                    : pay?.paidAmount
                )}
              </div>
              <span className="text-[10px] text-emerald-300/80">
                {(pay?.downPayment || 0) > 0 ? `Peşinat: ${formatPrice(pay?.downPayment)} dahil` : 'Tahsilat'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#0e1017] border border-amber-500/30">
              <span className="text-amber-400 text-[11px] font-semibold">Kalan Borç / Bakiye:</span>
              <div className="text-base font-black text-amber-300 mt-0.5">
                {formatPrice(
                  pay?.paymentType === 'cash'
                    ? (pay.status === 'paid' ? 0 : pay?.totalPrice)
                    : pay?.remainingAmount
                )}
              </div>
              <span className="text-[10px] text-amber-300/80">
                {pay?.status === 'paid' ? 'Tamamı Kapandı' : 'Ödenecek Tutar'}
              </span>
            </div>
          </div>

          {/* Installments Breakdown if Installment Type */}
          {pay?.paymentType === 'installment' && pay.installments && pay.installments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Taksit Çizelgesi ({pay.installments.filter((i) => i.status === 'paid').length} / {pay.installments.length} Ödendi):</span>
                <span className="text-slate-400">Her Ayın {pay.dayOfMonth || 15}'i Vade</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                {pay.installments.map((inst) => {
                  const isPaid = inst.status === 'paid';
                  const dueDateObj = new Date(inst.dueDate);
                  const isOverdue = !isPaid && dueDateObj.getTime() < Date.now();

                  return (
                    <div
                      key={inst.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                        isPaid
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : isOverdue
                          ? 'bg-rose-950/25 border-rose-500/40'
                          : 'bg-[#0e1017] border-[#22293b]'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-white text-xs">
                          {inst.installmentNo}. Taksit
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{dueDateObj.toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="font-mono font-black text-amber-300 text-xs mt-0.5">
                          {formatPrice(inst.amount)}
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1">
                        <span
                          className={`text-[10px] font-bold ${
                            isPaid
                              ? 'text-emerald-400'
                              : isOverdue
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {isPaid ? '✓ ÖDENDİ' : isOverdue ? '🚨 GECİKTİ' : '⏳ BEKLİYOR'}
                        </span>

                        <button
                          type="button"
                          disabled={updatingInstId === inst.id}
                          onClick={() => handleToggleInstallment(inst.id, isPaid)}
                          className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                            isPaid
                              ? 'bg-[#181d29] hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-[#2b3548]'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                          }`}
                        >
                          {isPaid ? 'Ödenmedi' : '✓ Ödendi Yap'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#242b3b]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleStatus(license)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                license.status === 'active'
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {license.status === 'active' ? 'Lisansı PASİF (Kilitli) Yap' : 'Lisansı AKTİF Yap'}
            </button>

            <button
              type="button"
              onClick={() => onOpenExtend(license)}
              className="px-3 py-2 rounded-xl bg-[#202636] hover:bg-[#2c344a] text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Süre Uzat</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenEdit(license)}
              className="px-3 py-2 rounded-xl bg-[#202636] hover:bg-[#2c344a] text-cyan-400 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Düzenle</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenReport(license)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Müşteri Raporunu Aç</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#202636] hover:bg-[#2c344a] text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
