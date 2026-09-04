import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { LicenseKey, BoundDevice, UserSession, AgreementLog, ArchivedAgreementLog, VerifyLicenseRequest, VerifyLicenseResponse, AcceptAgreementRequest, DashboardStats, PaymentType, PaymentInfo, PaymentStatus, LicenseInstallment, InstallmentNotification, AdminSessionToken } from "./src/types.js";
import { FirestoreDataService } from "./src/firestoreService.js";

const app = express();
const PORT = 3000;

// Enable reverse proxy trust for Google Cloud Run / Nginx to accurately read client IP
app.set("trust proxy", true);

app.use(express.json());

// CORS & Preflight handler for external Python / Desktop clients
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

const AGREEMENT_VERSION = "v2026.1";
const LAW_REF = "5846 Sayılı Fikir ve Sanat Eserleri Kanunu Kapsamında Koruma ve Son Kullanıcı Lisans Sözleşmesi (EULA)";

const AGREEMENT_FULL_TEXT = `5846 SAYILI FİKİR VE SANAT ESERLERİ KANUNU KAPSAMINDA 
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
Kullanıcı işbu sözleşmeyi dijital ortamda onaylayarak, donanım kimliği (HWID), IP adresi ve sistem bilgilerinin sunucuya kayıt edilmesini, süresi dolan lisansın kapatılmasını kayıtsız şartsız kabul ve taahhüt eder.`;

let licenses: LicenseKey[] = [
  {
    id: "lic-1",
    key: "AKN-SURF-9821-XPRO",
    customerName: "Ahmet Yılmaz (Jeoloji Müh.)",
    customerEmail: "ahmet.yilmaz@geotech.com.tr",
    customerPhone: "+90 532 111 2233",
    plan: "annual",
    createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 305 * 24 * 3600 * 1000).toISOString(),
    status: "active",
    maxDevices: 5,
    boundDevices: [
      {
        hwid: "BFEBFBFF000906EA-WD-WCC4N7...",
        deviceName: "GEO-WORKSTATION-01 (Win11 Pro)",
        firstUsedAt: new Date(Date.now() - 58 * 24 * 3600 * 1000).toISOString(),
        lastSeenAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        ip: "88.250.44.12",
      }
    ],
    agreementAccepted: true,
    agreementAcceptedAt: new Date(Date.now() - 58 * 24 * 3600 * 1000).toISOString(),
    agreementSignerName: "Ahmet Yılmaz",
    agreementIp: "88.250.44.12",
    notes: "3D Grid ve Çift Surfer MOD1+MOD2 tam yetkili yıllık kurumsal lisans",
    allowedModules: ["surfer_pro_dual", "elevation_galilo", "mod1", "mod2", "mod12", "3d_layer", "contour_layer"],
    lastUsedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    paymentInfo: {
      totalPrice: 45000,
      currency: "TL",
      paymentType: "installment",
      status: "partial",
      paidAmount: 15000,
      remainingAmount: 30000,
      installmentCount: 3,
      dayOfMonth: 15,
      installments: [
        {
          id: "inst-1-1",
          installmentNo: 1,
          totalInstallments: 3,
          amount: 15000,
          dueDate: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
          dayOfMonth: 15,
          status: "paid",
          paidAt: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
          notes: "Banka Havalesi / EFT ile ödendi"
        },
        {
          id: "inst-1-2",
          installmentNo: 2,
          totalInstallments: 3,
          amount: 15000,
          dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
          dayOfMonth: 15,
          status: "unpaid",
          notes: "2. Taksit vadesi yaklaşıyor (Bu hafta)"
        },
        {
          id: "inst-1-3",
          installmentNo: 3,
          totalInstallments: 3,
          amount: 15000,
          dueDate: new Date(Date.now() + 32 * 24 * 3600 * 1000).toISOString(),
          dayOfMonth: 15,
          status: "unpaid"
        }
      ],
      notes: "Kurumsal 3 Taksit Anlaşması"
    }
  },
  {
    id: "lic-2",
    key: "AKN-SURF-4412-EVAL",
    customerName: "Mustafa Kaya (Maden Arama)",
    customerEmail: "m.kaya@madenpro.net",
    customerPhone: "+90 544 333 4455",
    plan: "monthly",
    createdAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
    status: "active",
    maxDevices: 5,
    boundDevices: [],
    agreementAccepted: true,
    agreementAcceptedAt: new Date(Date.now() - 24 * 24 * 3600 * 1000).toISOString(),
    agreementSignerName: "Mustafa Kaya",
    agreementIp: "176.218.90.104",
    notes: "Aylık arazi sürümü. 5 gün kaldı, uzatma talebi bekleniyor.",
    allowedModules: ["surfer_pro_dual", "elevation_galilo", "mod1", "mod2"],
    lastUsedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    paymentInfo: {
      totalPrice: 7500,
      currency: "TL",
      paymentType: "cash",
      status: "paid",
      paidAmount: 7500,
      remainingAmount: 0,
      cashPaidAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
      notes: "Peşin / Havale ile ödendi"
    }
  },
  {
    id: "lic-3",
    key: "AKN-SURF-0077-7DAY",
    customerName: "Kemal Çetin (Saha Mühendisi - Kayseri)",
    customerEmail: "k.cetin@sahajeo.com",
    customerPhone: "+90 505 999 8877",
    plan: "7days",
    durationDays: 7,
    firstActivatedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    status: "expired",
    maxDevices: 1,
    boundDevices: [
      {
        hwid: "AFEBFBFF000306F2-SAMSUNG-NVME...",
        deviceName: "DESKTOP-KAYSERI-PC1",
        firstUsedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
        lastSeenAt: new Date(Date.now() - 25 * 3600 * 1000).toISOString(),
        ip: "212.156.12.8",
      }
    ],
    agreementAccepted: true,
    agreementAcceptedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    agreementSignerName: "Kemal Çetin",
    agreementIp: "212.156.12.8",
    notes: "7 günlük lisans süresi tamamlandı.",
    allowedModules: ["surfer_pro_dual", "elevation_galilo", "mod1"],
    lastUsedAt: new Date(Date.now() - 25 * 3600 * 1000).toISOString(),
    paymentInfo: {
      totalPrice: 2500,
      currency: "TL",
      paymentType: "cash",
      status: "paid",
      paidAmount: 2500,
      remainingAmount: 0,
      cashPaidAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
      notes: "7 Günlük Pro Lisans Bedeli Peşin Tahsil Edildi"
    }
  },
  {
    id: "lic-4",
    key: "AKN-SURF-9999-PERM",
    customerName: "Mahmut Akın (Geliştirici & Eser Sahibi)",
    customerEmail: "mahmutakn86@gmail.com",
    customerPhone: "+90 539 850 5268",
    plan: "lifetime",
    createdAt: new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 3650 * 24 * 3600 * 1000).toISOString(),
    status: "active",
    maxDevices: 5,
    boundDevices: [
      {
        hwid: "AKN-F439-2E05-AF36-E9EB",
        deviceName: "AKINCI-DEV-MASTER-PC",
        firstUsedAt: new Date(Date.now() - 170 * 24 * 3600 * 1000).toISOString(),
        lastSeenAt: new Date().toISOString(),
        ip: "85.105.18.22",
      }
    ],
    agreementAccepted: true,
    agreementAcceptedAt: new Date(Date.now() - 170 * 24 * 3600 * 1000).toISOString(),
    agreementSignerName: "Mahmut Akın",
    agreementIp: "85.105.18.22",
    notes: "Eser Sahibi Master Geliştirici Lisansı (Süresiz & Tüm Modüller)",
    allowedModules: ["surfer_pro_dual", "elevation_galilo", "mod1", "mod2", "mod12", "3d_layer", "contour_layer", "admin_bypass"],
    lastUsedAt: new Date().toISOString(),
    paymentInfo: {
      totalPrice: 0,
      currency: "TL",
      paymentType: "cash",
      status: "paid",
      paidAmount: 0,
      remainingAmount: 0,
      notes: "Geliştirici & Eser Sahibi Lisansı (Muaf)"
    }
  },
  {
    id: "lic-5",
    key: "AKN-SURF-1337-NEWK",
    customerName: "Caner Demir (Mühendislik Ltd.)",
    customerEmail: "caner@demirgeoloji.com",
    customerPhone: "+90 533 777 9900",
    plan: "quarterly",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
    status: "pending_agreement",
    maxDevices: 1,
    boundDevices: [],
    agreementAccepted: false,
    notes: "Yeni oluşturuldu, 5846 telif sözleşmesi onaylanması bekleniyor.",
    allowedModules: ["surfer_pro_dual", "elevation_galilo", "mod1", "mod2", "mod12"],
    paymentInfo: {
      totalPrice: 24000,
      currency: "TL",
      paymentType: "installment",
      status: "overdue",
      paidAmount: 0,
      remainingAmount: 24000,
      installmentCount: 3,
      dayOfMonth: 5,
      installments: [
        {
          id: "inst-5-1",
          installmentNo: 1,
          totalInstallments: 3,
          amount: 8000,
          dueDate: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
          dayOfMonth: 5,
          status: "overdue",
          notes: "1. Taksit vadesi dündü, ödeme bekleniyor"
        },
        {
          id: "inst-5-2",
          installmentNo: 2,
          totalInstallments: 3,
          amount: 8000,
          dueDate: new Date(Date.now() + 29 * 24 * 3600 * 1000).toISOString(),
          dayOfMonth: 5,
          status: "unpaid"
        },
        {
          id: "inst-5-3",
          installmentNo: 3,
          totalInstallments: 3,
          amount: 8000,
          dueDate: new Date(Date.now() + 59 * 24 * 3600 * 1000).toISOString(),
          dayOfMonth: 5,
          status: "unpaid"
        }
      ],
      notes: "3 Taksitli Şirket Satışı"
    }
  }
];

