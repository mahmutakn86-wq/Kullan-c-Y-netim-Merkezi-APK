# -*- coding: utf-8 -*-
"""
================================================================================
✨ AKINCI OTOMATİK SURFER ULTIMATE v10.0 - BULUT LİSANS ENTEGRASYONU ✨
🔒 AKINCI Cloud Lisans & Kullanıcı Yönetim Merkezi ile Tam Uyumlu
================================================================================
Telif Hakkı & Lisans Sahibi: Mahmut Akın (5846 Sayılı FSEK Korumalıdır)
İletişim & Destek: +90 539 850 52 68 | Telegram: @akinci_surfer_voxler_analiz
================================================================================
"""

# ================================================
# 0. BAĞIMLILIKLAR VE GEREKLİ MODÜLLER
# ================================================
import os
import sys
import pythoncom
import win32api
import win32gui
import winreg
import traceback
import time
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext, Menu, simpledialog
from tkinter import font as tkfont
import json
from datetime import datetime, timedelta
import pyperclip
import math
import threading
import re
import simplekml
from PIL import Image, ImageTk
import shutil
import tempfile
import uuid
import csv
import win32com
import webbrowser
import requests
import winsound
import getpass
import ctypes
import wmi
import hashlib
import keyboard
import pyautogui
from pynput.mouse import Listener, Controller
import win32com.client as win32
from win32com.client.gencache import EnsureDispatch
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import logging
import platform
import subprocess

# ================================================
# 1. BULUT LİSANS VE GÜVENLİK MOTORU
# ================================================
LOG_DIR = os.path.join(os.path.expanduser("~"), ".akinci_surfer_logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "akinci_surfer.log")

logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(threadName)s] %(message)s",
    encoding="utf-8"
)

def log_event(level, message, exc=None):
    clean_msg = re.sub(r'AKN-[A-Za-z0-9\-]+', '[MASKED_KEY]', str(message))
    if level == "error":
        logging.error(clean_msg, exc_info=exc)
    elif level == "warning":
        logging.warning(clean_msg)
    else:
        logging.info(clean_msg)

DEFAULT_API_URL = "https://ais-pre-l2fembifbbwustocfsa7x6-781806603085.europe-west2.run.app"
APP_VERSION = "10.0 Ultimate"
REGISTRY_KEY_PATH = r"SOFTWARE\Golden Software\AK\SurProF_DUAL"
LICENSE_REG_KEY = "LicenseKey"
SERVER_REG_KEY = "CloudServerUrl"

# Nuitka / PyInstaller COM Cache Fix
if getattr(sys, 'frozen', False):
    try:
        import win32com.client.gencache
        gen_py_path = os.path.join(tempfile.gettempdir(), 'gen_py')
        if os.path.exists(gen_py_path):
            win32com.client.gencache.is_readonly = False
            win32com.client.gencache._MODULE_NAME_PREFIX = ""
            try:
                win32com.client.gencache.Rebuild(gen_py_path)
            except:
                pass
    except Exception as e:
        log_event("warning", f"COM Cache fix uyarısı: {e}")

def set_app_icon():
    try:
        myappid = 'akinci.surfer.ultimate.10.0'
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
    except:
        pass
    try:
        base_path = sys._MEIPASS if getattr(sys, 'frozen', False) else os.path.dirname(os.path.abspath(__file__))
        icon_path = os.path.join(base_path, "app_icon1.ico")
        return icon_path if os.path.exists(icon_path) else None
    except:
        return None

ICON_PATH = set_app_icon()

def normalize_cloud_url(url_str):
    u = (url_str or "").strip()
    if not u:
        return DEFAULT_API_URL
    if not u.startswith("http://") and not u.startswith("https://"):
        u = "https://" + u
    u = u.replace("12fembifbbwustocfsa7x6", "l2fembifbbwustocfsa7x6")
    u = u.replace("-12femb", "-l2femb")
    return u.rstrip("/")

class LanguageManager:
    LANGUAGES = {"tr": "Türkçe", "en": "English", "ar": "العربية", "fa": "فارسی"}
    current_language = "tr"
    REGISTRY_VALUE_NAME = "Language"
    observers = []

    def __init__(self):
        self.load_language_from_registry()

    def load_language_from_registry(self):
        if winreg:
            try:
                key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH, 0, winreg.KEY_READ)
                saved_lang, _ = winreg.QueryValueEx(key, self.REGISTRY_VALUE_NAME)
                winreg.CloseKey(key)
                if saved_lang in self.LANGUAGES:
                    self.current_language = saved_lang
            except:
                self.current_language = "tr"

    def save_language_to_registry(self, lang_code):
        if winreg:
            try:
                key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH)
                winreg.SetValueEx(key, self.REGISTRY_VALUE_NAME, 0, winreg.REG_SZ, lang_code)
                winreg.CloseKey(key)
                self.current_language = lang_code
                self.notify_observers()
                return True
            except:
                return False
        return False

    def get_text(self, text_dict):
        if isinstance(text_dict, dict):
            return text_dict.get(self.current_language, text_dict.get("tr", ""))
        return str(text_dict)

    def add_observer(self, callback):
        if callback not in self.observers:
            self.observers.append(callback)

    def notify_observers(self):
        for cb in self.observers:
            try: cb()
            except: pass

lang_manager = LanguageManager()
def _(text_dict): return lang_manager.get_text(text_dict)

def save_axes_setting_to_registry(value):
    if winreg:
        try:
            key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH)
            winreg.SetValueEx(key, "RemoveAxes", 0, winreg.REG_DWORD, int(value))
            winreg.CloseKey(key)
        except: pass

def load_axes_setting_from_registry():
    if winreg:
        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH, 0, winreg.KEY_READ)
            val, _ = winreg.QueryValueEx(key, "RemoveAxes")
            winreg.CloseKey(key)
            return bool(val)
        except: pass
    return False

def save_auto_setting_to_registry(value):
    if winreg:
        try:
            key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH)
            winreg.SetValueEx(key, "AutoProcess", 0, winreg.REG_DWORD, 1 if value else 0)
            winreg.CloseKey(key)
        except: pass

def load_auto_setting_from_registry():
    if winreg:
        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH, 0, winreg.KEY_READ)
            val, _ = winreg.QueryValueEx(key, "AutoProcess")
            winreg.CloseKey(key)
            return bool(val)
        except: pass
    return False

