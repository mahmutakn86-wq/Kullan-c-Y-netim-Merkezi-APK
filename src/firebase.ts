import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, onSnapshot } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, CustomProvider, AppCheck } from "firebase/app-check";
import rawConfig from "../firebase-applet-config.json";

// Default configuration from firebase-applet-config.json
export const firebaseConfig = {
  projectId: rawConfig.projectId || "gen-lang-client-0270652882",
  appId: rawConfig.appId || "1:903289738768:web:6cbdf189927e8d4c689c95",
  apiKey: rawConfig.apiKey || "AIzaSyBgUa6SF4Z-ljRPyuvYffV34huYWEYhupg",
  authDomain: rawConfig.authDomain || "gen-lang-client-0270652882.firebaseapp.com",
  firestoreDatabaseId: rawConfig.firestoreDatabaseId || "ai-studio-akincicloudlisan-3a34fed4-0751-41f0-88cf-b4ceecd716b7",
  storageBucket: rawConfig.storageBucket || "gen-lang-client-0270652882.firebasestorage.app",
  messagingSenderId: rawConfig.messagingSenderId || "903289738768",
  recaptchaSiteKey: rawConfig.recaptchaSiteKey || ""
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Custom database ID support for Firestore
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// App Check initialization with Localhost / Debug Token & reCAPTCHA Enterprise support
let appCheckInstance: AppCheck | null = null;

export const initAppCheckIfAvailable = (customSiteKey?: string): AppCheck | null => {
  if (typeof window === "undefined") return null;
  if (appCheckInstance) return appCheckInstance;

  try {
    const isLocalhost = window.location.hostname === "localhost" || 
                        window.location.hostname === "127.0.0.1" ||
                        window.location.hostname.includes("run.app") ||
                        process.env.NODE_ENV === "development";

    // Check if debug token is provided in window or localStorage
    const storedDebugToken = localStorage.getItem("akinci_appcheck_debug_token");
    if (storedDebugToken) {
      // @ts-ignore
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = storedDebugToken;
    } else if (isLocalhost) {
      // @ts-ignore
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    const siteKey = customSiteKey || firebaseConfig.recaptchaSiteKey || (window as any).__RECAPTCHA_SITE_KEY__;

    if (siteKey && siteKey.trim() !== "") {
      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(siteKey.trim()),
        isTokenAutoRefreshEnabled: true
      });
      console.log("🛡️ Firebase App Check (reCAPTCHA Enterprise) başarıyla başlatıldı.");
    } else if (isLocalhost) {
      console.log("🛡️ Firebase App Check: Yerel/Geliştirme Debug Modu devrede (Debug Token oluşturuluyor).");
    }
  } catch (err) {
    console.warn("⚠️ App Check başlatma uyarısı:", err);
  }

  return appCheckInstance;
};

// Automatically attempt initialization
if (typeof window !== "undefined") {
  initAppCheckIfAvailable();
}

export { appCheckInstance, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, onSnapshot };