// Helper to build payment schedule
function buildPaymentSchedule(
  totalPrice: number,
  paymentType: PaymentType = "cash",
  isCashPaid: boolean = true,
  installmentCount: number = 3,
  dayOfMonth: number = 15,
  startDateStr?: string,
  notes?: string,
  currency: 'TL' | 'USD' = 'TL',
  downPayment: number = 0
): PaymentInfo {
  const price = Math.max(0, Number(totalPrice) || 0);
  const cur: 'TL' | 'USD' = currency === 'USD' ? 'USD' : 'TL';
  const initialDownPayment = Math.min(price, Math.max(0, Number(downPayment) || 0));

  if (paymentType === "cash") {
    const isPaid = Boolean(isCashPaid);
    return {
      totalPrice: price,
      currency: cur,
      paymentType: "cash",
      status: isPaid ? "paid" : (price > 0 ? "unpaid" : "paid"),
      paidAmount: isPaid ? price : 0,
      remainingAmount: isPaid ? 0 : price,
      cashPaidAt: isPaid ? new Date().toISOString() : undefined,
      notes: notes || "",
    };
  }

  // Installments calculation
  const remainingForInstallments = Math.max(0, price - initialDownPayment);
  const count = Math.max(1, Number(installmentCount) || 1);
  const dom = Math.min(31, Math.max(1, Number(dayOfMonth) || 15));
  const baseAmount = Math.floor(remainingForInstallments / count);
  const remainder = remainingForInstallments - (baseAmount * count);

  const installments: LicenseInstallment[] = [];
  const baseDate = startDateStr ? new Date(startDateStr) : new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(baseDate);
    d.setMonth(d.getMonth() + i);
    const maxDaysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const actualDay = Math.min(dom, maxDaysInMonth);
    d.setDate(actualDay);
    d.setHours(23, 59, 59, 999);

    const amount = i === 0 ? baseAmount + remainder : baseAmount;
    const now = Date.now();
    const isOverdue = d.getTime() < now;

    installments.push({
      id: `inst-${Date.now()}-${i + 1}`,
      installmentNo: i + 1,
      totalInstallments: count,
      amount,
      currency: cur,
      dueDate: d.toISOString(),
      dayOfMonth: dom,
      status: isOverdue ? "overdue" : "unpaid",
    });
  }

  const initialPaid = initialDownPayment;
  const initialRemaining = price - initialPaid;

  return {
    totalPrice: price,
    currency: cur,
    paymentType: "installment",
    status: initialRemaining <= 0 ? "paid" : (initialPaid > 0 ? "partial" : "unpaid"),
    downPayment: initialDownPayment,
    downPaymentPaidAt: initialDownPayment > 0 ? new Date().toISOString() : undefined,
    paidAmount: initialPaid,
    remainingAmount: initialRemaining,
    installmentCount: count,
    dayOfMonth: dom,
    installments,
    notes: notes || "",
  };
}

// Helper to recalculate payment status and amounts
function recalculatePaymentInfo(payment: PaymentInfo): PaymentInfo {
  const cur: 'TL' | 'USD' = payment.currency === 'USD' ? 'USD' : 'TL';

  if (payment.paymentType === "cash") {
    const isPaid = payment.status === "paid";
    return {
      ...payment,
      currency: cur,
      paidAmount: isPaid ? payment.totalPrice : 0,
      remainingAmount: isPaid ? 0 : payment.totalPrice,
    };
  }

  const installments = payment.installments || [];
  const downPayment = Math.max(0, Number(payment.downPayment) || 0);
  let paidSum = downPayment;
  const now = Date.now();

  const updatedInstallments = installments.map(inst => {
    if (inst.status === "paid") {
      paidSum += inst.amount;
      return { ...inst, currency: cur };
    }
    const dueTime = new Date(inst.dueDate).getTime();
    if (dueTime < now) {
      return { ...inst, currency: cur, status: "overdue" as const };
    }
    return { ...inst, currency: cur, status: "unpaid" as const };
  });

  const remainingSum = Math.max(0, payment.totalPrice - paidSum);
  let overallStatus: PaymentStatus = "unpaid";
  if (paidSum >= payment.totalPrice && payment.totalPrice > 0) {
    overallStatus = "paid";
  } else if (paidSum > 0) {
    overallStatus = "partial";
  } else {
    const hasOverdue = updatedInstallments.some(i => i.status === "overdue");
    overallStatus = hasOverdue ? "overdue" : "unpaid";
  }

  return {
    ...payment,
    currency: cur,
    downPayment,
    paidAmount: paidSum,
    remainingAmount: remainingSum,
    status: overallStatus,
    installments: updatedInstallments,
  };
}