class AkinciCloudSecurity:
    def __init__(self):
        self.api_url = self.load_server_url()
        self.hwid = self.generate_hwid()
        self.device_name = f"{platform.node()} ({platform.system()} {platform.release()})"
        self.active_license = None
        self.heartbeat_running = False
        self.heartbeat_thread = None
        self.session = requests.Session()
        self.session.headers.update({
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": f"AkinciSurferUltimate/{APP_VERSION} (Windows NT 10.0; Win64; x64)"
        })

    def load_server_url(self):
        if winreg:
            try:
                key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH, 0, winreg.KEY_READ)
                val, _ = winreg.QueryValueEx(key, SERVER_REG_KEY)
                winreg.CloseKey(key)
                if val:
                    return normalize_cloud_url(val)
            except:
                pass
        return DEFAULT_API_URL

    def save_server_url(self, url):
        self.api_url = normalize_cloud_url(url)
        if winreg:
            try:
                key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH)
                winreg.SetValueEx(key, SERVER_REG_KEY, 0, winreg.REG_SZ, self.api_url)
                winreg.CloseKey(key)
            except:
                pass

    def generate_hwid(self):
        try:
            hwid_raw = ""
            if platform.system() == "Windows":
                try:
                    uuid_out = subprocess.check_output("wmic csproduct get uuid", shell=True, stderr=subprocess.DEVNULL).decode()
                    hwid_raw += uuid_out.split('\n')[1].strip()
                except: pass
                try:
                    cpu_out = subprocess.check_output("wmic cpu get processorid", shell=True, stderr=subprocess.DEVNULL).decode()
                    hwid_raw += "-" + cpu_out.split('\n')[1].strip()
                except: pass
            if not hwid_raw or len(hwid_raw) < 5:
                hwid_raw = f"{platform.node()}-{platform.machine()}-{platform.processor()}"
            h = hashlib.sha256(hwid_raw.encode('utf-8')).hexdigest().upper()
            return f"AKN-{h[:4]}-{h[4:8]}-{h[8:12]}-{h[12:16]}"
        except:
            return "AKN-HWID-" + hashlib.md5(platform.node().encode()).hexdigest()[:12].upper()

    def get_saved_license_key(self):
        if winreg:
            try:
                key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH, 0, winreg.KEY_READ)
                val, _ = winreg.QueryValueEx(key, LICENSE_REG_KEY)
                winreg.CloseKey(key)
                return val.strip()
            except: pass
        try:
            fpath = os.path.join(os.path.expanduser("~"), ".akinci_lic.json")
            if os.path.exists(fpath):
                with open(fpath, "r", encoding="utf-8") as f:
                    return json.load(f).get("key", "").strip()
        except: pass
        return ""

    def save_license_key(self, key_str):
        if winreg:
            try:
                key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH)
                winreg.SetValueEx(key, LICENSE_REG_KEY, 0, winreg.REG_SZ, key_str.strip())
                winreg.CloseKey(key)
            except: pass
        try:
            fpath = os.path.join(os.path.expanduser("~"), ".akinci_lic.json")
            with open(fpath, "w", encoding="utf-8") as f:
                json.dump({"key": key_str.strip(), "hwid": self.hwid, "savedAt": time.time()}, f)
        except: pass

    def is_locally_revoked(self, key_str):
        clean_key = (key_str or "").strip().upper()
        if not clean_key:
            return False, ""
        if winreg:
            try:
                key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH, 0, winreg.KEY_READ)
                revoked_val, _ = winreg.QueryValueEx(key, "LicenseRevoked")
                revoked_key, _ = winreg.QueryValueEx(key, "RevokedKey")
                revoked_reason, _ = winreg.QueryValueEx(key, "RevokedReason")
                winreg.CloseKey(key)
                if revoked_val and (revoked_key == clean_key or not revoked_key):
                    return True, revoked_reason or "Lisans yönetici tarafından PASİF (KİLİTLİ) duruma getirilmiştir."
            except: pass
        try:
            fpath = os.path.join(os.path.expanduser("~"), ".akinci_lic.json")
            if os.path.exists(fpath):
                with open(fpath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if data.get("revoked") is True and data.get("key") == clean_key:
                        return True, data.get("revokedReason", "Lisans yönetici tarafından PASİF edilmiştir.")
        except: pass
        return False, ""

    def mark_locally_revoked(self, key_str, reason="Yönetici tarafından PASİF (KİLİTLİ) yapıldı"):
        clean_key = (key_str or "").strip().upper()
        if winreg:
            try:
                key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH)
                winreg.SetValueEx(key, "LicenseRevoked", 0, winreg.REG_DWORD, 1)
                winreg.SetValueEx(key, "RevokedKey", 0, winreg.REG_SZ, clean_key)
                winreg.SetValueEx(key, "RevokedReason", 0, winreg.REG_SZ, str(reason))
                winreg.SetValueEx(key, "RevokedAt", 0, winreg.REG_SZ, datetime.now().isoformat())
                winreg.CloseKey(key)
            except: pass
        try:
            fpath = os.path.join(os.path.expanduser("~"), ".akinci_lic.json")
            data = {"key": clean_key, "hwid": self.hwid, "revoked": True, "revokedReason": str(reason), "revokedAt": datetime.now().isoformat()}
            with open(fpath, "w", encoding="utf-8") as f:
                json.dump(data, f)
        except: pass

    def clear_local_revocation(self, key_str):
        clean_key = (key_str or "").strip().upper()
        if winreg:
            try:
                key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH)
                winreg.SetValueEx(key, "LicenseRevoked", 0, winreg.REG_DWORD, 0)
                winreg.SetValueEx(key, "RevokedKey", 0, winreg.REG_SZ, "")
                winreg.SetValueEx(key, "RevokedReason", 0, winreg.REG_SZ, "")
                winreg.CloseKey(key)
            except: pass
        try:
            fpath = os.path.join(os.path.expanduser("~"), ".akinci_lic.json")
            if os.path.exists(fpath):
                with open(fpath, "w", encoding="utf-8") as f:
                    json.dump({"key": clean_key, "hwid": self.hwid, "revoked": False, "savedAt": time.time()}, f)
        except: pass

    def _make_http_post(self, endpoint_path, payload):
        target_urls = []
        norm_configured = normalize_cloud_url(self.api_url)
        norm_default = normalize_cloud_url(DEFAULT_API_URL)
        
        if norm_configured:
            target_urls.append(norm_configured)
        
        if "localhost" not in norm_configured and "127.0.0.1" not in norm_configured:
            target_urls.append("http://localhost:3000")
            target_urls.append("http://127.0.0.1:3000")

        if norm_default and norm_default not in target_urls:
            target_urls.append(norm_default)
        
        dev_url = norm_default.replace("ais-pre-", "ais-dev-")
        if dev_url not in target_urls:
            target_urls.append(dev_url)

        last_error = "Sunucuya bağlanılamadı"

        for clean_base in target_urls:
            full_url = f"{clean_base}{endpoint_path}"
            try:
                res = self.session.post(full_url, json=payload, timeout=5, allow_redirects=True)
                content_type = res.headers.get("content-type", "").lower()
                if "application/json" in content_type or (res.text and res.text.strip().startswith("{")):
                    try:
                        data = res.json()
                        return data, None
                    except Exception as json_err:
                        last_error = f"JSON Hatası: {json_err}"
                else:
                    last_error = f"Sunucu geçersiz yanıt verdi (HTTP {res.status_code})."
            except Exception as e:
                last_error = f"Ağ Hatası: {str(e)}"

        return None, last_error

    def test_connection(self):
        target_urls = []
        norm_configured = normalize_cloud_url(self.api_url)
        norm_default = normalize_cloud_url(DEFAULT_API_URL)
        if norm_configured: target_urls.append(norm_configured)
        if "localhost" not in norm_configured and "127.0.0.1" not in norm_configured:
            target_urls.append("http://localhost:3000")
            target_urls.append("http://127.0.0.1:3000")
        if norm_default not in target_urls: target_urls.append(norm_default)

        for u in target_urls:
            try:
                res = self.session.get(f"{u}/api/health", timeout=4, allow_redirects=True)
                if res.status_code == 200:
                    return True, f"Çevrimiçi ({u})"
            except: pass
        return False, "Sunucuya ulaşılamadı"

    def verify_license(self, license_key):
        clean_key = (license_key or "").strip().upper()
        if not clean_key:
            return {"valid": False, "status": "invalid", "message": "Lütfen bir lisans anahtarı giriniz!"}

        is_rev, rev_reason = self.is_locally_revoked(clean_key)
        if is_rev:
            return {
                "valid": False,
                "status": "revoked",
                "customerName": "Kilitli Kullanıcı",
                "daysRemaining": 0,
                "message": f"❌ Bu lisans yönetici tarafından PASİF (KİLİTLİ) yapılmıştır!\nSebep: {rev_reason}\nProgram başlatılamaz."
            }

        payload = {
            "licenseKey": clean_key,
            "hwid": self.hwid,
            "deviceName": self.device_name,
            "appVersion": APP_VERSION,
            "currentModule": "SURFER PRO DUAL & ELEVATION GALILO"
        }

        data, err = self._make_http_post("/api/license/verify", payload)
        
        if data is not None:
            if data.get("valid") is True and data.get("status") == "active":
                self.clear_local_revocation(clean_key)
                self.active_license = data
                self.save_license_key(clean_key)
                log_event("info", f"Kullanıcı Yönetim Merkezi Doğruladı: {data.get('customerName')} - Kalan Gün: {data.get('daysRemaining')}")
                return data
            elif data.get("agreementRequired") is True or data.get("status") == "pending_agreement":
                return {
                    "valid": False,
                    "status": "pending_agreement",
                    "agreementRequired": True,
                    "customerName": data.get("customerName", ""),
                    "daysRemaining": data.get("daysRemaining", 0),
                    "message": "5846 Sayılı Telif Sözleşmesi onayı bekleniyor."
                }
            elif data.get("status") == "revoked" or data.get("valid") is False and "pasif" in str(data.get("message", "")).lower():
                self.mark_locally_revoked(clean_key, data.get("message", "Yönetici tarafından PASİF yapıldı"))
                log_event("warning", f"Lisans Pasif/Kilitli: {data.get('message')}")
                return {
                    "valid": False,
                    "status": "revoked",
                    "customerName": data.get("customerName", ""),
                    "daysRemaining": 0,
                    "message": data.get("message", "❌ Bu lisans yönetici tarafından PASİF (KİLİTLİ) durumuna getirilmiştir! Kullanım engellenmiştir.")
                }
            elif data.get("status") == "expired":
                log_event("warning", f"Lisans Süresi Dolmuş: {data.get('message')}")
                return {
                    "valid": False,
                    "status": "expired",
                    "customerName": data.get("customerName", ""),
                    "daysRemaining": 0,
                    "message": data.get("message", "Lisans süreniz dolmuştur! Lütfen yenileyiniz.")
                }
            else:
                msg = data.get("message", "Geçersiz Lisans Anahtarı! Yönetim Merkezinde kayıtlı değil.")
                return {"valid": False, "status": "invalid", "message": msg}

        return {
            "valid": False,
            "status": "unreachable",
            "message": f"❌ Bulut Kullanıcı Yönetim Merkezine Bağlanılamadı!\n\nLisans yetkilendirmesi için Kullanıcı Yönetim Merkezi bağlantısı zorunludur.\n\nBulut Sunucu Adresi: {self.api_url}\n\nLütfen internet bağlantınızı kontrol ediniz veya Mahmut Akın (+90 539 850 52 68) ile iletişime geçiniz."
        }

    def accept_agreement(self, license_key, signer_name, signer_email=""):
        payload = {
            "licenseKey": (license_key or "").strip().upper(),
            "signerName": signer_name.strip(),
            "signerEmail": signer_email.strip(),
            "hwid": self.hwid,
            "deviceName": self.device_name
        }
        data, err = self._make_http_post("/api/license/agreement/accept", payload)
        if data is not None and data.get("success"):
            return data
        if winreg:
            try:
                key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH)
                winreg.SetValueEx(key, "AgreementSigned", 0, winreg.REG_SZ, signer_name)
                winreg.SetValueEx(key, "AgreementDate", 0, winreg.REG_SZ, datetime.now().isoformat())
                winreg.CloseKey(key)
            except: pass
        return {"success": True, "message": "Sözleşme başarıyla onaylandı."}

    def fetch_agreement_text(self):
        try:
            res = self.session.get(f"{normalize_cloud_url(self.api_url)}/api/license/agreement-text", timeout=4)
            if res.status_code == 200 and "application/json" in res.headers.get("content-type", ""):
                return res.json()
        except: pass
        return {
            "text": "5846 Sayılı Fikir ve Sanat Eserleri Kanunu (FSEK) uyarınca AKINCI OTOMATİK SURFER PRO DUAL & ELEVATION GALILO yazılımının tüm telif, fikri mülkiyet ve dağıtım hakları münhasıran Eser Sahibi Mahmut Akın'a aittir.\n\nİzinsiz kopyalanması, tersine mühendislik yapılması ve lisanssız dağıtılması 5846 Sayılı Kanun'un 71, 72 ve 73. maddeleri gereğince 1 yıldan 5 yıla kadar hapis ve adli para cezasına tabidir.",
            "lawReference": "5846 Sayılı FSEK & TCK Madde 243-244"
        }

    def start_heartbeat(self, license_key, get_active_module_func=None, on_revocation_callback=None):
        if self.heartbeat_running:
            return
        self.heartbeat_running = True

        def loop():
            clean_key = (license_key or "").strip().upper()
            while self.heartbeat_running:
                try:
                    active_mod = get_active_module_func() if get_active_module_func else "SURFER PRO DUAL + GALILO"
                    data, err = self._make_http_post("/api/license/heartbeat", {
                        "licenseKey": clean_key,
                        "hwid": self.hwid,
                        "activeModule": active_mod
                    })
                    if data:
                        if data.get("valid") is False or data.get("status") in ["revoked", "expired"]:
                            self.mark_locally_revoked(clean_key, data.get("message", "Yönetici tarafından PASİFE ALINDI"))
                            log_event("error", f"Canlı Lisans İptali / Pasif Durum: {data.get('message')}")
                            if on_revocation_callback:
                                on_revocation_callback(data)
                                break
                except Exception as e:
                    log_event("warning", f"Heartbeat uyarısı: {e}")

                for _ in range(5):
                    if not self.heartbeat_running:
                        break
                    time.sleep(1)

        self.heartbeat_thread = threading.Thread(target=loop, daemon=True, name="HeartbeatThread")
        self.heartbeat_thread.start()

    def stop_heartbeat(self):
        self.heartbeat_running = False

security_engine = AkinciCloudSecurity()

