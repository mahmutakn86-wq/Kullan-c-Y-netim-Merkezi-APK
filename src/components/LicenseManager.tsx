import React, { useState } from 'react';
import {
  Plus, Search, Copy, Check, Calendar, Laptop, ShieldCheck, ShieldAlert,
  Clock, RefreshCw, Trash2, Ban, PlayCircle, KeyRound, Sparkles, ExternalLink,
  ChevronDown, ChevronUp, AlertTriangle, FileText, ToggleLeft, ToggleRight, CheckCircle2,
  XCircle, Globe, Radio, Server, Edit3, UserCheck, Shield, CreditCard, DollarSign,
  Wallet, AlertCircle, Phone
} from 'lucide-react';
import { LicenseKey, LicensePlan, PaymentType, PaymentInfo, LicenseInstallment, Currency } from '../types';
import { InstallmentAlertBanner } from './InstallmentAlertBanner';
import { PaymentModal } from './PaymentModal';
import { UserDetailsModal } from './UserDetailsModal';
import { CustomerReportModal } from './CustomerReportModal';

interface LicenseManagerProps {
  licenses: LicenseKey[];
  onRefresh: () => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
}

// Robust 27-character Enterprise Key Generator (e.g. AKN-Q3PWM-ZQ3IA-20S0F-CB2CN)
export const generateRobustLicenseKey = (prefix = 'AKN'): string => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const getBlock = (len = 5) => {
    let str = '';
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(len);
      window.crypto.getRandomValues(array);
      for (let i = 0; i < len; i++) {
        str += chars[array[i] % chars.length];
      }
    } else {
      for (let i = 0; i < len; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    return str;
  };
  return `${prefix}-${getBlock(5)}-${getBlock(5)}-${getBlock(5)}-${getBlock(5)}`;
};

// Helper to compute future date strings in YYYY-MM-DD format
export const getFutureDateString = (daysToAdd: number): string => {
  const target = new Date();
  target.setDate(target.getDate() + daysToAdd);
  return target.toISOString().split('T')[0];
};