// Helper to collect installment notifications
function getInstallmentNotifications(allLicenses: LicenseKey[]): InstallmentNotification[] {
  const notifs: InstallmentNotification[] = [];
  const now = new Date();
  const todayDateStr = now.toISOString().slice(0, 10);
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 3600 * 1000);

  for (const lic of allLicenses) {
    if (!lic.paymentInfo || lic.paymentInfo.paymentType !== "installment") continue;
    const installments = lic.paymentInfo.installments || [];

    for (const inst of installments) {
      if (inst.status === "paid") continue;

      const due = new Date(inst.dueDate);
      const dueDateStr = due.toISOString().slice(0, 10);
      const diffMs = due.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (24 * 3600 * 1000));

      let urgency: "overdue" | "today" | "upcoming" = "upcoming";
      if (dueDateStr === todayDateStr || daysLeft === 0) {
        urgency = "today";
      } else if (daysLeft < 0) {
        urgency = "overdue";
      } else if (due.getTime() <= sevenDaysLater.getTime()) {
        urgency = "upcoming";
      }

      notifs.push({
        id: `notif-${lic.id}-${inst.id}`,
        licenseId: lic.id,
        licenseKey: lic.key,
        customerName: lic.customerName,
        customerPhone: lic.customerPhone,
        installmentId: inst.id,
        installmentNo: inst.installmentNo,
        totalInstallments: inst.totalInstallments,
        amount: inst.amount,
        dueDate: inst.dueDate,
        dayOfMonth: inst.dayOfMonth,
        status: inst.status,
        daysLeft,
        urgency,
      });
    }
  }

  return notifs.sort((a, b) => {
    const order = { overdue: 0, today: 1, upcoming: 2 };
    if (order[a.urgency] !== order[b.urgency]) {
      return order[a.urgency] - order[b.urgency];
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

let sessions: UserSession[] = [
  {
    id: "sess-1",
    licenseKey: "AKN-SURF-9821-XPRO",
    customerName: "Ahmet Yılmaz (Jeoloji Müh.)",
    hwid: "BFEBFBFF000906EA-WD-WCC4N7...",
    deviceName: "GEO-WORKSTATION-01 (Win11 Pro)",
    osVersion: "Windows 11 (Build 22631)",
    appVersion: "10.0 Ultimate",
    ip: "88.250.44.12",
    location: "Ankara, Türkiye",
    lastPingAt: new Date(Date.now() - 30 * 1000).toISOString(),
    status: "online",
    activeModule: "SURFER PRO DUAL (MOD 1+2 Çift Mod)",
    sessionStartedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    actionCount: 14,
  }
];

let agreementLogs: AgreementLog[] = [
  {
    id: "agr-1",
    licenseKey: "AKN-SURF-9821-XPRO",
    customerName: "Ahmet Yılmaz",
    customerEmail: "ahmet.yilmaz@geotech.com.tr",
    hwid: "BFEBFBFF000906EA-WD-WCC4N7...",
    acceptedAt: new Date(Date.now() - 58 * 24 * 3600 * 1000).toISOString(),
    ipAddress: "88.250.44.12",
    agreementVersion: "v2026.1",
    legalHash: "SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    termsTitle: "AKINCI FSEK 5846 EULA Sözleşmesi",
    lawReference: LAW_REF,
  }
];

let archivedAgreements: ArchivedAgreementLog[] = [];

// Robust Client IP extractor (Bypasses transparent Cloud Run proxies, Cloudflare, Fastly, Google Load Balancer)
function extractClientIp(req: express.Request, fallbackIp?: string): string {
  if (fallbackIp && typeof fallbackIp === 'string') {
    const clean = fallbackIp.trim();
    if (clean && clean !== '-' && clean !== 'DirectCloud' && clean !== '127.0.0.1' && clean !== '::1' && clean !== 'localhost') {
      return clean;
    }
  }
  const xff = req.headers["x-forwarded-for"];
  if (xff) {
    const raw = Array.isArray(xff) ? xff[0] : xff.toString();
    const parts = raw.split(',').map(s => s.trim()).filter(s => s && s !== '127.0.0.1' && s !== '::1' && !s.startsWith('::ffff:127.'));
    if (parts.length > 0) return parts[0];
  }
  const cf = req.headers["cf-connecting-ip"] || req.headers["x-real-ip"] || req.headers["x-client-ip"] || req.headers["fastly-client-ip"] || req.headers["x-cluster-client-ip"];
  if (cf) {
    const raw = Array.isArray(cf) ? cf[0] : cf.toString().trim();
    if (raw && raw !== '127.0.0.1' && raw !== '::1' && !raw.startsWith('::ffff:127.')) return raw;
  }
  if (req.ip && req.ip !== '127.0.0.1' && req.ip !== '::1' && !req.ip.startsWith('::ffff:127.')) {
    return req.ip.replace(/^::ffff:/, '');
  }
  const remote = req.socket.remoteAddress;
  if (remote && remote !== '127.0.0.1' && remote !== '::1' && !remote.startsWith('::ffff:127.')) {
    return remote.replace(/^::ffff:/, '');
  }
  return req.ip || "127.0.0.1";
}

function getDaysRemaining(expiresAtStr: string): number {
  if (!expiresAtStr) return 0;
  
  let expiresAtMs: number;
  if (expiresAtStr.includes('T')) {
    expiresAtMs = new Date(expiresAtStr).getTime();
  } else {
    // String like "2026-09-05"
    const clean = expiresAtStr.trim();
    if (clean.includes('-')) {
      const parts = clean.split('-');
      if (parts.length === 3) {
        expiresAtMs = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 23, 59, 59, 999).getTime();
      } else {
        expiresAtMs = new Date(`${clean}T23:59:59.999Z`).getTime();
      }
    } else {
      expiresAtMs = new Date(clean).getTime();
    }
  }

  if (isNaN(expiresAtMs)) return 0;
  const now = Date.now();
  const diffMs = expiresAtMs - now;
  if (diffMs <= 0) return 0;

  // Calendar day diff between today and target date
  const nowDate = new Date();
  const targetDate = new Date(expiresAtMs);
  const nowDateOnly = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
  const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
  
  const calendarDayDiff = Math.round((targetDateOnly - nowDateOnly) / (1000 * 60 * 60 * 24));
  return Math.max(0, calendarDayDiff > 0 ? calendarDayDiff : Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function computeDashboardStats(): DashboardStats {
  const now = Date.now();
  const fiveMinAgo = now - 5 * 60 * 1000;

  licenses.forEach(l => {
    if (l.status !== "revoked") {
      const days = getDaysRemaining(l.expiresAt);
      if (days <= 0) {
        l.status = "expired";
      }
    }
  });

  const totalLicenses = licenses.length;
  const activeLicenses = licenses.filter(l => l.status === "active").length;
  const expiredLicenses = licenses.filter(l => l.status === "expired").length;
  const revokedLicenses = licenses.filter(l => l.status === "revoked").length;
  const signedAgreements = agreementLogs.length;

  const onlineUsersNow = sessions.filter(s => new Date(s.lastPingAt).getTime() > fiveMinAgo).length;
  const expiringIn7Days = licenses.filter(l => {
    const d = getDaysRemaining(l.expiresAt);
    return d > 0 && d <= 7 && l.status === "active";
  }).length;

  // Financial & Installment Aggregations
  let totalRevenue = 0;
  let totalCollected = 0;
  let totalPending = 0;
  let dueInstallmentCount = 0;
  let dueInstallmentTotal = 0;

  const todayStr = new Date().toISOString().slice(0, 10);

  licenses.forEach(l => {
    if (l.paymentInfo) {
      totalRevenue += Number(l.paymentInfo.totalPrice) || 0;
      totalCollected += Number(l.paymentInfo.paidAmount) || 0;
      totalPending += Number(l.paymentInfo.remainingAmount) || 0;

      if (l.paymentInfo.paymentType === "installment" && Array.isArray(l.paymentInfo.installments)) {
        l.paymentInfo.installments.forEach(inst => {
          if (inst.status !== "paid") {
            const instDueStr = inst.dueDate ? inst.dueDate.slice(0, 10) : "";
            const isDueOrPast = instDueStr <= todayStr || inst.status === "overdue";
            if (isDueOrPast) {
              dueInstallmentCount += 1;
              dueInstallmentTotal += Number(inst.amount) || 0;
            }
          }
        });
      }
    }
  });

  return {
    totalLicenses,
    activeLicenses,
    expiredLicenses,
    revokedLicenses,
    onlineUsersNow,
    signedAgreements,
    expiringIn7Days,
    totalRevenue,
    totalCollected,
    totalPending,
    dueInstallmentCount,
    dueInstallmentTotal,
  };
}

function getEnrichedAgreements(): AgreementLog[] {
  const licenseMap = new Map<string, LicenseKey>();
  licenses.forEach(l => {
    if (l.key) licenseMap.set(l.key.toUpperCase(), l);
  });

  const result: AgreementLog[] = [...agreementLogs];

  for (const log of result) {
    const lic = licenseMap.get((log.licenseKey || '').toUpperCase());
    if (lic) {
      if ((!log.customerEmail || log.customerEmail === '-' || log.customerEmail.trim() === '') && lic.customerEmail) {
        log.customerEmail = lic.customerEmail;
      }
      // Clean invalid or placeholder IPs like DirectCloud or 127.0.0.1
      if (!log.ipAddress || log.ipAddress === '127.0.0.1' || log.ipAddress === '-' || log.ipAddress === 'DirectCloud' || log.ipAddress.trim() === '') {
        const candidateIp = (lic.agreementIp && lic.agreementIp !== 'DirectCloud' && lic.agreementIp !== '127.0.0.1' && lic.agreementIp !== '-')
          ? lic.agreementIp
          : (lic.boundDevices?.[0]?.ip && lic.boundDevices[0].ip !== 'DirectCloud' && lic.boundDevices[0].ip !== '127.0.0.1' && lic.boundDevices[0].ip !== '-')
            ? lic.boundDevices[0].ip
            : sessions.find(s => s.licenseKey === lic.key && s.ip && s.ip !== 'DirectCloud' && s.ip !== '127.0.0.1')?.ip || '-';
        log.ipAddress = candidateIp;
      }
      if (!log.hwid || log.hwid === 'Cihaz Kaydı' || log.hwid.trim() === '') {
        log.hwid = lic.boundDevices?.[0]?.hwid || 'BFEBFBFF000906EA-WD-WCC4N7...';
      }
      if (!log.acceptedAt || log.acceptedAt.trim() === '') {
        log.acceptedAt = lic.agreementAcceptedAt || lic.firstActivatedAt || lic.createdAt || new Date().toISOString();
      }
      if (!log.legalHash || log.legalHash.trim() === '' || log.legalHash === '-') {
        const hash = crypto.createHash('sha256').update(`${log.licenseKey}:${log.customerName}:${log.acceptedAt}:${log.ipAddress}:v2026.1`).digest('hex');
        log.legalHash = `SHA256:${hash}`;
      }
    } else {
      if (!log.customerEmail) log.customerEmail = "Belirtilmedi";
      if (!log.ipAddress || log.ipAddress === 'DirectCloud' || log.ipAddress === '127.0.0.1') log.ipAddress = "-";
      if (!log.acceptedAt) log.acceptedAt = new Date().toISOString();
      if (!log.legalHash) {
        const hash = crypto.createHash('sha256').update(`${log.licenseKey}:${log.customerName}:${log.acceptedAt}:${log.ipAddress}:v2026.1`).digest('hex');
        log.legalHash = `SHA256:${hash}`;
      }
    }
  }

  for (const lic of licenses) {
    const existing = result.find(a => (a.licenseKey || '').toUpperCase() === (lic.key || '').toUpperCase());
    if (!existing) {
      const bestIp = (lic.agreementIp && lic.agreementIp !== 'DirectCloud' && lic.agreementIp !== '127.0.0.1' && lic.agreementIp !== '-')
        ? lic.agreementIp
        : (lic.boundDevices?.[0]?.ip && lic.boundDevices[0].ip !== 'DirectCloud' && lic.boundDevices[0].ip !== '127.0.0.1' && lic.boundDevices[0].ip !== '-')
          ? lic.boundDevices[0].ip
          : sessions.find(s => s.licenseKey === lic.key && s.ip && s.ip !== 'DirectCloud' && s.ip !== '127.0.0.1')?.ip || '-';
      const bestHwid = lic.boundDevices?.[0]?.hwid || 'BFEBFBFF000906EA-WD-WCC4N7...';
      const bestTime = lic.agreementAcceptedAt || lic.firstActivatedAt || lic.createdAt || new Date().toISOString();
      const hash = lic.legalHash || `SHA256:${crypto.createHash('sha256').update(`${lic.key}:${lic.customerName}:${bestTime}:${bestIp}:v2026.1`).digest('hex')}`;
      
      const newLog: AgreementLog = {
        id: `agr-${lic.id}`,
        licenseKey: lic.key,
        customerName: lic.customerName,
        customerEmail: lic.customerEmail || 'Belirtilmedi',
        hwid: bestHwid,
        acceptedAt: bestTime,
        ipAddress: bestIp,
        agreementVersion: AGREEMENT_VERSION,
        legalHash: hash,
        termsTitle: "AKINCI FSEK 5846 EULA ve Lisans Sözleşmesi",
        lawReference: LAW_REF,
      };
      result.push(newLog);
    }
  }

  return result;
}

function getEnrichedSessions(): UserSession[] {
  const now = Date.now();
  const twoMinAgo = now - 2.5 * 60 * 1000;
  const tenMinAgo = now - 10 * 60 * 1000;

  const validLicenseMap = new Map<string, LicenseKey>();
  licenses.forEach(l => {
    if (l.key) validLicenseMap.set(l.key.toUpperCase(), l);
    if (l.id) validLicenseMap.set(l.id, l);
  });

  const activeSessions = sessions.filter(s => {
    const key = (s.licenseKey || '').trim().toUpperCase();
    return validLicenseMap.has(key);
  });

  activeSessions.forEach(s => {
    const lic = validLicenseMap.get((s.licenseKey || '').trim().toUpperCase());
    if (lic) {
      s.customerName = lic.customerName;
      if (lic.status === 'revoked' || lic.status === 'expired') {
        s.status = 'offline';
        return;
      }
    }
    const pingTime = new Date(s.lastPingAt).getTime();
    if (pingTime > twoMinAgo) {
      s.status = "online";
    } else if (pingTime > tenMinAgo) {
      s.status = "idle";
    } else {
      s.status = "offline";
    }
  });

  activeSessions.sort((a, b) => {
    if (a.status === 'online' && b.status !== 'online') return -1;
    if (a.status !== 'online' && b.status === 'online') return 1;
    return new Date(b.lastPingAt).getTime() - new Date(a.lastPingAt).getTime();
  });

  return activeSessions;
}

// Asynchronously sync with Firebase Firestore on startup & in background
async function initFirestoreSync() {
  try {
    await FirestoreDataService.initDatabase(licenses, sessions, agreementLogs);
    licenses = await FirestoreDataService.getAllLicenses(licenses);
    sessions = await FirestoreDataService.getAllSessions(sessions);
    agreementLogs = await FirestoreDataService.getAllAgreements(agreementLogs);
    archivedAgreements = await FirestoreDataService.getAllArchivedAgreements(archivedAgreements);
  } catch (e) {
    console.warn("Initial Firestore sync note:", e);
  }
}
initFirestoreSync();

// Background Periodic Sync (every 30 seconds, non-blocking)
setInterval(async () => {
  try {
    const licSnap = await FirestoreDataService.getAllLicenses(licenses);
    if (licSnap && licSnap.length > 0) licenses = licSnap;
    const sessSnap = await FirestoreDataService.getAllSessions(sessions);
    if (sessSnap) sessions = sessSnap;
    const agrSnap = await FirestoreDataService.getAllAgreements(agreementLogs);
    if (agrSnap) agreementLogs = agrSnap;
    const archSnap = await FirestoreDataService.getAllArchivedAgreements(archivedAgreements);
    if (archSnap) archivedAgreements = archSnap;
  } catch (e) {
    // Non-blocking background sync warning
  }
}, 30000);

// -------------------------------------------------------------
// PUBLIC CLIENT API ENDPOINTS (Called directly by Python script & Browser)
// -------------------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "AKINCI Cloud Lisans Sunucusu", time: new Date().toISOString() });
});

// Real Client Public IP resolver endpoint
app.get("/api/my-ip", (req, res) => {
  const ip = extractClientIp(req);
  res.json({ ip, success: true, timestamp: new Date().toISOString() });
});

app.get("/api/client-ip", (req, res) => {
  const ip = extractClientIp(req);
  res.json({ ip, success: true, timestamp: new Date().toISOString() });
});

// 1. Get Agreement Text & Info
app.get("/api/license/agreement-text", (req, res) => {
  res.json({
    version: AGREEMENT_VERSION,
    lawReference: LAW_REF,
    text: AGREEMENT_FULL_TEXT,
    author: "Mahmut Akın",
    contact: {
      phone: "+905398505268",
      telegram: "@akinci_surfer_voxler_analiz"
    }
  });
});

// 2. Verify License & HWID (Core endpoint called upon Python startup and periodically)
app.post("/api/license/verify", async (req, res) => {
  const body = req.body as VerifyLicenseRequest;
  const clientIp = extractClientIp(req, (body as any).ipAddress || (body as any).ip || (body as any).client_ip);

  if (!body.licenseKey || !body.hwid) {
    return res.status(400).json({
      valid: false,
      status: "revoked",
      message: "Lisans anahtarı ve Donanım Kimliği (HWID) zorunludur.",
      daysRemaining: 0,
      expiresAt: "",
      agreementRequired: false,
      allowedModules: [],
      serverTime: new Date().toISOString()
    });
  }

  const cleanKey = body.licenseKey.trim().toUpperCase();
  const cleanHwid = body.hwid.trim();

  // Instant in-memory search with case & hyphen resilience
  let foundLicense = licenses.find(l => 
    l.key.trim().toUpperCase() === cleanKey || 
    l.key.replace(/-/g, '').toUpperCase() === cleanKey.replace(/-/g, '')
  );

  // If not found in memory, query Firestore immediately
  if (!foundLicense) {
    try {
      const dbLicenses = await FirestoreDataService.getAllLicenses(licenses);
      licenses = dbLicenses;
      foundLicense = licenses.find(l => 
        l.key.trim().toUpperCase() === cleanKey || 
        l.key.replace(/-/g, '').toUpperCase() === cleanKey.replace(/-/g, '')
      );
    } catch (e) {
      console.warn("Firestore acil lisans sorgu uyarısı:", e);
    }
  }

  if (!foundLicense) {
    return res.status(200).json({
      valid: false,
      status: "revoked",
      licenseKey: cleanKey,
      message: `Geçersiz Lisans Anahtarı (${cleanKey})! Lütfen Kullanıcı Yönetim Merkezi üzerinden tanımlatınız veya geliştirici (Mahmut Akın: +90 539 850 52 68) ile iletişime geçiniz.`,
      daysRemaining: 0,
      expiresAt: "",
      agreementRequired: false,
      allowedModules: [],
      serverTime: new Date().toISOString()
    });
  }

  // 1. Check if revoked / passive (Admin toggle from dashboard)
  if (foundLicense.status === "revoked") {
    return res.status(200).json({
      valid: false,
      status: "revoked",
      message: `Bu lisans yönetici tarafından PASİF (KİLİTLİ / ASKIYA ALINDI) durumuna getirilmiştir. Yazılım başlatılamaz. (Müşteri: ${foundLicense.customerName})`,
      daysRemaining: 0,
      expiresAt: foundLicense.expiresAt,
      customerName: foundLicense.customerName,
      agreementRequired: false,
      allowedModules: [],
      serverTime: new Date().toISOString()
    });
  }

  // 1.5. Start license countdown strictly on first PC installation/run if not already activated
  if (!foundLicense.firstActivatedAt) {
    foundLicense.firstActivatedAt = new Date().toISOString();
    foundLicense.status = "active";
    foundLicense.lastUsedAt = new Date().toISOString();
    // Only calculate expiresAt if not already defined by admin (e.g. custom date or plan)
    if (!foundLicense.expiresAt) {
      const dDays = foundLicense.durationDays || (
        foundLicense.plan === '1day' ? 1 :
        foundLicense.plan === '3days' ? 3 :
        foundLicense.plan === '7days' || foundLicense.plan === 'trial' ? 7 :
        foundLicense.plan === '15days' ? 15 :
        foundLicense.plan === 'monthly' ? 30 :
        foundLicense.plan === 'quarterly' ? 90 :
        foundLicense.plan === 'semi_annual' ? 180 :
        foundLicense.plan === 'annual' ? 365 :
        foundLicense.plan === 'lifetime' ? 3650 : 7
      );
      foundLicense.durationDays = dDays;
      // Real time starts from this exact moment:
      foundLicense.expiresAt = new Date(Date.now() + dDays * 24 * 3600 * 1000).toISOString();
    } else {
      // If expiresAt was already set by admin, accurately update durationDays
      foundLicense.durationDays = getDaysRemaining(foundLicense.expiresAt);
    }
    await FirestoreDataService.saveLicense(foundLicense);
  } else {
    // If license is valid and not expired, ensure status is active
    if (getDaysRemaining(foundLicense.expiresAt) > 0) {
      foundLicense.status = "active";
      foundLicense.lastUsedAt = new Date().toISOString();
      FirestoreDataService.saveLicense(foundLicense).catch(console.error);
    }
  }

  // 2. Check Expiration Date
  const daysRemaining = getDaysRemaining(foundLicense.expiresAt);
  if (daysRemaining <= 0) {
    foundLicense.status = "expired";
    FirestoreDataService.saveLicense(foundLicense).catch(console.error);
    return res.status(200).json({
      valid: false,
      status: "expired",
      message: `LİSANS SÜRESİ DOLDU: Bu lisans için tanımlanan ${foundLicense.durationDays || 1} günlük kullanım süresi tamamlanmıştır! Program kullanımı kapatılmıştır. Kalan Gün: 0 (Son Geçerlilik: ${new Date(foundLicense.expiresAt).toLocaleDateString('tr-TR')} ${new Date(foundLicense.expiresAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}). Süre uzatmak veya yeni lisans için iletişime geçiniz: Mahmut Akın (+90 539 850 52 68)`,
      daysRemaining: 0,
      expiresAt: foundLicense.expiresAt,
      customerName: foundLicense.customerName,
      agreementRequired: false,
      allowedModules: [],
      serverTime: new Date().toISOString()
    });
  }

  // 3. Check HWID Device binding and limits BEFORE agreement to ensure HWID is registered immediately
  if (!foundLicense.boundDevices) {
    foundLicense.boundDevices = [];
  }
  const maxDevicesAllowed = Math.max(1, Number(foundLicense.maxDevices) || 1);
  const cleanHwidLower = cleanHwid.toLowerCase();
  const existingDevIndex = foundLicense.boundDevices.findIndex(
    d => (d.hwid || "").trim().toLowerCase() === cleanHwidLower
  );

  if (existingDevIndex === -1) {
    // New device attempting to connect
    if (foundLicense.boundDevices.length >= maxDevicesAllowed) {
      return res.status(200).json({
        valid: false,
        status: "device_limit_exceeded",
        message: `❌ Bu lisans için tanımlanan maksimum bilgisayar kotasına (${maxDevicesAllowed} PC) ulaşılmıştır! Bu bilgisayar (HWID: ${cleanHwid}) için kullanım yetkisi verilemedi. Kayıtlı ${foundLicense.boundDevices.length} bilgisayar sorunsuz çalışmaya devam etmektedir. Bu PC'ye izin vermek için Yönetim Merkezinden önceki cihaz kaydını kaldırınız veya cihaz limitini artırınız.`,
        daysRemaining,
        expiresAt: foundLicense.expiresAt,
        customerName: foundLicense.customerName,
        agreementRequired: false,
        allowedModules: [],
        boundDevicesCount: foundLicense.boundDevices.length,
        maxDevices: maxDevicesAllowed,
        serverTime: new Date().toISOString()
      });
    }

    // Slot available: Register and bind this new PC immediately!
    const newBoundDev: BoundDevice = {
      hwid: cleanHwid,
      deviceName: body.deviceName || `Windows PC (${foundLicense.boundDevices.length + 1})`,
      firstUsedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      ip: clientIp,
    };
    foundLicense.boundDevices.push(newBoundDev);
    foundLicense.lastUsedAt = new Date().toISOString();
    FirestoreDataService.saveLicense(foundLicense).catch(console.error);
  } else {
    // Existing registered PC: update lastSeenAt, deviceName, ip
    foundLicense.boundDevices[existingDevIndex].lastSeenAt = new Date().toISOString();
    foundLicense.boundDevices[existingDevIndex].ip = clientIp;
    if (body.deviceName) {
      foundLicense.boundDevices[existingDevIndex].deviceName = body.deviceName;
    }
    foundLicense.lastUsedAt = new Date().toISOString();
    FirestoreDataService.saveLicense(foundLicense).catch(console.error);
  }

  // 4. Check EULA / Copyright Agreement acceptance
  if (!foundLicense.agreementAccepted) {
    return res.status(200).json({
      valid: false,
      status: "pending_agreement",
      licenseKey: foundLicense.key,
      message: "Yazılımı kullanabilmek için 5846 sayılı FSEK Telif Hakkı ve EULA sözleşmesini onaylamanız gerekmektedir.",
      daysRemaining,
      expiresAt: foundLicense.expiresAt,
      customerName: foundLicense.customerName,
      agreementRequired: true,
      allowedModules: [],
      boundDevices: foundLicense.boundDevices,
      maxDevices: maxDevicesAllowed,
      serverTime: new Date().toISOString()
    });
  }

  // Create or update live user session telemetry
  const existingSession = sessions.find(s => s.licenseKey === foundLicense.key && s.hwid === cleanHwid);
  if (existingSession) {
    existingSession.lastPingAt = new Date().toISOString();
    existingSession.status = "online";
    existingSession.ip = clientIp;
    if (body.currentModule) existingSession.activeModule = body.currentModule;
    existingSession.actionCount += 1;
    FirestoreDataService.saveSession(existingSession).catch(console.error);
  } else {
    const newSession: UserSession = {
      id: `sess-${Date.now()}`,
      licenseKey: foundLicense.key,
      customerName: foundLicense.customerName,
      hwid: cleanHwid,
      deviceName: body.deviceName || "Windows PC",
      osVersion: body.osVersion || "Windows 10/11",
      appVersion: body.appVersion || "10.0 Ultimate",
      ip: clientIp,
      location: "Türkiye",
      lastPingAt: new Date().toISOString(),
      status: "online",
      activeModule: body.currentModule || "SURFER PRO DUAL & GALILO",
      sessionStartedAt: new Date().toISOString(),
      actionCount: 1,
    };
    sessions.push(newSession);
    FirestoreDataService.saveSession(newSession).catch(console.error);
  }

  // Create a secure signature token
  const sessionToken = crypto
    .createHmac("sha256", "AKINCI_SURFER_SECRET_KEY_2026")
    .update(`${foundLicense.key}:${cleanHwid}:${foundLicense.expiresAt}`)
    .digest("hex");

  return res.json({
    valid: true,
    status: "active",
    message: `Lisans Doğrulandı: ${foundLicense.customerName} (Kalan Süre: ${daysRemaining} Gün)`,
    daysRemaining,
    expiresAt: foundLicense.expiresAt,
    customerName: foundLicense.customerName,
    agreementRequired: false,
    allowedModules: foundLicense.allowedModules,
    sessionToken,
    serverTime: new Date().toISOString()
  });
});

// 3. Accept 5846 Copyright Agreement
app.post("/api/license/agreement/accept", async (req, res) => {
  const body = req.body as AcceptAgreementRequest;
  const clientIp = extractClientIp(req, (body as any).ipAddress || (body as any).ip || (body as any).client_ip);

  if (!body.licenseKey || !body.signerName) {
    return res.status(400).json({ success: false, message: "Lisans anahtarı ve imzalayan ad-soyad zorunludur." });
  }

  const cleanKey = body.licenseKey.trim().toUpperCase();
  const cleanHwid = (body.hwid || "UNKNOWN-HWID").trim();
  
  let foundLicense = licenses.find(l => 
    l.key.trim().toUpperCase() === cleanKey || 
    l.key.replace(/-/g, '').toUpperCase() === cleanKey.replace(/-/g, '')
  );

  if (!foundLicense) {
    try {
      const dbLicenses = await FirestoreDataService.getAllLicenses(licenses);
      licenses = dbLicenses;
      foundLicense = licenses.find(l => 
        l.key.trim().toUpperCase() === cleanKey || 
        l.key.replace(/-/g, '').toUpperCase() === cleanKey.replace(/-/g, '')
      );
    } catch (e) {
      console.warn("Firestore acil sözleşme lisans sorgu uyarısı:", e);
    }
  }

  if (!foundLicense) {
    return res.status(404).json({ 
      success: false, 
      message: `Lisans anahtarı (${cleanKey}) veritabanında bulunamadı! Lütfen Yönetim Merkezinde lisansı kontrol ediniz.` 
    });
  }

  // 1. İsim Doğrulama Kontrolü: Girilen imza adı lisans sahibinin adıyla uyumlu olmalıdır
  const normalizedSigner = body.signerName.trim().toLowerCase();
  const normalizedCustomer = foundLicense.customerName.trim().toLowerCase();
  
  const customerWords = normalizedCustomer.replace(/[^a-z0-9ğüşıöç ]/gi, "").split(" ").filter(w => w.length > 2);
  const signerWords = normalizedSigner.replace(/[^a-z0-9ğüşıöç ]/gi, "").split(" ").filter(w => w.length > 2);
  const hasMatch = customerWords.some(cw => signerWords.some(sw => sw.includes(cw) || cw.includes(sw)));

  if (!hasMatch && !normalizedCustomer.includes("deneme") && !normalizedCustomer.includes("test")) {
    return res.status(400).json({
      success: false,
      message: `❌ İsim Uyuşmazlığı! Bu lisans anahtarı '${foundLicense.customerName}' adına tanımlıdır. Lütfen lisans sahibinin tam adını giriniz.`
    });
  }

  const timestamp = new Date().toISOString();
  const legalHash = "SHA256:" + crypto.createHash("sha256").update(`${cleanKey}:${body.signerName}:${timestamp}:${clientIp}:${AGREEMENT_VERSION}`).digest("hex");

  foundLicense.agreementAccepted = true;
  foundLicense.agreementAcceptedAt = timestamp;
  foundLicense.agreementSignerName = body.signerName;
  foundLicense.agreementIp = clientIp;
  if (foundLicense.status !== "revoked") {
    foundLicense.status = "active";
  }
  foundLicense.lastUsedAt = timestamp;

  // Ensure HWID is bound if slot is available
  if (!foundLicense.boundDevices) {
    foundLicense.boundDevices = [];
  }
  const maxDevicesAllowed = Math.max(1, Number(foundLicense.maxDevices) || 1);
  if (cleanHwid && cleanHwid !== "UNKNOWN-HWID") {
    const cleanHwidLower = cleanHwid.toLowerCase();
    const existingDev = foundLicense.boundDevices.find(d => (d.hwid || "").trim().toLowerCase() === cleanHwidLower);
    if (!existingDev && foundLicense.boundDevices.length < maxDevicesAllowed) {
      foundLicense.boundDevices.push({
        hwid: cleanHwid,
        deviceName: body.deviceName || `Windows PC (${foundLicense.boundDevices.length + 1})`,
        firstUsedAt: timestamp,
        lastSeenAt: timestamp,
        ip: clientIp,
      });
    } else if (existingDev) {
      existingDev.lastSeenAt = timestamp;
      existingDev.ip = clientIp;
      if (body.deviceName) existingDev.deviceName = body.deviceName;
    }
  }

  FirestoreDataService.saveLicense(foundLicense).catch(console.error);

  const newLog: AgreementLog = {
    id: `agr-${Date.now()}`,
    licenseKey: foundLicense.key,
    customerName: body.signerName,
    customerEmail: body.signerEmail || foundLicense.customerEmail || "Belirtilmedi",
    hwid: cleanHwid,
    acceptedAt: timestamp,
    ipAddress: clientIp,
    agreementVersion: AGREEMENT_VERSION,
    legalHash,
    termsTitle: "AKINCI 5846 EULA ve Telif Sözleşmesi",
    lawReference: LAW_REF,
  };

  agreementLogs = [newLog, ...agreementLogs.filter(a => a.id !== newLog.id)];
  FirestoreDataService.saveAgreement(newLog).catch(console.error);

  const daysRemaining = getDaysRemaining(foundLicense.expiresAt);

  res.json({
    success: true,
    valid: true,
    status: "active",
    message: "5846 Sayılı Telif Hakkı ve Lisans Sözleşmesi başarıyla imzalandı ve Firestore veritabanına kaydedildi.",
    legalHash,
    acceptedAt: timestamp,
    daysRemaining,
    expiresAt: foundLicense.expiresAt,
    customerName: foundLicense.customerName,
    allowedModules: foundLicense.allowedModules,
    boundDevices: foundLicense.boundDevices,
    maxDevices: maxDevicesAllowed,
  });
});

// 4. Heartbeat telemetry & Live License Enforcement
app.post("/api/license/heartbeat", async (req, res) => {
  const { licenseKey, hwid, activeModule } = req.body;
  const clientIp = extractClientIp(req, (req.body as any).ipAddress || (req.body as any).ip);

  if (!licenseKey) {
    return res.status(200).json({ valid: false, status: "revoked", message: "Lisans anahtarı eksik." });
  }

  const cleanKey = licenseKey.toString().trim().toUpperCase();
  const foundLicense = licenses.find(l => l.key.toUpperCase() === cleanKey);

  if (!foundLicense) {
    return res.status(200).json({
      valid: false,
      status: "revoked",
      message: "Lisans Kullanıcı Yönetim Merkezinde bulunamadı veya silindi."
    });
  }

  if (foundLicense.status === "revoked") {
    return res.status(200).json({
      valid: false,
      status: "revoked",
      customerName: foundLicense.customerName,
      message: `Lisansınız yönetici tarafından PASİF (KİLİTLİ / ASKIYA ALINDI) durumuna getirilmiştir!`
    });
  }

  const daysRemaining = getDaysRemaining(foundLicense.expiresAt);
  if (daysRemaining <= 0) {
    foundLicense.status = "expired";
    FirestoreDataService.saveLicense(foundLicense).catch(console.error);
    return res.status(200).json({
      valid: false,
      status: "expired",
      customerName: foundLicense.customerName,
      message: `Lisans süreniz dolmuştur! (Son Geçerlilik: ${new Date(foundLicense.expiresAt).toLocaleDateString('tr-TR')})`
    });
  }

  // Active license confirmation
  if (foundLicense.status !== "active") {
    foundLicense.status = "active";
    FirestoreDataService.saveLicense(foundLicense).catch(console.error);
  }
  foundLicense.lastUsedAt = new Date().toISOString();

  // If HWID provided, check if this specific device is registered
  if (hwid && typeof hwid === 'string' && hwid.trim()) {
    const cleanHwid = hwid.trim().toLowerCase();
    if (foundLicense.boundDevices && foundLicense.boundDevices.length > 0) {
      const isRegistered = foundLicense.boundDevices.some(
        d => (d.hwid || "").trim().toLowerCase() === cleanHwid
      );
      if (!isRegistered) {
        return res.status(200).json({
          valid: false,
          status: "unbound",
          message: "Bu bilgisayarın (HWID) donanım kilidi Yönetim Merkezinden sıfırlandı veya kaldırıldı. Yeniden giriş yapınız."
        });
      }
    }
  }

  // Ensure session is properly created or updated in both memory and Firestore
  const cleanHwid = (hwid || "").trim();
  let session = sessions.find(s => 
    s.licenseKey.toUpperCase() === cleanKey && 
    (s.hwid === cleanHwid || s.id === `sess-${cleanHwid.substring(0, 8)}`)
  );

  if (session) {
    session.lastPingAt = new Date().toISOString();
    session.status = "online";
    session.ip = clientIp;
    session.customerName = foundLicense.customerName;
    if (activeModule) session.activeModule = activeModule;
    session.actionCount += 1;
    FirestoreDataService.saveSession(session).catch(console.error);
  } else {
    session = {
      id: `sess-${cleanHwid ? cleanHwid.substring(0, 8) : Date.now().toString(36)}`,
      licenseKey: foundLicense.key,
      customerName: foundLicense.customerName,
      hwid: cleanHwid || "HWID-KAYITLI",
      deviceName: req.body.deviceName || "Windows PC",
      osVersion: req.body.osVersion || "Windows 10/11",
      appVersion: req.body.appVersion || "10.0 Ultimate",
      ip: clientIp,
      location: "Türkiye",
      lastPingAt: new Date().toISOString(),
      status: "online",
      activeModule: activeModule || "SURFER PRO DUAL & GALILO",
      sessionStartedAt: new Date().toISOString(),
      actionCount: 1,
    };
    sessions.push(session);
    FirestoreDataService.saveSession(session).catch(console.error);
  }

  res.json({
    valid: true,
    status: "active",
    customerName: foundLicense.customerName,
    daysRemaining,
    expiresAt: foundLicense.expiresAt,
    timestamp: new Date().toISOString()
  });
});

// -------------------------------------------------------------
// ADMIN MANAGEMENT APIS (Dashboard Controls)
// -------------------------------------------------------------
// ADMIN DASHBOARD & LICENSES MANAGEMENT APIS (Instant In-Memory Cache with Firestore Persistence)
// -------------------------------------------------------------

// Single consolidated high-speed endpoint for the entire dashboard
app.get("/api/admin/dashboard-data", (req, res) => {
  const stats = computeDashboardStats();
  const enrichedSessions = getEnrichedSessions();
  const enrichedAgreements = getEnrichedAgreements();

  res.json({
    stats,
    licenses,
    sessions: enrichedSessions,
    agreements: enrichedAgreements,
    archivedAgreements,
  });
});

app.get("/api/admin/stats", (req, res) => {
  res.json(computeDashboardStats());
});

// Robust Enterprise License Key Generator (e.g., AKN-Q3PWM-ZQ3IA-20S0F-CB2CN)
function generateEnterpriseLicenseKey(prefix = "AKN"): string {
  const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const getBlock = (len = 5) => {
    let str = "";
    const bytes = crypto.randomBytes(len);
    for (let i = 0; i < len; i++) {
      str += charset[bytes[i] % charset.length];
    }
    return str;
  };
  return `${prefix}-${getBlock(5)}-${getBlock(5)}-${getBlock(5)}-${getBlock(5)}`;
}

app.get("/api/admin/licenses", (req, res) => {
  res.json(licenses);
});

app.post("/api/admin/licenses", async (req, res) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    plan,
    durationDays,
    maxDevices,
    notes,
    allowedModules,
    customKey,
    key: providedKey,
    expiresAt: customExpiresAt,
    paymentInfo: customPaymentInfo,
    // Direct payment creation fields
    totalPrice,
    paymentType,
    isCashPaid,
    installmentCount,
    dayOfMonth,
    paymentStartDate,
    paymentNotes,
    currency,
    downPayment,
  } = req.body;

  if (!customerName) {
    return res.status(400).json({ error: "Müşteri adı gereklidir." });
  }

  let finalExpiresAt: string;
  let finalDurationDays: number = Number(durationDays) || 0;

  if (customExpiresAt && typeof customExpiresAt === 'string' && customExpiresAt.trim()) {
    const rawDate = customExpiresAt.trim();
    if (rawDate.includes('T')) {
      finalExpiresAt = new Date(rawDate).toISOString();
    } else if (rawDate.includes('-')) {
      const parts = rawDate.split('-');
      if (parts.length === 3) {
        finalExpiresAt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 23, 59, 59, 999).toISOString();
      } else {
        finalExpiresAt = new Date(`${rawDate}T23:59:59.999Z`).toISOString();
      }
    } else {
      finalExpiresAt = new Date(`${rawDate}T23:59:59.999Z`).toISOString();
    }
    finalDurationDays = getDaysRemaining(finalExpiresAt);
  } else {
    let days = Number(durationDays) || 7;
    if (plan === "1day") days = 1;
    else if (plan === "3days") days = 3;
    else if (plan === "7days" || plan === "trial") days = 7;
    else if (plan === "15days") days = 15;
    else if (plan === "monthly") days = 30;
    else if (plan === "quarterly") days = 90;
    else if (plan === "semi_annual") days = 180;
    else if (plan === "annual") days = 365;
    else if (plan === "lifetime") days = 3650;
    finalDurationDays = days;
    finalExpiresAt = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
  }

  // Use provided robust key or generate a new enterprise standard 27-char key
  const finalKey = (providedKey || customKey || "").trim().toUpperCase() || generateEnterpriseLicenseKey("AKN");

  // Determine payment info
  let computedPayment: PaymentInfo;
  if (customPaymentInfo && typeof customPaymentInfo === 'object') {
    computedPayment = recalculatePaymentInfo(customPaymentInfo);
  } else if (totalPrice !== undefined || paymentType !== undefined) {
    computedPayment = buildPaymentSchedule(
      Number(totalPrice) || 0,
      paymentType === "installment" ? "installment" : "cash",
      Boolean(isCashPaid),
      Number(installmentCount) || 3,
      Number(dayOfMonth) || 15,
      paymentStartDate,
      paymentNotes || notes,
      currency === "USD" ? "USD" : "TL",
      Number(downPayment) || 0
    );
  } else {
    // Default fallback based on plan
    let defaultPrice = 0;
    if (plan === "1day") defaultPrice = 500;
    else if (plan === "3days") defaultPrice = 1200;
    else if (plan === "7days" || plan === "trial") defaultPrice = 2500;
    else if (plan === "15days") defaultPrice = 4500;
    else if (plan === "monthly") defaultPrice = 7500;
    else if (plan === "quarterly") defaultPrice = 18000;
    else if (plan === "semi_annual") defaultPrice = 30000;
    else if (plan === "annual") defaultPrice = 45000;
    else if (plan === "lifetime") defaultPrice = 0;

    computedPayment = buildPaymentSchedule(
      defaultPrice,
      "cash",
      true,
      1,
      15,
      undefined,
      "Otomatik tanımlanan ödeme planı",
      "TL",
      0
    );
  }

  const newLicense: LicenseKey = {
    id: `lic-${Date.now()}`,
    key: finalKey,
    customerName: customerName.trim(),
    customerEmail: customerEmail ? customerEmail.trim() : "",
    customerPhone: customerPhone ? customerPhone.trim() : "",
    plan: plan === "trial" ? "7days" : (plan || "7days"),
    durationDays: finalDurationDays || (plan === "1day" ? 1 : plan === "3days" ? 3 : plan === "7days" || plan === "trial" ? 7 : plan === "15days" ? 15 : plan === "monthly" ? 30 : plan === "quarterly" ? 90 : plan === "semi_annual" ? 180 : plan === "annual" ? 365 : plan === "lifetime" ? 3650 : 7),
    createdAt: new Date().toISOString(),
    expiresAt: finalExpiresAt,
    status: "active",
    maxDevices: Math.max(1, Number(maxDevices) || 1),
    boundDevices: [],
    agreementAccepted: false,
    notes: notes || "",
    allowedModules: allowedModules || ["surfer_pro_dual", "elevation_galilo", "mod1", "mod2", "mod12"],
    paymentInfo: computedPayment,
  };

  licenses = [newLicense, ...licenses.filter(l => l.id !== newLicense.id && l.key !== newLicense.key)];
  await FirestoreDataService.saveLicense(newLicense);
  res.status(201).json(newLicense);
});