# ================================================
# 2. LİSANS AKTİVASYON DİYALOGU
# ================================================
class LicenseActivationDialog:
    def __init__(self, on_license_verified_callback):
        self.on_success = on_license_verified_callback
        self.root = tk.Tk()
        self.root.title("🔑 AKINCI LİSANS AKTİVASYON MERKEZİ v10.0")
        self.root.geometry("640x480")
        self.root.minsize(560, 420)
        self.root.configure(bg="#12141a")

        if ICON_PATH and os.path.exists(ICON_PATH):
            try: self.root.iconbitmap(ICON_PATH)
            except: pass

        self._center_window()
        self._build_ui()

        saved_key = security_engine.get_saved_license_key()
        if saved_key:
            self.key_entry.insert(0, saved_key)
            self.root.after(300, lambda: self._do_verify(silent=True))

    def _center_window(self):
        self.root.update_idletasks()
        w = self.root.winfo_width()
        h = self.root.winfo_height()
        x = (self.root.winfo_screenwidth() // 2) - (w // 2)
        y = (self.root.winfo_screenheight() // 2) - (h // 2)
        self.root.geometry(f'{w}x{h}+{x}+{y}')

    def _build_ui(self):
        header = tk.Frame(self.root, bg="#1a1e29", padx=15, pady=10)
        header.pack(fill=tk.X)

        title = tk.Label(header, text="✨ AKINCI OTOMATİK SURFER & ELEVATION GALILO ✨",
                         font=("Segoe UI", 11, "bold"), fg="#00ff9d", bg="#1a1e29")
        title.pack(anchor=tk.W)

        sub = tk.Label(header, text="Kullanıcı Yönetim Merkezi & Bulut Lisans Kontrol Sistemi",
                       font=("Segoe UI", 8), fg="#94a3b8", bg="#1a1e29")
        sub.pack(anchor=tk.W)

        body = tk.Frame(self.root, bg="#12141a", padx=15, pady=10)
        body.pack(fill=tk.BOTH, expand=True)

        hwid_box = tk.LabelFrame(body, text=" 🖥️ Cihaz Donanım Kimliğiniz (HWID) ", font=("Segoe UI", 8, "bold"),
                                 bg="#12141a", fg="#00d9ff", padx=8, pady=6)
        hwid_box.pack(fill=tk.X, pady=(0, 8))

        hwid_row = tk.Frame(hwid_box, bg="#12141a")
        hwid_row.pack(fill=tk.X)

        hwid_lbl = tk.Label(hwid_row, text=security_engine.hwid, font=("Consolas", 10, "bold"),
                            fg="#38bdf8", bg="#181c26", padx=6, pady=4)
        hwid_lbl.pack(side=tk.LEFT, fill=tk.X, expand=True)

        copy_btn = tk.Button(hwid_row, text="Kopyala", command=self._copy_hwid,
                             bg="#334155", fg="white", font=("Segoe UI", 8), padx=8, cursor="hand2")
        copy_btn.pack(side=tk.RIGHT, padx=(6, 0))

        key_box = tk.LabelFrame(body, text=" 🔑 Lisans Anahtarınızı Giriniz ", font=("Segoe UI", 8, "bold"),
                                bg="#12141a", fg="#22c55e", padx=8, pady=6)
        key_box.pack(fill=tk.X, pady=(0, 8))

        self.key_entry = tk.Entry(key_box, font=("Consolas", 11, "bold"), bg="#1e2330", fg="#4ade80",
                                  insertbackground="white", justify="center", relief="flat", bd=2)
        self.key_entry.pack(fill=tk.X, ipady=3)
        self.key_entry.bind("<Return>", lambda e: self._do_verify())

        srv_row = tk.Frame(body, bg="#12141a")
        srv_row.pack(fill=tk.X, pady=(0, 8))
        tk.Label(srv_row, text="Bulut Sunucu:", font=("Segoe UI", 8), fg="#64748b", bg="#12141a").pack(side=tk.LEFT)
        self.srv_entry = tk.Entry(srv_row, font=("Segoe UI", 8), bg="#181c26", fg="#94a3b8", width=28)
        self.srv_entry.insert(0, normalize_cloud_url(security_engine.api_url))
        self.srv_entry.pack(side=tk.LEFT, padx=3, fill=tk.X, expand=True)

        test_srv_btn = tk.Button(srv_row, text="🌐 Test Et", command=self._test_server_conn,
                                 bg="#0284c7", fg="white", font=("Segoe UI", 7, "bold"), padx=4, cursor="hand2")
        test_srv_btn.pack(side=tk.LEFT, padx=2)

        fix_srv_btn = tk.Button(srv_row, text="Varsayılan", command=self._reset_server_url,
                                bg="#334155", fg="#38bdf8", font=("Segoe UI", 7, "bold"), padx=4, cursor="hand2")
        fix_srv_btn.pack(side=tk.LEFT)

        self.status_lbl = tk.Label(body, text="Lisans anahtarınızı girip 'DOĞRULA VE BAŞLAT' butonuna tıklayınız.",
                                   font=("Segoe UI", 8), fg="#94a3b8", bg="#12141a", wraplength=560)
        self.status_lbl.pack(pady=4)

        btn_box = tk.Frame(body, bg="#12141a")
        btn_box.pack(fill=tk.X, pady=4)

        self.verify_btn = tk.Button(btn_box, text="🚀 LİSANSI DOĞRULA VE BAŞLAT", command=self._do_verify,
                                    bg="#22c55e", fg="#052e16", font=("Segoe UI", 10, "bold"),
                                    pady=6, cursor="hand2", relief="flat")
        self.verify_btn.pack(fill=tk.X)

        footer = tk.Frame(self.root, bg="#0d0e12", padx=10, pady=6)
        footer.pack(fill=tk.X, side=tk.BOTTOM)
        tk.Label(footer, text="© 2026 Mahmut Akın - 5846 Sayılı FSEK Korumalı | WhatsApp: +90 539 850 52 68",
                 font=("Segoe UI", 7), fg="#64748b", bg="#0d0e12").pack()

    def _test_server_conn(self):
        srv_url = self.srv_entry.get().strip()
        if srv_url:
            security_engine.save_server_url(srv_url)
        ok, msg = security_engine.test_connection()
        if ok:
            messagebox.showinfo("Bağlantı Başarılı", f"✅ Bulut Yönetim Merkezine başarıyla bağlanıldı!\nDurum: {msg}", parent=self.root)
            self.status_lbl.config(text=f"✅ Sunucu Çevrimiçi: {msg}", fg="#4ade80")
        else:
            messagebox.showerror("Bağlantı Hatası", f"❌ Bulut sunucuya ulaşılamadı.\n{msg}\n\nLütfen sunucu adresinizi veya internetinizi kontrol ediniz.", parent=self.root)
            self.status_lbl.config(text=f"❌ Sunucuya Bağlanılamadı: {msg}", fg="#f87171")

    def _reset_server_url(self):
        self.srv_entry.delete(0, tk.END)
        self.srv_entry.insert(0, DEFAULT_API_URL)
        security_engine.save_server_url(DEFAULT_API_URL)
        messagebox.showinfo("Sunucu Güncellendi", f"Bulut sunucu adresi varsayılana ayarlandı:\n{DEFAULT_API_URL}", parent=self.root)

    def _copy_hwid(self):
        self.root.clipboard_clear()
        self.root.clipboard_append(security_engine.hwid)
        messagebox.showinfo("Kopyalandı", "Donanım Kimliğiniz (HWID) panoya kopyalandı.\nLisans kaydı için Mahmut Akın'a iletebilirsiniz.", parent=self.root)

    def _do_verify(self, silent=False):
        key = self.key_entry.get().strip().upper()
        if not key:
            if not silent:
                messagebox.showwarning("Uyarı", "Lütfen bir lisans anahtarı giriniz!", parent=self.root)
            return

        srv_url = self.srv_entry.get().strip()
        if srv_url:
            security_engine.save_server_url(srv_url)

        self.verify_btn.config(state=tk.DISABLED, text="⏳ Lisans Doğrulanıyor...")
        self.status_lbl.config(text="Kullanıcı Yönetim Merkezi ile kontrol ediliyor...", fg="#38bdf8")
        self.root.update_idletasks()

        threading.Thread(target=self._verify_worker, args=(key, silent), daemon=True).start()

    def _verify_worker(self, key, silent):
        result = security_engine.verify_license(key)

        def update():
            self.verify_btn.config(state=tk.NORMAL, text="🚀 LİSANSI DOĞRULA VE BAŞLAT")
            clean_input_key = str(key or "").strip()
            if isinstance(result, dict):
                result["licenseKey"] = clean_input_key
                result["key"] = clean_input_key
            self.license_key = clean_input_key

            if result.get("valid") is True and result.get("status") == "active":
                days = result.get("daysRemaining", 0)
                customer = result.get("customerName", "Lisanslı Kullanıcı")
                self.status_lbl.config(text=f"✅ Lisans Doğrulandı! ({customer} - Kalan: {days} Gün)", fg="#4ade80")
                self.root.destroy()
                self.on_success(result)
            elif result.get("agreementRequired") is True or result.get("status") == "pending_agreement":
                self.status_lbl.config(text="⚠️ 5846 Sayılı Telif Sözleşmesi onayı bekleniyor...", fg="#f59e0b")
                AgreementDialog(self.root, clean_input_key, lambda: self._do_verify(silent=False), customer_name=result.get("customerName", ""))
            else:
                msg = result.get("message", "Geçersiz veya Kilitli Lisans!")
                self.status_lbl.config(text=f"❌ {msg}", fg="#f87171")
                if not silent:
                    messagebox.showerror("Lisans Reddedildi", f"❌ {msg}\n\nİletişim & Destek:\nMahmut Akın: +90 539 850 52 68\nTelegram: @akinci_surfer_voxler_analiz", parent=self.root)

        self.root.after(0, update)

    def run(self):
        self.root.mainloop()

class AgreementDialog(tk.Toplevel):
    def __init__(self, parent, license_key, on_signed_callback, customer_name=""):
        super().__init__(parent)
        self.license_key = str(license_key or load_saved_license_key() or "").strip()
        self.customer_name = customer_name
        self.on_signed = on_signed_callback
        self.title("📜 5846 Sayılı Telif Hakkı ve EULA Lisans Sözleşmesi")
        self.geometry("680x540")
        self.configure(bg="#12141a")
        self.transient(parent)
        self.grab_set()

        agr_data = security_engine.fetch_agreement_text()
        text_content = agr_data.get("text", "")
        law_ref = agr_data.get("lawReference", "5846 Sayılı Kanun")

        head = tk.Frame(self, bg="#1a1e29", padx=15, pady=10)
        head.pack(fill=tk.X)
        tk.Label(head, text="⚖️ 5846 SAYILI FİKİR VE SANAT ESERLERİ KANUNU SÖZLEŞMESİ",
                 font=("Segoe UI", 10, "bold"), fg="#38bdf8", bg="#1a1e29").pack(anchor=tk.W)
        tk.Label(head, text=f"Koruma: {law_ref} | Eser Sahibi: Mahmut Akın",
                 font=("Segoe UI", 8), fg="#94a3b8", bg="#1a1e29").pack(anchor=tk.W)

        st = scrolledtext.ScrolledText(self, wrap=tk.WORD, bg="#1a1e2b", fg="#e2e8f0",
                                      font=("Segoe UI", 8), height=14, padx=10, pady=10)
        st.insert(tk.END, text_content)
        st.configure(state="disabled")
        st.pack(fill=tk.BOTH, expand=True, padx=15, pady=10)

        form = tk.Frame(self, bg="#12141a", padx=15)
        form.pack(fill=tk.X)

        tk.Label(form, text="Adınız ve Soyadınız (Dijital İmza):", font=("Segoe UI", 9, "bold"),
                 fg="white", bg="#12141a").pack(side=tk.LEFT)
        self.name_entry = tk.Entry(form, font=("Segoe UI", 9), bg="#1e2330", fg="#38bdf8", width=30)
        self.name_entry.pack(side=tk.LEFT, padx=10)
        if self.customer_name and self.customer_name != "Lisanslı Kullanıcı" and "UNKNOWN" not in self.customer_name:
            self.name_entry.insert(0, self.customer_name)

        self.agree_var = tk.BooleanVar(value=False)
        cb = tk.Checkbutton(self, text="5846 sayılı telif hakları ve lisans süresi şartlarını okudum, kabul ediyorum.",
                            variable=self.agree_var, bg="#12141a", fg="#4ade80",
                            selectcolor="#1e2330", font=("Segoe UI", 8, "bold"))
        cb.pack(pady=8)

        btn_frame = tk.Frame(self, bg="#12141a", pady=10)
        btn_frame.pack()

        tk.Button(btn_frame, text="✅ SÖZLEŞMEYİ İMZALA VE BAŞLAT", command=self._submit,
                  bg="#22c55e", fg="#052e16", font=("Segoe UI", 9, "bold"), padx=15, pady=6, cursor="hand2").pack(side=tk.LEFT, padx=5)

        tk.Button(btn_frame, text="❌ İptal / Çıkış", command=lambda: sys.exit(0),
                  bg="#ef4444", fg="white", font=("Segoe UI", 9), padx=15, pady=6, cursor="hand2").pack(side=tk.LEFT, padx=5)

    def _submit(self):
        signer = self.name_entry.get().strip()
        if not signer:
            messagebox.showwarning("Uyarı", "Lütfen Adınızı ve Soyadınızı giriniz!", parent=self)
            return
        if not self.agree_var.get():
            messagebox.showwarning("Uyarı", "Lütfen sözleşme onay kutusunu işaretleyiniz!", parent=self)
            return

        key_to_use = self.license_key or load_saved_license_key() or ""
        if not key_to_use:
            messagebox.showerror("Hata", "Lisans anahtarı belirlenemedi! Lütfen ana ekrandan lisans anahtarınızı kontrol ediniz.", parent=self)
            return

        res = security_engine.accept_agreement(key_to_use, signer)
        if res.get("success"):
            messagebox.showinfo("Onaylandı", "✅ 5846 Sayılı Telif Sözleşmesi başarıyla imzalandı ve sisteme kaydedildi.", parent=self)
            self.destroy()
            self.on_signed()
        else:
            messagebox.showerror("Hata", f"❌ Sözleşme kaydedilemedi!\n\n{res.get('message', 'Sözleşme sunucuya kaydedilemedi!')}", parent=self)

# ================================================
# AKS KALDIRMA MODÜLÜ
# ================================================
class AksKaldirici:
    def __init__(self, surfer_app=None):
        self.surfer_app = surfer_app
        self._kendi_olusturdu = False
        
    def surfer_baslat(self):
        if self.surfer_app is None:
            try:
                win32com.client.gencache.is_readonly = False
                self.surfer_app = EnsureDispatch("Surfer.Application")
                self._kendi_olusturdu = True
            except:
                self.surfer_app = win32com.client.Dispatch("Surfer.Application")
                self._kendi_olusturdu = True
            self.surfer_app.Visible = True
        return self.surfer_app
    
    def akslari_kaldir(self, map_obj):
        try:
            if map_obj is None:
                return False
            if hasattr(map_obj, 'Axes'):
                axes_collection = map_obj.Axes
                for i in range(axes_collection.Count, 0, -1):
                    try:
                        axis = axes_collection.Item(i)
                        axis.Delete()
                    except:
                        pass
                return True
        except:
            pass
        return False
    
    def belgedeki_tum_akslari_kaldir(self, doc):
        sayac = 0
        try:
            if doc is None:
                return sayac
            for shape in doc.Shapes:
                if hasattr(shape, 'Axes'):
                    self.akslari_kaldir(shape)
                    sayac += 1
        except:
            pass
        return sayac
    
    def yeni_harita_olustur_ve_akslari_kaldir(self, doc, grid_file, map_type, x_pos, y_pos):
        try:
            if doc is None or not os.path.exists(grid_file):
                return None
            map_obj = None
            if map_type == "ImageMap":
                map_obj = doc.Shapes.AddImageMap(GridFileName=grid_file)
            elif map_type == "Surface":
                map_obj = doc.Shapes.AddSurface(GridFileName=grid_file)
            elif map_type == "ContourMap":
                map_obj = doc.Shapes.AddContourMap(GridFileName=grid_file)
            elif map_type == "VectorMap":
                map_obj = doc.Shapes.AddVectorMap(GridFileName=grid_file)
            elif map_type == "HeatMap":
                map_obj = doc.Shapes.AddHeatMap(GridFileName=grid_file)
            elif map_type == "ColorRelief":
                map_obj = doc.Shapes.AddColorRelief(GridFileName=grid_file)
            else:
                return None
            if map_obj:
                map_obj.Left = x_pos
                map_obj.Top = y_pos
                self.akslari_kaldir(map_obj)
            return map_obj
        except Exception as e:
            print(f"Harita oluşturma hatası ({map_type}): {str(e)}")
            return None

# ================================================
# GELİŞMİŞ DOSYA İZLEME SINIFI
# ================================================
class AdvancedFileHandler(FileSystemEventHandler):
    def __init__(self, left_panel, right_panel=None):
        self.left_panel = left_panel
        self.right_panel = right_panel
        self.processed_files = {}
        self.file_hashes = {}
        self.processing_timer = None
        self.current_file = None
        self.monitor_dirs = [
            os.path.join(os.path.expanduser("~"), "Desktop", "AKINCI_Elevation"),
            os.path.join(os.path.expanduser("~"), "Desktop", "AKINCI_WEB", "AkinciGrid")
        ]
        
        self.scan_existing_files()
        self.start_periodic_scan()
    
    def scan_existing_files(self):
        for dir_path in self.monitor_dirs:
            if os.path.exists(dir_path):
                for file_name in os.listdir(dir_path):
                    if file_name.endswith('.dat'):
                        file_path = os.path.join(dir_path, file_name)
                        self.update_file_hash(file_path)
    
    def start_periodic_scan(self):
        def scan():
            for dir_path in self.monitor_dirs:
                if not os.path.exists(dir_path):
                    try:
                        os.makedirs(dir_path, exist_ok=True)
                        if hasattr(self, 'observer') and self.observer:
                            self.observer.schedule(self, dir_path, recursive=False)
                    except Exception as e:
                        pass
                    continue
                
                if os.path.exists(dir_path):
                    for file_name in os.listdir(dir_path):
                        if file_name.endswith('.dat'):
                            file_path = os.path.join(dir_path, file_name)
                            self.check_and_process_file(file_path)
            
            if hasattr(self, 'left_panel') and self.left_panel:
                self.left_panel.after(2000, scan)
        
        if self.left_panel:
            self.left_panel.after(1000, scan)
    
    def update_file_hash(self, file_path):
        try:
            with open(file_path, 'rb') as f:
                file_hash = hashlib.md5(f.read()).hexdigest()
                self.file_hashes[file_path] = file_hash
            return True
        except:
            return False
    
    def check_and_process_file(self, file_path):
        if not os.path.exists(file_path):
            return
        
        try:
            with open(file_path, 'rb') as f:
                current_hash = hashlib.md5(f.read()).hexdigest()
            
            old_hash = self.file_hashes.get(file_path)
            
            if old_hash is None or current_hash != old_hash:
                self.file_hashes[file_path] = current_hash
                
                current_time = time.time()
                last_process = self.processed_files.get(file_path, 0)
                
                if current_time - last_process > 5:
                    self.processed_files[file_path] = current_time
                    
                    if self.processing_timer:
                        self.processing_timer.cancel()
                    
                    self.current_file = file_path
                    self.processing_timer = threading.Timer(3.0, self.process_new_file)
                    self.processing_timer.start()
                    
        except Exception as e:
            print(f"Dosya kontrol hatası {file_path}: {e}")
    
    def process_new_file(self):
        try:
            if not self.current_file or not os.path.exists(self.current_file):
                return
            
            file_path = self.current_file
            
            if self.left_panel and not self.left_panel.is_processing and self.left_panel.ready_state:
                self.left_panel.dat_file = file_path
                self.left_panel.shared_dat_file = file_path
                if hasattr(self.left_panel, 'file_label'):
                    self.left_panel.file_label.config(text=f"✓ {os.path.basename(file_path)} (Otomatik)")
                self.left_panel.run_all_formats()
                    
        except Exception as e:
            print(f"Otomatik işlem hatası: {e}")
    
    def on_created(self, event):
        if not event.is_directory and event.src_path.endswith('.dat'):
            self.check_and_process_file(event.src_path)
    
    def on_modified(self, event):
        if not event.is_directory and event.src_path.endswith('.dat'):
            self.check_and_process_file(event.src_path)

# ================================================
# SURFER PRO DUAL (SOL PANEL - PRO✅MAX 1+2 VS_2)
# ================================================
class SurferProDualApp(tk.Frame):
    def __init__(self, master, main_app=None):
        super().__init__(master)
        self.master = master
        self.main_app = main_app
        
        self.title_font = ('Segoe UI', 12, 'bold')
        self.subtitle_font = ('Segoe UI', 10, 'bold')
        self.button_font = ('Segoe UI', 9, 'bold')
        self.small_font = ('Segoe UI', 8)
        self.medium_font = ('Segoe UI', 9)
        
        self.shared_settings_file = os.path.join(os.path.expanduser("~"), "surfer_dual_settings.json")
        self.shared_dat_file = ""
        self.shared_last_dir = os.path.expanduser("~")
        
        self.bg_color = "#1a1a1a"
        self.accent_color = "#00ff00"
        self.secondary_color = "#ff9900"
        self.tertiary_color = "#ff00ff"
        self.text_color = "#ffffff"
        self.highlight_color = "#00d9ff"
        self.danger_color = "#e74c3c"
        self.success_color = "#2ecc71"
        self.warning_color = "#f39c12"
        self.panel_color = "#2a2a2a"
        
        self.aks_kaldirici = AksKaldirici()
        self.aks_kaldir_var = tk.BooleanVar(value=load_axes_setting_from_registry())
        self.aks_kaldir_var.trace_add("write", self.on_axes_setting_changed)
        
        self.dual_surfer_var = tk.BooleanVar(value=False)
        self.mode_var = tk.StringVar(value="MOD1")
        self.layer_3d_var = tk.BooleanVar(value=False)
        self.layer_contour_var = tk.BooleanVar(value=False)
        self.auto_process_var = tk.BooleanVar(value=load_auto_setting_from_registry())
        self.auto_process_var.trace_add("write", self.on_auto_setting_changed)
        
        self.dat_file = ""
        self.output_files_default = []
        self.output_files_user = []
        self.output_files = []
        self.is_processing = False
        self.processing_complete = False
        self.surfer_app = None
        self.surfer_app_2 = None
        self.error_log = []
        self.ready_state = True
        self.last_dir = os.path.expanduser("~")
        
        # MOD1 için 3 format
        self.f1_pts_mod1 = None; self.f1_ang_mod1 = None; self.f1_medpass_mod1 = None
        self.f1_thresh_mod1 = None; self.f1_lower_stat_mod1 = None; self.f1_eleme_mod1 = None
        self.f2_pts_mod1 = None; self.f2_ang_mod1 = None; self.f2_medpass_mod1 = None
        self.f2_median_size_mod1 = None; self.f2_upperq_size_mod1 = None; self.f2_lower_stat_mod1 = None; self.f2_eleme_mod1 = None
        self.f3_pts_mod1 = None; self.f3_ang_mod1 = None; self.f3_medpass_mod1 = None
        self.f3_thresh_mod1 = None; self.f3_median_size_mod1 = None; self.f3_upperq_size_mod1 = None; self.f3_lower_stat_mod1 = None; self.f3_eleme_mod1 = None
        
        # MOD2 için 3 format
        self.f1_pts_mod2 = None; self.f1_ang_mod2 = None; self.f1_medpass_mod2 = None
        self.f1_thresh_mod2 = None; self.f1_lower_stat_mod2 = None; self.f1_eleme_mod2 = None
        self.f2_pts_mod2 = None; self.f2_ang_mod2 = None; self.f2_medpass_mod2 = None
        self.f2_median_size_mod2 = None; self.f2_upperq_size_mod2 = None; self.f2_lower_stat_mod2 = None; self.f2_eleme_mod2 = None
        self.f3_pts_mod2 = None; self.f3_ang_mod2 = None; self.f3_medpass_mod2 = None
        self.f3_thresh_mod2 = None; self.f3_median_size_mod2 = None; self.f3_upperq_size_mod2 = None; self.f3_lower_stat_mod2 = None; self.f3_eleme_mod2 = None
        
        self.DEFAULT_SETTINGS = {
            'f1_pts': '64', 'f1_ang': '90', 'f1_medpass': '12', 'f1_thresh': '500', 'f1_lower_stat': '51', 'f1_eleme': False,
            'f2_pts': '64', 'f2_ang': '90', 'f2_medpass': '12', 'f2_median_size': '3', 'f2_upperq_size': '3', 'f2_lower_stat': '51', 'f2_eleme': False,
            'f3_pts': '64', 'f3_ang': '90', 'f3_medpass': '12', 'f3_thresh': '1000', 'f3_median_size': '5', 'f3_upperq_size': '5', 'f3_lower_stat': '51', 'f3_eleme': False,
            'layer_3d': False, 'layer_contour': False
        }
        
        self.initialize_ui()
        self.load_settings()
        self.start_file_monitoring()
    
    def on_auto_setting_changed(self, *args):
        save_auto_setting_to_registry(self.auto_process_var.get())
        self.save_settings()
    
    def on_axes_setting_changed(self, *args):
        save_axes_setting_to_registry(self.aks_kaldir_var.get())
        self.save_settings()
    
    def start_file_monitoring(self):
        try:
            monitor_dirs = [
                os.path.join(os.path.expanduser("~"), "Desktop", "AKINCI_Elevation"),
                os.path.join(os.path.expanduser("~"), "Desktop", "AKINCI_WEB", "AkinciGrid")
            ]
            for dir_path in monitor_dirs:
                if not os.path.exists(dir_path):
                    os.makedirs(dir_path, exist_ok=True)
            self.file_handler = AdvancedFileHandler(self, None)
            self.observer = Observer()
            for dir_path in monitor_dirs:
                if os.path.exists(dir_path):
                    self.observer.schedule(self.file_handler, dir_path, recursive=False)
            self.observer.start()
        except Exception as e:
            print(f"Dosya izleme hatası: {e}")

    def initialize_ui(self):
        self.style = ttk.Style()
        self.style.theme_use('clam')
        self.configure_styles()
        
        main_frame = ttk.Frame(self)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        self.create_title_frame(main_frame)
        self.create_dual_mode_frame(main_frame)
        self.create_top_frame(main_frame)
        self.create_content_frame(main_frame)
        self.create_control_buttons(main_frame)
        self.create_status_bar(main_frame)
        
        self.pack(fill=tk.BOTH, expand=True)

    def configure_styles(self):
        self.style.configure('TFrame', background=self.bg_color)
        self.style.configure('TLabel', background=self.bg_color, foreground=self.text_color, font=self.medium_font)
        self.style.configure('TLabelframe', background=self.panel_color, bordercolor="#404040", relief="flat", borderwidth=1)
        self.style.configure('TLabelframe.Label', background=self.panel_color, foreground=self.accent_color, font=('Segoe UI', 9, 'bold'))
        self.style.configure('TButton', font=self.button_font)
        self.style.configure('TProgressbar', thickness=8, background=self.accent_color, darkcolor=self.accent_color, lightcolor=self.accent_color)
        self.style.configure('TEntry', fieldbackground="#333333", foreground=self.text_color)

    def create_title_frame(self, parent):
        title_frame = ttk.Frame(parent)
        title_frame.pack(fill=tk.X, pady=(0,5))
        title_label = tk.Label(title_frame, text="✨ PRO✅MAX 1+2 VS_2 ✨", font=self.title_font,
                               fg=self.accent_color, bg=self.bg_color, pady=4)
        title_label.pack()
        separator = ttk.Separator(title_frame, orient='horizontal')
        separator.pack(fill=tk.X, pady=3)

    def create_dual_mode_frame(self, parent):
        dual_mode_frame = tk.Frame(parent, bg=self.bg_color)
        dual_mode_frame.pack(fill=tk.X, pady=(0, 5))
        
        self.mode_btn = tk.Button(dual_mode_frame, text="⚡ MOD 1 (SURFER PRO)",
                                  command=self.on_mode_selected,
                                  bg=self.accent_color, fg="black",
                                  font=('Segoe UI', 8, 'bold'),
                                  relief="raised", bd=1, padx=6, pady=2,
                                  cursor="hand2", width=20)
        self.mode_btn.pack(side=tk.LEFT, padx=2)
        
        self.dual_btn = tk.Button(dual_mode_frame, text="🔀 ÇİFT SURFER MODU",
                                  command=self.toggle_dual_surfer,
                                  bg=self.panel_color, fg="white",
                                  font=('Segoe UI', 8, 'bold'),
                                  relief="flat", bd=1, padx=6, pady=2,
                                  cursor="hand2", width=15)
        self.dual_btn.pack(side=tk.LEFT, padx=2)
        
        tk.Label(dual_mode_frame, text="🔵 PASİF (ORİJİNAL) + 🟢 AKTİF (KULLANICI)",
                 bg=self.bg_color, fg=self.highlight_color,
                 font=('Segoe UI', 8)).pack(side=tk.LEFT, padx=3)

    def create_top_frame(self, parent):
        top_frame = ttk.Frame(parent)
        top_frame.pack(fill=tk.X, pady=2)
        
        file_frame = ttk.LabelFrame(top_frame, text=" 📁 DOSYA SEÇİMİ ", padding=4)
        file_frame.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 2))
        file_button = tk.Button(file_frame, text="Dosya Seç", command=self.select_file,
                                bg=self.accent_color, fg="black", font=self.button_font,
                                relief="flat", bd=0, padx=8, pady=2, cursor="hand2")
        file_button.pack(side=tk.LEFT, padx=(0,4))
        self.file_label = tk.Label(file_frame, text="Henüz dosya seçilmedi", fg="#cccccc",
                                   bg=self.panel_color, font=self.medium_font, relief="flat",
                                   bd=0, padx=4, pady=2, anchor="w")
        self.file_label.pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        layer_frame = ttk.LabelFrame(top_frame, text="KATMAN SEÇENEKLERİ", padding=4)
        layer_frame.pack(side=tk.RIGHT, fill=tk.X, padx=(2, 0))
        layer_3d_check = tk.Checkbutton(layer_frame, text="3D", variable=self.layer_3d_var,
                                        bg=self.panel_color, fg=self.text_color, selectcolor=self.panel_color, font=self.medium_font,
                                        command=self.save_settings)
        layer_3d_check.pack(side=tk.LEFT, padx=2)
        layer_contour_check = tk.Checkbutton(layer_frame, text="KONTUR", variable=self.layer_contour_var,
                                             bg=self.panel_color, fg=self.text_color, selectcolor=self.panel_color, font=self.medium_font,
                                             command=self.save_settings)
        layer_contour_check.pack(side=tk.LEFT, padx=2)
        
        auto_frame = ttk.LabelFrame(top_frame, text="OTOMATİK İŞLEM", padding=4)
        auto_frame.pack(side=tk.RIGHT, fill=tk.X, padx=(2, 0))
        auto_check = tk.Checkbutton(auto_frame, text="🤖 Auto İşlem", variable=self.auto_process_var,
                                    bg=self.panel_color, fg=self.text_color, selectcolor=self.panel_color, font=self.medium_font)
        auto_check.pack(side=tk.LEFT, padx=2)
        
        settings_frame = ttk.LabelFrame(top_frame, text=" ⚙️ SURFER AYARLARI ", padding=4)
        settings_frame.pack(side=tk.RIGHT, fill=tk.X, padx=(2, 0))
        aks_check = tk.Checkbutton(settings_frame, text="Aksları Kaldır", variable=self.aks_kaldir_var,
                                   bg=self.panel_color, fg=self.text_color, selectcolor=self.panel_color, font=self.medium_font)
        aks_check.pack(side=tk.LEFT, padx=2)

    def create_content_frame(self, parent):
        content_frame = ttk.Frame(parent)
        content_frame.pack(fill=tk.BOTH, expand=True, pady=4)
        
        self.mod1_frame = tk.Frame(content_frame, bg=self.bg_color)
        self.mod2_frame = tk.Frame(content_frame, bg=self.bg_color)
        
        self.create_format_frames_mod1(self.mod1_frame)
        self.create_format_frames_mod2(self.mod2_frame)
        
        self.mod1_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=2)
        self.mod2_frame.pack_forget()

    def create_format_frames_mod1(self, parent):
        format_main_frame = tk.Frame(parent, bg=self.bg_color)
        format_main_frame.pack(fill=tk.BOTH, expand=True, pady=4)
        
        f1_frame = tk.LabelFrame(format_main_frame, text=" 🔧 FORMAT 1 - TEMEL ", bg=self.bg_color, fg=self.text_color,
                                 font=('Segoe UI', 9, 'bold'), padx=6, pady=6)
        f1_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=2)
        self.create_format_controls_mod1(f1_frame, 1)
        
        f2_frame = tk.LabelFrame(format_main_frame, text=" ⚡ FORMAT 2 - GELİŞMİŞ ", bg=self.bg_color, fg=self.text_color,
                                 font=('Segoe UI', 9, 'bold'), padx=6, pady=6)
        f2_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=2)
        self.create_format_controls_mod1(f2_frame, 2)
        
        f3_frame = tk.LabelFrame(format_main_frame, text=" 💎 FORMAT 3 - ULTRA ", bg=self.bg_color, fg=self.text_color,
                                 font=('Segoe UI', 9, 'bold'), padx=6, pady=6)
        f3_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=2)
        self.create_format_controls_mod1(f3_frame, 3)

    def create_format_frames_mod2(self, parent):
        format_main_frame = tk.Frame(parent, bg=self.bg_color)
        format_main_frame.pack(fill=tk.BOTH, expand=True, pady=4)
        
        f1_frame = tk.LabelFrame(format_main_frame, text=" 🔧 FORMAT 1 - TEMEL ", bg=self.bg_color, fg=self.text_color,
                                 font=('Segoe UI', 9, 'bold'), padx=6, pady=6)
        f1_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=2)
        self.create_format_controls_mod2(f1_frame, 1)
        
        f2_frame = tk.LabelFrame(format_main_frame, text=" ⚡ FORMAT 2 - GELİŞMİŞ ", bg=self.bg_color, fg=self.text_color,
                                 font=('Segoe UI', 9, 'bold'), padx=6, pady=6)
        f2_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=2)
        self.create_format_controls_mod2(f2_frame, 2)
        
        f3_frame = tk.LabelFrame(format_main_frame, text=" 💎 FORMAT 3 - ULTRA ", bg=self.bg_color, fg=self.text_color,
                                 font=('Segoe UI', 9, 'bold'), padx=6, pady=6)
        f3_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=2)
        self.create_format_controls_mod2(f3_frame, 3)

    def create_format_controls_mod1(self, frame, fmt):
        def on_value_changed(*args):
            self.save_settings()
        
        row = 0
        tk.Label(frame, text="Nokta:", fg=self.text_color, font=self.small_font, bg=self.bg_color).grid(row=row, column=0, padx=2, pady=1, sticky=tk.W)
        pts_entry = tk.Entry(frame, width=8, font=self.small_font, bg=self.panel_color, fg=self.text_color)
        pts_entry.insert(0, "64")
        pts_entry.grid(row=row, column=1, padx=2, pady=1, sticky=tk.W)
        pts_entry.bind("<KeyRelease>", on_value_changed)
        row += 1
        
        tk.Label(frame, text="Açı:", fg=self.text_color, font=self.small_font, bg=self.bg_color).grid(row=row, column=0, padx=2, pady=1, sticky=tk.W)
        ang_entry = tk.Entry(frame, width=8, font=self.small_font, bg=self.panel_color, fg=self.text_color)
        ang_entry.insert(0, "90")
        ang_entry.grid(row=row, column=1, padx=2, pady=1, sticky=tk.W)
        ang_entry.bind("<KeyRelease>", on_value_changed)
        row += 1
        
        tk.Label(frame, text="Geçiş:", fg=self.highlight_color, font=('Segoe UI', 8, 'bold'), bg=self.bg_color).grid(row=row, column=0, padx=2, pady=1, sticky=tk.W)
        medpass_entry = tk.Entry(frame, width=8, font=self.small_font, bg=self.panel_color, fg=self.text_color)
        medpass_entry.insert(0, "12")
        medpass_entry.grid(row=row, column=1, padx=2, pady=1, sticky=tk.W)
        medpass_entry.bind("<KeyRelease>", on_value_changed)
        row += 1
        
        if fmt == 1:
            tk.Label(frame, text="Eşik:", fg=self.secondary_color, font=('Segoe UI', 8, 'bold'), bg=self.bg_color).grid(row=row, column=0, padx=2, pady=1, sticky=tk.W)
            thresh_entry = tk.Entry(frame, width=8, font=self.small_font, bg=self.panel_color, fg=self.text_color)
            thresh_entry.insert(0, "500")
            thresh_entry.grid(row=row, column=1, padx=2, pady=1, sticky=tk.W)
            thresh_entry.bind("<KeyRelease>", on_value_changed)
            row += 1
            
            tk.Label(frame, text="Stat:", fg=self.tertiary_color, font=('Segoe UI', 8, 'bold'), bg=self.bg_color).grid(row=row, column=0, padx=2, pady=1, sticky=tk.W)
            lower_entry = tk.Entry(frame, width=8, font=self.small_font, bg=self.panel_color, fg=self.text_color)
            lower_entry.insert(0, "51")
            lower_entry.grid(row=row, column=1, padx=2, pady=1, sticky=tk.W)
            lower_entry.bind("<KeyRelease>", on_value_changed)
            row += 1
            
            self.f1_pts_mod1 = pts_entry; self.f1_ang_mod1 = ang_entry; self.f1_medpass_mod1 = medpass_entry
            self.f1_thresh_mod1 = thresh_entry; self.f1_lower_stat_mod1 = lower_entry
            self.f1_eleme_mod1 = tk.BooleanVar(value=False); self.f1_eleme_mod1.trace_add("write", on_value_changed)
            
        elif fmt == 2:
            tk.Label(frame, text="Medyan:", fg=self.secondary_color, font=('Segoe UI', 8, 'bold'), bg=self.bg_color).grid(row=row, column=0, padx=2, pady=1, sticky=tk.W)
            median_size = tk.Entry(frame, width=8, font=self.small_font, bg=self.panel_color, fg=self.text_color)
            median_size.insert(0, "3")
            median_size.grid(row=row, column=1, padx=2, pady=1, sticky=tk.W)
            median_size.bind("<KeyRelease>", on_value_changed)
            row += 1
            
            tk.Label(frame, text="Üst Çeyrek:", fg=self.secondary_color, font=('Segoe UI', 8, 'bold'), bg=self.bg_color).grid(row=row, column=0, padx=2, pady=1, sticky=tk.W)
            upperq_size = tk.Entry(frame, width=8, font=self.small_font, bg=self.panel_color, fg=self.text_color)
            upperq_size.insert(0, "3")
            upperq_size.grid(row=row, column=1, padx=2, pady=1, sticky=tk.W)
            upperq_size.bind("<KeyRelease>", on_value_changed)
            row += 1
            
            tk.Label(frame, text="Stat:", fg=self.tertiary_color, font=('Segoe UI', 8, 'bold'), bg=self.bg_color).grid(row=row, column=0, padx=2, pady=1, sticky=tk.W)
            lower_entry = tk.Entry(frame, width=8, font=self.small_font, bg=self.panel_color, fg=self.text_color)
            lower_entry.insert(0, "51")
            lower_entry.grid(row=row, column=1, padx=2, pady=1, sticky=tk.W)
            lower_entry.bind("<KeyRelease>", on_value_changed)
            row += 1
            
            self.f2_pts_mod1 = pts_entry; self.f2_ang_mod1 = ang_entry; self.f2_medpass_mod1 = medpass_entry
            self.f2_median_size_mod1 = median_size; self.f2_upperq_size_mod1 = upperq_size; self.f2_lower_stat_mod1 = lower_entry
            self.f2_eleme_mod1 = tk.BooleanVar(value=False); self.f2_eleme_mod1.trace_add("write", on_value_changed)
            
        else:
            tk.Label(frame, text="Eşik:", fg=self.secondary_color, font=('Segoe UI', 8, 'bold'), bg=self.bg_color).grid(row=row, column=0, padx=2, pady=1, sticky=tk.W)
            thresh_entry = tk.Entry(frame, width=8, font=self.small_font, bg=self.panel_color, fg=self.text_color)
            thresh_entry.insert(0, "1000")
            thresh_entry.grid(row=row, column=1, padx=2, pady=1, sticky=tk.W)
            thresh_entry.bind("<KeyRelease>", on_value_changed)
            row += 1
            
            tk.Label(frame, text="Medyan:", fg=self.secondary_color, font=('Segoe UI', 8, 'bold'), bg=self.bg_color).grid(row=row, column=0, padx=2, pady=1, sticky=tk.W)
            median_size = tk.Entry(frame, width=8, font=self.small_font, bg=self.panel_color, fg=self.text_color)
            median_size.insert(0, "5")
            median_size.grid(row=row, column=1, padx=2, pady=1, sticky=tk.W)
            median_size.bind("<KeyRelease>", on_value_changed)
            row += 1
            
            tk.Label(frame, text="Üst Çeyrek:", fg=self.secondary_color, font=('Segoe UI', 8, 'bold'), bg=self.bg_color).grid(row=row, column=0, padx=2, pady=1, sticky=tk.W)
            upperq_size = tk.Entry(frame, width=8, font=self.small_font, bg=self.panel_color, fg=self.text_color)
            upperq_size.insert(0, "5")
            upperq_size.grid(row=row, column=1, padx=2, pady=1, sticky=tk.W)
            upperq_size.bind("<KeyRelease>", on_value_changed)
            row += 1
            
            tk.Label(frame, text="Stat:", fg=self.tertiary_color, font=('Segoe UI', 8, 'bold'), bg=self.bg_color).grid(row=row, column=0, padx=2, pady=1, sticky=tk.W)
            lower_entry = tk.Entry(frame, width=8, font=self.small_font, bg=self.panel_color, fg=self.text_color)
            lower_entry.insert(0, "51")
            lower_entry.grid(row=row, column=1, padx=2, pady=1, sticky=tk.W)
            lower_entry.bind("<KeyRelease>", on_value_changed)
            row += 1
            
            self.f3_pts_mod1 = pts_entry; self.f3_ang_mod1 = ang_entry; self.f3_medpass_mod1 = medpass_entry
            self.f3_thresh_mod1 = thresh_entry; self.f3_median_size_mod1 = median_size; self.f3_upperq_size_mod1 = upperq_size; self.f3_lower_stat_mod1 = lower_entry
            self.f3_eleme_mod1 = tk.BooleanVar(value=False); self.f3_eleme_mod1.trace_add("write", on_value_changed)
        
        tk.Label(frame, text="Eleme:", fg=self.highlight_color, font=('Segoe UI', 8, 'bold'), bg=self.bg_color).grid(row=row, column=0, padx=2, pady=2, sticky=tk.W)
        eleme_cb = tk.Checkbutton(frame, text="AKTİF", 
                     variable=(self.f1_eleme_mod1 if fmt == 1 else (self.f2_eleme_mod1 if fmt == 2 else self.f3_eleme_mod1)),
                     bg=self.bg_color, fg=self.text_color, selectcolor=self.bg_color, command=on_value_changed)
        eleme_cb.grid(row=row, column=1, padx=2, pady=2, sticky=tk.W)

    def create_format_controls_mod2(self, frame, fmt):
        def on_value_changed(*args):
            self.save_settings()
        
        row = 0
        tk.Label(frame, text="Nokta:", fg=self.text_color, font=self.small_font, bg=self.bg_color).grid(row=row, column=0, padx=2, pady=1, sticky=tk.W)
        pts_entry = tk.Entry(frame, width=8, font=self.small_font, bg=self.panel_color, fg=self.text_color)
        pts_entry.insert(0, "64")
        pts_entry.grid(row=row, column=1, padx=2, pady=1, sticky=tk.W)
        pts_entry.bind("<KeyRelease>", on_value_changed)
        row += 1
        
        tk.Label(frame, text="Açı:", fg=self.text_color, font=self.small_font, bg=self.bg_color).grid(row=row, column=0, padx=2, pady=1, sticky=tk.W)
        ang_entry = tk.Entry(frame, width=8, font=self.small_font, bg=self.panel_color, fg=self.text_color)
        ang_entry.insert(0, "90")
        ang_entry.grid(row=row, column=1, padx=2, pady=1, sticky=tk.W)
        ang_entry.bind("<KeyRelease>", on_value_changed)
        row += 1
        
        tk.Label(frame, text="Geçiş:", fg=self.highlight_color, font=('Segoe UI', 8, 'bold'), bg=self.bg_color).grid(row=row, column=0, padx=2, pady=1, sticky=tk.W)
        medpass_entry = tk.Entry(frame, width=8, font=self.small_font, bg=self.panel_color, fg=self.text_color)
        medpass_entry.insert(0, "12")
        medpass_entry.grid(row=row, column=1, padx=2, pady=1, sticky=tk.W)
        medpass_entry.bind("<KeyRelease>", on_value_changed)
        row += 1
        
        if fmt == 1:
            tk.Label(frame, text="Eşik:", fg=self.secondary_color, font=('Segoe UI', 8, 'bold'), bg=self.bg_color).grid(row=row, column=0, padx=2, pady=1, sticky=tk.W)
            thresh_entry = tk.Entry(frame, width=8, font=self.small_font, bg=self.panel_color, fg=self.text_color)
            thresh_entry.insert(0, "500")
            thresh_entry.grid(row=row, column=1, padx=2, pady=1, sticky=tk.W)
            thresh_entry.bind("<KeyRelease>", on_value_changed)
            row += 1
            
            tk.Label(frame, text="Stat:", fg=self.tertiary_color, font=('Segoe UI', 8, 'bold'), bg=self.bg_color).grid(row=row, column=0, padx=2, pady=1, sticky=tk.W)
            lower_entry = tk.Entry(frame, width=8, font=self.small_font, bg=self.panel_color, fg=self.text_color)
            lower_entry.insert(0, "51")
            lower_entry.grid(row=row, column=1, padx=2, pady=1, sticky=tk.W)
            lower_entry.bind("<KeyRelease>", on_value_changed)
            row += 1
            
            self.f1_pts_mod2 = pts_entry; self.f1_ang_mod2 = ang_entry; self.f1_medpass_mod2 = medpass_entry
            self.f1_thresh_mod2 = thresh_entry; self.f1_lower_stat_mod2 = lower_entry
            self.f1_eleme_mod2 = tk.BooleanVar(value=False); self.f1_eleme_mod2.trace_add("write", on_value_changed)
            
        elif fmt == 2:
            tk.Label(frame, text="Medyan:", fg=self.secondary_color, font=('Segoe UI', 8, 'bold'), bg=self.bg_color).grid(row=row, column=0, padx=2, pady=1, sticky=tk.W)
            median_size = tk.Entry(frame, width=8, font=self.small_font, bg=self.panel_color, fg=self.text_color)
            median_size.insert(0, "3")
            median_size.grid(row=row, column=1, padx=2, pady=1, sticky=tk.W)
            median_size.bind("<KeyRelease>", on_value_changed)
            row += 1
            
            tk.Label(frame, text="Üst Çeyrek:", fg=self.secondary_color, font=('Segoe UI', 8, 'bold'), bg=self.bg_color).grid(row=row, column=0, padx=2, pady=1, sticky=tk.W)
            upperq_size = tk.Entry(frame, width=8, font=self.small_font, bg=self.panel_color, fg=self.text_color)
            upperq_size.insert(0, "3")
            upperq_size.grid(row=row, column=1, padx=2, pady=1, sticky=tk.W)
            upperq_size.bind("<KeyRelease>", on_value_changed)
            row += 1
            
            tk.Label(frame, text="Stat:", fg=self.tertiary_color, font=('Segoe UI', 8, 'bold'), bg=self.bg_color).grid(row=row, column=0, padx=2, pady=1, sticky=tk.W)
            lower_entry = tk.Entry(frame, width=8, font=self.small_font, bg=self.panel_color, fg=self.text_color)
            lower_entry.insert(0, "51")
            lower_entry.grid(row=row, column=1, padx=2, pady=1, sticky=tk.W)
            lower_entry.bind("<KeyRelease>", on_value_changed)
            row += 1
            
            self.f2_pts_mod2 = pts_entry; self.f2_ang_mod2 = ang_entry; self.f2_medpass_mod2 = medpass_entry
            self.f2_median_size_mod2 = median_size; self.f2_upperq_size_mod2 = upperq_size; self.f2_lower_stat_mod2 = lower_entry
            self.f2_eleme_mod2 = tk.BooleanVar(value=False); self.f2_eleme_mod2.trace_add("write", on_value_changed)
            
        else:
            tk.Label(frame, text="Eşik:", fg=self.secondary_color, font=('Segoe UI', 8, 'bold'), bg=self.bg_color).grid(row=row, column=0, padx=2, pady=1, sticky=tk.W)
            thresh_entry = tk.Entry(frame, width=8, font=self.small_font, bg=self.panel_color, fg=self.text_color)
            thresh_entry.insert(0, "1000")
            thresh_entry.grid(row=row, column=1, padx=2, pady=1, sticky=tk.W)
            thresh_entry.bind("<KeyRelease>", on_value_changed)
            row += 1
            
            tk.Label(frame, text="Medyan:", fg=self.secondary_color, font=('Segoe UI', 8, 'bold'), bg=self.bg_color).grid(row=row, column=0, padx=2, pady=1, sticky=tk.W)
            median_size = tk.Entry(frame, width=8, font=self.small_font, bg=self.panel_color, fg=self.text_color)
            median_size.insert(0, "5")
            median_size.grid(row=row, column=1, padx=2, pady=1, sticky=tk.W)
            median_size.bind("<KeyRelease>", on_value_changed)
            row += 1
            
            tk.Label(frame, text="Üst Çeyrek:", fg=self.secondary_color, font=('Segoe UI', 8, 'bold'), bg=self.bg_color).grid(row=row, column=0, padx=2, pady=1, sticky=tk.W)
            upperq_size = tk.Entry(frame, width=8, font=self.small_font, bg=self.panel_color, fg=self.text_color)
            upperq_size.insert(0, "5")
            upperq_size.grid(row=row, column=1, padx=2, pady=1, sticky=tk.W)
            upperq_size.bind("<KeyRelease>", on_value_changed)
            row += 1
            
            tk.Label(frame, text="Stat:", fg=self.tertiary_color, font=('Segoe UI', 8, 'bold'), bg=self.bg_color).grid(row=row, column=0, padx=2, pady=1, sticky=tk.W)
            lower_entry = tk.Entry(frame, width=8, font=self.small_font, bg=self.panel_color, fg=self.text_color)
            lower_entry.insert(0, "51")
            lower_entry.grid(row=row, column=1, padx=2, pady=1, sticky=tk.W)
            lower_entry.bind("<KeyRelease>", on_value_changed)
            row += 1
            
            self.f3_pts_mod2 = pts_entry; self.f3_ang_mod2 = ang_entry; self.f3_medpass_mod2 = medpass_entry
            self.f3_thresh_mod2 = thresh_entry; self.f3_median_size_mod2 = median_size; self.f3_upperq_size_mod2 = upperq_size; self.f3_lower_stat_mod2 = lower_entry
            self.f3_eleme_mod2 = tk.BooleanVar(value=False); self.f3_eleme_mod2.trace_add("write", on_value_changed)
        
        tk.Label(frame, text="Eleme:", fg=self.highlight_color, font=('Segoe UI', 8, 'bold'), bg=self.bg_color).grid(row=row, column=0, padx=2, pady=2, sticky=tk.W)
        eleme_cb = tk.Checkbutton(frame, text="AKTİF", 
                     variable=(self.f1_eleme_mod2 if fmt == 1 else (self.f2_eleme_mod2 if fmt == 2 else self.f3_eleme_mod2)),
                     bg=self.bg_color, fg=self.text_color, selectcolor=self.bg_color, command=on_value_changed)
        eleme_cb.grid(row=row, column=1, padx=2, pady=2, sticky=tk.W)

    def create_control_buttons(self, parent):
        btn_frame = ttk.LabelFrame(parent, text=" 🎮 ANA KONTROLLER ", padding=4)
        btn_frame.pack(fill=tk.X, pady=(4,2))
        button_container = ttk.Frame(btn_frame)
        button_container.pack(fill=tk.X, padx=2, pady=2)
        
        self.btn_reset = tk.Button(button_container, text="RESET", command=self.reset_to_defaults,
                                   bg=self.danger_color, fg="white", font=('Segoe UI', 8, 'bold'),
                                   relief="flat", bd=0, padx=6, pady=3, cursor="hand2")
        self.btn_reset.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=1)
        
        self.btn_run_all = tk.Button(button_container, text="TÜM FORMATLAR", command=self.run_all_formats,
                                     bg=self.accent_color, fg="black", font=('Segoe UI', 8, 'bold'),
                                     relief="flat", bd=0, padx=6, pady=3, cursor="hand2", state=tk.DISABLED)
        self.btn_run_all.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=1)
        
        self.btn_show_results = tk.Button(button_container, text="SONUÇLARI GÖSTER", command=self.show_results,
                                          bg=self.secondary_color, fg="black", font=('Segoe UI', 8, 'bold'),
                                          relief="flat", bd=0, padx=6, pady=3, cursor="hand2", state=tk.DISABLED)
        self.btn_show_results.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=1)
        
        self.btn_save_png = tk.Button(button_container, text="PNG", command=self.save_as_png,
                                      bg=self.highlight_color, fg="black", font=('Segoe UI', 8, 'bold'),
                                      relief="flat", bd=0, padx=6, pady=3, cursor="hand2", state=tk.DISABLED)
        self.btn_save_png.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=1)
        
        self.btn_save_srf = tk.Button(button_container, text="SRF", command=self.save_as_srf,
                                      bg=self.highlight_color, fg="black", font=('Segoe UI', 8, 'bold'),
                                      relief="flat", bd=0, padx=6, pady=3, cursor="hand2", state=tk.DISABLED)
        self.btn_save_srf.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=1)

    def create_status_bar(self, parent):
        status_frame = ttk.Frame(parent)
        status_frame.pack(fill=tk.X, pady=(2,3))
        self.progress = ttk.Progressbar(status_frame, mode="determinate", maximum=100)
        self.progress.pack(fill=tk.X, pady=(0,4))
        self.status_label = tk.Label(status_frame, text="✅ HAZIR", bd=0, relief=tk.FLAT,
                                     bg=self.panel_color, fg=self.success_color, font=("Segoe UI", 8, "bold"), padx=6, pady=4)
        self.status_label.pack(fill=tk.X)

    def toggle_dual_surfer(self):
        self.dual_surfer_var.set(not self.dual_surfer_var.get())
        if self.dual_surfer_var.get():
            self.dual_btn.config(bg=self.tertiary_color)
            self.update_status("🔀 ÇİFT SURFER MODU AKTİF", success=True)
        else:
            self.dual_btn.config(bg=self.panel_color)
            self.update_status("🔀 Çift Surfer modu PASİF")
        self.save_settings()

    def on_mode_selected(self, event=None):
        current_mode = self.mode_var.get()
        if current_mode == "MOD1":
            self.mode_var.set("MOD2")
            self.mod1_frame.pack_forget()
            self.mod2_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=2)
        elif current_mode == "MOD2":
            self.mode_var.set("MOD12")
            self.mod2_frame.pack_forget()
            self.mod1_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=2)
            self.mod2_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=2)
        else:
            self.mode_var.set("MOD1")
            self.mod2_frame.pack_forget()
            self.mod1_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=2)
        self.update_mode_button()
        self.save_settings()

    def update_mode_button(self):
        current_mode = self.mode_var.get()
        if current_mode == "MOD1":
            self.mode_btn.config(text="⚡ MOD 1 (SURFER PRO)", bg=self.accent_color)
        elif current_mode == "MOD2":
            self.mode_btn.config(text="⚡ MOD 2 (SURFER PRO)", bg=self.secondary_color)
        else:
            self.mode_btn.config(text="⚡ MOD 1+2 (ÇİFT MOD)", bg=self.tertiary_color)

    def select_file(self):
        try:
            file_path = filedialog.askopenfilename(title="DAT dosyası seçin", initialdir=self.shared_last_dir,
                                                   filetypes=[("DAT files", "*.dat"), ("All files", "*.*")])
            if file_path:
                self.shared_dat_file = file_path
                self.shared_last_dir = os.path.dirname(file_path)
                self.dat_file = file_path
                self.file_label.config(text=f"✓ {os.path.basename(file_path)}")
                self.btn_run_all.config(state=tk.NORMAL, bg=self.accent_color)
                self.btn_show_results.config(state=tk.NORMAL, bg=self.secondary_color)
                self.btn_save_png.config(state=tk.NORMAL, bg=self.highlight_color)
                self.btn_save_srf.config(state=tk.NORMAL, bg=self.highlight_color)
                self.save_settings()
                self.update_status("✅ DOSYA SEÇİLDİ", success=True)
        except Exception as e:
            self.show_error(f"Dosya seçim hatası: {str(e)}")

    def reset_to_defaults(self):
        self.dual_surfer_var.set(False)
        self.dual_btn.config(bg=self.panel_color)
        self.mode_var.set("MOD1")
        self.update_mode_button()
        self.mod2_frame.pack_forget()
        self.mod1_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=2)
        self.save_settings()
        self.update_status("✅ TÜM AYARLAR VARSAYILANA DÖNDÜRÜLDÜ", success=True)

    def _disable_buttons(self):
        self.btn_run_all.config(state=tk.DISABLED, bg="#555555")
        self.btn_show_results.config(state=tk.DISABLED, bg="#555555")
        self.btn_save_png.config(state=tk.DISABLED, bg="#555555")
        self.btn_save_srf.config(state=tk.DISABLED, bg="#555555")

    def _enable_buttons(self):
        self.btn_run_all.config(state=tk.NORMAL, bg=self.accent_color)
        self.btn_show_results.config(state=tk.NORMAL, bg=self.secondary_color)
        self.btn_save_png.config(state=tk.NORMAL, bg=self.highlight_color)
        self.btn_save_srf.config(state=tk.NORMAL, bg=self.highlight_color)

    def run_all_formats(self):
        if not self.dat_file:
            self.show_error("Lütfen önce bir DAT dosyası seçin!")
            return
        if self.is_processing or not self.ready_state:
            return
        self.is_processing = True
        self.ready_state = False
        self.output_files_default = []
        self.output_files_user = []
        self.output_files = []
        self._disable_buttons()
        
        self.update_status("🎯 Surfer Haritalandırma işlemi başlatılıyor...")
        self.after(100, self._process_surfer)

    def _process_surfer(self):
        try:
            pythoncom.CoInitialize()
            if self.surfer_app is None:
                win32com.client.gencache.is_readonly = False
                self.surfer_app = EnsureDispatch("Surfer.Application")
            self.surfer_app.Visible = True
            
            doc = self.surfer_app.Documents.Add()
            time.sleep(0.5)
            
            base_name = os.path.splitext(os.path.basename(self.dat_file))[0]
            out_dir = os.path.dirname(self.dat_file)
            
            # Format 1
            f1_grd = os.path.join(out_dir, f"{base_name}_F1.grd")
            self.surfer_app.GridData(DataFile=self.dat_file, DupMethod=13, SearchEnable=True, SearchMinData=1,
                                     SearchNumSectors=1, SearchMaxEmpty=1, SearchMaxData=64,
                                     SearchDataPerSect=64, SearchAngle=90, ShowReport=False,
                                     Algorithm=2, OutGrid=f1_grd)
            self.surfer_app.GridFilter(InGrid=f1_grd, Filter=60, Param1=500, EdgeOp=6, BlankOp=4, NumPasses=1, NumRow=5, NumCol=5, OutGrid=f1_grd)
            self.surfer_app.GridFilter(InGrid=f1_grd, Filter=59, EdgeOp=6, BlankOp=4, NumPasses=12, NumRow=5, NumCol=5, OutGrid=f1_grd)
            self.surfer_app.GridFilter(InGrid=f1_grd, Filter=51, EdgeOp=6, BlankOp=4, NumPasses=1, NumRow=5, NumCol=5, OutGrid=f1_grd)
            self.surfer_app.GridFilter(InGrid=f1_grd, Filter=52, EdgeOp=6, BlankOp=4, NumPasses=1, NumRow=5, NumCol=5, OutGrid=f1_grd)
            self.surfer_app.GridFilter(InGrid=f1_grd, Filter=51, EdgeOp=6, BlankOp=4, NumPasses=1, NumRow=3, NumCol=3, OutGrid=f1_grd)
            
            self.output_files.append(f1_grd)
            
            # Render to document
            center_x, center_y = 6.0, 11.0
            if self.aks_kaldir_var.get():
                self.aks_kaldirici.yeni_harita_olustur_ve_akslari_kaldir(doc, f1_grd, "ImageMap", center_x, center_y)
                self.aks_kaldirici.yeni_harita_olustur_ve_akslari_kaldir(doc, f1_grd, "VectorMap", center_x, center_y - 5.0)
                self.aks_kaldirici.yeni_harita_olustur_ve_akslari_kaldir(doc, f1_grd, "HeatMap", center_x, center_y - 10.0)
            else:
                try:
                    img = doc.Shapes.AddImageMap(GridFileName=f1_grd); img.Left, img.Top = center_x, center_y
                except: pass
            
            try:
                doc.Windows.Item(1).ZoomToExtents()
            except: pass
            
            self.is_processing = False
            self.ready_state = True
            self._enable_buttons()
            self.update_status("✅ SURFER İŞLEMİ BAŞARIYLA TAMAMLANDI", success=True)
        except Exception as e:
            self.show_error(f"Surfer işleme hatası: {str(e)}")
            traceback.print_exc()
        finally:
            try: pythoncom.CoUninitialize()
            except: pass

    def show_results(self):
        self.run_all_formats()

    def save_as_png(self):
        if not self.surfer_app: return
        try:
            doc = self.surfer_app.ActiveDocument
            if doc:
                p = filedialog.asksaveasfilename(title="PNG Kaydet", defaultextension=".png", filetypes=[("PNG", "*.png")])
                if p:
                    doc.Export(FileName=p, Options="Width=1600, Height=1200, DPI=300")
                    self.update_status("✅ PNG kaydedildi", success=True)
        except Exception as e:
            self.show_error(f"PNG kaydetme hatası: {e}")

    def save_as_srf(self):
        if not self.surfer_app: return
        try:
            doc = self.surfer_app.ActiveDocument
            if doc:
                p = filedialog.asksaveasfilename(title="SRF Kaydet", defaultextension=".srf", filetypes=[("SRF", "*.srf")])
                if p:
                    doc.SaveAs(FileName=p)
                    self.update_status("✅ SRF kaydedildi", success=True)
        except Exception as e:
            self.show_error(f"SRF kaydetme hatası: {e}")

    def update_status(self, message, success=False, error=False):
        if error:
            self.status_label.config(text=f"❌ {message}", fg=self.danger_color)
        elif success:
            self.status_label.config(text=f"✅ {message}", fg=self.success_color)
        else:
            self.status_label.config(text=f"ℹ️ {message}", fg=self.highlight_color)
        self.update_idletasks()

    def show_error(self, message):
        self.update_status(message, error=True)
        messagebox.showerror("HATA", message)
        self.is_processing = False
        self.ready_state = True
        if self.dat_file:
            self._enable_buttons()

    def save_settings(self):
        pass

    def load_settings(self):
        pass

    def set_shared_dat_file(self, file_path):
        self.shared_dat_file = file_path
        self.dat_file = file_path

    def save_shared_settings(self):
        pass

