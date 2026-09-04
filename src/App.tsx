import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { LicenseManager } from './components/LicenseManager';
import { LiveTelemetry } from './components/LiveTelemetry';
import { AgreementAuditLogs } from './components/AgreementAuditLogs';
import { PythonIntegrationHub } from './components/PythonIntegrationHub';
import { GcpDeploymentGuide } from './components/GcpDeploymentGuide';
import { AppCheckCenter } from './components/AppCheckCenter';
import { RemoteAccessModal } from './components/RemoteAccessModal';
import { AdminLogin } from './components/AdminLogin';
import { LicenseKey, UserSession, AgreementLog, DashboardStats } from './types';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState('licenses');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRemoteModal, setShowRemoteModal] = useState(false);

  const [stats, setStats] = useState<DashboardStats>({
    totalLicenses: 5,
    activeLicenses: 3,
    expiredLicenses: 1,
    revokedLicenses: 0,
    onlineUsersNow: 2,
    signedAgreements: 3,
    expiringIn7Days: 1,
  });

  const [licenses, setLicenses] = useState<LicenseKey[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [agreements, setAgreements] = useState<AgreementLog[]>([]);

  // Check stored auth token on mount (Validates 30-day Remember Me status)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('akinci_admin_token') : null;
        const storedUser = typeof window !== 'undefined' ? localStorage.getItem('akinci_admin_user') : null;
        const storedExpiry = typeof window !== 'undefined' ? localStorage.getItem('akinci_admin_expiry') : null;

        if (!storedToken) {
          setIsAuthenticated(false);
          setAdminUser(null);
          setAuthChecking(false);
          return;
        }

        // Check if locally expired (30-day check)
        if (storedExpiry && new Date(storedExpiry).getTime() <= Date.now()) {
          localStorage.removeItem('akinci_admin_token');
          localStorage.removeItem('akinci_admin_user');
          localStorage.removeItem('akinci_admin_expiry');
          setIsAuthenticated(false);
          setAuthChecking(false);
          return;
        }

        // Fast-track load from localStorage if already saved, then verify with server/Firestore
        if (storedUser) {
          try {
            setAdminUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
          } catch (e) {}
        }

        const res = await fetch(`/api/admin/auth/check?token=${encodeURIComponent(storedToken)}`);
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          setAdminUser(data.admin);
          if (data.admin) {
            localStorage.setItem('akinci_admin_user', JSON.stringify(data.admin));
            if (data.admin.expiresAt) {
              localStorage.setItem('akinci_admin_expiry', data.admin.expiresAt);
            }
          }
        } else {
          // Token expired on server or was revoked/logged out
          localStorage.removeItem('akinci_admin_token');
          localStorage.removeItem('akinci_admin_user');
          localStorage.removeItem('akinci_admin_expiry');
          setIsAuthenticated(false);
          setAdminUser(null);
        }
      } catch (err) {
        // In case of offline/network glitch, if local token is still within 30 days, maintain state
        const storedExpiry = typeof window !== 'undefined' ? localStorage.getItem('akinci_admin_expiry') : null;
        if (storedExpiry && new Date(storedExpiry).getTime() > Date.now()) {
          const storedUser = localStorage.getItem('akinci_admin_user');
          if (storedUser) {
            try {
              setAdminUser(JSON.parse(storedUser));
              setIsAuthenticated(true);
            } catch (e) {}
          }
        }
      } finally {
        setAuthChecking(false);
      }
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = (userData: any, token: string) => {
    setAdminUser(userData);
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('akinci_admin_token', token);
      localStorage.setItem('akinci_admin_user', JSON.stringify(userData));
      if (userData?.expiresAt) {
        localStorage.setItem('akinci_admin_expiry', userData.expiresAt);
      }
    }
  };

  const handleLogout = async () => {
    try {
      const storedToken = localStorage.getItem('akinci_admin_token');
      if (storedToken) {
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: storedToken }),
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('akinci_admin_token');
      localStorage.removeItem('akinci_admin_user');
      localStorage.removeItem('akinci_admin_expiry');
      setIsAuthenticated(false);
      setAdminUser(null);
    }
  };

  const fetchAllData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/dashboard-data');
      if (res.ok) {
        const data = await res.json();
        if (data.stats) setStats(data.stats);
        if (Array.isArray(data.licenses)) {
          const uniqueLicMap = new Map<string, LicenseKey>();
          data.licenses.forEach((l: LicenseKey) => {
            const idKey = l.id || l.key;
            if (idKey && !uniqueLicMap.has(idKey)) {
              uniqueLicMap.set(idKey, l);
            }
          });
          setLicenses(Array.from(uniqueLicMap.values()));
        }
        if (Array.isArray(data.sessions)) {
          const uniqueSessMap = new Map<string, UserSession>();
          data.sessions.forEach((s: UserSession) => {
            const idKey = s.id || `${s.licenseKey}-${s.hwid}`;
            if (idKey && !uniqueSessMap.has(idKey)) {
              uniqueSessMap.set(idKey, s);
            }
          });
          setSessions(Array.from(uniqueSessMap.values()));
        }
        if (Array.isArray(data.agreements)) {
          const uniqueAgrMap = new Map<string, AgreementLog>();
          data.agreements.forEach((a: AgreementLog) => {
            const idKey = a.id || `${a.licenseKey}-${a.acceptedAt}`;
            if (idKey && !uniqueAgrMap.has(idKey)) {
              uniqueAgrMap.set(idKey, a);
            }
          });
          setAgreements(Array.from(uniqueAgrMap.values()));
        }
      } else {
        // Fallback to individual endpoints
        const [statsRes, licensesRes, sessionsRes, agreementsRes] = await Promise.all([
          fetch('/api/admin/stats').then((r) => r.json()),
          fetch('/api/admin/licenses').then((r) => r.json()),
          fetch('/api/admin/sessions').then((r) => r.json()),
          fetch('/api/admin/agreements').then((r) => r.json()),
        ]);
        if (statsRes) setStats(statsRes);
        if (Array.isArray(licensesRes)) setLicenses(licensesRes);
        if (Array.isArray(sessionsRes)) setSessions(sessionsRes);
        if (Array.isArray(agreementsRes)) setAgreements(agreementsRes);
      }
    } catch (err) {
      console.error('Veriler yüklenirken hata:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();

      // Auto-refresh telemetry every 10 seconds for real-time tracking
      const interval = setInterval(fetchAllData, 10000);
      return () => clearInterval(interval);
    }
  }, [fetchAllData, isAuthenticated]);

  const handleCardFilter = (cardId: string) => {
    if (cardId === 'online') {
      setActiveTab('telemetry');
    } else if (cardId === 'agreements') {
      setActiveTab('agreements');
    } else {
      setActiveTab('licenses');
      setFilterStatus(cardId);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#0d0e12] flex items-center justify-center text-slate-400">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono">AKINCI CLOUD Güvenlik Kontrolü...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, require Admin Login with 2FA
  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#0d0e12] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onlineCount={stats.onlineUsersNow}
        onRefresh={fetchAllData}
        isRefreshing={isRefreshing}
        onOpenRemoteModal={() => setShowRemoteModal(true)}
        onLogout={handleLogout}
        adminUser={adminUser}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Stats Overview Bar */}
        <StatsCards stats={stats} onFilterStatus={handleCardFilter} />

        {/* Tab Content Panels */}
        <div className="mt-6">
          {activeTab === 'licenses' && (
            <LicenseManager
              licenses={licenses}
              onRefresh={fetchAllData}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
            />
          )}

          {activeTab === 'telemetry' && (
            <LiveTelemetry sessions={sessions} licenses={licenses} onRefresh={fetchAllData} />
          )}

          {activeTab === 'agreements' && (
            <AgreementAuditLogs logs={agreements} onRefresh={fetchAllData} />
          )}

          {activeTab === 'app-check' && <AppCheckCenter />}

          {activeTab === 'integration' && (
            <PythonIntegrationHub licenses={licenses} onRefresh={fetchAllData} />
          )}

          {activeTab === 'gcp-guide' && <GcpDeploymentGuide />}
        </div>
      </main>

      {/* Remote Access & Live Broadcast URL Modal */}
      <RemoteAccessModal
        isOpen={showRemoteModal}
        onClose={() => setShowRemoteModal(false)}
      />

      {/* Footer */}
      <footer className="border-t border-[#1e2330] bg-[#101217] py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © 2026 <strong>Mahmut Akın</strong> (+90 539 850 52 68) - AKINCI OTOMATİK SURFER & ELEVATION GALILO
          </span>
          <span className="text-slate-400">
            5846 Sayılı Fikir ve Sanat Eserleri Kanunu Koruması
          </span>
          <span className="font-mono text-emerald-400">
            Google Cloud Firestore Kalıcı Veritabanı
          </span>
        </div>
      </footer>
    </div>
  );
}