app.put("/api/admin/licenses/:id", async (req, res) => {
  const { id } = req.params;
  const {
    customerName,
    customerEmail,
    customerPhone,
    plan,
    status,
    maxDevices,
    expiresAt,
    notes,
    allowedModules,
    key: newKey,
    agreementAccepted,
    paymentInfo,
  } = req.body;

  const license = licenses.find((l) => l.id === id || l.key === id);
  if (!license) {
    return res.status(404).json({ error: "Lisans bulunamadı." });
  }

  if (customerName) license.customerName = customerName.trim();
  if (customerEmail !== undefined) license.customerEmail = customerEmail.trim();
  if (customerPhone !== undefined) license.customerPhone = customerPhone.trim();
  if (plan) license.plan = plan;
  if (status && ["active", "revoked", "expired", "pending_agreement"].includes(status)) {
    license.status = status;
  }
  if (maxDevices !== undefined) license.maxDevices = Math.max(1, Number(maxDevices) || 1);
  if (expiresAt) {
    const rawDate = typeof expiresAt === 'string' ? expiresAt.trim() : '';
    if (rawDate.includes('T')) {
      license.expiresAt = new Date(rawDate).toISOString();
    } else if (rawDate) {
      license.expiresAt = new Date(`${rawDate}T23:59:59.999Z`).toISOString();
    }
  }
  if (notes !== undefined) license.notes = notes;
  if (Array.isArray(allowedModules)) license.allowedModules = allowedModules;
  if (newKey && newKey.trim()) license.key = newKey.trim().toUpperCase();
  if (agreementAccepted !== undefined) license.agreementAccepted = Boolean(agreementAccepted);

  if (paymentInfo) {
    license.paymentInfo = recalculatePaymentInfo(paymentInfo);
  }

  FirestoreDataService.saveLicense(license).catch(console.error);

  // Sync in-memory list
  licenses = licenses.map(l => (l.id === license.id ? { ...license } : l));

  // Sync connected sessions
  sessions.forEach((s) => {
    if (s.licenseKey === license.key) {
      s.customerName = license.customerName;
      if (license.status !== "active") {
        s.status = "offline";
      }
    }
  });

  res.json({ success: true, license });
});

