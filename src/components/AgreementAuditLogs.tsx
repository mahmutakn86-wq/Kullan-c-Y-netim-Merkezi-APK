import React, { useState, useEffect } from 'react';
import {
  FileText,
  ShieldCheck,
  Scale,
  Hash,
  Calendar,
  MapPin,
  Printer,
  Archive,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FolderArchive,
  UserCheck,
  Globe,
  Mail,
  Clock,
  Copy,
  Check,
  Eye,
  X
} from 'lucide-react';
import { AgreementLog, ArchivedAgreementLog } from '../types';

interface AgreementAuditLogsProps {
  logs: AgreementLog[];
  onRefresh: () => void;
}

// Global Exported Official Legal Receipt Printer
export const printAuditReceipt = (log: AgreementLog | ArchivedAgreementLog, isArchived = false) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const emailVal = log.customerEmail && log.customerEmail !== '-' && log.customerEmail.trim() !== ''
    ? log.customerEmail
    : 'Belirtilmedi';

  const ipVal = log.ipAddress && log.ipAddress !== '-' && log.ipAddress !== 'DirectCloud' && log.ipAddress !== '127.0.0.1' && log.ipAddress.trim() !== ''
    ? log.ipAddress
    : '-';

  let dateVal = log.acceptedAt;
  let formattedDate = '01.01.2026 00:00:00';
  try {
    const d = new Date(dateVal || Date.now());
    formattedDate = isNaN(d.getTime()) ? (dateVal || '-') : d.toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    formattedDate = dateVal || '-';
  }

  const hashVal = log.legalHash && log.legalHash !== '-' && log.legalHash.trim() !== ''
    ? log.legalHash
    : `SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069`;

  const archivedInfo = isArchived && 'archivedAt' in log ? `
    <div style="background:#fff3cd; border:1px solid #ffeeba; padding:10px 14px; border-radius:6px; margin-top:12px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
        <span style="color:#856404; font-weight:bold;">Arşiv Durumu:</span> 
        <span style="color:#856404; font-weight:bold;">SİLİNEN LİSANS DİJİTAL ARŞİVİ (${new Date(log.archivedAt).toLocaleString('tr-TR')})</span>
      </div>
      <div style="font-size:12px; color:#664d03;"><span style="font-weight:bold;">Arşiv Nedeni:</span> ${log.archiveReason || 'Lisans silindiği için dijital onay arşive kaldırıldı'}</div>
    </div>
  ` : '';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>5846 Sayılı FSEK Kapsamında Resmi Lisans Denetim Tutanağı</title>
        <style>
          @page { size: A4; margin: 15mm; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 24px;
            line-height: 1.5;
            font-size: 13px;
          }
          .header {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 14px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .title-area { max-width: 80%; }
          .badge {
            display: inline-block;
            padding: 4px 10px;
            background: #0f172a;
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.5px;
            border-radius: 4px;
            margin-bottom: 8px;
            text-transform: uppercase;
          }
          .title-main {
            font-size: 17px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: -0.2px;
          }
          .title-sub {
            font-size: 13.5px;
            font-weight: 700;
            color: #334155;
            margin-top: 3px;
          }
          .law-ref {
            font-size: 11.5px;
            color: #64748b;
            margin-top: 5px;
            font-weight: 500;
          }
          .seal-box {
            text-align: center;
            border: 2px dashed #0284c7;
            padding: 8px 12px;
            border-radius: 6px;
            background: #f0f9ff;
            color: #0369a1;
            font-size: 11px;
            font-weight: 800;
          }
          .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
          }
          .meta-table tr {
            border-bottom: 1px solid #e2e8f0;
          }
          .meta-table tr:last-child {
            border-bottom: none;
          }
          .meta-table td {
            padding: 9px 14px;
            font-size: 12.5px;
          }
          .meta-table td.label-cell {
            font-weight: 700;
            color: #334155;
            width: 250px;
            background: #f1f5f9;
            border-right: 1px solid #e2e8f0;
          }
          .meta-table td.val-cell {
            color: #0f172a;
            font-weight: 500;
          }
          .code-font {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 12px;
            color: #0369a1;
            font-weight: 700;
          }
          .legal-statement {
            background: #fdfdfd;
            border: 1px solid #cbd5e1;
            padding: 14px;
            border-radius: 6px;
            margin: 16px 0;
            font-size: 12px;
            line-height: 1.6;
            color: #1e293b;
          }
          .legal-statement p {
            margin: 0 0 8px 0;
          }
          .legal-statement p:last-child {
            margin-bottom: 0;
          }
          .hash-container {
            background: #0f172a;
            color: #38bdf8;
            padding: 12px 14px;
            border-radius: 6px;
            margin: 16px 0;
          }
          .hash-label {
            font-size: 11px;
            font-weight: 800;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          .hash-value {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 11.5px;
            word-break: break-all;
            line-height: 1.4;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 32px;
            padding-top: 16px;
            border-top: 1px solid #cbd5e1;
          }
          .sig-block {
            width: 45%;
            text-align: center;
          }
          .sig-line {
            height: 48px;
            border-bottom: 1px solid #94a3b8;
            margin-bottom: 6px;
          }
          .sig-title {
            font-size: 11.5px;
            font-weight: 700;
            color: #334155;
          }
          .footer-note {
            margin-top: 24px;
            font-size: 10.5px;
            color: #64748b;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title-area">
            <span class="badge">${isArchived ? 'ARŞİV DENETİM TUTANAĞI' : 'AKTİF LİSANS DENETİM TUTANAĞI'}</span>
            <div class="title-main">⚖️ T.C. 5846 SAYILI FİKİR VE SANAT ESERLERİ KANUNU (FSEK)</div>
            <div class="title-sub">AKINCI OTOMATİK SURFER PRO & ELEVATION GALILO YAZILIM LİSANS TESCİL KAYDI</div>
            <div class="law-ref">Eser Sahibi: Mahmut Akın | Hukuki Dayanak: 5846 Sayılı Kanun Md. 71-72, TCK Md. 243-244</div>
          </div>
          <div class="seal-box">
            <div>DİJİTAL TESCİL</div>
            <div style="font-size: 14px; margin-top: 2px;">✓ ONAYLI</div>
            <div style="font-size: 9px; font-weight: normal; margin-top: 3px;">KOD: FSEK-2026</div>
          </div>
        </div>

        <table class="meta-table">
          <tbody>
            <tr>
              <td class="label-cell">Kullanıcı / İmzalayan:</td>
              <td class="val-cell"><strong>${log.customerName}</strong></td>
            </tr>
            <tr>
              <td class="label-cell">E-Posta:</td>
              <td class="val-cell"><span class="code-font" style="color:#0f172a;">${emailVal}</span></td>
            </tr>
            <tr>
              <td class="label-cell">Lisans Anahtarı:</td>
              <td class="val-cell"><span class="code-font">${log.licenseKey}</span></td>
            </tr>
            <tr>
              <td class="label-cell">Cihaz Donanım Kimliği (HWID):</td>
              <td class="val-cell"><span class="code-font" style="color:#475569;">${log.hwid}</span></td>
            </tr>
            <tr>
              <td class="label-cell">İlk Onay Zaman Damgası:</td>
              <td class="val-cell"><strong>${formattedDate}</strong></td>
            </tr>
            <tr>
              <td class="label-cell">Onay IP Adresi:</td>
              <td class="val-cell"><span class="code-font" style="color:#059669;">${ipVal}</span></td>
            </tr>
            <tr>
              <td class="label-cell">Sözleşme Versiyonu & Dayanak:</td>
              <td class="val-cell">${log.agreementVersion || 'v2026.1'} (${log.lawReference || '5846 Sayılı FSEK & TCK 243-244'})</td>
            </tr>
          </tbody>
        </table>

        ${archivedInfo}

        <div class="legal-statement">
          <p><strong>HUKUKİ GEÇERLİLİK VE BEYAN:</strong></p>
          <p>
            İşbu tutanak; yukarıda kimlik, e-posta, zaman damgası, onay IP adresi ve donanım bilgileri belirtilen kullanıcının, "AKINCI OTOMATİK SURFER" ve "ELEVATION GALILO" yazılımlarının tüm telif ve fikri haklarının Mahmut Akın'a ait olduğunu bildiğini; kaynak kodlarının tersine mühendislik (reverse engineering), decompile, crack, kopyalama veya yetkisiz paylaşımına konu edilemeyeceğini, belirlenen lisans ve süre sınırlarına riayet edeceğini 5846 Sayılı Kanun çerçevesinde dijital ortamda kabul, beyan ve taahhüt ettiğini tevsik eder.
          </p>
        </div>

        <div class="hash-container">
          <div class="hash-label">Kriptografik Dijital İmza Özeti (SHA-256)</div>
          <div class="hash-value">${hashVal}</div>
        </div>

        <div class="signatures">
          <div class="sig-block">
            <div class="sig-line"></div>
            <div class="sig-title">YAZILIM ESER SAHİBİ</div>
            <div style="font-size: 11px; color: #64748b;">Mahmut Akın</div>
          </div>
          <div class="sig-block">
            <div class="sig-line"></div>
            <div class="sig-title">LİSANSLI KULLANICI / KURUM</div>
            <div style="font-size: 11px; color: #64748b;">${log.customerName} (${emailVal})</div>
          </div>
        </div>

        <div class="footer-note">
          AKINCI Cloud Güvenlik ve Lisans Yönetim Sistemi tarafından üretilmiştir. Bu belge 5070 Sayılı Elektronik İmza Kanunu ve 5846 Sayılı FSEK uyarınca resmi delil niteliği taşır.
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 350);
};

