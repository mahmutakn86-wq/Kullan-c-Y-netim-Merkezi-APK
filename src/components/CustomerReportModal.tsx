import React, { useState } from 'react';
import {
  FileText, Copy, Check, Printer, Share2, Shield, Calendar, CreditCard,
  DollarSign, CheckCircle2, AlertCircle, Laptop, Clock, User, Phone, Mail, KeyRound, Sparkles
} from 'lucide-react';
import { LicenseKey, Currency } from '../types';

interface CustomerReportModalProps {
  license: LicenseKey;
  onClose: () => void;
}

export const CustomerReportModal: React.FC<CustomerReportModalProps> = ({ license, onClose }) => {
  const [copied, setCopied] = useState(false);
  const pay = license.paymentInfo;
  const currencySymbol = pay?.currency === 'USD' ? '$' : '₺';
  const currencyCode = pay?.currency === 'USD' ? 'USD' : 'TL';

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

  // Generate plain-text document for WhatsApp / Email / Clipboard
  const generatePlainTextDocument = (): string => {
    const lines: string[] = [];
    lines.push('========================================');
    lines.push('   AKINCI YAZILIM LİSANS VE HESAP EKSTRESİ   ');
    lines.push('========================================\n');

    lines.push(`👤 MÜŞTERİ BİLGİLERİ:`);
    lines.push(`• Müşteri Adı / Unvan: ${license.customerName}`);
    if (license.customerPhone) lines.push(`• Telefon / WhatsApp: ${license.customerPhone}`);
    if (license.customerEmail) lines.push(`• E-Posta: ${license.customerEmail}`);
    lines.push(`• Lisans Paketi: ${formatPlanLabel(license.plan)}`);
    lines.push(`• Durum: ${license.status === 'active' ? 'AKTİF (Kullanıma Açık)' : 'PASİF / ASKIYA ALINDI'}`);
    lines.push(`• Lisans Bitiş Tarihi: ${new Date(license.expiresAt).toLocaleDateString('tr-TR')} (${getDaysLeft(license.expiresAt)} Gün Kaldı)`);
    lines.push(`• Cihaz / PC Kotası: ${license.maxDevices || 1} Bilgisayar\n`);

    lines.push(`🔑 LİSANS ANAHTARINIZ:`);
    lines.push(`   ${license.key}\n`);

    lines.push(`💰 ÖDEME VE HESAP DETAYLARI:`);
    lines.push(`• Para Birimi: ${currencyCode}`);
    lines.push(`• Toplam Lisans Bedeli: ${formatPrice(pay?.totalPrice)}`);
    
    if (pay?.paymentType === 'cash') {
      lines.push(`• Ödeme Tipi: Peşin Ödeme (Nakit / Havale / EFT)`);
      lines.push(`• Ödenen Tutar: ${formatPrice(pay.paidAmount || (pay.status === 'paid' ? pay.totalPrice : 0))}`);
      lines.push(`• Kalan Bakiye: ${formatPrice(pay.remainingAmount || (pay.status === 'paid' ? 0 : pay.totalPrice))}`);
      lines.push(`• Ödeme Durumu: ${pay.status === 'paid' ? 'TAMAMI ÖDENDİ (Tahsil Edildi ✓)' : 'ÖDENMEDİ (Beklemede ⏳)'}`);
    } else if (pay?.paymentType === 'installment') {
      lines.push(`• Ödeme Tipi: Taksitli Ödeme Planı`);
      if ((pay.downPayment || 0) > 0) {
        lines.push(`• Alınan Peşinat: ${formatPrice(pay.downPayment)} (Tahsil Edildi ✓)`);
      }
      lines.push(`• Toplam Tahsil Edilen: ${formatPrice(pay.paidAmount)}`);
      lines.push(`• Toplam Kalan Borç: ${formatPrice(pay.remainingAmount)}`);
      lines.push(`• Taksit Sayısı: ${pay.installmentCount || pay.installments?.length || 0} Ay`);
      lines.push(`• Ödeme Günü: Her Ayın ${pay.dayOfMonth || 15}. Günü\n`);

      if (pay.installments && pay.installments.length > 0) {
        lines.push(`📅 TAKSİT ÖDEME PLANI VE ÇİZELGESİ:`);
        lines.push(`----------------------------------------`);
        pay.installments.forEach((inst) => {
          const isPaid = inst.status === 'paid';
          const dueDateStr = new Date(inst.dueDate).toLocaleDateString('tr-TR');
          const statusText = isPaid
            ? `[✓ ÖDENDİ - ${inst.paidAt ? new Date(inst.paidAt).toLocaleDateString('tr-TR') : 'Tamamlandı'}]`
            : `[⏳ ÖDENECEK]`;
          lines.push(`• ${inst.installmentNo}. Taksit: ${formatPrice(inst.amount)} | Vade: ${dueDateStr} ${statusText}`);
        });
        lines.push(`----------------------------------------`);
      }
    } else {
      lines.push(`• Ödeme Şekli: Belirtilmedi`);
    }

    if (license.notes) {
      lines.push(`\n📝 NOTLAR / AÇIKLAMA:`);
      lines.push(`• ${license.notes}`);
    }

    lines.push(`\n========================================`);
    lines.push(`AKINCI Software & Engineering Systems`);
    lines.push(`Düzenlenme Tarihi: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}`);
    lines.push(`========================================`);

    return lines.join('\n');
  };

  const handleCopy = () => {
    const text = generatePlainTextDocument();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#171a23] border border-[#2d364c] rounded-2xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#242b3b] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Müşteri Lisans & Ödeme Hesap Raporu</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Döküman
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Müşteriye WhatsApp, E-Posta veya çıktı olarak iletilmeye hazır hesap özeti.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-slate-950 font-black" />
                  <span>Kopyalandı!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Raporu Kopyala</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-[#202636] hover:bg-[#2c344a] text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Yazdır"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white text-lg font-bold p-1 ml-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable/Formatted Paper Preview */}
        <div className="bg-[#101218] border border-[#262f44] rounded-2xl p-6 text-slate-200 space-y-6 shadow-inner font-sans">
          {/* Header Strip */}
          <div className="flex flex-wrap items-center justify-between border-b border-[#232b3d] pb-4 gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-cyan-400 font-bold">
                AKINCI YAZILIM SİSTEMLERİ
              </div>
              <h2 className="text-xl font-black text-white mt-0.5">{license.customerName}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Lisans Türü: <span className="text-slate-200 font-semibold">{formatPlanLabel(license.plan)}</span> • Kota: {license.maxDevices || 1} PC
              </p>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                  license.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                }`}
              >
                {license.status === 'active' ? '● LİSANS AKTİF' : '○ LİSANS PASİF'}
              </span>
              <div className="text-[11px] text-slate-400 mt-1">
                Tarih: {new Date().toLocaleDateString('tr-TR')}
              </div>
            </div>
          </div>

          {/* License Key Box */}
          <div className="p-4 rounded-xl bg-[#171b26] border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider font-bold text-cyan-400 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                Tanımlı Lisans Anahtarı:
              </span>
              <div className="font-mono font-black text-base text-white tracking-wider">
                {license.key}
              </div>
            </div>

            <div className="text-right text-xs space-y-0.5">
              <div className="text-slate-400">
                Geçerlilik Bitiş: <strong className="text-white">{new Date(license.expiresAt).toLocaleDateString('tr-TR')}</strong>
              </div>
              <div className="text-emerald-400 font-bold">
                Kalan Süre: {getDaysLeft(license.expiresAt)} Gün
              </div>
            </div>
          </div>

          {/* Financial Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Toplam Satış Bedeli */}
            <div className="p-3.5 rounded-xl bg-[#141824] border border-[#283248]">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                Toplam Satış Bedeli
              </span>
              <div className="text-lg font-black text-cyan-300 mt-1">
                {formatPrice(pay?.totalPrice)}
              </div>
              <span className="text-[10px] text-slate-500">
                Para Birimi: {currencyCode} ({currencySymbol})
              </span>
            </div>

            {/* Tahsil Edilen Tutar / Peşinat */}
            <div className="p-3.5 rounded-xl bg-[#141824] border border-emerald-500/30">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Tahsil Edilen (Ödenen)
              </span>
              <div className="text-lg font-black text-emerald-400 mt-1">
                {formatPrice(
                  pay?.paymentType === 'cash'
                    ? (pay.status === 'paid' ? pay.totalPrice : 0)
                    : pay?.paidAmount
                )}
              </div>
              <span className="text-[10px] text-emerald-300/80">
                {pay?.paymentType === 'installment' && (pay.downPayment || 0) > 0
                  ? `Peşinat: ${formatPrice(pay.downPayment)} dahil`
                  : 'Nakit / Havale / EFT'}
              </span>
            </div>

            {/* Kalan Borç / Bakiye */}
            <div className="p-3.5 rounded-xl bg-[#141824] border border-amber-500/30">
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Kalan Ödeme / Borç
              </span>
              <div className="text-lg font-black text-amber-300 mt-1">
                {formatPrice(
                  pay?.paymentType === 'cash'
                    ? (pay.status === 'paid' ? 0 : pay?.totalPrice)
                    : pay?.remainingAmount
                )}
              </div>
              <span className="text-[10px] text-amber-300/80">
                {pay?.status === 'paid' ? 'Tüm ödemeler tamamlandı' : 'Ödenecek kalan tutar'}
              </span>
            </div>
          </div>

          {/* Payment Type Details */}
          {pay?.paymentType === 'cash' ? (
            <div className="p-4 rounded-xl bg-[#141824] border border-[#283248] flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-xs flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-cyan-400" />
                  <span>Ödeme Tipi: Peşin Tek Çekim / Havale</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Lisans bedeli tek seferde tahsil edilmek üzere tanımlanmıştır.
                </p>
              </div>

              <div className="text-right">
                <span
                  className={`px-3 py-1.5 rounded-lg text-xs font-black ${
                    pay.status === 'paid'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {pay.status === 'paid' ? '✓ TAMAMI ÖDENDİ' : '⏳ ÖDENMEDİ / BEKLEMEDE'}
                </span>
                {pay.cashPaidAt && (
                  <div className="text-[10px] text-emerald-400 mt-1">
                    Tahsilat: {new Date(pay.cashPaidAt).toLocaleDateString('tr-TR')}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Installments Breakdown Table */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>Taksitli Ödeme Planı ({pay?.installmentCount || pay?.installments?.length || 0} Taksit)</span>
                </div>
                <span className="text-xs text-slate-400">
                  Her Ayın <strong className="text-amber-300">{pay?.dayOfMonth || 15}. Günü</strong> Vade
                </span>
              </div>

              {pay?.installments && pay.installments.length > 0 ? (
                <div className="rounded-xl border border-[#283248] overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#181c28] text-slate-400 border-b border-[#283248]">
                      <tr>
                        <th className="p-3">Taksit No</th>
                        <th className="p-3">Vade Tarihi</th>
                        <th className="p-3">Taksit Tutarı</th>
                        <th className="p-3">Durum</th>
                        <th className="p-3 text-right">Tahsilat Tarihi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#22293b]">
                      {pay.installments.map((inst) => {
                        const isPaid = inst.status === 'paid';
                        const isOverdue = !isPaid && new Date(inst.dueDate).getTime() < Date.now();

                        return (
                          <tr
                            key={inst.id}
                            className={
                              isPaid
                                ? 'bg-emerald-950/10'
                                : isOverdue
                                ? 'bg-rose-950/10'
                                : 'bg-[#12151e]'
                            }
                          >
                            <td className="p-3 font-bold text-white">
                              {inst.installmentNo}. Taksit
                            </td>
                            <td className="p-3 text-slate-300">
                              {new Date(inst.dueDate).toLocaleDateString('tr-TR')}
                            </td>
                            <td className="p-3 font-mono font-black text-amber-300">
                              {formatPrice(inst.amount)}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isPaid
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : isOverdue
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                }`}
                              >
                                {isPaid ? '✓ ÖDENDİ' : isOverdue ? '🚨 GECİKMİŞ' : '⏳ BEKLİYOR'}
                              </span>
                            </td>
                            <td className="p-3 text-right text-slate-400 font-mono text-[11px]">
                              {inst.paidAt ? new Date(inst.paidAt).toLocaleDateString('tr-TR') : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#141824] text-slate-400 text-xs">
                  Henüz taksit dökümü oluşturulmadı.
                </div>
              )}
            </div>
          )}

          {/* Quick Copy Raw Document Box */}
          <div className="p-3.5 rounded-xl bg-[#0b0d13] border border-[#202738] space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Metin Formatı (WhatsApp / Mail Gönderimi İçin Hazır):</span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold text-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Panoya Kopyala</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-[#141824] text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap select-all max-h-40 border border-[#222a3d]">
              {generatePlainTextDocument()}
            </pre>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#202636] hover:bg-[#2c344a] text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Kapat
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            <span>Müşteriye Göndermek İçin Kopyala</span>
          </button>
        </div>
      </div>
    </div>
  );
};