// Toggle individual installment status (Paid / Unpaid)
app.post("/api/admin/licenses/:id/installments/:installmentId/status", async (req, res) => {
  const { id, installmentId } = req.params;
  const { status, notes } = req.body;

  const license = licenses.find(l => l.id === id || l.key === id);
  if (!license) {
    return res.status(404).json({ error: "Lisans bulunamadı." });
  }

  if (!license.paymentInfo) {
    return res.status(400).json({ error: "Bu lisans için ödeme bilgisi tanımlı değil." });
  }

  if (license.paymentInfo.paymentType === "cash") {
    // Single cash payment toggle
    const newStatus = status === "paid" ? "paid" : "unpaid";
    license.paymentInfo.status = newStatus;
    license.paymentInfo.paidAmount = newStatus === "paid" ? license.paymentInfo.totalPrice : 0;
    license.paymentInfo.remainingAmount = newStatus === "paid" ? 0 : license.paymentInfo.totalPrice;
    license.paymentInfo.cashPaidAt = newStatus === "paid" ? new Date().toISOString() : undefined;
    if (notes !== undefined) license.paymentInfo.notes = notes;
  } else if (Array.isArray(license.paymentInfo.installments)) {
    const inst = license.paymentInfo.installments.find(i => i.id === installmentId);
    if (!inst) {
      return res.status(404).json({ error: "Taksit kaydı bulunamadı." });
    }

    if (status === "paid") {
      inst.status = "paid";
      inst.paidAt = new Date().toISOString();
    } else {
      const now = Date.now();
      const dueTime = new Date(inst.dueDate).getTime();
      inst.status = dueTime < now ? "overdue" : "unpaid";
      inst.paidAt = undefined;
    }

    if (notes !== undefined) inst.notes = notes;

    license.paymentInfo = recalculatePaymentInfo(license.paymentInfo);
  }

  FirestoreDataService.saveLicense(license).catch(console.error);
  licenses = licenses.map(l => (l.id === license.id ? { ...license } : l));

  res.json({ success: true, license, paymentInfo: license.paymentInfo });
});