export const getDaysLeft = (expiresAtStr: string): number => {
  if (!expiresAtStr) return 0;
  
  let expDate: Date;
  if (expiresAtStr.includes('T')) {
    expDate = new Date(expiresAtStr);
  } else {
    // String like "2026-09-05" or "05.09.2026"
    const clean = expiresAtStr.trim();
    if (clean.includes('.')) {
      const parts = clean.split('.');
      if (parts.length === 3) {
        expDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10), 23, 59, 59, 999);
      } else {
        expDate = new Date(clean);
      }
    } else if (clean.includes('-')) {
      const parts = clean.split('-');
      if (parts.length === 3) {
        expDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 23, 59, 59, 999);
      } else {
        expDate = new Date(clean);
      }
    } else {
      expDate = new Date(clean);
    }
  }

  if (isNaN(expDate.getTime())) return 0;
  const now = new Date();
  const diffMs = expDate.getTime() - now.getTime();
  if (diffMs <= 0) return 0;

  // Calendar day diff between today and target date:
  const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const expDateOnly = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate()).getTime();
  
  const calendarDayDiff = Math.round((expDateOnly - nowDateOnly) / (1000 * 60 * 60 * 24));
  return Math.max(0, calendarDayDiff > 0 ? calendarDayDiff : Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

export const formatPlanLabel = (plan: string): string => {
  switch (plan) {
    case '1day':
      return '1 Günlük Test Lisansı';
    case '3days':
      return '3 Günlük Lisans';
    case '7days':
    case 'trial':
      return '7 Günlük Lisans';
    case '15days':
      return '15 Günlük Lisans';
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

export const LicenseManager: React.FC<LicenseManagerProps> = ({
  licenses,
  onRefresh,
  filterStatus,
  setFilterStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState<LicenseKey | null>(null);
  const [showEditModal, setShowEditModal] = useState<LicenseKey | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<LicenseKey | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<LicenseKey | null>(null);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState<LicenseKey | null>(null);
  const [showReportModal, setShowReportModal] = useState<LicenseKey | null>(null);
  const [showUnbindModal, setShowUnbindModal] = useState<{ license: LicenseKey; hwid?: string } | null>(null);
  const [expandedPaymentLicenseIds, setExpandedPaymentLicenseIds] = useState<string[]>([]);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLicenseIds, setSelectedLicenseIds] = useState<string[]>([]);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // New License Form State
  const [newKey, setNewKey] = useState(generateRobustLicenseKey('AKN'));
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newPlan, setNewPlan] = useState<LicensePlan>('monthly');
  const [newExpiryDate, setNewExpiryDate] = useState<string>(getFutureDateString(30));
  const [newMaxDevices, setNewMaxDevices] = useState(1);
  const [newNotes, setNewNotes] = useState('');
  const [allowedModules, setAllowedModules] = useState<string[]>([
    'surfer_pro_dual',
    'elevation_galilo',
    'mod1',
    'mod2',
    'mod12'
  ]);

  // Payment creation fields
  const [newCurrency, setNewCurrency] = useState<Currency>('TL');
  const [newPaymentType, setNewPaymentType] = useState<PaymentType>('cash');
  const [newTotalPrice, setNewTotalPrice] = useState<number>(15000);
  const [newDownPayment, setNewDownPayment] = useState<number>(0);
  const [newCashIsPaid, setNewCashIsPaid] = useState<boolean>(true);
  const [newInstallmentCount, setNewInstallmentCount] = useState<number>(3);
  const [newDayOfMonth, setNewDayOfMonth] = useState<number>(15);
  const [newFirstDueDate, setNewFirstDueDate] = useState<string>(getFutureDateString(30));

  // Edit License Form State
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerEmail, setEditCustomerEmail] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editKey, setEditKey] = useState('');
  const [editPlan, setEditPlan] = useState<LicensePlan>('monthly');
  const [editStatus, setEditStatus] = useState<string>('active');
  const [editMaxDevices, setEditMaxDevices] = useState(1);
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editAgreementAccepted, setEditAgreementAccepted] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editAllowedModules, setEditAllowedModules] = useState<string[]>([]);

  // Open Edit Modal helper
  const openEditModal = (license: LicenseKey) => {
    setShowEditModal(license);
    setEditCustomerName(license.customerName);
    setEditCustomerEmail(license.customerEmail || '');
    setEditCustomerPhone(license.customerPhone || '');
    setEditKey(license.key);
    setEditPlan(license.plan);
    setEditStatus(license.status);
    setEditMaxDevices(license.maxDevices || 1);
    setEditExpiresAt(license.expiresAt ? license.expiresAt.substring(0, 10) : getFutureDateString(30));
    setEditAgreementAccepted(Boolean(license.agreementAccepted));
    setEditNotes(license.notes || '');
    setEditAllowedModules(license.allowedModules || ['surfer_pro_dual', 'elevation_galilo', 'mod1', 'mod2', 'mod12']);
  };

  const handleUpdateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    setIsSubmitting(true);
    try {
      const finalExp = editExpiresAt
        ? new Date(`${editExpiresAt}T23:59:59.999Z`).toISOString()
        : showEditModal.expiresAt;

      const res = await fetch(`/api/admin/licenses/${showEditModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: editCustomerName.trim(),
          customerEmail: editCustomerEmail.trim(),
          customerPhone: editCustomerPhone.trim(),
          key: editKey.trim().toUpperCase(),
          plan: editPlan,
          status: editStatus,
          maxDevices: editMaxDevices,
          expiresAt: finalExp,
          agreementAccepted: editAgreementAccepted,
          notes: editNotes,
          allowedModules: editAllowedModules,
        }),
      });

      if (res.ok) {
        setShowEditModal(null);
        showToast(`✓ "${editCustomerName}" lisans bilgileri başarıyla güncellendi.`);
        onRefresh();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(`Hata: ${err.error || 'Güncellenemedi'}`);
      }
    } catch (err) {
      console.error('Lisans güncellenemedi:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Extend form state
  const [extendDays, setExtendDays] = useState(30);

  // Server URL display
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const publicCloudUrl = currentOrigin.includes('ais-dev-')
    ? currentOrigin.replace('ais-dev-', 'ais-pre-')
    : currentOrigin || 'https://ais-pre-l2fembifbbwustocfsa7x6-781806603085.europe-west2.run.app';

  const showToast = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 3500);
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    showToast(`Lisans anahtarı kopyalandı: ${key}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicCloudUrl);
    setCopiedUrl(true);
    showToast('Yayınlanan Kullanıcı Yönetim Merkezi sunucu linki kopyalandı!');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Direct toggle between Active and Passive
  const handleToggleStatus = async (license: LicenseKey) => {
    const nextStatus = license.status === 'active' ? 'revoked' : 'active';
    try {
      const res = await fetch(`/api/admin/licenses/${license.id}/set-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        showToast(
          nextStatus === 'active'
            ? `✓ "${license.customerName}" lisansı AKTİF edildi.`
            : `⚠️ "${license.customerName}" lisansı PASİF (Kilitli / Askıda) yapıldı.`
        );
        onRefresh();
      }
    } catch (err) {
      console.error('Durum değiştirilemedi:', err);
    }
  };

  // Set explicit status from menu
  const handleSetExplicitStatus = async (license: LicenseKey, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/licenses/${license.id}/set-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast(`✓ "${license.customerName}" lisans durumu güncellendi: ${newStatus.toUpperCase()}`);
        onRefresh();
      }
    } catch (err) {
      console.error('Durum ayarlanamadı:', err);
    }
  };

  // Direct quick toggle installment status from card
  const handleToggleInstallmentStatus = async (license: LicenseKey, installmentId: string, currentPaid: boolean) => {
    try {
      const nextPaid = !currentPaid;
      const res = await fetch(`/api/admin/licenses/${license.id}/installments/${installmentId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid: nextPaid }),
      });

      if (res.ok) {
        showToast(
          nextPaid
            ? `✓ "${license.customerName}" taksiti ÖDENDİ olarak işaretlendi.`
            : `⚠️ "${license.customerName}" taksiti ÖDENMEDİ olarak işaretlendi.`
        );
        onRefresh();
      }
    } catch (err) {
      console.error('Taksit durumu güncellenemedi:', err);
    }
  };

  // Toggle in-card payment schedule visibility
  const toggleCardPaymentDetails = (licenseId: string) => {
    setExpandedPaymentLicenseIds((prev) =>
      prev.includes(licenseId) ? prev.filter((id) => id !== licenseId) : [...prev, licenseId]
    );
  };

  // Bulk status change
  const handleBulkStatusChange = async (targetStatus: 'active' | 'revoked') => {
    if (selectedLicenseIds.length === 0) return;
    try {
      const res = await fetch('/api/admin/licenses/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedLicenseIds, status: targetStatus }),
      });
      if (res.ok) {
        showToast(
          targetStatus === 'active'
            ? `✓ Seçilen ${selectedLicenseIds.length} lisans AKTİF yapıldı.`
            : `⚠️ Seçilen ${selectedLicenseIds.length} lisans PASİF yapıldı.`
        );
        setSelectedLicenseIds([]);
        onRefresh();
      }
    } catch (err) {
      console.error('Toplu durum değiştirilemedi:', err);
    }
  };

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;

    setIsSubmitting(true);
    try {
      const calculatedDays = getDaysLeft(newExpiryDate);
      const finalExpiresAt = newExpiryDate
        ? (newExpiryDate.includes('T') ? newExpiryDate : `${newExpiryDate}T23:59:59.999Z`)
        : new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: newKey.trim().toUpperCase(),
          customerName: newCustomerName.trim(),
          customerEmail: newCustomerEmail.trim(),
          customerPhone: newCustomerPhone.trim(),
          plan: newPlan,
          durationDays: calculatedDays,
          expiresAt: finalExpiresAt,
          maxDevices: newMaxDevices,
          notes: newNotes,
          allowedModules,
          totalPrice: newTotalPrice,
          currency: newCurrency,
          downPayment: newDownPayment,
          paymentType: newPaymentType,
          installmentCount: newInstallmentCount,
          dueDayOfMonth: newDayOfMonth,
          dayOfMonth: newDayOfMonth,
          firstDueDate: newFirstDueDate,
          paymentStartDate: newFirstDueDate,
          isCashPaid: newCashIsPaid,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewCustomerName('');
        setNewCustomerEmail('');
        setNewCustomerPhone('');
        setNewNotes('');
        setNewPlan('monthly');
        setNewExpiryDate(getFutureDateString(30));
        setNewKey(generateRobustLicenseKey('AKN'));
        setNewCurrency('TL');
        setNewTotalPrice(15000);
        setNewDownPayment(0);
        setNewPaymentType('cash');
        setNewCashIsPaid(true);
        setNewInstallmentCount(3);
        setNewDayOfMonth(15);
        showToast('✓ Yeni müşteri lisansı ve ödeme planı başarıyla kaydedildi.');
        onRefresh();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(`Hata: ${err.error || 'Lisans kaydedilemedi'}`);
      }
    } catch (err) {
      console.error('Lisans oluşturulamadı:', err);
      showToast('Bağlantı hatası: Lisans kaydedilemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExtendLicense = async () => {
    if (!showExtendModal) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/licenses/${showExtendModal.id}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addDays: extendDays }),
      });
      if (res.ok) {
        setShowExtendModal(null);
        showToast(`✓ "${showExtendModal.customerName}" lisans süresi ${extendDays} gün uzatıldı.`);
        onRefresh();
      }
    } catch (err) {
      console.error('Süre uzatılamadı:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnbindDevice = (license: LicenseKey, hwid?: string) => {
    setShowUnbindModal({ license, hwid });
  };

  const confirmUnbindDeviceAction = async () => {
    if (!showUnbindModal) return;
    const { license, hwid } = showUnbindModal;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/licenses/${license.id}/unbind-device`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hwid: hwid || '' }),
      });
      if (res.ok) {
        showToast(`✓ "${license.customerName}" HWID donanım kilidi sıfırlandı.`);
        setShowUnbindModal(null);
        if (showEditModal && showEditModal.id === license.id) {
          setShowEditModal(null);
        }
        onRefresh();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(`Hata: ${data.error || 'HWID sıfırlanamadı'}`);
      }
    } catch (err) {
      console.error('Cihaz kilidi sıfırlanamadı:', err);
      showToast('Bağlantı hatası: Donanım kilidi sıfırlanamadı');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLicense = (license: LicenseKey) => {
    setShowDeleteModal(license);
  };

  const confirmDeleteLicenseAction = async () => {
    if (!showDeleteModal) return;
    const targetLicense = showDeleteModal;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/licenses/${targetLicense.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`✓ "${targetLicense.customerName}" lisansı kalıcı olarak silindi ve dijital onayı arşive taşındı.`);
        setShowDeleteModal(null);
        if (showEditModal && showEditModal.id === targetLicense.id) {
          setShowEditModal(null);
        }
        onRefresh();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(`Hata: ${data.error || 'Lisans silinemedi'}`);
      }
    } catch (err) {
      console.error('Lisans silinemedi:', err);
      showToast('Bağlantı hatası: Lisans silinemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtering
  const filteredLicenses = licenses.filter((lic) => {
    const matchesSearch =
      lic.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lic.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lic.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lic.boundDevices.some((d) => d.hwid.toLowerCase().includes(searchTerm.toLowerCase()));

    const days = getDaysLeft(lic.expiresAt);

    if (!matchesSearch) return false;

    if (filterStatus === 'active') return lic.status === 'active';
    if (filterStatus === 'expiring') return lic.status === 'active' && days > 0 && days <= 7;
    if (filterStatus === 'expired') return lic.status === 'expired' || days <= 0;
    if (filterStatus === 'revoked') return lic.status === 'revoked';

    // Financial filters
    if (filterStatus === 'installment') {
      return lic.paymentInfo?.paymentType === 'installment';
    }
    if (filterStatus === 'cash') {
      return lic.paymentInfo?.paymentType === 'cash' || !lic.paymentInfo;
    }
    if (filterStatus === 'due_installments') {
      const now = Date.now();
      const in7Days = now + 7 * 24 * 3600 * 1000;
      return (
        lic.paymentInfo?.installments?.some((inst) => {
          if (inst.status === 'paid') return false;
          const dueTime = new Date(inst.dueDate).getTime();
          return dueTime <= in7Days;
        }) || false
      );
    }
    if (filterStatus === 'paid_complete') {
      return lic.paymentInfo?.status === 'paid';
    }
    if (filterStatus === 'pending_debt') {
      return (lic.paymentInfo?.remainingAmount || 0) > 0;
    }

    return true;
  });

  const allFilteredSelected =
    filteredLicenses.length > 0 &&
    filteredLicenses.every((l) => selectedLicenseIds.includes(l.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedLicenseIds([]);
    } else {
      setSelectedLicenseIds(filteredLicenses.map((l) => l.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedLicenseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {statusNotification && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-semibold text-xs shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5" />
          <span>{statusNotification}</span>
        </div>
      )}

      {/* Real-Time Installment Due & Overdue Alerts Banner */}
      <InstallmentAlertBanner
        onRefresh={onRefresh}
        onFilterCustomer={(name) => setSearchTerm(name)}
      />

      {/* Top Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#171a23] p-3 rounded-2xl border border-[#232733]">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            id="input-license-search"
            type="text"
            placeholder="Müşteri adı, lisans anahtarı, HWID veya telefon ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-[#101217] border border-[#2a3040] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'active', label: '🟢 Aktif' },
            { id: 'due_installments', label: '🚨 Vadesi Gelen / Geciken' },
            { id: 'installment', label: '💳 Taksitli' },
            { id: 'cash', label: '💰 Peşin' },
            { id: 'pending_debt', label: '🟡 Kalan Borç' },
            { id: 'paid_complete', label: '✓ Tamamı Ödendi' },
            { id: 'revoked', label: '🔴 Pasif' },
            { id: 'expiring', label: '⏳ ≤ 7 Gün' },
            { id: 'expired', label: '⚪ Süresi Dolan' },
          ].map((f) => (
            <button
              key={f.id}
              id={`filter-pill-${f.id}`}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === f.id
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 bg-[#1f2433] hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Create License Button */}
        <button
          id="btn-create-license"
          onClick={() => {
            setNewKey(generateRobustLicenseKey('AKN'));
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 font-bold" />
          <span>Yeni Lisans Tanımla</span>
        </button>
      </div>

      {/* Bulk Action Bar (Visible when items selected) */}
      {selectedLicenseIds.length > 0 && (
        <div className="p-3 rounded-xl bg-[#1e2330] border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-cyan-300 font-medium">
            <span>{selectedLicenseIds.length} lisans seçildi:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkStatusChange('active')}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Seçilenleri AKTİF Yap</span>
            </button>
            <button
              onClick={() => handleBulkStatusChange('revoked')}
              className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Seçilenleri PASİF (Kilitli) Yap</span>
            </button>
            <button
              onClick={() => setSelectedLicenseIds([])}
              className="px-3 py-1.5 rounded-lg bg-[#141822] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Seçimi Temizle
            </button>
          </div>
        </div>
      )}

      {/* Select All Checkbox Header */}
      {filteredLicenses.length > 0 && (
        <div className="flex items-center justify-between px-2 text-xs text-slate-400">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleSelectAll}
              className="rounded border-[#2a3040] bg-[#101217] text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <span>Tümünü Seç ({filteredLicenses.length} Lisans)</span>
          </label>
          <span>
            Toplam: <strong>{filteredLicenses.length}</strong> lisans listeleniyor
          </span>
        </div>
      )}

      {/* License Cards Grid / List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredLicenses.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-[#171a23] border border-[#232733] text-slate-400">
            <KeyRound className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-slate-300">Hiç Lisans Bulunamadı</h3>
            <p className="text-xs text-slate-500 mt-1">Arama kriterlerinizi değiştirin veya yeni bir lisans oluşturun.</p>
          </div>
        ) : (
          filteredLicenses.map((license) => {
            const daysLeft = getDaysLeft(license.expiresAt);
            const isExpired = license.status === 'expired' || daysLeft <= 0;
            const isRevoked = license.status === 'revoked';
            const isExpiringSoon = !isExpired && !isRevoked && daysLeft <= 7;
            const isSelected = selectedLicenseIds.includes(license.id);

            const payment = license.paymentInfo;
            const currencyCode = payment?.currency === 'USD' ? 'USD' : 'TL';
            const isInstallment = payment?.paymentType === 'installment';

            return (
              <div
                key={license.id}
                id={`license-item-${license.id}`}
                className={`p-4 rounded-2xl bg-[#171a23] border transition-all ${
                  isRevoked
                    ? 'border-rose-900/50 bg-rose-950/15'
                    : isExpired
                    ? 'border-slate-800 bg-slate-900/40'
                    : isExpiringSoon
                    ? 'border-amber-500/40'
                    : 'border-[#262c3d] hover:border-amber-500/40'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left: Checkbox + Customer & Key info */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(license.id)}
                      className="mt-1.5 rounded border-[#2a3040] bg-[#101217] text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-white tracking-wide">
                          {license.customerName}
                        </h4>

                        {/* Status Badges */}
                        {isRevoked ? (
                          <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> PASİF (KİLİTLİ)
                          </span>
                        ) : isExpired ? (
                          <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-slate-700 text-slate-300 border border-slate-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Süresi Doldu
                          </span>
                        ) : isExpiringSoon ? (
                          <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {daysLeft} Gün Kaldı
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> AKTİF ({daysLeft} Gün)
                          </span>
                        )}

                        <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-[#222838] text-cyan-300 border border-cyan-500/20">
                          {formatPlanLabel(license.plan)}
                        </span>

                        {license.agreementAccepted ? (
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" title="5846 Sayılı Kanun Sözleşmesi İmzalandı">
                            ✓ 5846 EULA İmzalı
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30" title="İlk açılışta sözleşme onayı istenecek">
                            ⏳ Sözleşme Bekleniyor
                          </span>
                        )}
                      </div>

                      {/* Key box & Contact */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="px-2.5 py-1 rounded-lg bg-[#101217] border border-[#272d3d] font-mono text-xs text-cyan-400 font-bold flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                          <span>{license.key}</span>
                        </div>
                        <button
                          onClick={() => handleCopyKey(license.key)}
                          className="p-1.5 rounded-lg bg-[#202636] hover:bg-[#2c344a] text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Anahtarı Kopyala"
                        >
                          {copiedKey === license.key ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {license.customerPhone && (
                          <a
                            href={`https://wa.me/${license.customerPhone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-emerald-400 hover:underline flex items-center gap-1 bg-[#101217] px-2 py-0.5 rounded border border-[#222838]"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{license.customerPhone}</span>
                          </a>
                        )}

                        {license.customerEmail && (
                          <span className="text-xs text-slate-400 bg-[#101217] px-2 py-0.5 rounded border border-[#222838] truncate max-w-[200px]">
                            {license.customerEmail}
                          </span>
                        )}
                      </div>

                      {/* Payment Compact Summary Badge */}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        {payment ? (
                          payment.paymentType === 'cash' ? (
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                                payment.status === 'paid'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              }`}
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>
                                {payment.totalPrice.toLocaleString('tr-TR')} {currencyCode} (Peşin •{' '}
                                {payment.status === 'paid' ? 'Ödendi' : 'ÖDENMEDİ'})
                              </span>
                            </span>
                          ) : (
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                                payment.status === 'paid'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : payment.status === 'overdue'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>
                                {payment.totalPrice.toLocaleString('tr-TR')} {currencyCode} (
                                {payment.installmentCount || payment.installments?.length || 0} Taksit)
                              </span>
                              <span className="font-normal text-slate-300">
                                | Tahsil: {payment.paidAmount.toLocaleString('tr-TR')} {currencyCode} / Kalan:{' '}
                                <strong className="text-white">{payment.remainingAmount.toLocaleString('tr-TR')} {currencyCode}</strong>
                              </span>
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-slate-500 italic bg-[#101217] px-2 py-0.5 rounded border border-[#222838]">
                            Ödeme bilgisi girilmedi
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Switch + Action Buttons (Including Yellow User Details Button) */}
                  <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-end xl:items-center gap-2.5 lg:justify-end">
                    {/* Quick Active / Passive Switch & Expiration */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#101217] border border-[#283042]">
                        <span className={`text-[11px] font-bold ${license.status === 'active' ? 'text-emerald-400' : 'text-slate-400'}`}>
                          Aktif
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(license)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                            license.status === 'active' ? 'bg-emerald-500' : 'bg-rose-600'
                          }`}
                          title={license.status === 'active' ? 'Tıklayarak PASİF yapın' : 'Tıklayarak AKTİF yapın'}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              license.status === 'active' ? 'translate-x-4.5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`text-[11px] font-bold ${license.status === 'revoked' ? 'text-rose-400' : 'text-slate-400'}`}>
                          Pasif
                        </span>
                      </div>

                      <div className="text-xs text-slate-400">
                        <span>Bitiş: <strong className="text-slate-200">{new Date(license.expiresAt).toLocaleDateString('tr-TR')}</strong></span>
                      </div>
                    </div>

                    {/* Management Action Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* PROMINENT USER DETAILS BUTTON (Yellow / Golden Highlighted as requested) */}
                      <button
                        type="button"
                        onClick={() => setShowUserDetailsModal(license)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-2 border-amber-400/80 hover:border-amber-400 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/10 transition-all cursor-pointer"
                        title="Kullanıcı Profilini, Donanım Kilidini ve Finans Detaylarını Görüntüle"
                      >
                        <UserCheck className="w-4 h-4 text-amber-400" />
                        <span>KULLANICI BİLGİLERİ</span>
                      </button>

                      {/* Rapor Al Button */}
                      <button
                        type="button"
                        onClick={() => setShowReportModal(license)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Müşteriye Gönderilecek Hesap & Lisans Ekstresini Al"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Rapor Al</span>
                      </button>

                      {/* Payment & Installments Modal Button */}
                      <button
                        type="button"
                        onClick={() => setShowPaymentModal(license)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#222838] hover:bg-amber-600/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Ödeme ve Taksit Planını Yönet"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Ödeme</span>
                      </button>

                      <button
                        id={`btn-edit-${license.id}`}
                        onClick={() => openEditModal(license)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#222838] hover:bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Kullanıcıyı ve Lisansı Yeniden Düzenle"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Düzenle</span>
                      </button>

                      <button
                        id={`btn-extend-${license.id}`}
                        onClick={() => setShowExtendModal(license)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#222838] hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Lisans Süresini Uzat"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Süre Uzat</span>
                      </button>

                      <button
                        id={`btn-delete-${license.id}`}
                        onClick={() => handleDeleteLicense(license)}
                        className="p-1.5 rounded-lg bg-[#202636] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-[#2a3142] transition-colors cursor-pointer"
                        title="Lisansı Kalıcı Olarak Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-panel: Compact Device Quota & Reset summary */}
                <div className="mt-3 pt-2.5 border-t border-[#232733] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-semibold flex items-center gap-1 bg-[#101217] px-2 py-0.5 rounded border border-[#232a3a] text-[11px]">
                      <Laptop className="w-3 h-3 text-cyan-400" />
                      <span>Cihaz İzni:</span>
                      <strong className={license.boundDevices.length >= license.maxDevices ? 'text-amber-400' : 'text-emerald-400'}>
                        {license.boundDevices.length} / {license.maxDevices} PC
                      </strong>
                    </span>

                    {license.boundDevices.length === 0 ? (
                      <span className="text-slate-500 italic text-[11px]">
                        Henüz cihaz kilitlenmedi (İlk açılışta PC otomatik kilitlenecektir)
                      </span>
                    ) : (
                      <span className="text-cyan-300 font-mono text-[11px]">
                        {license.boundDevices.map(d => d.deviceName).join(', ')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {license.boundDevices.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleUnbindDevice(license)}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer"
                        title="Kayıtlı cihazların donanım kilidini sıfırlar"
                      >
                        Cihaz Kilidini Sıfırla
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Yeni Lisans Tanımla & Ödeme Planı Oluştur */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#171a23] border border-[#2e364a] rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#242b3b] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Yeni Müşteri Lisansı Tanımla</h3>
                  <p className="text-xs text-slate-400">Surfer Pro Dual & Elevation Galilo yetkilendirme ve ödeme planı</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLicense} className="space-y-4 text-xs">
              {/* Enterprise Robust License Key Generator */}
              <div className="p-3.5 bg-[#10131a] border border-cyan-500/30 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Güvenli Enterprise Lisans Anahtarı (27 Karakter)</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/60 font-bold">
                    36²⁰ Kriptografik Güvenlik
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      required
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value.toUpperCase())}
                      placeholder="AKN-Q3PWM-ZQ3IA-20S0F-CB2CN"
                      className="w-full px-3 py-2 bg-[#0a0c10] border border-[#2b354a] rounded-lg text-cyan-300 font-mono font-bold text-sm tracking-wider focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const freshKey = generateRobustLicenseKey('AKN');
                      setNewKey(freshKey);
                      showToast(`Yeni sağlam anahtar üretildi: ${freshKey}`);
                    }}
                    className="px-3 py-2 bg-[#1c2333] hover:bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
                    title="Yeni Rastgele Güvenli Anahtar Üret"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Yeniden Üret</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyKey(newKey)}
                    className="p-2 bg-[#1c2333] hover:bg-[#283248] text-slate-300 hover:text-white border border-[#2b354a] rounded-lg transition-colors shrink-0 cursor-pointer"
                    title="Anahtarı Kopyala"
                  >
                    {copiedKey === newKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Müşteri / Kurum Adı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Ahmet Yılmaz veya GeoTech A.Ş."
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#101217] border border-[#2b3244] rounded-lg text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">E-Posta Adresi</label>
                  <input
                    type="email"
                    placeholder="ahmet@example.com"
                    value={newCustomerEmail}
                    onChange={(e) => setNewCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#101217] border border-[#2b3244] rounded-lg text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Telefon / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+90 5XX XXX XX XX"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#101217] border border-[#2b3244] rounded-lg text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
              </div>

              {/* PAYMENT INFORMATION SECTION (Peşin mi Taksit mi, Kaç TL, Kaç Taksit, Her ayın kaçı) */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#12151d] to-[#101217] border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white text-xs">
                      Lisans Satış Ücreti & Ödeme Planı Tanımlama
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    Ödeme & Taksit Takibi
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Currency Selection */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Para Birimi</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setNewCurrency('TL')}
                        className={`py-2 px-2 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                          newCurrency === 'TL'
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-500/40'
                            : 'bg-[#171a23] border-[#2b3244] text-slate-400'
                        }`}
                      >
                        TL (₺)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewCurrency('USD')}
                        className={`py-2 px-2 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                          newCurrency === 'USD'
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-500/40'
                            : 'bg-[#171a23] border-[#2b3244] text-slate-400'
                        }`}
                      >
                        USD ($)
                      </button>
                    </div>
                  </div>

                  {/* Total Price */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Toplam Satış Tutarı ({newCurrency}) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step={newCurrency === 'USD' ? '10' : '100'}
                        required
                        value={newTotalPrice}
                        onChange={(e) => setNewTotalPrice(Math.max(0, Number(e.target.value)))}
                        className="w-full pl-8 pr-3 py-2 bg-[#171a23] border border-[#2b354a] rounded-lg text-amber-300 font-black text-sm focus:outline-none focus:border-amber-400"
                      />
                      <span className="absolute left-3 top-2.5 text-slate-500 font-bold">
                        {newCurrency === 'USD' ? '$' : '₺'}
                      </span>
                    </div>
                  </div>

                  {/* Payment Type */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Ödeme Şekli</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setNewPaymentType('cash')}
                        className={`py-2 px-2 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                          newPaymentType === 'cash'
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-500/40'
                            : 'bg-[#171a23] border-[#2b3244] text-slate-400'
                        }`}
                      >
                        Peşin
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPaymentType('installment')}
                        className={`py-2 px-2 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                          newPaymentType === 'installment'
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-500/40'
                            : 'bg-[#171a23] border-[#2b3244] text-slate-400'
                        }`}
                      >
                        Taksitli
                      </button>
                    </div>
                  </div>
                </div>

                {/* Conditional Cash vs Installment Config */}
                {newPaymentType === 'cash' ? (
                  <div className="p-3 bg-[#171a23] rounded-lg border border-[#2b354a] flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">Peşin Ödeme Tahsil Edildi mi?</div>
                      <div className="text-[10px] text-slate-400">
                        {newTotalPrice.toLocaleString('tr-TR')} {newCurrency} nakit / banka havalesi ile ödendi mi?
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setNewCashIsPaid(!newCashIsPaid)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
                        newCashIsPaid
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {newCashIsPaid ? '✓ ÖDENDİ (Tahsil Edildi)' : '✕ ÖDENMEDİ (Beklemede)'}
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-[#171a23] rounded-lg border border-[#2b354a] space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      {/* Down Payment */}
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Alınan Peşinat ({newCurrency}):</label>
                        <input
                          type="number"
                          min="0"
                          max={newTotalPrice}
                          value={newDownPayment}
                          onChange={(e) => setNewDownPayment(Math.max(0, Math.min(newTotalPrice, Number(e.target.value))))}
                          placeholder="0"
                          className="w-full px-2.5 py-1.5 bg-[#101217] border border-[#2b3244] rounded-lg text-emerald-300 font-bold text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Taksit Sayısı:</label>
                        <select
                          value={newInstallmentCount}
                          onChange={(e) => setNewInstallmentCount(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-[#101217] border border-[#2b3244] rounded-lg text-white font-bold text-xs"
                        >
                          {[2, 3, 4, 5, 6, 8, 9, 10, 12, 18, 24].map((c) => {
                            const rem = Math.max(0, newTotalPrice - newDownPayment);
                            const perInst = Math.round(rem / c);
                            return (
                              <option key={c} value={c}>
                                {c} Taksit ({perInst.toLocaleString('tr-TR')} {newCurrency}/Ay)
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">
                          Her Ayın Kaçıncı Günü?
                        </label>
                        <select
                          value={newDayOfMonth}
                          onChange={(e) => setNewDayOfMonth(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-[#101217] border border-[#2b3244] rounded-lg text-white font-bold text-xs"
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
                          value={newFirstDueDate}
                          onChange={(e) => setNewFirstDueDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#101217] border border-[#2b3244] rounded-lg text-white font-semibold text-xs"
                        />
                      </div>
                    </div>

                    <div className="p-2 bg-[#101217] rounded-md border border-[#232a3a] text-[11px] text-amber-200/90 flex items-center justify-between">
                      <div>
                        💡 <strong>Özet:</strong> Toplam {newTotalPrice.toLocaleString('tr-TR')} {newCurrency}
                        {newDownPayment > 0 && ` (Peşinat: ${newDownPayment.toLocaleString('tr-TR')} ${newCurrency})`}
                        {` → Kalan ${Math.max(0, newTotalPrice - newDownPayment).toLocaleString('tr-TR')} ${newCurrency}, `}
                        <strong>{newInstallmentCount} taksitle</strong> (her ayın {newDayOfMonth}. günü) tahsil edilecek.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Plan Selection & Expiration Date Calculation */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-medium text-xs">
                    Lisans Süresi & Plan Seçimi:
                  </label>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Bitiş: {newExpiryDate ? new Date(newExpiryDate).toLocaleDateString('tr-TR') : '-'} ({getDaysLeft(newExpiryDate)} Gün)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: '1day', label: '1 Günlük Test', days: 1, desc: 'Tam 24 Saat / 1 Gün' },
                    { id: '3days', label: '3 Günlük Lisans', days: 3, desc: '3 Gün Süre' },
                    { id: '7days', label: '7 Günlük Lisans', days: 7, desc: '1 Hafta (7 Gün)' },
                    { id: '15days', label: '15 Günlük Lisans', days: 15, desc: '15 Gün Süre' },
                    { id: 'monthly', label: '1 Aylık (30 Gün)', days: 30, desc: '1 Ay Standart' },
                    { id: 'quarterly', label: '3 Aylık (90 Gün)', days: 90, desc: '3 Ay Çeyrek' },
                    { id: 'semi_annual', label: '6 Aylık (180 Gün)', days: 180, desc: '6 Ay Paket' },
                    { id: 'annual', label: '1 Yıllık (365 Gün)', days: 365, desc: 'Tam 1 Yıl' },
                    { id: 'lifetime', label: 'Süresiz (Ömür Boyu)', days: 3650, desc: '10 Yıl / Süresiz' },
                    { id: 'custom', label: 'Özel Bitiş Tarihi', days: 0, desc: 'Manuel Tarih / Gün' },
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => {
                        setNewPlan(p.id as LicensePlan);
                        if (p.days > 0) {
                          setNewExpiryDate(getFutureDateString(p.days));
                        }
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        newPlan === p.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-sm ring-1 ring-emerald-500/40'
                          : 'bg-[#101217] border-[#2b3244] text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="font-semibold text-xs">{p.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {p.days > 0 ? `+${p.days} gün ekler` : 'Takvimden seçin'}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Date Input with Calculation */}
                <div className="p-3 bg-[#10131a] rounded-xl border border-[#2b3244] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <span>Hesaplanan Lisans Bitiş Tarihi:</span>
                    </label>
                    <span className="px-2.5 py-0.5 rounded text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <span>⏳</span>
                      <span>Net Kalan Süre: {getDaysLeft(newExpiryDate)} Gün</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-medium">Bitiş Tarihi Seçimi (Takvim):</label>
                      <input
                        type="date"
                        required
                        value={newExpiryDate}
                        min={getFutureDateString(1)}
                        onChange={(e) => {
                          setNewExpiryDate(e.target.value);
                          setNewPlan('custom');
                        }}
                        className="w-full px-3 py-2 bg-[#171a23] border border-[#374158] rounded-lg text-white font-semibold focus:outline-none focus:border-emerald-500 text-sm cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-medium">Hızlı Gün Sayısı Belirleme (Örn: 1 gün):</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          max="3650"
                          value={getDaysLeft(newExpiryDate) || 1}
                          onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value) || 1);
                            setNewExpiryDate(getFutureDateString(val));
                            setNewPlan(val === 1 ? '1day' : val === 3 ? '3days' : val === 7 ? '7days' : val === 15 ? '15days' : val === 30 ? 'monthly' : 'custom');
                          }}
                          className="w-full px-3 py-2 bg-[#171a23] border border-[#374158] rounded-lg text-white font-bold focus:outline-none focus:border-emerald-500 text-sm"
                        />
                        <span className="text-xs text-slate-400 font-bold px-1.5 shrink-0">Gün</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-[11px] text-emerald-400/90 font-medium">
                    💡 <strong>Önemli:</strong> 1 günlük lisans verildiğinde kullanıcının süresi tam 1 gün (24 saat) sonra sona erer ve program otomatik olarak kapanır.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-slate-300 font-medium">İzin Verilen Bilgisayar Sayısı (PC Limiti)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 2, 3, 4, 5, 10].map((count) => (
                      <button
                        type="button"
                        key={count}
                        onClick={() => setNewMaxDevices(count)}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                          newMaxDevices === count
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'bg-[#101217] text-slate-300 border border-[#2b3244] hover:border-slate-500'
                        }`}
                      >
                        {count} PC
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newMaxDevices}
                    onChange={(e) => setNewMaxDevices(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 bg-[#101217] border border-[#2b3244] rounded-lg text-white focus:outline-none focus:border-emerald-500 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Yönetici Notu</label>
                  <input
                    type="text"
                    placeholder="Örn: 3 Taksitli anlaşma yapıldı"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-[#101217] border border-[#2b3244] rounded-lg text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
              </div>

              {/* Module permissions */}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Yetkili Modüller</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'surfer_pro_dual', label: 'SURFER PRO DUAL' },
                    { id: 'elevation_galilo', label: 'ELEVATION GALILO' },
                    { id: 'mod1', label: 'MOD 1 (3 Format)' },
                    { id: 'mod2', label: 'MOD 2 (3 Format)' },
                    { id: 'mod12', label: 'MOD 1+2 Çift Mod' },
                    { id: '3d_layer', label: '3D Katman' },
                    { id: 'contour_layer', label: 'Kontur Katman' },
                  ].map((mod) => {
                    const isChecked = allowedModules.includes(mod.id);
                    return (
                      <button
                        type="button"
                        key={mod.id}
                        onClick={() => {
                          if (isChecked) {
                            setAllowedModules(allowedModules.filter((m) => m !== mod.id));
                          } else {
                            setAllowedModules([...allowedModules, mod.id]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                          isChecked
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-[#101217] text-slate-500 border-[#282f40]'
                        }`}
                      >
                        {isChecked ? '✓ ' : '+ '}
                        {mod.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-[#242b3b] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-[#202636] hover:bg-[#2b3347] text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Oluşturuluyor...' : 'Lisansı Üret ve Kaydet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Süre Uzat */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#171a23] border border-[#2e364a] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#242b3b] pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Lisans Süresini Uzat</h3>
              </div>
              <button
                onClick={() => setShowExtendModal(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-3">
              <p className="text-slate-300">
                <strong>{showExtendModal.customerName}</strong> kullanıcısının mevcut lisans süresi:
              </p>
              <div className="p-3 bg-[#101217] rounded-lg border border-[#282f40] text-slate-300">
                <div>Mevcut Bitiş: <strong className="text-emerald-400">{new Date(showExtendModal.expiresAt).toLocaleDateString('tr-TR')}</strong></div>
                <div>Lisans: <span className="font-mono text-cyan-400">{showExtendModal.key}</span></div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Hızlı Süre Ekle:</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[1, 3, 7, 15, 30, 90, 180, 365].map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => setExtendDays(d)}
                      className={`py-1.5 rounded-lg border text-center font-bold cursor-pointer text-xs ${
                        extendDays === d
                          ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-sm'
                          : 'bg-[#101217] text-slate-300 border-[#2b3244] hover:border-slate-500'
                      }`}
                    >
                      +{d} Gün
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    value={extendDays}
                    onChange={(e) => setExtendDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#101217] border border-[#2b3244] rounded-lg text-white font-bold focus:outline-none focus:border-emerald-500 text-sm"
                  />
                  <span className="text-xs text-slate-400 font-bold shrink-0">Gün Ekle</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#242b3b] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowExtendModal(null)}
                className="px-4 py-2 bg-[#202636] text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleExtendLicense}
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                {isSubmitting ? 'Kaydediliyor...' : 'Süreyi Uzat'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Kullanıcıyı & Lisansı Yeniden Düzenle */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#171a23] border border-[#2e364a] rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#242b3b] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Lisans ve Kullanıcıyı Düzenle</h3>
                  <p className="text-xs text-slate-400">
                    Müşteri: <strong className="text-slate-200">{showEditModal.customerName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateLicense} className="space-y-4 text-xs">
              {/* Enterprise Robust License Key Generator */}
              <div className="p-3.5 bg-[#10131a] border border-cyan-500/30 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-xs">
                    <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Lisans Anahtarı (27 Karakter)</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/60 font-bold">
                    36²⁰ Kriptografik Güvenlik
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={editKey}
                    onChange={(e) => setEditKey(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-[#0a0c10] border border-[#2b354a] rounded-lg text-cyan-300 font-mono font-bold text-sm tracking-wider focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const freshKey = generateRobustLicenseKey('AKN');
                      setEditKey(freshKey);
                      showToast(`Yeni anahtar üretildi: ${freshKey}`);
                    }}
                    className="px-3 py-2 bg-[#1c2333] hover:bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                    title="Yeni Rastgele Anahtar Üret"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Yenile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyKey(editKey)}
                    className="p-2 bg-[#1c2333] hover:bg-[#283248] text-slate-300 hover:text-white border border-[#2b354a] rounded-lg shrink-0 cursor-pointer"
                    title="Kopyala"
                  >
                    {copiedKey === editKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Customer information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Müşteri / Kurum Adı *</label>
                  <input
                    type="text"
                    required
                    value={editCustomerName}
                    onChange={(e) => setEditCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#101217] border border-[#2b3244] rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">E-posta</label>
                  <input
                    type="email"
                    value={editCustomerEmail}
                    onChange={(e) => setEditCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#101217] border border-[#2b3244] rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Telefon / WhatsApp</label>
                  <input
                    type="tel"
                    value={editCustomerPhone}
                    onChange={(e) => setEditCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#101217] border border-[#2b3244] rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm"
                  />
                </div>
              </div>

              {/* Plan & Status & Max Devices & Expiration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Lisans Durumu</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-[#101217] border border-[#2b3244] rounded-lg text-white font-medium focus:outline-none focus:border-cyan-400 text-sm cursor-pointer"
                  >
                    <option value="active">🟢 Aktif (Kullanıma Açık)</option>
                    <option value="revoked">🔴 Pasif (Kilitli / Askıda)</option>
                    <option value="pending_agreement">🟡 Sözleşme Bekleniyor</option>
                    <option value="expired">⚪ Süresi Doldu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Paket Tipi</label>
                  <select
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value as LicensePlan)}
                    className="w-full px-3 py-2 bg-[#101217] border border-[#2b3244] rounded-lg text-white font-medium focus:outline-none focus:border-cyan-400 text-sm cursor-pointer"
                  >
                    <option value="1day">1 Günlük Test Lisansı</option>
                    <option value="3days">3 Günlük Lisans</option>
                    <option value="7days">7 Günlük Lisans (7 Gün)</option>
                    <option value="15days">15 Günlük Lisans</option>
                    <option value="monthly">1 Aylık (30 Gün)</option>
                    <option value="quarterly">3 Aylık (90 Gün)</option>
                    <option value="semi_annual">6 Aylık (180 Gün)</option>
                    <option value="annual">1 Yıllık (365 Gün)</option>
                    <option value="lifetime">Süresiz (Ömür Boyu)</option>
                    <option value="custom">Özel Bitiş Tarihi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Bitiş Tarihi</label>
                  <input
                    type="date"
                    required
                    value={editExpiresAt}
                    onChange={(e) => setEditExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 bg-[#101217] border border-[#2b3244] rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-slate-300 font-medium">
                    İzin Verilen Bilgisayar Sayısı (PC Limiti)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 2, 3, 4, 5, 10].map((count) => (
                      <button
                        type="button"
                        key={count}
                        onClick={() => setEditMaxDevices(count)}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                          editMaxDevices === count
                            ? 'bg-cyan-500 text-slate-950 shadow-sm'
                            : 'bg-[#101217] text-slate-300 border border-[#2b3244] hover:border-slate-500'
                        }`}
                      >
                        {count} PC
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={editMaxDevices}
                    onChange={(e) => setEditMaxDevices(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 bg-[#101217] border border-[#2b3244] rounded-lg text-white font-semibold focus:outline-none focus:border-cyan-400 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Yönetici Notu</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Örn: 4 PC için yetki tanımlandı"
                    className="w-full px-3 py-2 bg-[#101217] border border-[#2b3244] rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm"
                  />
                </div>
              </div>

              {/* 5846 EULA Agreement status toggle */}
              <div className="p-3 bg-[#101217] border border-[#282f40] rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200 text-xs">5846 Sayılı FSEK Telif Sözleşmesi İmzalandı mı?</div>
                  <div className="text-[11px] text-slate-400">İşaretlenirse istemci açılışta sözleşme onayını atlar.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditAgreementAccepted(!editAgreementAccepted)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    editAgreementAccepted
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {editAgreementAccepted ? '✓ İmzalandı (Onaylı)' : '⚠️ İmza Bekleniyor'}
                </button>
              </div>

              {/* Module permissions */}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Yetkili Modüller</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'surfer_pro_dual', label: 'SURFER PRO DUAL' },
                    { id: 'elevation_galilo', label: 'ELEVATION GALILO' },
                    { id: 'mod1', label: 'MOD 1 (3 Format)' },
                    { id: 'mod2', label: 'MOD 2 (3 Format)' },
                    { id: 'mod12', label: 'MOD 1+2 Çift Mod' },
                    { id: '3d_layer', label: '3D Katman' },
                    { id: 'contour_layer', label: 'Kontur Katman' },
                  ].map((mod) => {
                    const isChecked = editAllowedModules.includes(mod.id);
                    return (
                      <button
                        type="button"
                        key={mod.id}
                        onClick={() => {
                          if (isChecked) {
                            setEditAllowedModules(editAllowedModules.filter((m) => m !== mod.id));
                          } else {
                            setEditAllowedModules([...editAllowedModules, mod.id]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                          isChecked
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-[#101217] text-slate-500 border-[#282f40]'
                        }`}
                      >
                        {isChecked ? '✓ ' : '+ '}
                        {mod.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-[#242b3b] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 bg-[#202636] hover:bg-[#2b3347] text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Dedicated Payment & Installment Management */}
      {showPaymentModal && (
        <PaymentModal
          license={showPaymentModal}
          onClose={() => setShowPaymentModal(null)}
          onSaved={() => {
            showToast(`✓ "${showPaymentModal.customerName}" ödeme planı başarıyla güncellendi.`);
            onRefresh();
          }}
        />
      )}

      {/* Modal: Comprehensive User Profile Details Modal */}
      {showUserDetailsModal && (
        <UserDetailsModal
          license={showUserDetailsModal}
          onClose={() => setShowUserDetailsModal(null)}
          onOpenReport={(lic) => {
            setShowUserDetailsModal(null);
            setShowReportModal(lic);
          }}
          onOpenEdit={(lic) => {
            setShowUserDetailsModal(null);
            openEditModal(lic);
          }}
          onOpenExtend={(lic) => {
            setShowUserDetailsModal(null);
            setShowExtendModal(lic);
          }}
          onOpenPayment={(lic) => {
            setShowUserDetailsModal(null);
            setShowPaymentModal(lic);
          }}
          onUnbindDevice={(lic, hwid) => {
            setShowUserDetailsModal(null);
            handleUnbindDevice(lic, hwid);
          }}
          onToggleStatus={(lic) => {
            handleToggleStatus(lic);
          }}
          onRefresh={onRefresh}
        />
      )}

      {/* Modal: Customer Report & Statement Export Modal */}
      {showReportModal && (
        <CustomerReportModal
          license={showReportModal}
          onClose={() => setShowReportModal(null)}
        />
      )}

      {/* Modal: Lisansı Kalıcı Olarak Silme Onay Penceresi */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#161922] border border-rose-600/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-[#282f42] pb-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Lisansı Kalıcı Olarak Sil</h3>
                <p className="text-xs text-rose-300 font-medium">Bu işlem geri alınamaz!</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0f1117] border border-[#232a3b] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Müşteri / Kullanıcı:</span>
                <span className="font-bold text-white">{showDeleteModal.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lisans Anahtarı:</span>
                <span className="font-mono font-bold text-cyan-400">{showDeleteModal.key}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Plan / Bitiş:</span>
                <span className="text-slate-200">
                  {showDeleteModal.plan.toUpperCase()} ({new Date(showDeleteModal.expiresAt).toLocaleDateString('tr-TR')})
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-[11px] text-indigo-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-indigo-300">
                <span>📁 5846 Sayılı Dijital Onay Koruması</span>
              </div>
              <p className="text-indigo-200/80 leading-relaxed">
                Lisans sistemden silindiğinde, bu kişiye ait varsa <strong>Kayıtlı Dijital Onaylar</strong> silinmez, yasal denetim için <strong>Dijital Onay Arşivi</strong>ne güvenle taşınır.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(null)}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-[#202636] hover:bg-[#2b3347] text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={confirmDeleteLicenseAction}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Siliniyor...' : 'TAMAM, Kalıcı Olarak Sil'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: HWID Cihaz Kilidini Sıfırlama Onay Penceresi */}
      {showUnbindModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#161922] border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-[#282f42] pb-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Laptop className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Donanım (HWID) Kilidini Sıfırla</h3>
                <p className="text-xs text-amber-300">Cihaz Bağlantı Sıfırlama</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>"{showUnbindModal.license.customerName}"</strong> kullanıcısının{' '}
              {showUnbindModal.hwid ? (
                <>
                  <span className="font-mono text-cyan-300">"{showUnbindModal.hwid.substring(0, 16)}..."</span> donanım kilidi silinecektir.
                </>
              ) : (
                <>tüm kayıtlı donanım (HWID) kilitleri sıfırlanacaktır. Kullanıcı yeni bir bilgisayara giriş yapabilir.</>
              )}
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowUnbindModal(null)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#202636] hover:bg-[#2b3347] text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={confirmUnbindDeviceAction}
                disabled={isSubmitting}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Sıfırlanıyor...' : 'TAMAM, Kilidi Sıfırla'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