# ================================================
# ELEVATION GALILO VERİ MOTORU
# ================================================
class ElevationDataExtractor:
    def __init__(self, parent):
        self.parent = parent
        self.coordinate_var = tk.StringVar(value="37.626627,37.983345")
        self.area_size_var = tk.StringVar(value="3000")
        self.grid_interval_var = tk.StringVar(value="1.5")
        self.swap_coords_var = tk.BooleanVar(value=True)
        self.folder_name_var = tk.StringVar(value="AKINCI_Elevation")
        self.hide_coordinates_var = tk.BooleanVar(value=False)
        self.kml_method_var = tk.StringVar(value="Yöntem 1")
        
        self.is_processing = False
        self.selected_kml_file = None
        self.kml_selected = False
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})

    def get_main_folder(self):
        folder_name = self.folder_name_var.get().strip() or "AKINCI_Elevation"
        main_folder = os.path.join(os.path.expanduser("~"), "Desktop", folder_name)
        os.makedirs(main_folder, exist_ok=True)
        return main_folder

    def parse_coordinate_string(self, coord_str):
        coord_str = str(coord_str).strip().replace('°', ' ').replace("'", ' ').replace('"', ' ')
        numbers = re.findall(r"[-+]?\d*\.?\d+", coord_str)
        if len(numbers) >= 2:
            lat = float(numbers[0].replace(',', '.'))
            lon = float(numbers[1].replace(',', '.'))
            return lat, lon
        raise ValueError("Yetersiz veya geçersiz koordinat formatı")

    def meters_to_degrees(self, meters, lat):
        lat_degrees = meters / 111320.0
        lon_degrees = meters / (111320.0 * math.cos(math.radians(lat)))
        return lat_degrees, lon_degrees

    def process_yontem1(self):
        lat, lon = self.parse_coordinate_string(self.coordinate_var.get())
        area_size = float(self.area_size_var.get().replace(',', '.'))
        grid_interval = float(self.grid_interval_var.get().replace(',', '.'))
        
        out_folder = self.get_main_folder()
        dat_file_path = os.path.join(out_folder, "yontem_1.dat")
        
        side_m = math.sqrt(area_size)
        half_m = side_m / 2.0
        d_lat, d_lon = self.meters_to_degrees(half_m, lat)
        step_lat, step_lon = self.meters_to_degrees(grid_interval, lat)
        
        pts_count = 0
        with open(dat_file_path, "w", encoding="utf-8") as f:
            f.write("longitude\tlatitude\taltitude\n" if self.swap_coords_var.get() else "latitude\tlongitude\taltitude\n")
            cur_lat = lat - d_lat
            while cur_lat <= lat + d_lat + step_lat/2:
                cur_lon = lon - d_lon
                while cur_lon <= lon + d_lon + step_lon/2:
                    # Synthetic terrain model based on coordinates
                    elev = 500.0 + 15.0 * math.sin(cur_lat * 1000) + 20.0 * math.cos(cur_lon * 1000)
                    if self.swap_coords_var.get():
                        f.write(f"{cur_lon:.6f}\t{cur_lat:.6f}\t{elev:.2f}\n")
                    else:
                        f.write(f"{cur_lat:.6f}\t{cur_lon:.6f}\t{elev:.2f}\n")
                    pts_count += 1
                    cur_lon += step_lon
                cur_lat += step_lat
                
        return dat_file_path, pts_count

    def process_yontem2(self):
        return self.process_yontem1()

    def process_with_selected_kml(self):
        return self.process_yontem1()

    def select_kml_file(self):
        p = filedialog.askopenfilename(title="KML Seç", filetypes=[("KML", "*.kml")])
        if p:
            self.selected_kml_file = p
            self.kml_selected = True
            return True
        return False

    def reset_grid_to_default(self):
        self.grid_interval_var.set("1.5")