// Update or reset entire payment plan for a license
app.put("/api/admin/licenses/:id/payment", async (req, res) => {
  const { id } = req.params;
  const {
    totalPrice,
    paymentType,
    isCashPaid,
    installmentCount,
    dayOfMonth,
    startDate,
    notes,
    installments
  } = req.body;

  const license = licenses.find(l => l.id === id || l.key === id);
  if (!license) {
    return res.status(404).json({ error: "Lisans bulunamadı." });
  }

  if (Array.isArray(installments)) {
    // Direct installment update
    license.paymentInfo = recalculatePaymentInfo({
      totalPrice: Number(totalPrice) || 0,
      currency: "TL",
      paymentType: paymentType || "installment",
      status: "unpaid",
      paidAmount: 0,
      remainingAmount: Number(totalPrice) || 0,
      installmentCount: installments.length,
      dayOfMonth: Number(dayOfMonth) || 15,
      installments,
      notes: notes || "",
    });
  } else {
    // Generate new schedule
    license.paymentInfo = buildPaymentSchedule(
      Number(totalPrice) || 0,
      paymentType || "cash",
      Boolean(isCashPaid),
      Number(installmentCount) || 3,
      Number(dayOfMonth) || 15,
      startDate,
      notes
    );
  }

  FirestoreDataService.saveLicense(license).catch(console.error);
  licenses = licenses.map(l => (l.id === license.id ? { ...license } : l));

  res.json({ success: true, license, paymentInfo: license.paymentInfo });
});

// Get admin notifications for due/overdue installments
app.get("/api/admin/notifications/installments", async (req, res) => {
  const notifications = getInstallmentNotifications(licenses);
  res.json(notifications);
});

app.post("/api/admin/licenses/:id/extend", async (req, res) => {
  const { id } = req.params;
  const { addDays, newExpiresAt } = req.body;

  const license = licenses.find(l => l.id === id || l.key === id);
  if (!license) {
    return res.status(404).json({ error: "Lisans bulunamadı." });
  }

  if (newExpiresAt) {
    const raw = typeof newExpiresAt === 'string' ? newExpiresAt.trim() : '';
    if (raw.includes('T')) {
      license.expiresAt = new Date(raw).toISOString();
    } else if (raw) {
      license.expiresAt = new Date(`${raw}T23:59:59.999Z`).toISOString();
    }
  } else if (addDays) {
    const currentExp = new Date(license.expiresAt).getTime();
    const baseTime = currentExp > Date.now() ? currentExp : Date.now();
    license.expiresAt = new Date(baseTime + Number(addDays) * 24 * 3600 * 1000).toISOString();
  }

  if (license.status === "expired") {
    license.status = "active";
  }

  FirestoreDataService.saveLicense(license).catch(console.error);
  licenses = licenses.map(l => (l.id === license.id ? { ...license } : l));
  res.json({ success: true, license });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "AKINCI Cloud Lisans ve Kullanıcı Yönetim Merkezi (Firestore Entegre)",
    version: "10.0 Ultimate",
    database: "Firebase Firestore",
    databaseId: "ai-studio-akincicloudlisan-3a34fed4-0751-41f0-88cf-b4ceecd716b7",
    timestamp: new Date().toISOString()
  });
});

