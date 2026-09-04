export interface BoundDevice {
  hwid: string;
  deviceName: string;
  firstUsedAt: string;
  lastSeenAt: string;
  ip: string;
}

export type LicensePlan = '1day' | '3days' | '7days' | '15days' | 'trial' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'lifetime' | 'custom';
export type LicenseStatus = 'active' | 'expired' | 'revoked' | 'pending_agreement';

export type Currency = 'TL' | 'USD';
export type PaymentType = 'cash' | 'installment';
export type PaymentStatus = 'paid' | 'unpaid' | 'partial' | 'overdue';

export interface LicenseInstallment {
  id: string;
  installmentNo: number;
  totalInstallments: number;
  amount: number; // TL veya USD
  currency?: Currency;
  dueDate: string; // ISO string e.g. "2026-09-15T00:00:00.000Z"
  dayOfMonth: number; // e.g. 15
  status: 'paid' | 'unpaid' | 'overdue';
  paidAt?: string;
  notes?: string;
}

export interface PaymentInfo {
  totalPrice: number; // Toplam Lisans Bedeli
  currency: Currency; // 'TL' | 'USD'
  paymentType: PaymentType; // 'cash' (Peşin) | 'installment' (Taksitli)
  status: PaymentStatus;
  downPayment?: number; // Alınan Peşinat (Taksitli satışlarda başlangıçta ödenen nakit)
  downPaymentPaidAt?: string;
  paidAmount: number; // Toplam Ödenen Tutar (Peşinat + Ödenen Taksitler)
  remainingAmount: number; // Kalan Bakiye
  installmentCount?: number; // Kaç taksit
  dayOfMonth?: number; // Her ayın kaçı (1-31)
  installments?: LicenseInstallment[];
  cashPaidAt?: string;
  notes?: string;
}

export interface LicenseKey {
  id: string;
  key: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  plan: LicensePlan;
  durationDays?: number;
  firstActivatedAt?: string;
  createdAt: string;
  expiresAt: string;
  status: LicenseStatus;
  maxDevices: number;
  boundDevices: BoundDevice[];
  agreementAccepted: boolean;
  agreementAcceptedAt?: string;
  agreementSignerName?: string;
  agreementIp?: string;
  legalHash?: string;
  notes?: string;
  allowedModules: string[];
  lastUsedAt?: string;
  paymentInfo?: PaymentInfo;
}

export interface UserSession {
  id: string;
  licenseKey: string;
  customerName: string;
  hwid: string;
  deviceName: string;
  osVersion: string;
  appVersion: string;
  ip: string;
  location: string;
  lastPingAt: string;
  status: 'online' | 'idle' | 'offline';
  activeModule: string;
  sessionStartedAt: string;
  actionCount: number;
}

export interface AgreementLog {
  id: string;
  licenseKey: string;
  customerName: string;
  customerEmail: string;
  hwid: string;
  acceptedAt: string;
  ipAddress: string;
  agreementVersion: string;
  legalHash: string;
  termsTitle: string;
  lawReference: string; // e.g. "5846 Sayılı FSEK Kapsamında Koruma ve Kullanım Sözleşmesi"
}

export interface ArchivedAgreementLog extends AgreementLog {
  archivedAt: string;
  archiveReason: string;
  deletedCustomerName: string;
}

export interface AdminSessionToken {
  token: string;
  adminIdentifier: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  createdAt: number;
  expiresAt: number;
  rememberMe?: boolean;
  ip: string;
}

export interface VerifyLicenseRequest {
  licenseKey: string;
  hwid: string;
  deviceName?: string;
  appVersion?: string;
  osVersion?: string;
  currentModule?: string;
}

export interface VerifyLicenseResponse {
  valid: boolean;
  status: LicenseStatus;
  message: string;
  daysRemaining: number;
  expiresAt: string;
  customerName?: string;
  agreementRequired: boolean;
  allowedModules: string[];
  sessionToken?: string;
  serverTime: string;
}

export interface AcceptAgreementRequest {
  licenseKey: string;
  hwid: string;
  signerName: string;
  signerEmail: string;
  deviceName?: string;
}

export interface InstallmentNotification {
  id: string;
  licenseId: string;
  licenseKey: string;
  customerName: string;
  customerPhone?: string;
  installmentId: string;
  installmentNo: number;
  totalInstallments: number;
  amount: number;
  dueDate: string;
  dayOfMonth: number;
  status: 'paid' | 'unpaid' | 'overdue';
  daysLeft: number; // 0 = today, < 0 = overdue, > 0 = days remaining
  urgency: 'overdue' | 'today' | 'upcoming';
}

export interface DashboardStats {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  revokedLicenses: number;
  onlineUsersNow: number;
  signedAgreements: number;
  expiringIn7Days: number;
  totalRevenue?: number; // Toplam Lisans Bedeli TL
  totalCollected?: number; // Tahsil Edilen TL
  totalPending?: number; // Kalan Alacak TL
  dueInstallmentCount?: number; // Vadesi gelen/geciken taksit adedi
  dueInstallmentTotal?: number; // Vadesi gelen/geciken toplam tutar TL
}