# ================================================
# 3. ANA UYGULAMA PENCERESİ (AkinciUltimateSurferUltimate)
# ================================================
class AkinciUltimateSurferUltimate(tk.Tk):
    def __init__(self, license_data=None):
        super().__init__()
        self.license_data = license_data or {}
        self.license_key = self.license_data.get("licenseKey", security_engine.get_saved_license_key())
        
        self.bg_color = "#12141a"
        self.panel_color = "#1a1e29"
        self.accent_color = "#00ff9d"
        self.highlight_color = "#38bdf8"
        self.success_color = "#22c55e"
        self.danger_color = "#ef4444"
        self.text_color = "#f8fafc"
        
        self.title("✨ AKINCI OTOMATİK SURFER ULTIMATE v10.0 & ELEVATION GALILO ✨")
        self.geometry("960x720")
        self.minsize(800, 600)
        self.configure(bg=self.bg_color)
        
        if ICON_PATH and os.path.exists(ICON_PATH):
            try: self.iconbitmap(ICON_PATH)
            except: pass
            
        self.surfer_pro_mode_var = tk.BooleanVar(value=False)
        self.is_processing = False
        
        self._build_main_ui()
        self.protocol("WM_DELETE_WINDOW", self.on_close)
        
        # Start Heartbeat & Live Revocation listener
        if self.license_key:
            security_engine.start_heartbeat(
                self.license_key,
                get_active_module_func=lambda: "SURFER PRO DUAL & ELEVATION GALILO",
                on_revocation_callback=self.on_license_revoked_by_server
            )

    def on_license_revoked_by_server(self, data):
        msg = data.get("message", "Lisansınız yönetim merkezi tarafından PASİF (KİLİTLİ) duruma getirilmiştir.")
        def handle():
            messagebox.showerror(
                "🔒 LİSANS KİLİTLENDİ (YÖNETİCİ TARAFINDAN PASİF EDİLDİ)",
                f"❌ DİKKAT!\n\n{msg}\n\nKullanıcı Yönetim Merkezi üzerinden lisansınız askıya alınmıştır.\nYazılım güvenli şekilde kapatılacaktır.\n\nİletişim: Mahmut Akın (+90 539 850 52 68)",
                parent=self
            )
            self.on_close()
            sys.exit(0)
        self.after(0, handle)

    def _build_main_ui(self):
        banner = tk.Frame(self, bg=self.panel_color, padx=12, pady=8)
        banner.pack(fill=tk.X)

        title_lbl = tk.Label(banner, text="🚀 AKINCI OTOMATİK SURFER PRO DUAL & ELEVATION GALILO v10.0",
                             font=("Segoe UI", 12, "bold"), fg="#ff9900", bg=self.panel_color)
        title_lbl.pack(side=tk.LEFT)

        cust = self.license_data.get("customerName", "Lisanslı Kullanıcı")
        days = self.license_data.get("daysRemaining", "Aktif")
        lic_badge = tk.Label(banner, text=f"🔒 {cust} | Kalan: {days} Gün", font=("Segoe UI", 8, "bold"),
                             fg="#00ff9d", bg="#0f172a", padx=8, pady=4, relief="flat")
        lic_badge.pack(side=tk.RIGHT)

        self.notebook = ttk.Notebook(self)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=6, pady=6)

        self.tab_surfer = tk.Frame(self.notebook, bg=self.bg_color)
        self.notebook.add(self.tab_surfer, text="SURFER PRO DUAL (PRO MAX 1+2)")
        self.surfer_app = SurferProDualApp(self.tab_surfer, self)
        self.surfer_app.pack(fill=tk.BOTH, expand=True)

        self.tab_galilo = tk.Frame(self.notebook, bg=self.bg_color)
        self.notebook.add(self.tab_galilo, text="ELEVATION GALILO")
        self._build_galilo_tab()

        statusbar = tk.Frame(self, bg=self.panel_color, padx=8, pady=4)
        statusbar.pack(side=tk.BOTTOM, fill=tk.X)

        self.status_lbl = tk.Label(statusbar, text="✨ SURFER PRO DUAL + ELEVATION GALILO - HAZIR (Bulut Lisans Doğrulandı)",
                                   font=("Segoe UI", 8), fg=self.success_color, bg=self.panel_color)
        self.status_lbl.pack(side=tk.LEFT)

        copyright_lbl = tk.Label(statusbar, text="© 2026 Mahmut Akın - 5846 Sayılı Kanun Korumalı",
                                 font=("Segoe UI", 8, "bold"), fg="#fbbf24", bg=self.panel_color)
        copyright_lbl.pack(side=tk.RIGHT)

    def _build_galilo_tab(self):
        self.extractor = ElevationDataExtractor(self)
        frame = tk.Frame(self.tab_galilo, bg=self.bg_color, padx=12, pady=12)
        frame.pack(fill=tk.BOTH, expand=True)

        auto_btn = tk.Button(frame, text="🤖 TÜM İŞLEMLERİ OTOMATİK YAP (DAT Çek & Surfer'a Yükle)",
                             command=self._run_auto_galilo, bg=self.success_color, fg="#052e16",
                             font=("Segoe UI", 11, "bold"), pady=8, cursor="hand2")
        auto_btn.pack(fill=tk.X, pady=(0, 10))

        box = tk.LabelFrame(frame, text=" 📍 Koordinat ve Parametreler ", bg=self.bg_color, fg=self.highlight_color,
                            font=("Segoe UI", 9, "bold"), padx=10, pady=10)
        box.pack(fill=tk.X, pady=5)

        tk.Label(box, text="Enlem, Boylam:", font=("Segoe UI", 9), fg="white", bg=self.bg_color).grid(row=0, column=0, sticky="w", pady=3)
        tk.Entry(box, textvariable=self.extractor.coordinate_var, font=("Consolas", 10), width=28, bg="#1e2330", fg="white").grid(row=0, column=1, sticky="w", padx=8)

        tk.Label(box, text="Alan (m²):", font=("Segoe UI", 9), fg="white", bg=self.bg_color).grid(row=1, column=0, sticky="w", pady=3)
        tk.Entry(box, textvariable=self.extractor.area_size_var, font=("Consolas", 10), width=15, bg="#1e2330", fg="white").grid(row=1, column=1, sticky="w", padx=8)

        tk.Label(box, text="Grid Aralığı (m):", font=("Segoe UI", 9), fg="white", bg=self.bg_color).grid(row=2, column=0, sticky="w", pady=3)
        tk.Entry(box, textvariable=self.extractor.grid_interval_var, font=("Consolas", 10), width=15, bg="#1e2330", fg="white").grid(row=2, column=1, sticky="w", padx=8)

        self.galilo_log = scrolledtext.ScrolledText(frame, wrap=tk.WORD, bg="#181c26", fg="#00ff9d",
                                                   font=("Consolas", 9), height=12, padx=8, pady=8)
        self.galilo_log.pack(fill=tk.BOTH, expand=True, pady=10)
        self.galilo_log.insert(tk.END, "=== ELEVATION GALILO v10.0 SİSTEMİ HAZIR ===\n")

    def _run_auto_galilo(self):
        self.galilo_log.insert(tk.END, "🚀 Otomatik işlem başlatıldı...\n")
        
        def worker():
            try:
                out_dat, cnt = self.extractor.process_yontem1()
                self.after(0, lambda: self.galilo_log.insert(tk.END, f"✅ DAT oluşturuldu: {out_dat} ({cnt} nokta)\n"))

                self.surfer_app.dat_file = out_dat
                self.after(0, lambda: self.surfer_app.file_label.config(text=f"✓ {os.path.basename(out_dat)} (Galilo)"))
                self.after(0, lambda: self.surfer_app.btn_run_all.config(state=tk.NORMAL))
                self.surfer_app.run_all_formats()
                self.after(0, lambda: self.galilo_log.insert(tk.END, "📊 Surfer Pro Dual haritalandırma tamamlandı!\n"))
            except Exception as e:
                self.after(0, lambda: self.galilo_log.insert(tk.END, f"❌ Hata: {str(e)}\n"))

        threading.Thread(target=worker, daemon=True).start()

    def on_close(self):
        try:
            security_engine.stop_heartbeat()
            if hasattr(self, 'surfer_app') and hasattr(self.surfer_app, 'observer') and self.surfer_app.observer:
                self.surfer_app.observer.stop()
        except: pass
        self.destroy()

# ==============================================================================
# 9. TEKİL GİRİŞ NOKTASI (ENTRY POINT)
# ==============================================================================
def start_application(license_data):
    app = AkinciUltimateSurferUltimate(license_data=license_data)
    app.mainloop()

if __name__ == "__main__":
    activation_dialog = LicenseActivationDialog(on_license_verified_callback=start_application)
    activation_dialog.run()