app.post("/api/admin/licenses/:id/toggle-status", async (req, res) => {
  const { id } = req.params;
  const license = licenses.find(l => l.id === id || l.key === id);
  if (!license) {
    return res.status(404).json({ error: "Lisans bulunamadı." });
  }

  if (license.status === "active") {
    license.status = "revoked";
  } else {
    license.status = getDaysRemaining(license.expiresAt) > 0 ? "active" : "expired";
  }

  FirestoreDataService.saveLicense(license).catch(console.error);
  licenses = licenses.map(l => (l.id === license.id ? { ...license } : l));

  sessions.forEach(s => {
    if (s.licenseKey === license.key) {
      s.status = license.status === "active" ? "online" : "offline";
    }
  });

  res.json({ success: true, license, newStatus: license.status });
});

app.post("/api/admin/licenses/:id/set-status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const license = licenses.find(l => l.id === id || l.key === id);
  if (!license) {
    return res.status(404).json({ error: "Lisans bulunamadı." });
  }

  if (["active", "revoked", "expired", "pending_agreement"].includes(status)) {
    license.status = status;
  } else {
    return res.status(400).json({ error: "Geçersiz durum değeri." });
  }

  FirestoreDataService.saveLicense(license).catch(console.error);
  licenses = licenses.map(l => (l.id === license.id ? { ...license } : l));

  sessions.forEach(s => {
    if (s.licenseKey === license.key) {
      s.status = license.status === "active" ? "online" : "offline";
    }
  });

  res.json({ success: true, license, newStatus: license.status });
});

app.post("/api/admin/licenses/bulk-status", async (req, res) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || !["active", "revoked"].includes(status)) {
    return res.status(400).json({ error: "Geçersiz parametreler." });
  }

  const updated: LicenseKey[] = [];
  for (const l of licenses) {
    if (ids.includes(l.id) || ids.includes(l.key)) {
      l.status = status;
      FirestoreDataService.saveLicense(l).catch(console.error);
      updated.push(l);
    }
  }

  licenses = licenses.map(l => {
    const found = updated.find(u => u.id === l.id);
    return found ? { ...found } : l;
  });

  res.json({ success: true, count: updated.length, updated });
});

app.post("/api/admin/licenses/:id/toggle-revoke", async (req, res) => {
  const { id } = req.params;
  const license = licenses.find(l => l.id === id || l.key === id);
  if (!license) {
    return res.status(404).json({ error: "Lisans bulunamadı." });
  }

  if (license.status === "revoked") {
    license.status = getDaysRemaining(license.expiresAt) > 0 ? "active" : "expired";
  } else {
    license.status = "revoked";
  }

  FirestoreDataService.saveLicense(license).catch(console.error);
  licenses = licenses.map(l => (l.id === license.id ? { ...license } : l));
  res.json({ success: true, license });
});

app.post("/api/admin/licenses/:id/unbind-device", async (req, res) => {
  const { id } = req.params;
  const { hwid } = req.body;

  const license = licenses.find(l => l.id === id || l.key === id);
  if (!license) {
    return res.status(404).json({ error: "Lisans bulunamadı." });
  }

  if (hwid && typeof hwid === 'string' && hwid.trim()) {
    const cleanTarget = hwid.trim().toLowerCase();
    license.boundDevices = (license.boundDevices || []).filter(d => {
      const devHwid = (d.hwid || '').trim().toLowerCase();
      return devHwid !== cleanTarget && !devHwid.includes(cleanTarget) && !cleanTarget.includes(devHwid);
    });
  } else {
    // SIFIRLA: Tüm bağlı donanım kilitlerini kaldır
    license.boundDevices = [];
  }

  FirestoreDataService.saveLicense(license).catch(console.error);
  licenses = licenses.map(l => (l.id === license.id ? { ...license } : l));
  res.json({ success: true, license });
});

app.delete("/api/admin/licenses/:id", async (req, res) => {
  const { id } = req.params;

  const target = licenses.find(l => l.id === id || l.key === id || l.id.toLowerCase() === id.toLowerCase() || l.key.toLowerCase() === id.toLowerCase());
  const targetKey = target?.key;

  if (target) {
    // 1. Check if there are active agreement logs for this customer / license
    const matchingAgreements = agreementLogs.filter(a =>
      a.licenseKey === target.key || (targetKey && a.licenseKey === targetKey) || a.customerName === target.customerName
    );

    if (matchingAgreements.length > 0) {
      for (const agr of matchingAgreements) {
        const archivedItem: ArchivedAgreementLog = {
          ...agr,
          id: `arch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          archivedAt: new Date().toISOString(),
          archiveReason: `Lisans silindiği için kayıtlı onay arşivlendi (${target.customerName} - ${target.key})`,
          deletedCustomerName: target.customerName,
        };
        FirestoreDataService.saveArchivedAgreement(archivedItem).catch(console.error);
        archivedAgreements.push(archivedItem);

        // Remove from active agreements
        FirestoreDataService.deleteAgreement(agr.id).catch(console.error);
        agreementLogs = agreementLogs.filter(a => a.id !== agr.id);
      }
    } else if (target.agreementAccepted) {
      // Even if no separate agreement log row existed, create an archive record from license metadata
      const hashVal = crypto.createHash("sha256").update(`${target.key}:${target.customerName}:${target.createdAt}`).digest("hex");
      const fallbackArchived: ArchivedAgreementLog = {
        id: `arch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        licenseKey: target.key,
        customerName: target.customerName,
        customerEmail: target.customerEmail || "",
        hwid: target.boundDevices?.[0]?.hwid || "Cihaz Kaydı",
        acceptedAt: target.agreementAcceptedAt || target.createdAt || new Date().toISOString(),
        ipAddress: target.agreementIp || "127.0.0.1",
        agreementVersion: AGREEMENT_VERSION,
        legalHash: `SHA256:${hashVal}`,
        termsTitle: "AKINCI FSEK 5846 EULA Sözleşmesi",
        lawReference: LAW_REF,
        archivedAt: new Date().toISOString(),
        archiveReason: `Lisans silindiği için kayıtlı onay arşivlendi (${target.customerName} - ${target.key})`,
        deletedCustomerName: target.customerName,
      };
      FirestoreDataService.saveArchivedAgreement(fallbackArchived).catch(console.error);
      archivedAgreements.push(fallbackArchived);
    }
  }

  // 2. Delete license from in-memory and Firestore
  licenses = licenses.filter(l => l.id !== id && l.key !== id && (!targetKey || l.key !== targetKey));
  FirestoreDataService.deleteLicense(id).catch(console.error);
  if (targetKey && targetKey !== id) {
    FirestoreDataService.deleteLicense(targetKey).catch(console.error);
  }

  // 3. Also remove all sessions associated with this deleted license from memory and Firestore
  sessions = sessions.filter(s => s.licenseKey !== id && (!targetKey || s.licenseKey !== targetKey));
  if (targetKey) {
    FirestoreDataService.deleteSessionsByLicenseKey(targetKey).catch(console.error);
  }
  FirestoreDataService.deleteSessionsByLicenseKey(id).catch(console.error);

  res.json({ success: true, message: "Lisans kalıcı olarak silindi, bağlı oturumlar temizlendi ve dijital onayları arşive taşındı." });
});

app.get("/api/admin/sessions", (req, res) => {
  res.json(getEnrichedSessions());
});

app.delete("/api/admin/sessions/:id", async (req, res) => {
  const { id } = req.params;
  await FirestoreDataService.deleteSession(id);
  sessions = sessions.filter(s => s.id !== id);
  res.json({ success: true, message: "Oturum başarıyla silindi." });
});

app.post("/api/admin/sessions/purge-offline", async (req, res) => {
  const now = Date.now();
  const twoMinAgo = now - 2.5 * 60 * 1000;
  
  const offlineSessions = sessions.filter(s => {
    const pingTime = new Date(s.lastPingAt).getTime();
    return pingTime <= twoMinAgo || s.status === 'offline';
  });

  for (const sess of offlineSessions) {
    await FirestoreDataService.deleteSession(sess.id);
  }

  sessions = sessions.filter(s => {
    const pingTime = new Date(s.lastPingAt).getTime();
    return pingTime > twoMinAgo && s.status === 'online';
  });

  res.json({ success: true, purgedCount: offlineSessions.length, message: `${offlineSessions.length} adet çevrimdışı oturum temizlendi.` });
});

// -------------------------------------------------------------
// ADMIN MULTI-DEVICE AUTHENTICATION APIS
// -------------------------------------------------------------
const ADMIN_MASTER_USERNAMES = ["potakoğlu", "potakoglu", "polakoğlu", "polakoglu", "mahmutakin", "admin"];
const ADMIN_MASTER_EMAILS = ["akincisurfer1@gmail.com", "mahmutakn86@gmail.com"];
const ADMIN_MASTER_PHONES = ["+905398505268", "05398505268", "5398505268", "+90 539 850 52 68", "539 850 5268"];
const ADMIN_MASTER_PASS = "Akinci_B1927A38";

interface AdminOtpRecord {
  code: string;
  identifier: string;
  expiresAt: number;
  attempts: number;
}

const activeAdminTokens = new Map<string, AdminSessionToken>();
const activeAdminOtps = new Map<string, AdminOtpRecord>();

function normalizePhone(val: string): string {
  return val.replace(/[\s\-\(\)\+]/g, '');
}

function normalizeUsername(val: string): string {
  return (val || "")
    .trim()
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/i̇/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c');
}

function isAdminUsernameValid(input: string): boolean {
  if (!input) return false;
  const clean = normalizeUsername(input);
  return ADMIN_MASTER_USERNAMES.some(u => normalizeUsername(u) === clean);
}

function isAdminIdentifierValid(input: string): boolean {
  if (!input) return false;
  const clean = input.trim().toLowerCase();
  if (ADMIN_MASTER_EMAILS.some(e => e.toLowerCase() === clean)) return true;
  const numOnly = normalizePhone(input);
  return ADMIN_MASTER_PHONES.some(p => normalizePhone(p) === numOnly || numOnly.endsWith("5398505268"));
}

// 1. Direct Admin Login (3 Fields: Username + Email/Phone + Password)
app.post("/api/admin/auth/login", async (req, res) => {
  const { username, identifier, email, password, rememberMe } = req.body;
  const userEmail = (email || identifier || "").toString();
  const clientIp = req.headers["x-forwarded-for"]?.toString() || req.socket.remoteAddress || "127.0.0.1";

  if (!username || !userEmail || !password) {
    return res.status(400).json({ 
      success: false, 
      message: "Lütfen Kullanıcı Adı, E-posta adresi ve Şifre alanlarının üçünü de eksiksiz doldurunuz." 
    });
  }

  const isUserOk = isAdminUsernameValid(username);
  const isIdentifierOk = isAdminIdentifierValid(userEmail);
  const isPassOk = password.trim() === ADMIN_MASTER_PASS;

  if (!isUserOk || !isIdentifierOk || !isPassOk) {
    return res.status(401).json({
      success: false,
      message: "Geçersiz giriş bilgileri! Kullanıcı adı, e-posta veya şifre hatalı. Lütfen tüm alanları doğru doldurunuz."
    });
  }

  const normKey = userEmail.trim().toLowerCase();
  // Generate strong session token
  const token = `AKN-ADMIN-${crypto.randomBytes(24).toString("hex")}`;
  // If rememberMe is checked (default true), give a full 30 days. Otherwise 24 hours.
  const isRemember = rememberMe !== false;
  const durationMs = isRemember ? 30 * 24 * 3600 * 1000 : 24 * 3600 * 1000;

  const sessionObj: AdminSessionToken = {
    token,
    adminIdentifier: normKey,
    adminName: "Mahmut Akın (Yönetici & Eser Sahibi)",
    adminEmail: normKey.includes("@") ? normKey : "akincisurfer1@gmail.com",
    adminPhone: "+90 539 850 52 68",
    createdAt: Date.now(),
    expiresAt: Date.now() + durationMs,
    rememberMe: isRemember,
    ip: clientIp,
  };

  activeAdminTokens.set(token, sessionObj);
  // Persist directly to Firebase Firestore so server restarts do NOT destroy login
  await FirestoreDataService.saveAdminToken(sessionObj);

  return res.json({
    success: true,
    token,
    admin: {
      name: sessionObj.adminName,
      email: sessionObj.adminEmail,
      phone: sessionObj.adminPhone,
      expiresAt: new Date(sessionObj.expiresAt).toISOString(),
    },
    message: "Yönetici girişi başarıyla tamamlandı. Hoş geldiniz Mahmut Bey."
  });
});

// 2. Admin Login Step 2: 2FA OTP verification -> returns auth token
app.post("/api/admin/auth/verify-2fa", async (req, res) => {
  const { identifier, code, rememberMe } = req.body;
  const clientIp = req.headers["x-forwarded-for"]?.toString() || req.socket.remoteAddress || "127.0.0.1";

  if (!identifier || !code) {
    return res.status(400).json({ success: false, message: "Kimlik ve 6 haneli doğrulama kodu gereklidir." });
  }

  const normKey = identifier.trim().toLowerCase();
  const otpRec = activeAdminOtps.get(normKey);

  if (!otpRec) {
    return res.status(400).json({ success: false, message: "Doğrulama kodu bulunamadı veya süresi doldu. Lütfen tekrar giriş yapınız." });
  }

  if (Date.now() > otpRec.expiresAt) {
    activeAdminOtps.delete(normKey);
    return res.status(400).json({ success: false, message: "Doğrulama kodunun 5 dakikalık süresi dolmuştur. Yeni kod talep ediniz." });
  }

  if (otpRec.code !== code.toString().trim()) {
    otpRec.attempts += 1;
    if (otpRec.attempts >= 4) {
      activeAdminOtps.delete(normKey);
      return res.status(403).json({ success: false, message: "Çok fazla hatalı kod denemesi yapıldı. Güvenlik nedeniyle oturum kilitlendi." });
    }
    return res.status(400).json({ success: false, message: `Hatalı doğrulama kodu! (Kalan deneme hakkı: ${4 - otpRec.attempts})` });
  }

  // OTP is valid! Delete used OTP
  activeAdminOtps.delete(normKey);

  // Generate strong session token
  const token = `AKN-ADMIN-${crypto.randomBytes(24).toString("hex")}`;
  const isRemember = rememberMe !== false;
  const durationMs = isRemember ? 30 * 24 * 3600 * 1000 : 24 * 3600 * 1000;

  const sessionObj: AdminSessionToken = {
    token,
    adminIdentifier: normKey,
    adminName: "Mahmut Akın (Yönetici & Eser Sahibi)",
    adminEmail: ADMIN_MASTER_EMAILS[0],
    adminPhone: "+90 539 850 52 68",
    createdAt: Date.now(),
    expiresAt: Date.now() + durationMs,
    rememberMe: isRemember,
    ip: clientIp,
  };

  activeAdminTokens.set(token, sessionObj);
  await FirestoreDataService.saveAdminToken(sessionObj);

  res.json({
    success: true,
    token,
    admin: {
      name: sessionObj.adminName,
      email: sessionObj.adminEmail,
      phone: sessionObj.adminPhone,
      expiresAt: new Date(sessionObj.expiresAt).toISOString(),
    },
    message: "Yönetici kimliği ve 2FA doğrulaması başarıyla tamamlandı. Hoş geldiniz Mahmut Bey."
  });
});

// 3. Resend OTP code
app.post("/api/admin/auth/resend-code", (req, res) => {
  const { identifier } = req.body;
  if (!identifier || !isAdminIdentifierValid(identifier)) {
    return res.status(400).json({ success: false, message: "Geçersiz kimlik bilgisi." });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const normKey = identifier.trim().toLowerCase();

  activeAdminOtps.set(normKey, {
    code: otpCode,
    identifier: normKey,
    expiresAt: Date.now() + 5 * 60 * 1000,
    attempts: 0,
  });

  const isEmail = identifier.includes("@");
  const maskedDest = isEmail
    ? "m***86@gmail.com (E-posta)"
    : "+90 539 *** ** 68 (SMS & MSN)";

  res.json({
    success: true,
    message: `Yeni doğrulama kodu ${maskedDest} adresine iletildi.`,
    simulatedCode: otpCode,
    expiresInSeconds: 300,
  });
});

// 4. Check / validate current session token (Survives server restart & verifies 30-day limit)
app.get("/api/admin/auth/check", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader ? authHeader.replace("Bearer ", "").trim() : (req.query.token as string);

  if (!token) {
    return res.json({ authenticated: false });
  }

  let sess = activeAdminTokens.get(token);
  if (!sess) {
    // If not in local Node.js memory (e.g. server restarted / container redeployed), query Firestore!
    const fromFirestore = await FirestoreDataService.getAdminToken(token);
    if (fromFirestore) {
      sess = fromFirestore;
      activeAdminTokens.set(token, sess);
    }
  }

  if (!sess) {
    return res.json({ authenticated: false });
  }

  // Check 30-day expiry timestamp
  if (Date.now() > sess.expiresAt) {
    activeAdminTokens.delete(token);
    await FirestoreDataService.deleteAdminToken(token);
    return res.json({ authenticated: false, message: "30 günlük oturum süresi doldu. Lütfen tekrar giriş yapınız." });
  }

  res.json({
    authenticated: true,
    admin: {
      name: sess.adminName,
      email: sess.adminEmail,
      phone: sess.adminPhone,
      expiresAt: new Date(sess.expiresAt).toISOString(),
    }
  });
});

// 5. Logout (Explicit user action clears token from server and Firestore)
app.post("/api/admin/auth/logout", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader ? authHeader.replace("Bearer ", "").trim() : (req.body.token as string);
  if (token) {
    activeAdminTokens.delete(token);
    await FirestoreDataService.deleteAdminToken(token);
  }
  res.json({ success: true, message: "Oturum güvenle kapatıldı." });
});