export const AgreementAuditLogs: React.FC<AgreementAuditLogsProps> = ({ logs, onRefresh }) => {
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [archivedLogs, setArchivedLogs] = useState<ArchivedAgreementLog[]>([]);
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFullAgreement, setShowFullAgreement] = useState(false);
  const [previewLog, setPreviewLog] = useState<{ log: AgreementLog | ArchivedAgreementLog; isArchived: boolean } | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Deletion modals
  const [deleteArchiveTarget, setDeleteArchiveTarget] = useState<ArchivedAgreementLog | null>(null);
  const [deleteActiveTarget, setDeleteActiveTarget] = useState<AgreementLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchArchivedLogs = async () => {
    setIsLoadingArchive(true);
    try {
      const res = await fetch('/api/admin/archived-agreements');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setArchivedLogs(data);
        }
      }
    } catch (err) {
      console.error('Arşivlenmiş onaylar alınamadı:', err);
    } finally {
      setIsLoadingArchive(false);
    }
  };

  useEffect(() => {
    fetchArchivedLogs();
  }, [logs]);

  // Handle Permanent Delete of an Archived Agreement
  const confirmDeleteArchive = async () => {
    if (!deleteArchiveTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/archived-agreements/${deleteArchiveTarget.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast(`✓ "${deleteArchiveTarget.customerName}" dijital onay tutanağı arşivden kalıcı olarak silindi.`);
        setArchivedLogs(prev => prev.filter(a => a.id !== deleteArchiveTarget.id));
        setDeleteArchiveTarget(null);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(`Hata: ${err.error || 'Arşivden silinemedi'}`);
      }
    } catch (err) {
      console.error('Arşivden silinemedi:', err);
      showToast('Bağlantı hatası: Arşivden silinemedi');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Delete of an Active Agreement
  const confirmDeleteActive = async () => {
    if (!deleteActiveTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/agreements/${deleteActiveTarget.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast(`✓ "${deleteActiveTarget.customerName}" dijital onayı silindi.`);
        setDeleteActiveTarget(null);
        onRefresh();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(`Hata: ${err.error || 'Silinemedi'}`);
      }
    } catch (err) {
      console.error('Onay kaydı silinemedi:', err);
      showToast('Bağlantı hatası: Silinemedi');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // Filter logs based on search
  const filteredActiveLogs = logs.filter(log =>
    log.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.licenseKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.customerEmail && log.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.ipAddress && log.ipAddress.toLowerCase().includes(searchTerm.toLowerCase())) ||
    log.hwid.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.legalHash.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredArchivedLogs = archivedLogs.filter(log =>
    log.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.licenseKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.customerEmail && log.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.ipAddress && log.ipAddress.toLowerCase().includes(searchTerm.toLowerCase())) ||
    log.hwid.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.legalHash.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-emerald-600 text-white font-semibold rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Legal Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#171a23] via-[#1a1e2b] to-[#171a23] border border-[#2b3347] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>5846 Sayılı FSEK Telif Hakkı & EULA Dijital İmza Denetim Merkezi</span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/40">
                Hukuki Koruma
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Yazılımı başlatan her kullanıcının donanım kimliği (HWID), IP adresi ve onay zaman damgası SHA-256 kriptografik imzası ile kaydedilir. Lisansı silinen kişilerin onayları yasal delil olarak <strong>Dijital Onay Arşivi</strong>nde muhafaza edilir.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFullAgreement(true)}
            className="px-3.5 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <FileText className="w-4 h-4" />
            <span>Sözleşme Metnini İncele</span>
          </button>
        </div>
      </div>

      {/* Top View Mode Selector & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#171a23] border border-[#232733] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-lg">
        {/* Tab switch */}
        <div className="flex items-center gap-2 p-1 bg-[#101217] rounded-xl border border-[#252b3b]">
          <button
            onClick={() => setViewMode('active')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              viewMode === 'active'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Kayıtlı Dijital Onaylar ({logs.length})</span>
          </button>

          <button
            onClick={() => {
              setViewMode('archived');
              fetchArchivedLogs();
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              viewMode === 'archived'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderArchive className="w-4 h-4 text-amber-400" />
            <span>Silinen Lisanslar & Onay Arşivi ({archivedLogs.length})</span>
          </button>
        </div>

        {/* Search input and refresh */}
        <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Müşteri, Lisans, HWID veya Hash ara..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#101217] border border-[#272d3d] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <button
            onClick={() => {
              onRefresh();
              fetchArchivedLogs();
            }}
            className="p-2 bg-[#202636] hover:bg-[#2b3347] text-slate-300 rounded-xl border border-[#2b3347] transition-colors"
            title="Listeyi Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingArchive ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* VIEW 1: ACTIVE AGREEMENTS TABLE */}
      {viewMode === 'active' && (
        <div className="overflow-hidden rounded-2xl bg-[#171a23] border border-[#232733] shadow-xl">
          <div className="p-4 border-b border-[#232733] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">
                Aktif Lisans Dijital Onay Kayıtları ({filteredActiveLogs.length} Kayıt)
              </h4>
            </div>
            <span className="text-xs text-slate-400">Son geçerli sözleşme: v2026.1</span>
          </div>

          <div className="overflow-x-auto">
            {filteredActiveLogs.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                Kayıtlı dijital onay bulunamadı veya arama sonucu eşleşmedi.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#12141a] text-slate-400 font-semibold border-b border-[#232733]">
                  <tr>
                    <th className="p-3.5">İmzalayan / Müşteri</th>
                    <th className="p-3.5">Lisans Anahtarı</th>
                    <th className="p-3.5">Cihaz HWID</th>
                    <th className="p-3.5">Onay Tarihi</th>
                    <th className="p-3.5">IP Adresi</th>
                    <th className="p-3.5">Dijital İmza (SHA-256)</th>
                    <th className="p-3.5 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2433] text-slate-300">
                  {filteredActiveLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#1a1f2c] transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-white">{log.customerName}</div>
                        <div className="text-[11px] text-slate-400">{log.customerEmail}</div>
                      </td>
                      <td className="p-3.5 font-mono text-cyan-400 font-medium">
                        {log.licenseKey}
                      </td>
                      <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                        {log.hwid.substring(0, 16)}...
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(log.acceptedAt).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(log.acceptedAt).toLocaleTimeString('tr-TR')}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-emerald-400">
                        {log.ipAddress && log.ipAddress !== 'DirectCloud' && log.ipAddress !== '127.0.0.1' && log.ipAddress !== '-' ? log.ipAddress : '-'}
                      </td>
                      <td className="p-3.5 font-mono text-[10px] text-slate-400 max-w-[140px] truncate" title={log.legalHash}>
                        {log.legalHash}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewLog({ log, isArchived: false })}
                            className="px-2.5 py-1 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                            title="Tutanak Belgesini Ekranda İncele"
                          >
                            <Eye className="w-3 h-3 text-cyan-400" />
                            <span>İncele</span>
                          </button>
                          <button
                            onClick={() => printAuditReceipt(log, false)}
                            className="px-2.5 py-1 rounded-lg bg-[#202636] hover:bg-[#2c344a] text-slate-200 border border-[#2e374b] text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                            title="Resmi Onay Belgesi / Tutanağı Doğrudan Yazdır"
                          >
                            <Printer className="w-3 h-3 text-emerald-400" />
                            <span>Yazdır</span>
                          </button>
                          <button
                            onClick={() => setDeleteActiveTarget(log)}
                            className="p-1 rounded-lg bg-[#202636] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-[#2e374b] transition-colors"
                            title="Onay kaydını sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: ARCHIVED AGREEMENTS TABLE (Deleted Licenses) */}
      {viewMode === 'archived' && (
        <div className="overflow-hidden rounded-2xl bg-[#171a23] border border-amber-500/30 shadow-xl">
          <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FolderArchive className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white">
                Silinen Kişilerin Kayıtlı Dijital Onay Arşivi ({filteredArchivedLogs.length} Kayıt)
              </h4>
            </div>
            <p className="text-xs text-amber-300">
              💡 Lisansı silinen kişilerin 5846 Sayılı Telif onayları burada güvenle saklanır. İstenirse arşivden kalıcı olarak silinebilir.
            </p>
          </div>

          <div className="overflow-x-auto">
            {filteredArchivedLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <FolderArchive className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-300">Arşivde Henüz Kayıt Bulunmuyor</p>
                <p className="text-slate-500 text-[11px] mt-1">
                  Lisansı silinen kullanıcıların dijital onayları otomatik olarak bu arşive aktarılacaktır.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#12141a] text-slate-400 font-semibold border-b border-[#232733]">
                  <tr>
                    <th className="p-3.5">Silinen Müşteri / İmzalayan</th>
                    <th className="p-3.5">Lisans Anahtarı</th>
                    <th className="p-3.5">Cihaz HWID</th>
                    <th className="p-3.5">İlk Onay Tarihi</th>
                    <th className="p-3.5">Arşivlenme Tarihi & Nedeni</th>
                    <th className="p-3.5">Dijital İmza (SHA-256)</th>
                    <th className="p-3.5 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2433] text-slate-300">
                  {filteredArchivedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#1a1f2c] transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{log.customerName}</span>
                          <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[10px] rounded border border-amber-500/30">
                            Silindi
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">{log.customerEmail || '-'}</div>
                      </td>
                      <td className="p-3.5 font-mono text-cyan-400 font-medium">
                        {log.licenseKey}
                      </td>
                      <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                        {log.hwid ? log.hwid.substring(0, 16) : '-'}...
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-300">
                          {new Date(log.acceptedAt).toLocaleDateString('tr-TR')}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(log.acceptedAt).toLocaleTimeString('tr-TR')}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="text-amber-300 font-semibold flex items-center gap-1">
                          <Archive className="w-3 h-3 text-amber-400" />
                          <span>{new Date(log.archivedAt).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px]" title={log.archiveReason}>
                          {log.archiveReason || 'Lisans silindiği için arşivlendi'}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-[10px] text-slate-400 max-w-[130px] truncate" title={log.legalHash}>
                        {log.legalHash}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewLog({ log, isArchived: true })}
                            className="px-2.5 py-1 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                            title="Arşiv Tutanağını Ekranda İncele"
                          >
                            <Eye className="w-3 h-3 text-cyan-400" />
                            <span>İncele</span>
                          </button>
                          <button
                            onClick={() => printAuditReceipt(log, true)}
                            className="px-2.5 py-1 rounded-lg bg-[#202636] hover:bg-[#2c344a] text-slate-200 border border-[#2e374b] text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                            title="Resmi Arşiv Onay Tutanağını Yazdır"
                          >
                            <Printer className="w-3 h-3 text-amber-400" />
                            <span>Yazdır</span>
                          </button>
                          <button
                            onClick={() => setDeleteArchiveTarget(log)}
                            className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                            title="Bu dijital onayı arşivden kalıcı olarak sil"
                          >
                            <Trash2 className="w-3 h-3 text-rose-400" />
                            <span>Sil</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modal: Delete from Archive Confirmation */}
      {deleteArchiveTarget && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#161922] border border-rose-600/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-[#282f42] pb-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Arşivden Kalıcı Olarak Sil</h3>
                <p className="text-xs text-rose-300 font-medium">Dijital Onay Arşiv Kaydı Silinecek</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0f1117] border border-[#232a3b] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">İmzalayan / Müşteri:</span>
                <span className="font-bold text-white">{deleteArchiveTarget.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lisans Anahtarı:</span>
                <span className="font-mono font-bold text-cyan-400">{deleteArchiveTarget.licenseKey}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Arşiv Zamanı:</span>
                <span className="text-slate-200">
                  {new Date(deleteArchiveTarget.archivedAt).toLocaleString('tr-TR')}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>"{deleteArchiveTarget.customerName}"</strong> kullanıcısına ait arşivlenmiş dijital onay tutanağı sistemden ve veritabanından kalıcı olarak silinecektir. Bu işlem geri alınamaz!
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteArchiveTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 bg-[#202636] hover:bg-[#2b3347] text-slate-300 rounded-xl text-xs font-semibold"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={confirmDeleteArchive}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Siliniyor...' : 'TAMAM, Arşivden Sil'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Active Agreement Confirmation */}
      {deleteActiveTarget && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#161922] border border-rose-600/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-[#282f42] pb-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Dijital Onay Kaydını Sil</h3>
                <p className="text-xs text-rose-300">Aktif Onay Listesinden Kaldır</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>"{deleteActiveTarget.customerName}"</strong> ({deleteActiveTarget.licenseKey}) onay kaydını silmek istediğinizden emin misiniz?
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteActiveTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-[#202636] hover:bg-[#2b3347] text-slate-300 rounded-lg text-xs font-semibold"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={confirmDeleteActive}
                disabled={isDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Siliniyor...' : 'TAMAM, Onayı Sil'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Interactive Preview of Official Audit Receipt */}
      {previewLog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#13161f] border border-[#2d374d] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-[#181c27] border-b border-[#242b3b] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{previewLog.isArchived ? 'Arşiv Denetim Tutanağı Önizleme' : 'Aktif Lisans Denetim Tutanağı'}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      5846 FSEK ONAYLI
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Resmi Hukuki Onay & Güvenlik Tescili</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printAuditReceipt(previewLog.log, previewLog.isArchived)}
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-600/20"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Resmi Tutanağı Yazdır</span>
                </button>
                <button
                  onClick={() => setPreviewLog(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#202636]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: The Complete 4 Key Audit Fields Required by User */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-[#0d0f15] border border-[#212738] space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-[#141824] border border-[#242c3d]">
                    <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                      <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Kullanıcı / İmzalayan:</span>
                    </div>
                    <div className="font-bold text-white text-sm">{previewLog.log.customerName}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#141824] border border-[#242c3d]">
                    <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                      <Mail className="w-3.5 h-3.5 text-blue-400" />
                      <span>E-Posta:</span>
                    </div>
                    <div className="font-mono text-cyan-300 font-semibold">
                      {previewLog.log.customerEmail && previewLog.log.customerEmail !== '-' ? previewLog.log.customerEmail : 'Belirtilmedi'}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#141824] border border-[#242c3d]">
                    <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>İlk Onay Zaman Damgası:</span>
                    </div>
                    <div className="font-semibold text-slate-200">
                      {new Date(previewLog.log.acceptedAt || Date.now()).toLocaleString('tr-TR')}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#141824] border border-[#242c3d]">
                    <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Onay IP Adresi:</span>
                    </div>
                    <div className="font-mono text-emerald-400 font-bold">
                      {previewLog.log.ipAddress && previewLog.log.ipAddress !== '-' && previewLog.log.ipAddress !== 'DirectCloud' && previewLog.log.ipAddress !== '127.0.0.1' ? previewLog.log.ipAddress : '-'}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1e2433] grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400">Lisans Anahtarı: </span>
                    <span className="font-mono text-cyan-400 font-bold">{previewLog.log.licenseKey}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Donanım HWID: </span>
                    <span className="font-mono text-slate-300">{previewLog.log.hwid}</span>
                  </div>
                </div>
              </div>

              {/* Legal Hash SHA-256 with Copy Action */}
              <div className="p-3.5 rounded-xl bg-[#0a0c10] border border-cyan-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
                    <Hash className="w-3.5 h-3.5" />
                    <span>Kriptografik Dijital İmza Özeti (SHA-256):</span>
                  </div>
                  <button
                    onClick={() => handleCopyHash(previewLog.log.legalHash)}
                    className="px-2 py-0.5 rounded bg-[#1e2638] hover:bg-[#2b354e] text-[10px] text-cyan-300 flex items-center gap-1 transition-colors"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHash ? 'Kopyalandı' : 'Kopyala'}</span>
                  </button>
                </div>
                <div className="p-2 bg-[#050608] rounded-lg font-mono text-[11px] text-cyan-200/90 break-all select-all border border-[#1b2230]">
                  {previewLog.log.legalHash}
                </div>
              </div>

              {/* Official Law Notice */}
              <div className="p-3 rounded-xl bg-[#141822] border border-[#212838] text-slate-400 text-[11px] leading-relaxed">
                <strong className="text-slate-200">5846 Sayılı FSEK Kapsamı:</strong> Kullanıcı bu yazılımın tersine mühendisliğe tabi tutulamayacağını, Mahmut Akın adına tescilli olduğunu ve onay IP adresi ile zaman damgasının hukuken bağlayıcı olduğunu dijital olarak teyit etmiştir.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#181c27] border-t border-[#242b3b] flex items-center justify-between">
              <span className="text-[11px] text-slate-400">5070 Sayılı Elektronik İmza Kanununa Uygundur</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewLog(null)}
                  className="px-4 py-2 bg-[#202636] hover:bg-[#2b3347] text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Kapat
                </button>
                <button
                  type="button"
                  onClick={() => {
                    printAuditReceipt(previewLog.log, previewLog.isArchived);
                  }}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Yazdır</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Full Legal Agreement Text */}
      {showFullAgreement && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#171a23] border border-[#2e364a] rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#242b3b] pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">5846 Sayılı Telif Hakkı & Lisans Sözleşmesi Metni</h3>
              </div>
              <button
                onClick={() => setShowFullAgreement(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#101217] border border-[#242a38] text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
{`5846 SAYILI FİKİR VE SANAT ESERLERİ KANUNU KAPSAMINDA 
AKINCI OTOMATİK SURFER & ELEVATION GALILO YAZILIM LİSANS VE TELİF SÖZLEŞMESİ

1. TARAFLAR VE SÖZLEŞMENİN KONUSU
İşbu sözleşme, "AKINCI OTOMATİK SURFER PRO DUAL & ELEVATION GALILO" yazılımının eser sahibi ve geliştiricisi Mahmut Akın (bundan sonra "HAK SAHİBİ" olarak anılacaktır) ile bu yazılımı kullanan tüzel/gerçek kişi (bundan sonra "KULLANICI" olarak anılacaktır) arasında akdedilmiştir.

2. TELİF HAKKI VE HUKUKİ KORUMA (5846 SAYILI KANUN)
a) Yazılımın tüm kaynak kodları, algoritmaları, grid filtre parametreleri, haritalandırma fonksiyonları ve arayüz tasarımları 5846 sayılı Fikir ve Sanat Eserleri Kanunu (FSEK), Türk Ceza Kanunu (TCK) ve ilgili uluslararası fikri mülkiyet mevzuatı ile korunmaktadır.
b) Yazılımın tersine mühendislik (reverse engineering), decompile (kod çözme), crack, HWID baypass veya lisans anahtarı manipülasyonu yapılması kesinlikle yasaktır. Tespit halinde TCK Madde 243-244 ve 5846 Sayılı Kanun Madde 71-72 uyarınca savcılık suç duyurusu ve tazminat davası açılacaktır.

3. KULLANIM SÜRESİ VE CİHAZ (HWID) BAĞLILIK ŞARTLARI
a) Kullanıcı, satın aldığı veya kendisine tanımlanan lisans süresi boyunca (Gün/Ay/Yıl) yazılımı aktif tutulan tekil Donanım Kimliği (HWID) üzerinde kullanabilir.
b) Süre bitiminde yazılım otomatik olarak kilitlenecektir. Yetkisiz süre uzatma veya sunucu manipülasyonu yapan lisanslar derhal iptal (Blacklist) edilecektir.

4. DİJİTAL İMZA VE ONAY
Kullanıcı işbu sözleşmeyi dijital ortamda onaylayarak, donanım kimliği (HWID), IP adresi ve sistem bilgilerinin sunucuya kayıt edilmesini, süresi dolan lisansın kapatılmasını kayıtsız şartsız kabul ve taahhüt eder.`}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowFullAgreement(false)}
                className="px-4 py-2 bg-[#202636] hover:bg-[#2b3347] text-white rounded-lg text-xs font-semibold"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
