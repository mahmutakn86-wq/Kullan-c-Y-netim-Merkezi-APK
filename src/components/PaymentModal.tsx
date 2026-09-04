import React, { useState } from 'react';
import { CreditCard, DollarSign, Calendar, CheckCircle2, XCircle, AlertTriangle, Plus, Trash2, Clock, RefreshCw, Save, Sparkles } from 'lucide-react';
import { LicenseKey, PaymentInfo, LicenseInstallment, PaymentType, Currency } from '../types';

interface PaymentModalProps {
  license: LicenseKey;
  onClose: () => void;
  onSaved: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  license,
  onClose,
  onSaved,
}) => {
  const currentPay = license.paymentInfo;

  const [currency, setCurrency] = useState<Currency>(currentPay?.currency === 'USD' ? 'USD' : 'TL');
  const [paymentType, setPaymentType] = useState<PaymentType>(currentPay?.paymentType || 'cash');
  const [totalPrice, setTotalPrice] = useState<number>(currentPay?.totalPrice || 15000);
  const [downPayment, setDownPayment] = useState<number>(currentPay?.downPayment || 0);
  const [installmentCount, setInstallmentCount] = useState<number>(currentPay?.installmentCount || 3);
  const [dayOfMonth, setDayOfMonth] = useState<number>(currentPay?.dayOfMonth || 15);
  const [firstDueDate, setFirstDueDate] = useState<string>(
    currentPay?.installments?.[0]?.dueDate
      ? currentPay.installments[0].dueDate.substring(0, 10)
      : new Date().toISOString().substring(0, 10)
  );
  const [notes, setNotes] = useState<string>(currentPay?.notes || '');
  const [cashIsPaid, setCashIsPaid] = useState<boolean>(currentPay?.status === 'paid');

  const [installments, setInstallments] = useState<LicenseInstallment[]>(
    currentPay?.installments || []
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const currencySymbol = currency === 'USD' ? '$' : '₺';
  const currencyCode = currency === 'USD' ? 'USD' : 'TL';

  // Calculate remaining after down payment for installment division
  const remainingForInstallments = Math.max(0, totalPrice - downPayment);

  // Generate installments schedule based on inputs
  const handleGenerateSchedule = () => {
    const count = Math.max(1, installmentCount);
    const perAmount = Math.round((remainingForInstallments / count) * 100) / 100;
    const baseDate = new Date(firstDueDate || new Date());

    const generated: LicenseInstallment[] = [];
    for (let i = 1; i <= count; i++) {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + (i - 1));

      // Adjust day of month
      const maxDaysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const actualDay = Math.min(dayOfMonth, maxDaysInMonth);
      d.setDate(actualDay);
      d.setHours(23, 59, 59, 999);

      // Preserve existing installment paid status if available
      const existing = installments.find((inst) => inst.installmentNo === i);

      generated.push({
        id: existing?.id || `inst-${i}-${Date.now()}`,
        installmentNo: i,
        totalInstallments: count,
        amount: perAmount,
        currency,
        dueDate: d.toISOString(),
        dayOfMonth: actualDay,
        status: existing?.status || 'unpaid',
        paidAt: existing?.paidAt,
        notes: existing?.notes || '',
      });
    }

    setInstallments(generated);
    setStatusMsg(`✓ ${count} taksitli ödeme planı oluşturuldu (Her ay ${perAmount.toLocaleString('tr-TR')} ${currencyCode}).`);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const toggleInstallmentStatus = (instId: string) => {
    setInstallments((prev) =>
      prev.map((inst) => {
        if (inst.id === instId) {
          const nextStatus = inst.status === 'paid' ? 'unpaid' : 'paid';
          return {
            ...inst,
            status: nextStatus,
            paidAt: nextStatus === 'paid' ? new Date().toISOString() : undefined,
          };
        }
        return inst;
      })
    );
  };

  const updateInstallmentAmount = (instId: string, newAmount: number) => {
    setInstallments((prev) =>
      prev.map((inst) => (inst.id === instId ? { ...inst, amount: Math.max(0, newAmount) } : inst))
    );
  };

  const updateInstallmentDate = (instId: string, newDateStr: string) => {
    setInstallments((prev) =>
      prev.map((inst) => {
        if (inst.id === instId) {
          const d = new Date(`${newDateStr}T23:59:59.999Z`);
          return {
            ...inst,
            dueDate: d.toISOString(),
            dayOfMonth: d.getDate(),
          };
        }
        return inst;
      })
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalPaymentInfo: PaymentInfo;

      if (paymentType === 'cash') {
        finalPaymentInfo = {
          totalPrice,
          currency,
          paymentType: 'cash',
          status: cashIsPaid ? 'paid' : 'unpaid',
          paidAmount: cashIsPaid ? totalPrice : 0,
          remainingAmount: cashIsPaid ? 0 : totalPrice,
          cashPaidAt: cashIsPaid ? (currentPay?.cashPaidAt || new Date().toISOString()) : undefined,
          notes,
          installments: [],
        };
      } else {
        const activeInstallments = installments.length > 0 ? installments : [];
        const installmentsPaidSum = activeInstallments
          .filter((inst) => inst.status === 'paid')
          .reduce((sum, inst) => sum + (inst.amount || 0), 0);
        
        const totalPaid = downPayment + installmentsPaidSum;
        const remainingAmount = Math.max(0, totalPrice - totalPaid);

        let overallStatus: PaymentInfo['status'] = 'unpaid';
        if (totalPaid >= totalPrice && totalPrice > 0) {
          overallStatus = 'paid';
        } else if (totalPaid > 0) {
          overallStatus = 'partial';
        } else {
          // Check if any overdue
          const now = Date.now();
          const hasOverdue = activeInstallments.some(
            (i) => i.status !== 'paid' && new Date(i.dueDate).getTime() < now
          );
          overallStatus = hasOverdue ? 'overdue' : 'unpaid';
        }

        finalPaymentInfo = {
          totalPrice,
          currency,
          paymentType: 'installment',
          status: overallStatus,
          downPayment,
          downPaymentPaidAt: downPayment > 0 ? (currentPay?.downPaymentPaidAt || new Date().toISOString()) : undefined,
          paidAmount: totalPaid,
          remainingAmount,
          installmentCount: activeInstallments.length,
          dayOfMonth,
          notes,
          installments: activeInstallments.map(i => ({ ...i, currency })),
        };
      }

      const res = await fetch(`/api/admin/licenses/${license.id}/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentInfo: finalPaymentInfo }),
      });

      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMsg(`Hata: ${err.error || 'Ödeme bilgileri kaydedilemedi'}`);
      }
    } catch (err) {
      console.error('Ödeme kaydedilemedi:', err);
      setStatusMsg('Bağlantı hatası');
    } finally {
      setIsSubmitting(false);
    }
  };

  const paidTotal =
    paymentType === 'cash'
      ? cashIsPaid
        ? totalPrice
        : 0
      : downPayment +
        installments
          .filter((i) => i.status === 'paid')
          .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const remainingTotal = Math.max(0, totalPrice - paidTotal);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#171a23] border border-[#2e364a] rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#242b3b] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Ödeme ve Taksit Takip Yönetimi</h3>
              <p className="text-xs text-slate-400">
                Müşteri: <strong className="text-white">{license.customerName}</strong> • {license.key}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {statusMsg && (
          <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
            {statusMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Top Summary Bar */}
          <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-[#10131a] border border-[#262f44]">
            <div>
              <span className="text-slate-400 text-[11px]">Toplam Lisans Tutarı:</span>
              <div className="text-base font-black text-cyan-400">
                {totalPrice.toLocaleString('tr-TR')} {currencyCode}
              </div>
            </div>
            <div>
              <span className="text-slate-400 text-[11px]">Tahsil Edilen (Ödenen):</span>
              <div className="text-base font-black text-emerald-400">
                {paidTotal.toLocaleString('tr-TR')} {currencyCode}
              </div>
            </div>
            <div>
              <span className="text-slate-400 text-[11px]">Kalan Bakiye:</span>
              <div className="text-base font-black text-amber-300">
                {remainingTotal.toLocaleString('tr-TR')} {currencyCode}
              </div>
            </div>
          </div>

          {/* Currency and Payment Type Switchers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Currency Selector */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-semibold">Para Birimi:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCurrency('TL')}
                  className={`p-2 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                    currency === 'TL'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-500/40'
                      : 'bg-[#101217] border-[#2b3244] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🇹🇷 Türk Lirası (₺ - TL)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`p-2 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                    currency === 'USD'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-500/40'
                      : 'bg-[#101217] border-[#2b3244] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🇺🇸 Dolar ($ - USD)
                </button>
              </div>
            </div>

            {/* Payment Type */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-semibold">Ödeme Şekli:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentType('cash')}
                  className={`p-2 rounded-xl border text-center font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentType === 'cash'
                      ? 'bg-cyan-500/20 border-cyan-400 text-white ring-1 ring-cyan-500/40'
                      : 'bg-[#101217] border-[#2b3244] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Peşin Ödeme</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentType('installment');
                    if (installments.length === 0) {
                      handleGenerateSchedule();
                    }
                  }}
                  className={`p-2 rounded-xl border text-center font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentType === 'installment'
                      ? 'bg-amber-500/20 border-amber-400 text-white ring-1 ring-amber-500/40'
                      : 'bg-[#101217] border-[#2b3244] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                  <span>Taksitli Plan</span>
                </button>
              </div>
            </div>
          </div>

          {/* Price & Down Payment Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Toplam Lisans Bedeli ({currencyCode}) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  step="10"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-[#101217] border border-[#2b3244] rounded-lg text-white font-bold text-sm focus:outline-none focus:border-cyan-400 pl-8"
                />
                <span className="absolute left-3 top-2.5 text-slate-500 font-bold">{currencySymbol}</span>
              </div>
            </div>

            {paymentType === 'installment' ? (
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Alınan Peşinat ({currencyCode})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={totalPrice}
                    step="10"
                    placeholder="0"
                    value={downPayment}
                    onChange={(e) => setDownPayment(Math.max(0, Math.min(totalPrice, Number(e.target.value))))}
                    className="w-full px-3 py-2 bg-[#101217] border border-[#2b3244] rounded-lg text-emerald-400 font-bold text-sm focus:outline-none focus:border-emerald-400 pl-8"
                  />
                  <span className="absolute left-3 top-2.5 text-emerald-500 font-bold">{currencySymbol}</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Taksitlendirilecek Tutar: <strong className="text-white">{remainingForInstallments.toLocaleString('tr-TR')} {currencyCode}</strong>
                </span>
              </div>
            ) : (
              <div>
                <label className="block text-slate-300 font-medium mb-1">Ödeme Notu / Banka</label>
                <input
                  type="text"
                  placeholder="Örn: Garanti Bankası Havalesi, Dekont No: 1284"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#101217] border border-[#2b3244] rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm"
                />
              </div>
            )}
          </div>

          {/* Cash Payment Details */}
          {paymentType === 'cash' ? (
            <div className="p-4 bg-[#10131a] rounded-xl border border-[#262f44] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Peşin Ödeme Durumu</h4>
                  <p className="text-[11px] text-slate-400">
                    Lisans bedeli olan {totalPrice.toLocaleString('tr-TR')} {currencyCode} tahsil edildi mi?
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCashIsPaid(!cashIsPaid)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    cashIsPaid
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {cashIsPaid ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>✓ ÖDENDİ (Tahsil Edildi)</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>✕ ÖDENMEDİ (Beklemede)</span>
                    </>
                  )}
                </button>
              </div>

              {cashIsPaid && currentPay?.cashPaidAt && (
                <p className="text-[11px] text-emerald-400">
                  Tahsilat Tarihi: {new Date(currentPay.cashPaidAt).toLocaleString('tr-TR')}
                </p>
              )}
            </div>
          ) : (
            /* Installments Configuration & Table */
            <div className="space-y-3">
              {/* Installment parameters */}
              <div className="p-3.5 bg-[#10131a] rounded-xl border border-[#262f44] space-y-3">
                <div className="font-semibold text-slate-200 text-xs">Taksit Planlama Parametreleri:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Taksit Sayısı:</label>
                    <select
                      value={installmentCount}
                      onChange={(e) => setInstallmentCount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-[#171a23] border border-[#2b3244] rounded-lg text-white font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      {[2, 3, 4, 5, 6, 8, 9, 10, 12, 18, 24].map((cnt) => (
                        <option key={cnt} value={cnt}>
                          {cnt} Taksit ({Math.round(remainingForInstallments / cnt).toLocaleString('tr-TR')} {currencyCode}/Ay)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">
                      Her Ayın Kaçıncı Günü?
                    </label>
                    <select
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-[#171a23] border border-[#2b3244] rounded-lg text-white font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          Her Ayın {d}. Günü
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">
                      İlk Taksit Vade Tarihi:
                    </label>
                    <input
                      type="date"
                      value={firstDueDate}
                      onChange={(e) => setFirstDueDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#171a23] border border-[#2b3244] rounded-lg text-white font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Kalan {remainingForInstallments.toLocaleString('tr-TR')} {currencyCode} tutar {installmentCount} aya eşit olarak dağıtılacaktır.
                  </span>

                  <button
                    type="button"
                    onClick={handleGenerateSchedule}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Çizelgeyi Yeniden Hesapla</span>
                  </button>
                </div>
              </div>

              {/* Installments Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Taksit Çizelgesi ({installments.filter((i) => i.status === 'paid').length} / {installments.length} Ödendi)</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {installments.length === 0 ? (
                    <div className="p-4 text-center rounded-xl bg-[#10131a] border border-[#242b3b] text-slate-400 text-xs">
                      Taksit planı oluşturmak için yukarıdaki "Çizelgeyi Yeniden Hesapla" düğmesine tıklayın.
                    </div>
                  ) : (
                    installments.map((inst) => {
                      const isPaid = inst.status === 'paid';
                      const dueDateObj = new Date(inst.dueDate);
                      const isOverdue = !isPaid && dueDateObj.getTime() < Date.now();

                      return (
                        <div
                          key={inst.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                            isPaid
                              ? 'bg-emerald-950/20 border-emerald-500/40'
                              : isOverdue
                              ? 'bg-rose-950/20 border-rose-500/40'
                              : 'bg-[#10131a] border-[#262f44]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#181d29] border border-[#2b3447] text-[11px] font-bold text-white flex items-center justify-center">
                              {inst.installmentNo}
                            </span>
                            <div>
                              <div className="font-bold text-white text-xs">
                                {inst.installmentNo}. Taksit
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                <span>Vade: {dueDateObj.toLocaleDateString('tr-TR')} (Her ayın {inst.dayOfMonth}'i)</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="font-mono font-black text-amber-300 text-xs">
                                {inst.amount.toLocaleString('tr-TR')} {currencyCode}
                              </span>
                              {isPaid && (
                                <div className="text-[9px] text-emerald-400 font-semibold">
                                  ✓ Ödendi
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleInstallmentStatus(inst.id)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                isPaid
                                  ? 'bg-[#202636] hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-[#2a3449]'
                                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm'
                              }`}
                            >
                              {isPaid ? 'Ödenmedi Yap' : '✓ Ödendi Yap'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-[#242b3b]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#202636] hover:bg-[#2c344a] text-slate-300 font-semibold text-xs cursor-pointer"
            >
              İptal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Kaydediliyor...' : 'Ödeme Bilgilerini Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