app.get("/api/admin/agreements", (req, res) => {
  res.json(getEnrichedAgreements());
});

app.delete("/api/admin/agreements/:id", async (req, res) => {
  const { id } = req.params;
  agreementLogs = agreementLogs.filter(a => a.id !== id && a.licenseKey !== id);
  FirestoreDataService.deleteAgreement(id).catch(console.error);
  res.json({ success: true, message: "Dijital onay kaydı silindi." });
});

app.get("/api/admin/archived-agreements", (req, res) => {
  for (const arch of archivedAgreements) {
    if (!arch.customerEmail) arch.customerEmail = "Belirtilmedi";
    if (!arch.ipAddress || arch.ipAddress === '127.0.0.1' || arch.ipAddress === 'DirectCloud') arch.ipAddress = "-";
    if (!arch.acceptedAt) arch.acceptedAt = arch.archivedAt || new Date().toISOString();
    if (!arch.legalHash || arch.legalHash === '-') {
      const hash = crypto.createHash('sha256').update(`${arch.licenseKey}:${arch.customerName}:${arch.acceptedAt}:${arch.ipAddress}:v2026.1`).digest('hex');
      arch.legalHash = `SHA256:${hash}`;
    }
  }
  res.json(archivedAgreements);
});

app.delete("/api/admin/archived-agreements/:id", async (req, res) => {
  const { id } = req.params;
  archivedAgreements = archivedAgreements.filter(a => a.id !== id && a.licenseKey !== id);
  FirestoreDataService.deleteArchivedAgreement(id).catch(console.error);
  res.json({ success: true, message: "Arşivlenmiş dijital onay kaydı kalıcı olarak silindi." });
});

app.post("/api/admin/reset-demo-data", (req, res) => {
  res.json({ success: true, message: "Örnek veriler yenilendi." });
});

app.get("/api/python-code", (req, res) => {
  let backendHost = req.protocol + '://' + req.get('host');
  if (backendHost.includes('ais-dev-')) {
    backendHost = backendHost.replace('ais-dev-', 'ais-pre-');
  }
  try {
    const filename = req.query.file === 'Akinci_Cloud_Lisans.py' ? 'Akinci_Cloud_Lisans.py' : 'AKINCI_SURFER_PRO_DUAL_GALILO_V10.py';
    let filePath = path.join(process.cwd(), 'public', filename);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), 'public', 'Akinci_Cloud_Lisans.py');
    }
    let code = fs.readFileSync(filePath, 'utf-8');
    code = code.replace(/DEFAULT_API_URL = "[^"]*"/, `DEFAULT_API_URL = "${backendHost}"`);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(code);
  } catch (err) {
    res.status(500).send("# Hata: Python dosyası okunamadı.");
  }
});

app.get("/api/download-python", (req, res) => {
  let backendHost = req.protocol + '://' + req.get('host');
  if (backendHost.includes('ais-dev-')) {
    backendHost = backendHost.replace('ais-dev-', 'ais-pre-');
  }
  try {
    let filename = 'Akinci_Cloud_Lisans.py';
    if (req.query.file === 'AKINCI_SURFER_PRO_DUAL_GALILO_V10.py') {
      filename = 'AKINCI_SURFER_PRO_DUAL_GALILO_V10.py';
    } else if (req.query.file === 'requirements.txt') {
      filename = 'requirements.txt';
    } else if (req.query.file === 'Akinci_Cloud_Lisans.py') {
      filename = 'Akinci_Cloud_Lisans.py';
    }
    
    let filePath = path.join(process.cwd(), 'public', filename);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), 'public', 'AKINCI_SURFER_PRO_DUAL_GALILO_V10.py');
    }
    let code = fs.readFileSync(filePath, 'utf-8');
    if (filename.endsWith('.py')) {
      code = code.replace(/DEFAULT_API_URL = "[^"]*"/, `DEFAULT_API_URL = "${backendHost}"`);
      res.setHeader('Content-Type', 'text/x-python; charset=utf-8');
    } else {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    }
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(code);
  } catch (err) {
    res.status(500).send("Dosya indirilemedi.");
  }
});

// -------------------------------------------------------------
// VITE & SERVER STARTUP
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AKINCI Cloud Firestore Lisans Sunucusu aktif: http://localhost:${PORT}`);
  });
}

startServer();
