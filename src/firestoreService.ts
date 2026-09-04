import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";
import { LicenseKey, UserSession, AgreementLog, ArchivedAgreementLog, AdminSessionToken } from "./types.js";

// Read configuration from firebase-applet-config.json
let firebaseConfig: any = {
  projectId: "gen-lang-client-0270652882",
  appId: "1:903289738768:web:6cbdf189927e8d4c689c95",
  apiKey: "AIzaSyBgUa6SF4Z-ljRPyuvYffV34huYWEYhupg",
  authDomain: "gen-lang-client-0270652882.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-akincicloudlisan-3a34fed4-0751-41f0-88cf-b4ceecd716b7",
  storageBucket: "gen-lang-client-0270652882.firebasestorage.app",
  messagingSenderId: "903289738768"
};

try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, "utf-8");
    firebaseConfig = { ...firebaseConfig, ...JSON.parse(raw) };
  }
} catch (e) {
  console.warn("Firebase config load warning:", e);
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const firestoreDb = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export class FirestoreDataService {
  private static isInitialized = false;

  public static async initDatabase(seedLicenses: LicenseKey[], seedSessions: UserSession[], seedAgreements: AgreementLog[]) {
    if (this.isInitialized) return;
    try {
      const snap = await getDocs(collection(firestoreDb, "licenses"));
      if (snap.empty) {
        console.log("⚡ Firebase Firestore boş, başlangıç lisans ve sözleşme kayıtları aktarılıyor...");
        for (const lic of seedLicenses) {
          await setDoc(doc(firestoreDb, "licenses", lic.id), lic);
        }
        for (const sess of seedSessions) {
          await setDoc(doc(firestoreDb, "sessions", sess.id), sess);
        }
        for (const agr of seedAgreements) {
          await setDoc(doc(firestoreDb, "agreements", agr.id), agr);
        }
        console.log("✅ Firebase Firestore verileri başarıyla yüklendi.");
      } else {
        console.log(`✅ Firebase Firestore bağlı: ${snap.size} lisans mevcut.`);
      }
      this.isInitialized = true;
    } catch (err) {
      console.error("Firestore init hatası (yerel hafıza yedeği devrede):", err);
    }
  }

  public static async getAllLicenses(fallback: LicenseKey[]): Promise<LicenseKey[]> {
    try {
      const snap = await getDocs(collection(firestoreDb, "licenses"));
      if (!snap.empty) {
        const map = new Map<string, LicenseKey>();
        snap.forEach(docSnap => {
          const data = docSnap.data() as LicenseKey;
          const id = (data.id || docSnap.id).trim();
          const key = (data.key || "").trim().toUpperCase();
          const record: LicenseKey = {
            ...data,
            id,
            boundDevices: Array.isArray(data.boundDevices) ? data.boundDevices : []
          };

          // Dedup by canonical ID or License Key
          const existingById = map.get(id);
          const existingByKey = key ? Array.from(map.values()).find(l => l.key?.trim().toUpperCase() === key) : undefined;

          if (!existingById && !existingByKey) {
            map.set(id, record);
          } else {
            const target = existingById || existingByKey!;
            // Keep most up to date record without resurrecting deleted bound devices
            if (record.agreementAccepted && !target.agreementAccepted) {
              target.agreementAccepted = true;
              target.agreementAcceptedAt = record.agreementAcceptedAt;
              target.agreementSignerName = record.agreementSignerName;
              target.agreementIp = record.agreementIp;
            }
            if (record.lastUsedAt && (!target.lastUsedAt || new Date(record.lastUsedAt) > new Date(target.lastUsedAt))) {
              target.lastUsedAt = record.lastUsedAt;
            }
          }
        });
        return Array.from(map.values());
      } else if (this.isInitialized) {
        // If Firestore is initialized and empty, do not re-populate with fallback
        return [];
      }
    } catch (e) {
      console.warn("Firestore'dan lisanslar alınamadı, yerel bellek kullanılıyor:", e);
    }
    
    // Ensure fallback is also unique
    const fallbackMap = new Map<string, LicenseKey>();
    fallback.forEach(l => {
      const id = l.id.trim();
      if (!fallbackMap.has(id)) fallbackMap.set(id, {
        ...l,
        boundDevices: Array.isArray(l.boundDevices) ? l.boundDevices : []
      });
    });
    return Array.from(fallbackMap.values());
  }

  public static async saveLicense(license: LicenseKey) {
    try {
      const safeId = license.id || `lic-${Date.now()}`;
      const cleanLicense: LicenseKey = {
        ...license,
        id: safeId,
        boundDevices: Array.isArray(license.boundDevices) ? license.boundDevices : []
      };
      // Overwrite document completely so boundDevices: [] replaces previous array properly
      await setDoc(doc(firestoreDb, "licenses", safeId), cleanLicense);
    } catch (e) {
      console.error("Firestore lisans kaydetme hatası:", e);
    }
  }

  public static async deleteLicense(id: string) {
    try {
      await deleteDoc(doc(firestoreDb, "licenses", id));
    } catch (e) {
      console.error("Firestore lisans silme hatası:", e);
    }
  }

  public static async saveSession(session: UserSession) {
    try {
      const safeId = session.id || `sess-${Date.now()}`;
      await setDoc(doc(firestoreDb, "sessions", safeId), { ...session, id: safeId }, { merge: true });
    } catch (e) {
      console.error("Firestore oturum kaydetme hatası:", e);
    }
  }

  public static async deleteSession(id: string) {
    try {
      await deleteDoc(doc(firestoreDb, "sessions", id));
    } catch (e) {
      console.error("Firestore oturum silme hatası:", e);
    }
  }

  public static async deleteSessionsByLicenseKey(licenseKey: string) {
    try {
      const cleanKey = (licenseKey || "").trim().toUpperCase();
      if (!cleanKey) return;
      const snap = await getDocs(collection(firestoreDb, "sessions"));
      const promises: Promise<any>[] = [];
      for (const d of snap.docs) {
        const data = d.data() as UserSession;
        if ((data.licenseKey && data.licenseKey.trim().toUpperCase() === cleanKey) || d.id.includes(cleanKey)) {
          promises.push(deleteDoc(doc(firestoreDb, "sessions", d.id)));
        }
      }
      await Promise.all(promises);
    } catch (e) {
      console.error("Firestore lisansa ait oturumları silme hatası:", e);
    }
  }

  public static async cleanupOrphanSessions(validLicenseKeys: string[]) {
    try {
      const validSet = new Set(validLicenseKeys.map(k => (k || "").trim().toUpperCase()));
      const snap = await getDocs(collection(firestoreDb, "sessions"));
      const promises: Promise<any>[] = [];
      for (const d of snap.docs) {
        const data = d.data() as UserSession;
        const licKey = (data.licenseKey || "").trim().toUpperCase();
        if (licKey && !validSet.has(licKey)) {
          promises.push(deleteDoc(doc(firestoreDb, "sessions", d.id)));
        }
      }
      await Promise.all(promises);
    } catch (e) {
      console.error("Firestore yetkisiz/silinmiş oturum temizleme hatası:", e);
    }
  }

  public static async getAllSessions(fallback: UserSession[]): Promise<UserSession[]> {
    try {
      const snap = await getDocs(collection(firestoreDb, "sessions"));
      if (!snap.empty) {
        const map = new Map<string, UserSession>();
        snap.forEach(d => {
          const data = d.data() as UserSession;
          const id = (data.id || d.id).trim();
          if (!map.has(id)) {
            map.set(id, { ...data, id });
          }
        });
        return Array.from(map.values());
      }
    } catch (e) {
      console.warn("Firestore oturumlar alınamadı:", e);
    }
    const fallbackMap = new Map<string, UserSession>();
    fallback.forEach(s => {
      const id = s.id.trim();
      if (!fallbackMap.has(id)) fallbackMap.set(id, s);
    });
    return Array.from(fallbackMap.values());
  }

  public static async saveAgreement(agreement: AgreementLog) {
    try {
      const safeId = agreement.id || `agr-${Date.now()}`;
      await setDoc(doc(firestoreDb, "agreements", safeId), { ...agreement, id: safeId }, { merge: true });
    } catch (e) {
      console.error("Firestore sözleşme kaydetme hatası:", e);
    }
  }

  public static async getAllAgreements(fallback: AgreementLog[]): Promise<AgreementLog[]> {
    try {
      const snap = await getDocs(collection(firestoreDb, "agreements"));
      if (!snap.empty) {
        const map = new Map<string, AgreementLog>();
        snap.forEach(d => {
          const data = d.data() as AgreementLog;
          const id = (data.id || d.id).trim();
          if (!map.has(id)) {
            map.set(id, { ...data, id });
          }
        });
        return Array.from(map.values());
      }
    } catch (e) {
      console.warn("Firestore sözleşmeler alınamadı:", e);
    }
    const fallbackMap = new Map<string, AgreementLog>();
    fallback.forEach(a => {
      const id = a.id.trim();
      if (!fallbackMap.has(id)) fallbackMap.set(id, a);
    });
    return Array.from(fallbackMap.values());
  }

  public static async deleteAgreement(id: string) {
    try {
      await deleteDoc(doc(firestoreDb, "agreements", id));
    } catch (e) {
      console.error("Firestore sözleşme silme hatası:", e);
    }
  }

  public static async saveArchivedAgreement(archived: ArchivedAgreementLog) {
    try {
      const safeId = archived.id || `arch-${Date.now()}`;
      await setDoc(doc(firestoreDb, "archived_agreements", safeId), { ...archived, id: safeId }, { merge: true });
    } catch (e) {
      console.error("Firestore arşiv sözleşme kaydetme hatası:", e);
    }
  }

  public static async getAllArchivedAgreements(fallback: ArchivedAgreementLog[]): Promise<ArchivedAgreementLog[]> {
    try {
      const snap = await getDocs(collection(firestoreDb, "archived_agreements"));
      if (!snap.empty) {
        const map = new Map<string, ArchivedAgreementLog>();
        snap.forEach(d => {
          const data = d.data() as ArchivedAgreementLog;
          const id = (data.id || d.id).trim();
          if (!map.has(id)) {
            map.set(id, { ...data, id });
          }
        });
        return Array.from(map.values());
      }
    } catch (e) {
      console.warn("Firestore arşiv sözleşmeler alınamadı:", e);
    }
    const fallbackMap = new Map<string, ArchivedAgreementLog>();
    fallback.forEach(a => {
      const id = a.id.trim();
      if (!fallbackMap.has(id)) fallbackMap.set(id, a);
    });
    return Array.from(fallbackMap.values());
  }

  public static async deleteArchivedAgreement(id: string) {
    try {
      await deleteDoc(doc(firestoreDb, "archived_agreements", id));
    } catch (e) {
      console.error("Firestore arşiv sözleşme silme hatası:", e);
    }
  }

  // Admin Session Token Persistence (Ensures 30-Day "Remember Me" survives server restarts / redeployments)
  public static async saveAdminToken(sessionToken: AdminSessionToken) {
    try {
      if (!sessionToken.token) return;
      await setDoc(doc(firestoreDb, "admin_tokens", sessionToken.token), sessionToken, { merge: true });
    } catch (e) {
      console.error("Firestore admin oturum token'ı kaydetme hatası:", e);
    }
  }

  public static async getAdminToken(token: string): Promise<AdminSessionToken | null> {
    try {
      if (!token) return null;
      const snap = await getDoc(doc(firestoreDb, "admin_tokens", token));
      if (snap.exists()) {
        return snap.data() as AdminSessionToken;
      }
    } catch (e) {
      console.warn("Firestore admin oturum token'ı sorgulanamadı:", e);
    }
    return null;
  }

  public static async deleteAdminToken(token: string) {
    try {
      if (!token) return;
      await deleteDoc(doc(firestoreDb, "admin_tokens", token));
    } catch (e) {
      console.error("Firestore admin oturum token'ı silme hatası:", e);
    }
  }

  public static async cleanupExpiredAdminTokens() {
    try {
      const snap = await getDocs(collection(firestoreDb, "admin_tokens"));
      const now = Date.now();
      for (const d of snap.docs) {
        const data = d.data() as AdminSessionToken;
        if (data.expiresAt && data.expiresAt < now) {
          await deleteDoc(doc(firestoreDb, "admin_tokens", d.id));
        }
      }
    } catch (e) {
      console.warn("Firestore süresi dolmuş admin token temizleme uyarısı:", e);
    }
  }
}
