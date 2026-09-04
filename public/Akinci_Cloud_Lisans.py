# -*- coding: utf-8 -*-
"""
================================================================================
✨ AKINCI OTOMATİK SURFER ULTIMATE v10.0 - TAM ENTEGRE ✨
🔒 AKINCI Cloud Lisans & Kullanıcı Yönetim Merkezi ile Tam Uyumlu
================================================================================
MODÜLLER:
  • SURFER PRO DUAL (PRO✅MAX 1+2 VS_2)
  • ELEVATION GALILO
  • AUTOCLICKER v3
  • EK DOSYALAR (Kısayol Yöneticisi)
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
import base64
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
import atexit
import signal
import secrets

# Güvenli kimlik ve şifreleme kütüphaneleri (Windows Credential Manager, Fernet Şifreleme, DotEnv)
try:
    import keyring
except ImportError:
    keyring = None

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    load_dotenv = None

try:
    from cryptography.fernet import Fernet
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
except ImportError:
    Fernet = None
    hashes = None
    PBKDF2HMAC = None

# ================================================
# 1. BULUT LİSANS VE GÜVENLİK MOTORU (GÜVENLİ KİMLİK YÖNETİMİ)
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
    """
    Güvenli Olay Günlüğü (Maskelenmiş Loglama):
    Log dosyalarına lisans anahtarları, Firebase API anahtarları, veritabanı ID'leri
    ve master secret gibi hassas bilgilerin düz metin olarak yazılmasını engeller.
    """
    msg_str = str(message)
    # Lisans anahtarlarını maskele (örn: AKN-XXXX-XXXX)
    msg_str = re.sub(r'AKN-[A-Za-z0-9\-]+', '[MASKED_LICENSE_KEY]', msg_str)
    # Google Firebase API anahtarlarını maskele (örn: AIzaSy...)
    msg_str = re.sub(r'AIzaSy[A-Za-z0-9_\-]+', '[MASKED_API_KEY]', msg_str)
    # URL veya parametredeki key=... değerlerini maskele
    msg_str = re.sub(r'([?&]key=)[^&\s]+', r'\1[MASKED_API_KEY]', msg_str)
    # Master secret ve hassas anahtarları maskele
    msg_str = re.sub(r'(master_secret["\']?\s*[:=]\s*["\']?)[^"\'\s,}]+', r'\1[MASKED_SECRET]', msg_str)
    msg_str = re.sub(r'(api_key["\']?\s*[:=]\s*["\']?)[^"\'\s,}]+', r'\1[MASKED_KEY]', msg_str)

    if level == "error":
        logging.error(msg_str, exc_info=exc)
    elif level == "warning":
        logging.warning(msg_str)
    else:
        logging.info(msg_str)

DEFAULT_API_URL = "http://localhost:3000"
APP_VERSION = "10.0 Ultimate"
REGISTRY_KEY_PATH = r"SOFTWARE\Golden Software\AK\SurProF_DUAL"
LICENSE_REG_KEY = "LicenseKey"
SERVER_REG_KEY = "CloudServerUrl"
AGREEMENT_SIGNED_KEY = "AgreementSigned"
AGREEMENT_DATE_KEY = "AgreementDate"

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

# ================================================
# DİL YÖNETİMİ
# ================================================
class LanguageManager:
    LANGUAGES = {"tr": "Türkçe", "en": "English", "ar": "العربية", "fa": "فارسی"}
    current_language = "tr"
    REGISTRY_VALUE_NAME = "Language"
    observers = []

    def __init__(self):
        self.load_language_from_registry()

    def load_language_from_registry(self):
        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH, 0, winreg.KEY_READ)
            saved_lang, _ = winreg.QueryValueEx(key, self.REGISTRY_VALUE_NAME)
            winreg.CloseKey(key)
            if saved_lang in self.LANGUAGES:
                self.current_language = saved_lang
        except:
            self.current_language = "tr"

    def save_language_to_registry(self, lang_code):
        try:
            key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH)
            winreg.SetValueEx(key, self.REGISTRY_VALUE_NAME, 0, winreg.REG_SZ, lang_code)
            winreg.CloseKey(key)
            self.current_language = lang_code
            self.notify_observers()
            return True
        except:
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
    try:
        key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH)
        winreg.SetValueEx(key, "RemoveAxes", 0, winreg.REG_DWORD, int(value))
        winreg.CloseKey(key)
    except: pass

def load_axes_setting_from_registry():
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH, 0, winreg.KEY_READ)
        val, _ = winreg.QueryValueEx(key, "RemoveAxes")
        winreg.CloseKey(key)
        return bool(val)
    except: pass
    return False

def save_auto_setting_to_registry(value):
    try:
        key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH)
        winreg.SetValueEx(key, "AutoProcess", 0, winreg.REG_DWORD, 1 if value else 0)
        winreg.CloseKey(key)
    except: pass

def load_auto_setting_from_registry():
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH, 0, winreg.KEY_READ)
        val, _ = winreg.QueryValueEx(key, "AutoProcess")
        winreg.CloseKey(key)
        return bool(val)
    except: pass
    return False

def _get_system_salt():
    """Rastgele 32-baytlık kriptografik tuz (salt) oluşturur veya güvenli dizinden yükler."""
    salt_dir = os.path.join(os.path.expanduser("~"), ".akinci_security")
    os.makedirs(salt_dir, exist_ok=True)
    salt_file = os.path.join(salt_dir, ".akinci_salt.bin")
    if os.path.exists(salt_file):
        try:
            with open(salt_file, "rb") as f:
                salt = f.read()
                if len(salt) >= 32:
                    return salt
        except Exception:
            pass
    salt = os.urandom(32)
    try:
        with open(salt_file, "wb") as f:
            f.write(salt)
    except Exception:
        pass
    return salt

def _derive_fernet_key(passphrase=None):
    """Kullanıcı parolası veya makine bilgisi + PBKDF2 600.000 iterasyon ile Fernet anahtarı türetir."""
    salt = _get_system_salt()
    secret_source = str(passphrase or platform.node() + "-AKINCI-SECURE-VAULT-2026")
    base = secret_source.encode('utf-8')
    if PBKDF2HMAC and hashes:
        try:
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=600000,
            )
            return base64.urlsafe_b64encode(kdf.derive(base))
        except Exception:
            pass
    digest = hashlib.sha256(base + salt).digest()
    return base64.urlsafe_b64encode(digest)

def encrypt_json_payload(data: dict, passphrase=None) -> bytes:
    """JSON verisini Fernet simetrik algoritması ile şifreler."""
    try:
        json_str = json.dumps(data, indent=2, ensure_ascii=False)
        key = _derive_fernet_key(passphrase)
        if Fernet:
            return Fernet(key).encrypt(json_str.encode('utf-8'))
        return base64.b64encode(json_str.encode('utf-8'))
    except Exception as e:
        log_event("warning", f"JSON şifreleme hatası: {e}")
        return b""

def decrypt_json_payload(cipher_bytes: bytes, passphrase=None) -> dict:
    """Şifreli JSON verisini çözer ve Python sözlüğüne dönüştürür."""
    if not cipher_bytes:
        return {}
    try:
        key = _derive_fernet_key(passphrase)
        if Fernet:
            decrypted = Fernet(key).decrypt(cipher_bytes).decode('utf-8')
        else:
            decrypted = base64.b64decode(cipher_bytes).decode('utf-8')
        return json.loads(decrypted)
    except Exception:
        try:
            # Eski şifresiz düz metin formatından güvenli okuma desteği
            return json.loads(cipher_bytes.decode('utf-8', errors='ignore'))
        except Exception:
            return {}

def save_encrypted_json_file(file_path: str, data: dict, passphrase=None) -> bool:
    """JSON verisini diske şifreli (.enc) olarak yazar."""
    try:
        parent_dir = os.path.dirname(file_path)
        if parent_dir:
            os.makedirs(parent_dir, exist_ok=True)
        enc_bytes = encrypt_json_payload(data, passphrase)
        if enc_bytes:
            with open(file_path, "wb") as f:
                f.write(enc_bytes)
            return True
    except Exception as e:
        log_event("warning", f"Şifreli JSON yazma hatası ({file_path}): {e}")
    return False

def load_encrypted_json_file(file_path: str, passphrase=None) -> dict:
    """Diskteki şifreli (.enc) JSON dosyasını okur ve çözer."""
    if not os.path.exists(file_path):
        return {}
    try:
        with open(file_path, "rb") as f:
            raw = f.read()
        return decrypt_json_payload(raw, passphrase)
    except Exception as e:
        log_event("warning", f"Şifreli JSON okuma hatası ({file_path}): {e}")
        return {}

def is_agreement_signed():
    """5846 Sayılı Telif Sözleşmesi dijital onayını Registry ve Şifreli Dosyalardan denetler."""
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH, 0, winreg.KEY_READ)
        signed, _ = winreg.QueryValueEx(key, AGREEMENT_SIGNED_KEY)
        winreg.CloseKey(key)
        if bool(signed):
            return True
    except:
        pass

    # Şifreli dosyalardan (.enc) kontrol et
    sec_enc = os.path.join(os.path.expanduser("~"), ".akinci_security", ".akinci_agr.enc")
    home_enc = os.path.join(os.path.expanduser("~"), ".akinci_agr.enc")
    for p in [sec_enc, home_enc]:
        data = load_encrypted_json_file(p)
        if data.get("signed") is True:
            return True

    # Eski şifresiz dosya varsa oku, şifreliye taşı ve eskiyi sil (Migration)
    old_plain = os.path.join(os.path.expanduser("~"), ".akinci_agr.json")
    if os.path.exists(old_plain):
        try:
            with open(old_plain, "r", encoding="utf-8") as f:
                old_data = json.load(f)
            if old_data.get("signed") is True:
                save_encrypted_json_file(sec_enc, old_data)
                save_encrypted_json_file(home_enc, old_data)
                try: os.remove(old_plain)
                except: pass
                return True
        except:
            pass

    return False

def save_agreement_signed(signer_name):
    """5846 Sayılı Telif Sözleşmesi onayını Windows Registry ve Şifreli JSON (.enc) olarak kaydeder."""
    try:
        key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH)
        winreg.SetValueEx(key, AGREEMENT_SIGNED_KEY, 0, winreg.REG_SZ, "True")
        winreg.SetValueEx(key, AGREEMENT_DATE_KEY, 0, winreg.REG_SZ, datetime.now().isoformat())
        winreg.CloseKey(key)
    except: pass

    agr_payload = {
        "signed": True,
        "signerName": str(signer_name).strip(),
        "signedAt": datetime.now().isoformat(),
        "lawReference": "5846 Sayılı Fikir ve Sanat Eserleri Kanunu (FSEK)",
        "encrypted": True
    }

    sec_enc = os.path.join(os.path.expanduser("~"), ".akinci_security", ".akinci_agr.enc")
    home_enc = os.path.join(os.path.expanduser("~"), ".akinci_agr.enc")
    save_encrypted_json_file(sec_enc, agr_payload)
    save_encrypted_json_file(home_enc, agr_payload)

    # Eski şifresiz json varsa sil
    old_plain = os.path.join(os.path.expanduser("~"), ".akinci_agr.json")
    if os.path.exists(old_plain):
        try: os.remove(old_plain)
        except: pass

# ==============================================================================
# FIRESTORE PROTOKOL DÖNÜŞTÜRÜCÜSÜ
# ==============================================================================
def parse_firestore_fields(fields_dict):
    if not isinstance(fields_dict, dict):
        return {}
    res = {}
    for k, v in fields_dict.items():
        if not isinstance(v, dict):
            continue
        if "stringValue" in v:
            res[k] = v["stringValue"]
        elif "integerValue" in v:
            res[k] = int(v["integerValue"])
        elif "doubleValue" in v:
            res[k] = float(v["doubleValue"])
        elif "booleanValue" in v:
            res[k] = bool(v["booleanValue"])
        elif "timestampValue" in v:
            res[k] = v["timestampValue"]
        elif "arrayValue" in v:
            vals = v["arrayValue"].get("values", [])
            arr = []
            for item in vals:
                if isinstance(item, dict):
                    if "stringValue" in item: arr.append(item["stringValue"])
                    elif "mapValue" in item: arr.append(parse_firestore_fields(item["mapValue"].get("fields", {})))
                    elif "integerValue" in item: arr.append(int(item["integerValue"]))
                    elif "booleanValue" in item: arr.append(bool(item["booleanValue"]))
            res[k] = arr
        elif "mapValue" in v:
            res[k] = parse_firestore_fields(v["mapValue"].get("fields", {}))
    return res

def dict_to_firestore_fields(py_dict):
    fields = {}
    for k, v in py_dict.items():
        if isinstance(v, bool):
            fields[k] = {"booleanValue": v}
        elif isinstance(v, int):
            fields[k] = {"integerValue": str(v)}
        elif isinstance(v, float):
            fields[k] = {"doubleValue": v}
        elif isinstance(v, str):
            fields[k] = {"stringValue": v}
        elif isinstance(v, list):
            vals = []
            for item in v:
                if isinstance(item, str):
                    vals.append({"stringValue": item})
                elif isinstance(item, dict):
                    vals.append({"mapValue": {"fields": dict_to_firestore_fields(item)}})
            fields[k] = {"arrayValue": {"values": vals}}
        elif isinstance(v, dict):
            fields[k] = {"mapValue": {"fields": dict_to_firestore_fields(v)}}
    return fields

class SecureString:
    """
    ================================================================================
    🛡️ GÜVENLİ BELLEK METİN YÖNETİCİSİ (IN-MEMORY SECURE STRING & ANTI-DUMP)
    ================================================================================
    Hassas kimlik bilgilerini (Firebase API Key, Project ID, Database ID, Master Secret)
    RAM üzerinde düz metin (plaintext) olarak tutmaz.
    
    Güvenlik Özellikleri:
    1. Oturum Başına Rastgele Maskeleme Anahtarı (Ephemeral Random Key XOR Masking)
    2. Zeroize / Güvenli Bellek Sıfırlama: ctypes.memset ve bytearray temizliği ile RAM'den kalıcı silme
    3. Log & Print Koruması: __repr__ ve __str__ asla gerçek veriyi sızdırmaz
    4. Otomatik Temizlik: Garbage collection (__del__), context manager ve atexit entegrasyonu
    5. Memory Dump Savunması: Düz metin sadece kullanım anında anlık üretilir ve yok edilir
    """
    def __init__(self, value: str = ""):
        self._key = bytearray(os.urandom(32))
        self._buffer = bytearray()
        self._length = 0
        self._is_cleared = False
        if value:
            self.set_value(value)

    def set_value(self, value: str):
        self.clear()
        if not value:
            self._buffer = bytearray()
            self._length = 0
            self._is_cleared = False
            return
        
        # 32 baytlık rastgele maskeleme anahtarı türet
        self._key = bytearray(os.urandom(32))
        raw = str(value).encode('utf-8')
        self._length = len(raw)
        key_len = len(self._key)
        
        # RAM'de XOR ile maskelenmiş bayt dizisi oluştur
        self._buffer = bytearray(raw[i] ^ self._key[i % key_len] for i in range(self._length))
        self._is_cleared = False

    def get_value(self) -> str:
        """Kısa süreliğine maskeyi çözüp değeri döndürür. Geçici baytlar anında sıfırlanır."""
        if self._is_cleared or not self._buffer or self._length == 0:
            return ""
        
        key_len = len(self._key)
        decrypted = bytearray(self._buffer[i] ^ self._key[i % key_len] for i in range(self._length))
        try:
            result = decrypted.decode('utf-8', errors='ignore')
            return result
        finally:
            # Geçici deşifre edilmiş arabelleği bellekten sıfırla (Zero-out)
            try:
                if len(decrypted) > 0:
                    ctypes.memset((ctypes.c_char * len(decrypted)).from_buffer(decrypted), 0, len(decrypted))
            except Exception:
                pass
            for i in range(len(decrypted)):
                decrypted[i] = 0

    def is_empty(self) -> bool:
        return self._length == 0 or self._is_cleared

    def clear(self):
        """Bellekteki hassas tamponları (buffer & key) sıfırlar (Zero-out / Wipe)."""
        if hasattr(self, '_buffer') and self._buffer:
            try:
                ctypes.memset((ctypes.c_char * len(self._buffer)).from_buffer(self._buffer), 0, len(self._buffer))
            except Exception:
                pass
            for i in range(len(self._buffer)):
                self._buffer[i] = 0
            self._buffer = bytearray()
        
        if hasattr(self, '_key') and self._key:
            try:
                ctypes.memset((ctypes.c_char * len(self._key)).from_buffer(self._key), 0, len(self._key))
            except Exception:
                pass
            for i in range(len(self._key)):
                self._key[i] = 0
            self._key = bytearray()
        
        self._length = 0
        self._is_cleared = True

    def __enter__(self):
        return self.get_value()

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

    def __str__(self):
        return "<SecureString [PROTECTED]>"

    def __repr__(self):
        return "<SecureString [PROTECTED]>"

    def __del__(self):
        self.clear()

    def __bool__(self):
        return not self.is_empty()

class AkinciCloudSecurity:
    """
    AKINCI Bulut Lisans ve Güvenlik Yönetim Motoru:
    Hassas bilgileri (Firebase API Key, Project ID, Database ID, Master Secret)
    kaynak kod içinde asla düz metin olarak barındırmaz.
    
    Çok Katmanlı Güvenli Depolama ve Öncelik Hiyerarşisi:
    1. Ortam Değişkenleri (.env / os.environ) -> En Yüksek Öncelik
    2. Windows Credential Manager (keyring ile "AkinciSurfer" servisi)
    3. Şifrelenmiş Yapılandırma Dosyası (config.enc / Fernet AES simetrik şifreleme)
    4. Yapılandırma Sihirbazı / Güvenli Fallback (Eksikse ilk çalıştırmada güvenli girdi penceresi)
    
    Bellek Güvenliği (In-Memory & Anti-Dump):
    - Hassas alanlar SecureString ile RAM'de maskelenmiş tutulur.
    - Program sonlandığında (atexit/signals) tüm bellek alanları sıfırlanır (Zero-out).
    """
    CREDENTIAL_SERVICE_NAME = "AkinciSurfer"
    CONFIG_FILE_NAME = "config.json"
    ENCRYPTED_CONFIG_NAME = "config.enc"

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

        # Bellek Korumalı Güvenli Alanlar (SecureString ile şifreli/maskelenmiş)
        self._firebase_project_id = SecureString("")
        self._firebase_db_id = SecureString("")
        self._firebase_api_key = SecureString("")
        self._master_secret = SecureString("")
        self.firestore_rest_base = ""

        # Çalışma Zamanı Koruması (Anti-Dump & Exit Handlers)
        self._apply_runtime_protections()

        # Bağımlılık kontrolü
        self._check_dependencies()
        self._check_oauth_dependencies()

        # Eski güvensiz şifrelenmemiş dosyaları güvenli dizine taşı veya temizle
        self._clean_old_config_files()

        # Kimlik bilgilerini hiyerarşik olarak yükle
        self._load_credentials()

        # API Anahtarı ve kimlik bilgisi hijyen kontrolü
        self._check_api_key_expiry()

    @property
    def firebase_project_id(self) -> str:
        return self._firebase_project_id.get_value() if hasattr(self, '_firebase_project_id') and self._firebase_project_id else ""

    @firebase_project_id.setter
    def firebase_project_id(self, val: str):
        if not hasattr(self, '_firebase_project_id') or self._firebase_project_id is None:
            self._firebase_project_id = SecureString(val)
        else:
            self._firebase_project_id.set_value(val)

    @property
    def firebase_db_id(self) -> str:
        return self._firebase_db_id.get_value() if hasattr(self, '_firebase_db_id') and self._firebase_db_id else ""

    @firebase_db_id.setter
    def firebase_db_id(self, val: str):
        if not hasattr(self, '_firebase_db_id') or self._firebase_db_id is None:
            self._firebase_db_id = SecureString(val)
        else:
            self._firebase_db_id.set_value(val)

    @property
    def firebase_api_key(self) -> str:
        return self._firebase_api_key.get_value() if hasattr(self, '_firebase_api_key') and self._firebase_api_key else ""

    @firebase_api_key.setter
    def firebase_api_key(self, val: str):
        if not hasattr(self, '_firebase_api_key') or self._firebase_api_key is None:
            self._firebase_api_key = SecureString(val)
        else:
            self._firebase_api_key.set_value(val)

    @property
    def master_secret(self) -> str:
        return self._master_secret.get_value() if hasattr(self, '_master_secret') and self._master_secret else ""

    @master_secret.setter
    def master_secret(self, val: str):
        if not hasattr(self, '_master_secret') or self._master_secret is None:
            self._master_secret = SecureString(val)
        else:
            self._master_secret.set_value(val)

    def purge_all_secrets(self):
        """Program kapandığında veya hata durumunda bellekteki hassas verileri sıfırlar (Zero-out / Memory Wipe)."""
        try:
            if hasattr(self, '_firebase_project_id') and self._firebase_project_id:
                self._firebase_project_id.clear()
            if hasattr(self, '_firebase_db_id') and self._firebase_db_id:
                self._firebase_db_id.clear()
            if hasattr(self, '_firebase_api_key') and self._firebase_api_key:
                self._firebase_api_key.clear()
            if hasattr(self, '_master_secret') and self._master_secret:
                self._master_secret.clear()
            self.firestore_rest_base = ""
            log_event("info", "Bellekteki tüm hassas kimlik bilgileri güvenle sıfırlandı (Memory Zeroed).")
        except Exception:
            pass

    def _apply_runtime_protections(self):
        """Çalışma zamanı koruması: atexit, signal ve memory dump engelleme."""
        # 1. atexit ile program normal sonlandığında bellek temizliği
        try:
            atexit.register(self.purge_all_secrets)
        except Exception:
            pass

        # 2. Sinyal yakalama (SIGINT, SIGTERM) ile ani kapanışlarda bellek temizliği
        try:
            for sig_name in ('SIGINT', 'SIGTERM', 'SIGABRT'):
                sig = getattr(signal, sig_name, None)
                if sig is not None:
                    try:
                        orig_handler = signal.getsignal(sig)
                        def make_handler(original):
                            def handler(signum, frame):
                                self.purge_all_secrets()
                                if callable(original) and original not in (signal.SIG_IGN, signal.SIG_DFL):
                                    original(signum, frame)
                                sys.exit(0)
                            return handler
                        signal.signal(sig, make_handler(orig_handler))
                    except Exception:
                        pass
        except Exception:
            pass

        # 3. Core Dump / Memory Dump Koruması (Linux / POSIX)
        try:
            import resource
            resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
        except Exception:
            pass

    def __del__(self):
        self.purge_all_secrets()

    def _check_dependencies(self):
        """Güvenlik ve şifreleme bağımlılıklarını kontrol eder."""
        missing = []
        if keyring is None:
            missing.append("keyring")
        if load_dotenv is None:
            missing.append("python-dotenv")
        if Fernet is None:
            missing.append("cryptography")

        if missing:
            warning_msg = (
                f"Eksik güvenlik kütüphaneleri: {', '.join(missing)}\n"
                f"Tüm güvenlik katmanlarının aktif olması için terminalden çalıştırın: pip install {' '.join(missing)}"
            )
            log_event("warning", warning_msg)

    def _check_oauth_dependencies(self):
        """OAuth2 kütüphanelerinin varlığını kontrol eder."""
        try:
            import google.auth.transport.requests
            from google.oauth2 import service_account
            return True
        except ImportError:
            missing = []
            try:
                import google
            except ImportError:
                missing.append("google-auth")
            try:
                import google.auth
            except ImportError:
                missing.append("google-auth-oauthlib")
            
            if missing:
                log_event("info", f"OAuth2 Service Account desteği için opsiyonel kütüphaneler: {', '.join(missing)} (pip install google-auth google-auth-oauthlib)")
            return False

    def _load_env_file(self):
        """.env dosyasını güvenle yükler ve kontrol eder."""
        env_paths = [
            os.path.join(os.getcwd(), '.env'),
            os.path.join(os.path.expanduser("~"), '.akinci_env'),
            os.path.join(os.path.expanduser("~"), '.akinci_security', '.env')
        ]
        
        for env_path in env_paths:
            if os.path.exists(env_path):
                try:
                    if load_dotenv:
                        load_dotenv(env_path)
                        log_event("info", f".env dosyası yüklendi: {env_path}")
                        return True
                except Exception as e:
                    log_event("warning", f".env dosyası yüklenemedi: {e}")
        return False

    def _clean_old_config_files(self):
        """Eski şifrelenmemiş yapılandırma ve geçici düz metin dosyalarını temizler ve güvenli yedekler."""
        old_files = [
            os.path.join(os.getcwd(), "config.json"),
            os.path.join(os.getcwd(), ".env"),
            os.path.join(os.path.expanduser("~"), ".akinci_config.json"),
            os.path.join(os.path.expanduser("~"), ".akinci_env"),
            os.path.join(os.path.expanduser("~"), ".akinci_lic.json"),
            os.path.join(os.path.expanduser("~"), ".akinci_agr.json"),
        ]
        
        deleted = []
        for file_path in old_files:
            if os.path.exists(file_path):
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                    
                    # Hassas token veya anahtar içeriyorsa güvenli dizine yedekle
                    if "AIzaSy" in content or "firebase" in content.lower() or "key" in content.lower() or "secret" in content.lower():
                        sec_backup_dir = os.path.join(os.path.expanduser("~"), ".akinci_security", "backups")
                        os.makedirs(sec_backup_dir, exist_ok=True)
                        backup_path = os.path.join(sec_backup_dir, f"{os.path.basename(file_path)}.{int(time.time())}.backup")
                        shutil.copy2(file_path, backup_path)
                    
                    os.remove(file_path)
                    deleted.append(os.path.basename(file_path))
                except Exception as e:
                    log_event("warning", f"Eski dosya temizleme uyarısı ({file_path}): {e}")
        
        if deleted:
            log_event("info", f"Güvensiz eski düz metin dosyalar temizlendi: {', '.join(deleted)}")
        return deleted

    def _check_api_key_expiry(self):
        """API anahtarı ve kimlik bilgisi hijyen kontrolü (6 aydan eski anahtarlar için güvenlik uyarısı)"""
        try:
            sec_dir = os.path.join(os.path.expanduser("~"), ".akinci_security")
            cfg_enc = os.path.join(sec_dir, self.ENCRYPTED_CONFIG_NAME)
            if os.path.exists(cfg_enc):
                mtime = os.path.getmtime(cfg_enc)
                age_days = (time.time() - mtime) / (24 * 3600)
                if age_days > 180:
                    import tkinter.messagebox as mb
                    mb.showwarning(
                        "⚠️ API Anahtarı Güvenlik Uyarısı",
                        "Yerel yapılandırma ve API anahtarlarınız 6 aydan uzun süredir değiştirilmedi.\n\n"
                        "En üst düzey bulut güvenliği için periyodik olarak Google Cloud / Firebase Console\n"
                        "üzerinden API anahtarlarınızı yenilemeniz önerilir."
                    )
        except Exception:
            pass

    def _load_or_create_salt(self):
        """Rastgele 32-baytlık kriptografik tuz (salt) oluşturur veya güvenli dizinden yükler."""
        return _get_system_salt()

    def _generate_master_secret(self):
        """Güçlü, rastgele 32 karakterlik master secret anahtarı oluşturur."""
        import secrets
        import string
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        secret = ''.join(secrets.choice(alphabet) for _ in range(32))
        return f"AKN_MASTER_{secret}"

    def _is_strong_password(self, password):
        """Şifre gücünü kontrol eder (En az 8 karakter, büyük harf, küçük harf, rakam ve özel karakter)"""
        if not password or len(password) < 8:
            return False
        if not re.search(r'[A-Z]', password):
            return False
        if not re.search(r'[a-z]', password):
            return False
        if not re.search(r'[0-9]', password):
            return False
        if not re.search(r'[!@#$%^&*(),.?":{}|<>\-_=+/\\~`]', password):
            return False
        return True

    def _prompt_user_password(self):
        """Kullanıcıdan güçlü şifreleme parolası alır (Zorunlu, güçlü kural seti ve onaylı)"""
        try:
            import tkinter as tk
            import tkinter.simpledialog as sd
            import tkinter.messagebox as mb
            root = tk.Tk()
            root.withdraw()
            root.attributes("-topmost", True)

            max_attempts = 3
            attempts = 0

            while attempts < max_attempts:
                password = sd.askstring(
                    "🔐 Şifreleme Anahtarı",
                    "Lütfen GÜÇLÜ bir şifre belirleyiniz (en az 8 karakter):\n"
                    "(En az bir büyük harf, bir küçük harf, bir rakam ve özel karakter içermelidir)\n"
                    "(Bu şifre yerel yapılandırma verilerinizi şifrelemek için kullanılacaktır)",
                    show='*',
                    parent=root
                )

                if password is None:
                    root.destroy()
                    return self._generate_master_secret()

                if len(password) < 8:
                    mb.showwarning("Uyarı", "Şifre en az 8 karakter olmalıdır!", parent=root)
                    attempts += 1
                    continue

                if not self._is_strong_password(password):
                    mb.showwarning(
                        "Uyarı",
                        "Şifre çok zayıf!\nEn az 8 karakter, en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter (!@#$%^&* vb.) içermelidir.",
                        parent=root
                    )
                    attempts += 1
                    continue

                # Şifre onayı
                confirm = sd.askstring(
                    "🔐 Şifre Onayı",
                    "Şifreyi doğrulamak için tekrar giriniz:",
                    show='*',
                    parent=root
                )

                if confirm is None:
                    root.destroy()
                    return self._generate_master_secret()

                if password != confirm:
                    mb.showwarning("Uyarı", "Girdiğiniz şifreler eşleşmiyor! Lütfen tekrar deneyin.", parent=root)
                    attempts += 1
                    continue

                root.destroy()
                return password

            root.destroy()
            return self._generate_master_secret()
        except Exception:
            pass

        return self._generate_master_secret()

    def _get_encryption_key(self, custom_passphrase=None):
        """
        Kullanıcı parolası veya makineye özgü HWID, rastgele tuz (salt) ve PBKDF2HMAC (600.000 iterasyon - OWASP 2024)
        ile Fernet 32-baytlık AES anahtarı türetir.
        """
        salt = self._load_or_create_salt()
        if custom_passphrase:
            secret_source = custom_passphrase
        else:
            secret_source = self.hwid
            if not secret_source or secret_source.startswith("AKN-HWID-FALLBACK"):
                secret_source = self._prompt_user_password()

        base = secret_source.encode('utf-8')
        if PBKDF2HMAC and hashes:
            try:
                kdf = PBKDF2HMAC(
                    algorithm=hashes.SHA256(),
                    length=32,
                    salt=salt,
                    iterations=600000,
                )
                return base64.urlsafe_b64encode(kdf.derive(base))
            except Exception:
                pass
        digest = hashlib.sha256(base + salt).digest()
        return base64.urlsafe_b64encode(digest)

    def _encrypt_data(self, plain_text):
        """Metin verisini Fernet simetrik algoritması ile şifreler."""
        if not Fernet:
            return base64.b64encode(plain_text.encode('utf-8'))
        try:
            key = self._get_encryption_key()
            fernet = Fernet(key)
            return fernet.encrypt(plain_text.encode('utf-8'))
        except Exception as e:
            log_event("warning", f"Veri şifreleme uyarısı: {e}")
            return base64.b64encode(plain_text.encode('utf-8'))

    def _decrypt_data(self, cipher_bytes):
        """Şifrelenmiş veriyi çözer."""
        if not Fernet:
            try:
                return base64.b64decode(cipher_bytes).decode('utf-8')
            except Exception:
                return cipher_bytes.decode('utf-8', errors='ignore')
        try:
            key = self._get_encryption_key()
            fernet = Fernet(key)
            return fernet.decrypt(cipher_bytes).decode('utf-8')
        except Exception as e:
            try:
                return base64.b64decode(cipher_bytes).decode('utf-8')
            except Exception:
                log_event("warning", f"Şifre çözme uyarısı: {e}")
                return cipher_bytes.decode('utf-8', errors='ignore')

    def _encrypt_json_file(self, file_path, data, passphrase=None):
        """JSON verisini belirtilen dosya yoluna şifreli (.enc) olarak kaydeder."""
        return save_encrypted_json_file(file_path, data, passphrase)

    def _decrypt_json_file(self, file_path, passphrase=None):
        """Belirtilen dosya yolundaki şifreli (.enc) JSON dosyasını çözer."""
        return load_encrypted_json_file(file_path, passphrase)

    def _get_oauth_token(self):
        """Service Account JSON dosyasından Google OAuth2 Access Token alır."""
        sa_paths = [
            os.path.join(os.path.expanduser("~"), ".akinci_security", "service-account.json"),
            os.path.join(os.getcwd(), "service-account.json"),
            os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")
        ]
        
        for sa_path in sa_paths:
            if sa_path and os.path.exists(sa_path):
                try:
                    import google.auth.transport.requests
                    from google.oauth2 import service_account
                    
                    credentials = service_account.Credentials.from_service_account_file(
                        sa_path,
                        scopes=[
                            "https://www.googleapis.com/auth/firebase",
                            "https://www.googleapis.com/auth/datastore"
                        ]
                    )
                    auth_req = google.auth.transport.requests.Request()
                    credentials.refresh(auth_req)
                    return credentials.token
                except Exception as e:
                    log_event("warning", f"OAuth2 Service Account token alınamadı ({sa_path}): {e}")
        return None

    def _create_service_account_guide(self):
        """Service Account oluşturma rehberini gösterir."""
        guide = (
            "🔐 Google Firebase Service Account Oluşturma Rehberi:\n\n"
            "1. Firebase Console'a gidin (console.firebase.google.com)\n"
            "2. Projenizi seçin\n"
            "3. Sol menüden 'Proje Ayarları' > 'Service Accounts' tıklayın\n"
            "4. 'Generate new private key' butonuna tıklayın\n"
            "5. JSON dosyasını indirin ve aşağıdaki konuma kaydedin:\n"
            "   ~/.akinci_security/service-account.json\n\n"
            "NOT: Bu dosya çok önemlidir! Kimseyle paylaşmayın!"
        )
        try:
            import tkinter.messagebox as mb
            mb.showinfo("Service Account Rehberi", guide)
        except Exception:
            print(guide)

    def _load_credentials(self):
        """
        Kimlik bilgilerini öncelik sırasına göre yükler:
        1. Ortam Değişkenleri (.env / os.environ)
        2. Windows Credential Manager (keyring / 'AkinciSurfer')
        3. Şifreli Yapılandırma Dosyası (config.enc) veya config.json
        4. Güvenli İlk Kurulum Sihirbazı (_run_configuration_wizard)
        """
        try:
            # .env dosyasını tara ve yükle
            self._load_env_file()

            # --- 1. ÖNCELİK: Ortam Değişkenleri (.env ve os.environ) ---
            env_project = os.environ.get("FIREBASE_PROJECT_ID", "").strip()
            env_db = os.environ.get("FIREBASE_DB_ID", "").strip()
            env_key = os.environ.get("FIREBASE_API_KEY", "").strip()
            env_secret = os.environ.get("MASTER_OFFLINE_SECRET", "").strip()

            if env_project and env_db and (env_key or self._get_oauth_token()):
                self.firebase_project_id = env_project
                self.firebase_db_id = env_db
                self.firebase_api_key = env_key
                self.master_secret = env_secret or self._generate_master_secret()
                self._update_firestore_base()
                log_event("info", "Güvenlik kimlik bilgileri Ortam Değişkenlerinden (Environment Variables) yüklendi.")
                return True

            # --- 2. ÖNCELİK: Windows Credential Manager (keyring) ---
            if keyring:
                try:
                    cred_project = keyring.get_password(self.CREDENTIAL_SERVICE_NAME, "firebase_project_id")
                    cred_db = keyring.get_password(self.CREDENTIAL_SERVICE_NAME, "firebase_db_id")
                    cred_key = keyring.get_password(self.CREDENTIAL_SERVICE_NAME, "firebase_api_key")
                    cred_secret = keyring.get_password(self.CREDENTIAL_SERVICE_NAME, "master_secret")

                    if cred_project and cred_db and (cred_key or self._get_oauth_token()):
                        self.firebase_project_id = cred_project.strip()
                        self.firebase_db_id = cred_db.strip()
                        self.firebase_api_key = (cred_key or "").strip()
                        self.master_secret = (cred_secret or "").strip() or self._generate_master_secret()
                        self._update_firestore_base()
                        log_event("info", "Güvenlik kimlik bilgileri Windows Credential Manager'dan ('AkinciSurfer') yüklendi.")
                        return True
                except Exception as e:
                    log_event("warning", f"Windows Credential Manager okuma denemesi: {e}")

            # --- 3. ÖNCELİK: Şifrelenmiş Yapılandırma Dosyası (config.enc / config.json) ---
            possible_config_paths = [
                os.path.join(os.path.expanduser("~"), ".akinci_security", self.ENCRYPTED_CONFIG_NAME),
                os.path.join(os.getcwd(), self.ENCRYPTED_CONFIG_NAME),
                os.path.join(os.path.expanduser("~"), f".{self.ENCRYPTED_CONFIG_NAME}"),
                os.path.join(os.getcwd(), self.CONFIG_FILE_NAME),
                os.path.join(os.path.expanduser("~"), f".akinci_{self.CONFIG_FILE_NAME}")
            ]

            for cfg_path in possible_config_paths:
                if os.path.exists(cfg_path):
                    try:
                        with open(cfg_path, "rb") as f:
                            raw_bytes = f.read()

                        if cfg_path.endswith(".enc"):
                            decrypted_text = self._decrypt_data(raw_bytes)
                            parsed = json.loads(decrypted_text)
                        else:
                            parsed = json.loads(raw_bytes.decode('utf-8'))

                        fb = parsed.get("firebase", {})
                        sec = parsed.get("security", {})
                        if fb.get("project_id") and fb.get("database_id") and (fb.get("api_key") or self._get_oauth_token()):
                            self.firebase_project_id = fb.get("project_id").strip()
                            self.firebase_db_id = fb.get("database_id").strip()
                            self.firebase_api_key = fb.get("api_key", "").strip()
                            self.master_secret = sec.get("master_secret", "").strip() or self._generate_master_secret()
                            self._update_firestore_base()
                            log_event("info", f"Güvenlik kimlik bilgileri yapılandırma dosyasından ({os.path.basename(cfg_path)}) yüklendi.")
                            return True
                    except Exception as e:
                        log_event("warning", f"Yapılandırma dosyası ({cfg_path}) çözümlenemedi: {e}")

            # --- 4. ÖNCELİK: Güvenli İlk Kurulum Sihirbazı ---
            return self._run_configuration_wizard()
        except Exception as err:
            self.purge_all_secrets()
            log_event("error", f"Kimlik bilgileri yüklenirken hata oluştu: {err}")
            try:
                import tkinter.messagebox as mb
                mb.showerror(
                    "Güvenlik Hatası",
                    f"Kimlik bilgileri yüklenirken hata oluştu:\n{str(err)}\n\n"
                    "Lütfen uygulamayı yeniden başlatın veya destek ile iletişime geçin:\n"
                    "Mahmut Akın (+90 539 850 52 68)"
                )
            except Exception:
                pass
            return False

    def _update_firestore_base(self):
        """Yüklenen Firebase kimlik bilgilerine göre REST API URL'sini günceller."""
        if self.firebase_project_id and self.firebase_db_id:
            self.firestore_rest_base = f"https://firestore.googleapis.com/v1/projects/{self.firebase_project_id}/databases/{self.firebase_db_id}/documents"

    def _save_credentials(self, firebase_config, security_config, save_to_keyring=True, save_to_file=True):
        """
        Firebase ve güvenlik yapılandırmalarını Windows Credential Manager'a ve
        şifrelenmiş yapılandırma dosyasına güvenle kaydeder.
        """
        proj_id = firebase_config.get("project_id", "").strip()
        db_id = firebase_config.get("database_id", "").strip()
        api_k = firebase_config.get("api_key", "").strip()
        sec = security_config.get("master_secret", "").strip()

        if not (proj_id and db_id and api_k):
            return False, "Firebase Project ID, Database ID ve API Key zorunludur."

        self.firebase_project_id = proj_id
        self.firebase_db_id = db_id
        self.firebase_api_key = api_k
        self.master_secret = sec or self._generate_master_secret()
        self._update_firestore_base()

        saved_locations = []

        # 1. Windows Credential Manager'a Kaydet
        if save_to_keyring and keyring:
            try:
                keyring.set_password(self.CREDENTIAL_SERVICE_NAME, "firebase_project_id", proj_id)
                keyring.set_password(self.CREDENTIAL_SERVICE_NAME, "firebase_db_id", db_id)
                keyring.set_password(self.CREDENTIAL_SERVICE_NAME, "firebase_api_key", api_k)
                if self.master_secret:
                    keyring.set_password(self.CREDENTIAL_SERVICE_NAME, "master_secret", self.master_secret)
                saved_locations.append("Windows Credential Manager")
            except Exception as e:
                log_event("warning", f"Credential Manager kayıt uyarısı: {e}")

        # 2. Şifrelenmiş Yapılandırma Dosyasına (Fernet AES) Kaydet
        if save_to_file:
            try:
                sec_dir = os.path.join(os.path.expanduser("~"), ".akinci_security")
                os.makedirs(sec_dir, exist_ok=True)
                payload = {
                    "firebase": {
                        "project_id": proj_id,
                        "database_id": db_id,
                        "api_key": api_k
                    },
                    "security": {
                        "master_secret": self.master_secret
                    }
                }
                json_str = json.dumps(payload, indent=2)
                encrypted_bytes = self._encrypt_data(json_str)
                enc_file_path = os.path.join(sec_dir, self.ENCRYPTED_CONFIG_NAME)
                with open(enc_file_path, "wb") as f:
                    f.write(encrypted_bytes)
                saved_locations.append("Şifreli Yapılandırma Dosyası (.config.enc)")
            except Exception as e:
                log_event("warning", f"Şifreli dosya kayıt uyarısı: {e}")

        if saved_locations:
            log_event("info", f"Kimlik bilgileri başarıyla saklandı: {', '.join(saved_locations)}")
            return True, f"Kimlik bilgileri güvenli alanlara ({', '.join(saved_locations)}) kaydedildi."
        else:
            return False, "Kimlik bilgileri güvenli depolara yazılamadı."

    def _run_configuration_wizard(self):
        """
        Güvenli İlk Kurulum Sihirbazı:
        Kod içinde hiçbir sabit değer barındırmaz.
        Kullanıcıdan GUI (Tkinter dialog) veya CLI üzerinden gizli giriş alarak şifreli depolar.
        """
        project = ""
        db = ""
        api_key = ""
        master_secret = ""

        # 1. Tkinter GUI Giriş Penceresi
        try:
            import tkinter as tk
            import tkinter.simpledialog as sd
            import tkinter.messagebox as mb

            root = tk.Tk()
            root.withdraw()
            root.attributes("-topmost", True)

            mb.showinfo(
                "🔐 AKINCI Bulut Güvenlik Kurulumu",
                "Uygulama ilk kez çalıştırılıyor veya kimlik bilgileri bulunamadı.\n"
                "Lütfen bulut veritabanı bağlantı parametrelerinizi giriniz.\n"
                "(Bu bilgiler sadece sizin cihazınızda şifrelenerek saklanacaktır.)"
            )

            project = sd.askstring("🔐 Firebase Yapılandırması", "Firebase Project ID:", parent=root)
            if project:
                db = sd.askstring("🔐 Firebase Yapılandırması", "Firebase Database ID:", parent=root)
            if db:
                api_key = sd.askstring("🔐 Firebase Yapılandırması", "Firebase Web API Key:", parent=root, show='*')
            if api_key:
                master_secret = sd.askstring("🔐 Master Secret", "Çevrimdışı Aktivasyon Master Secret (Boş bırakılırsa otomatik üretilir):", parent=root, show='*')

            root.destroy()
        except Exception as e:
            log_event("warning", f"GUI Yapılandırma sihirbazı başlatılamadı: {e}")

        # 2. CLI / Terminal Fallback
        if not (project and db and api_key) and sys.stdin and sys.stdin.isatty():
            try:
                print("\n" + "="*60)
                print("🔐 AKINCI BULUT LİSANS İLK KURULUM SİHİRBAZI")
                print("="*60)
                project = input("Firebase Project ID: ").strip()
                db = input("Firebase Database ID: ").strip()
                api_key = getpass.getpass("Firebase Web API Key (Gizli): ").strip()
                master_secret = getpass.getpass("Master Secret [İsteğe bağlı, boş bırakabilirsiniz]: ").strip()
            except Exception:
                pass

        if project and db and api_key:
            gen_secret = master_secret or self._generate_master_secret()
            self._save_credentials(
                {"project_id": project.strip(), "database_id": db.strip(), "api_key": api_key.strip()},
                {"master_secret": gen_secret}
            )
            return True

        log_event("warning", "Güvenlik kimlik bilgileri yapılandırılmadı. Ortam değişkenlerini veya .env dosyasını kontrol ediniz.")
        return False

    def load_server_url(self):
        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH, 0, winreg.KEY_READ)
            val, _ = winreg.QueryValueEx(key, SERVER_REG_KEY)
            winreg.CloseKey(key)
            if val:
                return normalize_cloud_url(val)
        except: pass
        return DEFAULT_API_URL

    def save_server_url(self, url):
        self.api_url = normalize_cloud_url(url)
        try:
            key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH)
            winreg.SetValueEx(key, SERVER_REG_KEY, 0, winreg.REG_SZ, self.api_url)
            winreg.CloseKey(key)
        except: pass

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
        """Kayıtlı lisans anahtarını Windows Registry ve Şifreli Dosyalardan (.enc) okur."""
        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH, 0, winreg.KEY_READ)
            val, _ = winreg.QueryValueEx(key, LICENSE_REG_KEY)
            winreg.CloseKey(key)
            if val and val.strip():
                return val.strip()
        except: pass

        sec_enc = os.path.join(os.path.expanduser("~"), ".akinci_security", ".akinci_lic.enc")
        home_enc = os.path.join(os.path.expanduser("~"), ".akinci_lic.enc")
        for p in [sec_enc, home_enc]:
            data = self._decrypt_json_file(p)
            if data and data.get("key"):
                return str(data.get("key", "")).strip()

        # Eski düz metin dosya varsa oku, şifrele ve eskiyi sil
        old_plain = os.path.join(os.path.expanduser("~"), ".akinci_lic.json")
        if os.path.exists(old_plain):
            try:
                with open(old_plain, "r", encoding="utf-8") as f:
                    old_data = json.load(f)
                k = old_data.get("key", "").strip()
                if k:
                    self.save_license_key(k)
                    try: os.remove(old_plain)
                    except: pass
                    return k
            except: pass

        return ""

    def save_license_key(self, key_str):
        """Lisans anahtarını Windows Registry ve Şifreli JSON (.enc) olarak kaydeder."""
        clean_key = str(key_str or "").strip().upper()
        try:
            key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH)
            winreg.SetValueEx(key, LICENSE_REG_KEY, 0, winreg.REG_SZ, clean_key)
            winreg.CloseKey(key)
        except: pass

        payload = {
            "key": clean_key,
            "hwid": self.hwid,
            "savedAt": time.time(),
            "savedAtIso": datetime.now().isoformat(),
            "encrypted": True
        }

        sec_enc = os.path.join(os.path.expanduser("~"), ".akinci_security", ".akinci_lic.enc")
        home_enc = os.path.join(os.path.expanduser("~"), ".akinci_lic.enc")
        self._encrypt_json_file(sec_enc, payload)
        self._encrypt_json_file(home_enc, payload)

        old_plain = os.path.join(os.path.expanduser("~"), ".akinci_lic.json")
        if os.path.exists(old_plain):
            try: os.remove(old_plain)
            except: pass

    def is_locally_revoked(self, key_str):
        """Lisansın yerel olarak pasife/kilide alınıp alınmadığını şifreli depodan kontrol eder."""
        clean_key = (key_str or "").strip().upper()
        if not clean_key:
            return False, ""
        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH, 0, winreg.KEY_READ)
            revoked_val, _ = winreg.QueryValueEx(key, "LicenseRevoked")
            revoked_key, _ = winreg.QueryValueEx(key, "RevokedKey")
            revoked_reason, _ = winreg.QueryValueEx(key, "RevokedReason")
            winreg.CloseKey(key)
            if revoked_val and (revoked_key == clean_key or not revoked_key):
                return True, revoked_reason or "Lisans yönetici tarafından PASİF (KİLİTLİ) duruma getirilmiştir."
        except: pass

        sec_enc = os.path.join(os.path.expanduser("~"), ".akinci_security", ".akinci_lic.enc")
        home_enc = os.path.join(os.path.expanduser("~"), ".akinci_lic.enc")
        for p in [sec_enc, home_enc]:
            data = self._decrypt_json_file(p)
            if data and data.get("revoked") is True and data.get("key") == clean_key:
                return True, data.get("revokedReason", "Lisans yönetici tarafından PASİF edilmiştir.")
        return False, ""

    def mark_locally_revoked(self, key_str, reason="Yönetici tarafından PASİF (KİLİTLİ) yapıldı"):
        """Lisansı yerel olarak şifreli formatta kilitler/pasife alır."""
        clean_key = (key_str or "").strip().upper()
        try:
            key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH)
            winreg.SetValueEx(key, "LicenseRevoked", 0, winreg.REG_DWORD, 1)
            winreg.SetValueEx(key, "RevokedKey", 0, winreg.REG_SZ, clean_key)
            winreg.SetValueEx(key, "RevokedReason", 0, winreg.REG_SZ, str(reason))
            winreg.SetValueEx(key, "RevokedAt", 0, winreg.REG_SZ, datetime.now().isoformat())
            winreg.CloseKey(key)
        except: pass

        payload = {
            "key": clean_key,
            "hwid": self.hwid,
            "revoked": True,
            "revokedReason": str(reason),
            "revokedAt": datetime.now().isoformat(),
            "encrypted": True
        }
        sec_enc = os.path.join(os.path.expanduser("~"), ".akinci_security", ".akinci_lic.enc")
        home_enc = os.path.join(os.path.expanduser("~"), ".akinci_lic.enc")
        self._encrypt_json_file(sec_enc, payload)
        self._encrypt_json_file(home_enc, payload)

        old_plain = os.path.join(os.path.expanduser("~"), ".akinci_lic.json")
        if os.path.exists(old_plain):
            try: os.remove(old_plain)
            except: pass

    def clear_local_revocation(self, key_str):
        """Lisans kilidini kaldırır ve şifreli depoyu günceller."""
        clean_key = (key_str or "").strip().upper()
        try:
            key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH)
            winreg.SetValueEx(key, "LicenseRevoked", 0, winreg.REG_DWORD, 0)
            winreg.SetValueEx(key, "RevokedKey", 0, winreg.REG_SZ, "")
            winreg.SetValueEx(key, "RevokedReason", 0, winreg.REG_SZ, "")
            winreg.CloseKey(key)
        except: pass

        payload = {
            "key": clean_key,
            "hwid": self.hwid,
            "revoked": False,
            "savedAt": time.time(),
            "encrypted": True
        }
        sec_enc = os.path.join(os.path.expanduser("~"), ".akinci_security", ".akinci_lic.enc")
        home_enc = os.path.join(os.path.expanduser("~"), ".akinci_lic.enc")
        self._encrypt_json_file(sec_enc, payload)
        self._encrypt_json_file(home_enc, payload)

        old_plain = os.path.join(os.path.expanduser("~"), ".akinci_lic.json")
        if os.path.exists(old_plain):
            try: os.remove(old_plain)
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
                res = self.session.post(full_url, json=payload, timeout=4, allow_redirects=True)
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

    def _get_firestore_headers(self):
        """Google Firestore REST API için güvenli HTTP başlıkları (OAuth2 token veya X-Goog-Api-Key)"""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        # 1. ÖNCELİK: OAuth2 Token (Service Account)
        token = self._get_oauth_token()
        if token:
            headers["Authorization"] = f"Bearer {token}"
            return headers
        
        # 2. İKİNCİL: API Key (X-Goog-Api-Key başlığı - URL'de taşınmaz, Bearer kullanılmaz)
        if self.firebase_api_key:
            headers["X-Goog-Api-Key"] = self.firebase_api_key
            return headers
        
        return headers

    def _firestore_direct_get_licenses(self):
        if not (self.firebase_project_id and self.firebase_db_id and (self.firebase_api_key or self._get_oauth_token())):
            self._load_credentials()
        if not (self.firebase_project_id and self.firebase_db_id and (self.firebase_api_key or self._get_oauth_token())):
            log_event("warning", "Firestore kimlik bilgileri tanımlı değil.")
            return []
        url = f"https://firestore.googleapis.com/v1/projects/{self.firebase_project_id}/databases/{self.firebase_db_id}/documents:runQuery"
        headers = self._get_firestore_headers()
        query_payload = {
            "structuredQuery": {
                "from": [{"collectionId": "licenses"}]
            }
        }
        try:
            res = self.session.post(url, headers=headers, json=query_payload, timeout=6)
            if res.status_code == 200:
                rows = res.json()
                result = []
                for row in rows:
                    doc = row.get("document")
                    if not doc:
                        continue
                    doc_id = doc.get("name", "").split("/")[-1]
                    parsed = parse_firestore_fields(doc.get("fields", {}))
                    parsed["id"] = doc_id
                    result.append(parsed)
                return result
            else:
                log_event("warning", f"Firestore runQuery HTTP {res.status_code}: {res.text[:100]}")
        except Exception as e:
            log_event("warning", f"Firestore Direct runQuery hatası: {e}")
        return []

    def get_public_ip(self):
        """Kullanıcının gerçek dış IP adresini bulur ve önbelleğe alır."""
        if hasattr(self, "_cached_public_ip") and self._cached_public_ip and self._cached_public_ip not in ["DirectCloud", "127.0.0.1", "-", "88.250.44.12", ""]:
            return self._cached_public_ip

        # 1. Öncelikli: Bağlı bulunulan AKINCI Cloud API üzerinden gerçek istemci IP'sini öğren
        target_hosts = [self.api_url, DEFAULT_API_URL]
        for host in target_hosts:
            if host:
                try:
                    norm = normalize_cloud_url(host)
                    if norm:
                        r = self.session.get(f"{norm}/api/my-ip", timeout=3)
                        if r.status_code == 200:
                            data = r.json()
                            ip = data.get("ip")
                            if ip and ip not in ["127.0.0.1", "DirectCloud", "localhost", ""] and len(ip) < 45 and ("." in ip or ":" in ip):
                                self._cached_public_ip = ip
                                return ip
                except:
                    pass

        # 2. Genel genel IP tespit servisleri
        for service in [
            "https://api.ipify.org",
            "https://ifconfig.me/ip",
            "https://icanhazip.com",
            "https://checkip.amazonaws.com",
            "https://ident.me",
            "https://ipecho.net/plain",
            "https://api.my-ip.io/v2/ip.txt"
        ]:
            try:
                r = self.session.get(service, timeout=3)
                if r.status_code == 200:
                    ip = r.text.strip()
                    if ip and len(ip) < 45 and ("." in ip or ":" in ip) and ip not in ["127.0.0.1", "localhost"]:
                        self._cached_public_ip = ip
                        return ip
            except:
                continue

        self._cached_public_ip = "127.0.0.1"
        return self._cached_public_ip

    def _firestore_direct_save_session(self, session_data):
        if not (self.firestore_rest_base and self.firebase_api_key):
            return
        doc_id = session_data.get("id") or f"sess-{int(time.time()*1000)}"
        url = f"{self.firestore_rest_base}/sessions/{doc_id}"
        headers = self._get_firestore_headers()
        if "ip" not in session_data or session_data["ip"] in ["DirectCloud", "127.0.0.1"]:
            session_data["ip"] = self.get_public_ip()
        fields = dict_to_firestore_fields(session_data)
        try:
            self.session.patch(url, headers=headers, json={"fields": fields}, timeout=4)
        except Exception as e:
            log_event("warning", f"Firestore Session kaydetme uyarısı: {e}")

    def _firestore_direct_save_agreement(self, agr_data):
        if not (self.firestore_rest_base and self.firebase_api_key):
            return False
        doc_id = agr_data.get("id") or f"agr-{int(time.time()*1000)}"
        url = f"{self.firestore_rest_base}/agreements/{doc_id}"
        headers = self._get_firestore_headers()
        if "ipAddress" not in agr_data or agr_data["ipAddress"] in ["DirectCloud", "127.0.0.1"]:
            agr_data["ipAddress"] = self.get_public_ip()
        fields = dict_to_firestore_fields(agr_data)
        try:
            res = self.session.patch(url, headers=headers, json={"fields": fields}, timeout=4)
            return res.status_code in [200, 201]
        except Exception as e:
            log_event("warning", f"Firestore Agreement kaydetme uyarısı: {e}")
            return False

    def _verify_via_firestore_direct(self, clean_key):
        licenses = self._firestore_direct_get_licenses()
        if not licenses:
            return None
        
        found = None
        for l in licenses:
            if str(l.get("key", "")).strip().upper() == clean_key:
                found = l
                break
        
        if not found:
            return {
                "valid": False,
                "status": "invalid",
                "message": f"❌ Geçersiz Lisans Anahtarı ({clean_key})!\nBu anahtar Bulut Veritabanında kayıtlı değildir."
            }

        if found.get("status") == "revoked":
            return {
                "valid": False,
                "status": "revoked",
                "customerName": found.get("customerName", "Müşteri"),
                "daysRemaining": 0,
                "message": f"❌ Bu lisans yönetici tarafından PASİF (KİLİTLİ) durumuna getirilmiştir!"
            }

        # Program kullanım süresi PC'ye kurulup ilk çalıştırıldığı an başlar
        if not found.get("firstActivatedAt"):
            first_act = datetime.now().isoformat()
            found["firstActivatedAt"] = first_act
            
            # Eğer admin panelinden önceden bitiş tarihi verilmiş ise onu koru, yoksa plandan hesapla
            if not found.get("expiresAt"):
                p_lower = str(found.get("plan", "")).lower()
                dur_days = int(found.get("durationDays") or (
                    1 if p_lower == "1day" else
                    3 if p_lower == "3days" else
                    7 if p_lower in ["7days", "trial"] else
                    15 if p_lower == "15days" else
                    30 if p_lower == "monthly" else
                    90 if p_lower == "quarterly" else
                    180 if p_lower == "semi_annual" else
                    365 if p_lower == "annual" else
                    3650 if p_lower == "lifetime" else 7
                ))
                exp_time = datetime.now() + timedelta(days=dur_days)
                expires_at_str = exp_time.isoformat()
                found["expiresAt"] = expires_at_str
                found["durationDays"] = dur_days
            else:
                expires_at_str = found.get("expiresAt", "")

            doc_id = found.get("id")
            found["status"] = "active"
            found["lastUsedAt"] = first_act
            if doc_id and self.firestore_rest_base and self.firebase_api_key:
                try:
                    patch_url = f"{self.firestore_rest_base}/licenses/{doc_id}?updateMask.fieldPaths=firstActivatedAt&updateMask.fieldPaths=durationDays&updateMask.fieldPaths=expiresAt&updateMask.fieldPaths=status&updateMask.fieldPaths=lastUsedAt"
                    headers = self._get_firestore_headers()
                    patch_fields = {
                        "firstActivatedAt": {"stringValue": first_act},
                        "durationDays": {"integerValue": int(found.get("durationDays", 7))},
                        "expiresAt": {"stringValue": str(found.get("expiresAt", ""))},
                        "status": {"stringValue": "active"},
                        "lastUsedAt": {"stringValue": first_act}
                    }
                    self.session.patch(patch_url, headers=headers, json={"fields": patch_fields}, timeout=5)
                except Exception as e:
                    pass
        else:
            expires_at_str = found.get("expiresAt", "")

        days_rem = 0
        if expires_at_str:
            try:
                exp_dt = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
                diff = exp_dt.timestamp() - time.time()
                days_rem = math.ceil(diff / (24 * 3600))
            except:
                days_rem = 1

        if days_rem <= 0:
            return {
                "valid": False,
                "status": "expired",
                "customerName": found.get("customerName", "Müşteri"),
                "daysRemaining": 0,
                "message": f"❌ LİSANS SÜRESİ DOLDU: Bu lisans için tanımlanan kullanım süresi tamamlanmıştır! Program erişimi kapatılmıştır. (Müşteri: {found.get('customerName')} | Kalan: 0 Gün). Yenilemek için: +90 539 850 52 68"
            }

        if not found.get("agreementAccepted"):
            return {
                "valid": False,
                "status": "pending_agreement",
                "agreementRequired": True,
                "customerName": found.get("customerName", ""),
                "daysRemaining": days_rem,
                "message": "5846 Sayılı FSEK Telif Sözleşmesi onayı bekleniyor."
            }

        # Multi-Device HWID Authorization Check
        bound = found.get("boundDevices", [])
        if not isinstance(bound, list): bound = []
        is_bound = any(b.get("hwid") == self.hwid if isinstance(b, dict) else False for b in bound)
        
        max_dev = int(found.get("maxDevices", 1))
        if not is_bound and len(bound) >= max_dev:
            return {
                "valid": False,
                "status": "device_limit_exceeded",
                "customerName": found.get("customerName", ""),
                "daysRemaining": days_rem,
                "message": f"❌ Maksimum bilgisayar sınırı ({max_dev} PC) dolmuştur!\nKayıtlı Cihaz Sayısı: {len(bound)}/{max_dev}\nBu bilgisayar (HWID: {self.hwid}) için kullanım izni bulunmamaktadır.\nKayıtlı {len(bound)} bilgisayar çalışmaya devam etmektedir.\nBu PC'yi eklemek için Yönetim Merkezinden cihaz limitini artırabilir veya önceki cihaz kilidini sıfırlayabilirsiniz."
            }

        # Auto-register new device to boundDevices in Firestore if not registered yet
        if not is_bound and len(bound) < max_dev:
            new_device = {
                "hwid": self.hwid,
                "deviceName": self.device_name,
                "firstUsedAt": datetime.now().isoformat(),
                "lastSeenAt": datetime.now().isoformat(),
                "ip": self.get_public_ip()
            }
            bound.append(new_device)
            try:
                doc_id = found.get("id")
                if doc_id and self.firestore_rest_base and self.firebase_api_key:
                    patch_url = f"{self.firestore_rest_base}/licenses/{doc_id}?updateMask.fieldPaths=boundDevices&updateMask.fieldPaths=lastUsedAt"
                    headers = self._get_firestore_headers()
                    patch_fields = {
                        "boundDevices": bound,
                        "lastUsedAt": datetime.now().isoformat()
                    }
                    self.session.patch(patch_url, headers=headers, json={"fields": dict_to_firestore_fields(patch_fields)}, timeout=4)
            except Exception as e:
                log_event("warning", f"Direct Firestore boundDevices patch hatası: {e}")

        sess_data = {
            "id": f"sess-{self.hwid[:8]}",
            "licenseKey": clean_key,
            "customerName": found.get("customerName", ""),
            "hwid": self.hwid,
            "deviceName": self.device_name,
            "appVersion": APP_VERSION,
            "ip": self.get_public_ip(),
            "lastPingAt": datetime.now().isoformat(),
            "status": "online",
            "activeModule": "SURFER PRO DUAL & GALILO"
        }
        self._firestore_direct_save_session(sess_data)

        return {
            "valid": True,
            "status": "active",
            "customerName": found.get("customerName", "Lisanslı Müşteri"),
            "daysRemaining": days_rem,
            "expiresAt": expires_at_str,
            "allowedModules": found.get("allowedModules", ["surfer_pro_dual", "elevation_galilo", "mod1", "mod2", "mod12"]),
            "message": f"Bulut Veritabanı Doğruladı: {found.get('customerName')} (Kalan: {days_rem} Gün)"
        }

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
                res = self.session.get(f"{u}/api/health", timeout=2, allow_redirects=True)
                if res.status_code == 200:
                    return True, f"Çevrimiçi ({u})"
            except: pass

        if self.firebase_project_id and self.firebase_db_id and self.firebase_api_key:
            try:
                url = f"https://firestore.googleapis.com/v1/projects/{self.firebase_project_id}/databases/{self.firebase_db_id}/documents:runQuery"
                headers = self._get_firestore_headers()
                res = self.session.post(url, headers=headers, json={"structuredQuery": {"from": [{"collectionId": "licenses"}], "limit": 1}}, timeout=4)
                if res.status_code == 200:
                    return True, "Google Firebase Firestore Bulutuna Doğrudan Bağlı (200 OK)"
            except: pass

        return False, "Bulut veritabanına bağlanılamadı."

    def verify_license(self, license_key):
        clean_key = (license_key or "").strip().upper()
        if not clean_key:
            return {"valid": False, "status": "invalid", "message": "Lütfen bir lisans anahtarı giriniz!"}

        payload = {
            "licenseKey": clean_key,
            "hwid": self.hwid,
            "deviceName": self.device_name,
            "ipAddress": self.get_public_ip(),
            "appVersion": APP_VERSION,
            "currentModule": "SURFER PRO DUAL & ELEVATION GALILO"
        }

        data, err = self._make_http_post("/api/license/verify", payload)
        
        if data is not None:
            if data.get("valid") is True and data.get("status") == "active":
                self.clear_local_revocation(clean_key)
                self.active_license = data
                self.save_license_key(clean_key)
                return data
            elif data.get("agreementRequired") is True or data.get("status") == "pending_agreement":
                self.clear_local_revocation(clean_key)
                return {
                    "valid": False,
                    "status": "pending_agreement",
                    "agreementRequired": True,
                    "customerName": data.get("customerName", ""),
                    "daysRemaining": data.get("daysRemaining", 0),
                    "message": "5846 Sayılı Telif Sözleşmesi onayı bekleniyor."
                }
            elif data.get("status") == "device_limit_exceeded":
                log_event("warning", f"Maksimum Cihaz Sınırı: {data.get('message')}")
                return {
                    "valid": False,
                    "status": "device_limit_exceeded",
                    "customerName": data.get("customerName", ""),
                    "daysRemaining": data.get("daysRemaining", 0),
                    "message": data.get("message", "❌ Bu lisans için tanımlanan maksimum cihaz (PC) sınırına ulaşılmıştır!\nBu bilgisayara izin vermek için Yönetim Merkezinden cihaz kaydını sıfırlayınız.")
                }
            elif data.get("status") == "revoked":
                self.mark_locally_revoked(clean_key, data.get("message", "Yönetici tarafından PASİF yapıldı"))
                return {
                    "valid": False,
                    "status": "revoked",
                    "customerName": data.get("customerName", ""),
                    "daysRemaining": 0,
                    "message": data.get("message", "❌ Bu lisans yönetici tarafından PASİF (KİLİTLİ) durumuna getirilmiştir!")
                }
            elif data.get("status") == "expired":
                return {
                    "valid": False,
                    "status": "expired",
                    "customerName": data.get("customerName", ""),
                    "daysRemaining": 0,
                    "message": data.get("message", "Lisans süreniz dolmuştur!")
                }
            else:
                return {"valid": False, "status": "invalid", "message": data.get("message", "Geçersiz Lisans Anahtarı!")}

        direct_data = self._verify_via_firestore_direct(clean_key)
        if direct_data is not None:
            if direct_data.get("valid") is True:
                self.clear_local_revocation(clean_key)
                self.active_license = direct_data
                self.save_license_key(clean_key)
                return direct_data
            elif direct_data.get("status") == "device_limit_exceeded":
                return direct_data
            elif direct_data.get("status") == "revoked":
                self.mark_locally_revoked(clean_key, direct_data.get("message", "Yönetici tarafından PASİF yapıldı"))
                return direct_data
            else:
                return direct_data

        is_rev, rev_reason = self.is_locally_revoked(clean_key)
        if is_rev:
            return {
                "valid": False,
                "status": "revoked",
                "customerName": "Kilitli Kullanıcı",
                "daysRemaining": 0,
                "message": f"❌ Bu lisans yönetici tarafından PASİF (KİLİTLİ) yapılmıştır!\n\nSebep: {rev_reason}"
            }

        return {
            "valid": False,
            "status": "unreachable",
            "message": f"❌ Bulut Veritabanına Bağlanılamadı!\n\nLisans yetkilendirmesi için aktif internet bağlantısı zorunludur."
        }

    def accept_agreement(self, license_key, signer_name, signer_email=""):
        clean_key = (license_key or load_saved_license_key() or "").strip().upper()
        if not clean_key:
            return {"success": False, "message": "Lisans anahtarı boş olamaz!"}
        pub_ip = self.get_public_ip()
        payload = {
            "licenseKey": clean_key,
            "signerName": signer_name.strip(),
            "signerEmail": signer_email.strip(),
            "hwid": self.hwid,
            "deviceName": self.device_name,
            "ipAddress": pub_ip
        }
        data, err = self._make_http_post("/api/license/agreement/accept", payload)
        if data is not None:
            if data.get("success"):
                save_agreement_signed(signer_name.strip())
            return data
        
        licenses = self._firestore_direct_get_licenses()
        found = next((l for l in licenses if str(l.get("key", "")).strip().upper() == clean_key or str(l.get("key", "")).strip().replace("-", "").upper() == clean_key.replace("-", "")), None)
        
        if not found:
            return {"success": False, "message": f"Lisans anahtarı ({clean_key}) veritabanında bulunamadı!"}

        customer_name = str(found.get("customerName", "")).strip()
        norm_signer = signer_name.strip().lower()
        norm_cust = customer_name.lower()
        cust_words = [w for w in norm_cust.replace("(", " ").replace(")", " ").replace(".", " ").split() if len(w) > 2]
        sign_words = [w for w in norm_signer.replace("(", " ").replace(")", " ").replace(".", " ").split() if len(w) > 2]
        has_match = any(cw in sign_words or any(cw in sw or sw in cw for sw in sign_words) for cw in cust_words)

        if not has_match and "deneme" not in norm_cust and "test" not in norm_cust:
            return {
                "success": False,
                "message": f"❌ İsim Uyuşmazlığı!\nBu lisans '{customer_name}' adına tahsis edilmiştir."
            }

        try:
            doc_id = found.get("id")
            if doc_id and self.firestore_rest_base and self.firebase_api_key:
                patch_url = f"{self.firestore_rest_base}/licenses/{doc_id}?updateMask.fieldPaths=agreementAccepted&updateMask.fieldPaths=agreementAcceptedAt&updateMask.fieldPaths=agreementSignerName&updateMask.fieldPaths=agreementIp&updateMask.fieldPaths=status"
                headers = self._get_firestore_headers()
                patch_fields = {
                    "agreementAccepted": {"booleanValue": True},
                    "agreementAcceptedAt": {"stringValue": datetime.now().isoformat()},
                    "agreementSignerName": {"stringValue": signer_name.strip()},
                    "agreementIp": {"stringValue": pub_ip}
                }
                if found.get("status") == "pending_agreement":
                    patch_fields["status"] = {"stringValue": "active"}
                self.session.patch(patch_url, headers=headers, json={"fields": patch_fields}, timeout=5)
        except Exception as e:
            log_event("warning", f"Lisans sözleşme güncelleme uyarısı: {e}")

        agr_record = {
            "id": f"agr-{int(time.time()*1000)}",
            "licenseKey": clean_key,
            "customerName": customer_name,
            "signerName": signer_name.strip(),
            "signerEmail": signer_email.strip(),
            "hwid": self.hwid,
            "deviceName": self.device_name,
            "ipAddress": pub_ip,
            "agreementVersion": "v2026.1",
            "signedAt": datetime.now().isoformat(),
            "lawReference": "5846 Sayılı Fikir ve Sanat Eserleri Kanunu (FSEK)"
        }
        self._firestore_direct_save_agreement(agr_record)

        save_agreement_signed(signer_name.strip())

        return {"success": True, "message": "5846 Telif Sözleşmesi doğrulandı ve Firebase Firestore'a kaydedildi."}

    def start_heartbeat(self, license_key, get_active_module_func=None, on_revocation_callback=None):
        """Arka plan kalp atışı (Heartbeat) kontrolü - SecureString bellek koruması ile"""
        if self.heartbeat_running:
            return
        self.heartbeat_running = True

        secure_key = SecureString(license_key)

        def loop():
            clean_key = secure_key.get_value().strip().upper()
            if not clean_key:
                secure_key.clear()
                return

            try:
                while self.heartbeat_running:
                    try:
                        active_mod = get_active_module_func() if get_active_module_func else "SURFER PRO DUAL + GALILO"
                        data, err = self._make_http_post("/api/license/heartbeat", {
                            "licenseKey": clean_key,
                            "hwid": self.hwid,
                            "activeModule": active_mod
                        })
                        if data:
                            if data.get("valid") is False or data.get("status") in ["revoked", "expired", "device_limit_exceeded", "unbound"]:
                                self.mark_locally_revoked(clean_key, data.get("message", "Yönetici tarafından PASİFE ALINDI"))
                                if on_revocation_callback:
                                    on_revocation_callback(data)
                                    break
                        else:
                            direct_chk = self._verify_via_firestore_direct(clean_key)
                            if direct_chk:
                                if direct_chk.get("valid") is False or direct_chk.get("status") in ["revoked", "expired", "device_limit_exceeded"]:
                                    self.mark_locally_revoked(clean_key, direct_chk.get("message", "Yönetici tarafından PASİFE ALINDI"))
                                    if on_revocation_callback:
                                        on_revocation_callback(direct_chk)
                                        break
                                elif direct_chk.get("valid") is True and direct_chk.get("status") == "active":
                                    self.clear_local_revocation(clean_key)
                            
                            sess_data = {
                                "id": f"sess-{self.hwid[:8]}",
                                "licenseKey": clean_key,
                                "hwid": self.hwid,
                                "deviceName": self.device_name,
                                "lastPingAt": datetime.now().isoformat(),
                                "status": "online",
                                "activeModule": active_mod
                            }
                            self._firestore_direct_save_session(sess_data)
                    except Exception as e:
                        log_event("warning", f"Heartbeat uyarısı: {e}")

                    for _ in range(5):
                        if not self.heartbeat_running:
                            break
                        time.sleep(1)
            finally:
                secure_key.clear()

        self.heartbeat_thread = threading.Thread(target=loop, daemon=True, name="HeartbeatThread")
        self.heartbeat_thread.start()

    def stop_heartbeat(self):
        self.heartbeat_running = False

security_engine = AkinciCloudSecurity()

# ================================================
# 2. LİSANS AKTİVASYON DİYALOGU - 5846 SÖZLEŞMESİ ONAYI
# ================================================
class LicenseActivationDialog:
    def __init__(self, on_license_verified_callback):
        self.on_success = on_license_verified_callback
        self.root = tk.Tk()
        self.root.title("🔑 AKINCI LİSANS AKTİVASYON MERKEZİ v10.0")
        self.root.geometry("640x550")
        self.root.minsize(560, 500)
        self.root.configure(bg="#12141a")
        self.agreement_accepted = False
        self.license_key = ""
        self.key_visible = False

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

        key_row = tk.Frame(key_box, bg="#12141a")
        key_row.pack(fill=tk.X)

        self.key_entry = tk.Entry(key_row, font=("Consolas", 11, "bold"), bg="#1e2330", fg="#4ade80",
                                  insertbackground="white", justify="center", relief="flat", bd=2)
        self.key_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=3)
        self.key_entry.bind("<Return>", lambda e: self._do_verify())

        self.toggle_btn = tk.Button(key_row, text="👁️", command=self._toggle_key_visibility,
                                   bg="#1e2330", fg="#94a3b8", font=("Segoe UI", 9),
                                   padx=4, cursor="hand2", relief="flat")
        self.toggle_btn.pack(side=tk.RIGHT, padx=(4, 0))
        self.key_visible = False
        self.key_entry.config(show="*")

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

    def _toggle_key_visibility(self):
        self.key_visible = not self.key_visible
        if self.key_visible:
            self.key_entry.config(show="")
            self.toggle_btn.config(text="🙈")
        else:
            self.key_entry.config(show="*")
            self.toggle_btn.config(text="👁️")

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

        self.verify_btn.config(state=tk.DISABLED, text="⏳ Lisans Doğrulanıyor...")
        self.status_lbl.config(text="Kullanıcı Yönetim Merkezi ile kontrol ediliyor...", fg="#38bdf8")
        self.root.update_idletasks()

        threading.Thread(target=self._verify_worker, args=(key, silent), daemon=True).start()

    def _verify_worker(self, key, silent):
        result = security_engine.verify_license(key)

        def update():
            self.verify_btn.config(state=tk.NORMAL, text="🚀 LİSANSI DOĞRULA VE BAŞLAT")
            # Her zaman lisans anahtarını veri nesnesine ve değişkene iliştir
            clean_input_key = str(key or "").strip()
            if isinstance(result, dict):
                result["licenseKey"] = clean_input_key
                result["key"] = clean_input_key
            self.license_key = clean_input_key

            if result.get("valid") is True and result.get("status") == "active":
                days = result.get("daysRemaining", 0)
                customer = result.get("customerName", "Lisanslı Kullanıcı")
                self.status_lbl.config(text=f"✅ Lisans Doğrulandı! ({customer} - Kalan: {days} Gün)", fg="#4ade80")
                
                if is_agreement_signed():
                    self.root.destroy()
                    self.on_success(result)
                else:
                    self._show_agreement_and_start(result)
            elif result.get("agreementRequired") is True or result.get("status") == "pending_agreement":
                self.status_lbl.config(text="⚠️ 5846 Sayılı Telif Sözleşmesi onayı bekleniyor...", fg="#f59e0b")
                self._show_agreement_and_start(result)
            else:
                msg = result.get("message", "Geçersiz veya Kilitli Lisans!")
                self.status_lbl.config(text=f"❌ {msg}", fg="#f87171")
                if not silent:
                    messagebox.showerror("Lisans Reddedildi", f"❌ {msg}\n\nİletişim & Destek:\nMahmut Akın: +90 539 850 52 68\nTelegram: @akinci_surfer_voxler_analiz", parent=self.root)

        self.root.after(0, update)

    def _show_agreement_and_start(self, license_data):
        agreement_dialog = AgreementDialog(self.root, license_data, self._on_agreement_accepted)
        self.root.wait_window(agreement_dialog)

    def _on_agreement_accepted(self, license_data):
        self.root.destroy()
        self.on_success(license_data)

    def run(self):
        self.root.mainloop()


class AgreementDialog(tk.Toplevel):
    def __init__(self, parent, license_data, on_accepted_callback):
        super().__init__(parent)
        if isinstance(license_data, str):
            self.license_key = license_data.strip()
            self.license_data = {"licenseKey": self.license_key, "key": self.license_key}
        elif isinstance(license_data, dict):
            self.license_data = dict(license_data)
            self.license_key = (self.license_data.get("licenseKey") or self.license_data.get("key") or "").strip()
        else:
            self.license_data = {}
            self.license_key = ""

        if not self.license_key:
            self.license_key = (load_saved_license_key() or "").strip()
            self.license_data["licenseKey"] = self.license_key
            self.license_data["key"] = self.license_key

        self.on_accepted = on_accepted_callback
        self.agreement_accepted = False

        self.title("⚖️ 5846 SAYILI FİKİR VE SANAT ESERLERİ KANUNU SÖZLEŞMESİ")
        self.geometry("750x650")
        self.minsize(700, 600)
        self.configure(bg="#12141a")
        self.transient(parent)
        self.grab_set()

        self._center_window()
        self._build_ui()

    def _center_window(self):
        self.update_idletasks()
        w = self.winfo_width()
        h = self.winfo_height()
        x = (self.winfo_screenwidth() // 2) - (w // 2)
        y = (self.winfo_screenheight() // 2) - (h // 2)
        self.geometry(f'{w}x{h}+{x}+{y}')

    def _build_ui(self):
        head = tk.Frame(self, bg="#1a1e29", padx=15, pady=10)
        head.pack(fill=tk.X)

        tk.Label(head, text="⚖️ 5846 SAYILI FİKİR VE SANAT ESERLERİ KANUNU",
                 font=("Segoe UI", 12, "bold"), fg="#38bdf8", bg="#1a1e29").pack(anchor=tk.W)

        tk.Label(head, text="AKINCI OTOMATİK SURFER & ELEVATION GALILO YAZILIM LİSANS VE TELİF SÖZLEŞMESİ",
                 font=("Segoe UI", 10, "bold"), fg="#00ff9d", bg="#1a1e29").pack(anchor=tk.W)

        tk.Label(head, text="Eser Sahibi: Mahmut Akın | Koruma: 5846 Sayılı FSEK & TCK Madde 243-244",
                 font=("Segoe UI", 8), fg="#94a3b8", bg="#1a1e29").pack(anchor=tk.W)

        st = scrolledtext.ScrolledText(self, wrap=tk.WORD, bg="#1a1e2b", fg="#e2e8f0",
                                       font=("Segoe UI", 9), height=18, padx=15, pady=15,
                                       relief="flat", bd=1)

        agreement_text = """5846 SAYILI FİKİR VE SANAT ESERLERİ KANUNU KAPSAMINDA 
AKINCI OTOMATİK SURFER & ELEVATION GALILO YAZILIM LİSANS VE TELİF SÖZLEŞMESİ

═══════════════════════════════════════════════════════════════════════════════

1. TARAFLAR VE SÖZLEŞMENİN KONUSU
───────────────────────────────────────────────────────────────────────────────
İşbu sözleşme, "AKINCI OTOMATİK SURFER PRO DUAL & ELEVATION GALILO" yazılımının 
eser sahibi ve geliştiricisi Mahmut Akın (bundan sonra "HAK SAHİBİ" olarak 
anılacaktır) ile bu yazılımı kullanan tüzel/gerçek kişi (bundan sonra 
"KULLANICI" olarak anılacaktır) arasında akdedilmiştir.

═══════════════════════════════════════════════════════════════════════════════

2. TELİF HAKKI VE HUKUKİ KORUMA (5846 SAYILI KANUN)
───────────────────────────────────────────────────────────────────────────────
a) Yazılımın tüm kaynak kodları, algoritmaları, grid filtre parametreleri, 
   haritalandırma fonksiyonları ve arayüz tasarımları 5846 sayılı Fikir ve 
   Sanat Eserleri Kanunu (FSEK), Türk Ceza Kanunu (TCK) ve ilgili uluslararası 
   fikri mülkiyet mevzuatı ile korunmaktadır.

b) Yazılımın tersine mühendislik (reverse engineering), decompile (kod çözme), 
   crack, HWID baypass veya lisans anahtarı manipülasyonu yapılması kesinlikle 
   yasaktır. Tespit halinde TCK Madde 243-244 ve 5846 Sayılı Kanun Madde 71-72 
   uyarınca savcılık suç duyurusu ve tazminat davası açılacaktır.

═══════════════════════════════════════════════════════════════════════════════

3. KULLANIM SÜRESİ VE CİHAZ (HWID) BAĞLILIK ŞARTLARI
───────────────────────────────────────────────────────────────────────────────
a) Kullanıcı, satın aldığı veya kendisine tanımlanan lisans süresi boyunca 
   (Gün/Ay/Yıl) yazılımı aktif tutulan tekil Donanım Kimliği (HWID) üzerinde 
   kullanabilir.

b) Süre bitiminde yazılım otomatik olarak kilitlenecektir. Yetkisiz süre 
   uzatma veya sunucu manipülasyonu yapan lisanslar derhal iptal (Blacklist) 
   edilecektir.

═══════════════════════════════════════════════════════════════════════════════

4. DİJİTAL İMZA VE ONAY
───────────────────────────────────────────────────────────────────────────────
Kullanıcı işbu sözleşmeyi dijital ortamda onaylayarak, donanım kimliği (HWID), 
IP adresi ve sistem bilgilerinin sunucuya kayıt edilmesini, süresi dolan 
lisansın kapatılmasını kayıtsız şartsız kabul ve taahhüt eder.

═══════════════════════════════════════════════════════════════════════════════

5. YÜRÜRLÜK
───────────────────────────────────────────────────────────────────────────────
İşbu sözleşme, Kullanıcı tarafından onaylandığı tarihte yürürlüğe girer ve 
lisans süresi boyunca geçerlidir.

═══════════════════════════════════════════════════════════════════════════════

© 2026 Mahmut Akın - Tüm Hakları Saklıdır
5846 Sayılı Fikir ve Sanat Eserleri Kanunu Korumalıdır
"""
        st.insert(tk.END, agreement_text)
        st.configure(state="disabled")
        st.pack(fill=tk.BOTH, expand=True, padx=15, pady=10)

        form = tk.Frame(self, bg="#12141a", padx=15)
        form.pack(fill=tk.X)

        name_frame = tk.Frame(form, bg="#12141a")
        name_frame.pack(fill=tk.X, pady=5)

        tk.Label(name_frame, text="Adınız ve Soyadınız (Dijital İmza):", 
                 font=("Segoe UI", 9, "bold"), fg="white", bg="#12141a").pack(side=tk.LEFT)

        self.name_entry = tk.Entry(name_frame, font=("Segoe UI", 9), bg="#1e2330", 
                                   fg="#38bdf8", width=35, relief="flat", bd=1)
        self.name_entry.pack(side=tk.LEFT, padx=10)
        
        # Müşteri adı biliniyorsa otomatik olarak dijital imza kutusuna doldur
        default_customer = ""
        if isinstance(self.license_data, dict):
            default_customer = self.license_data.get("customerName", "")
        if default_customer and default_customer != "Lisanslı Kullanıcı" and "UNKNOWN" not in default_customer:
            self.name_entry.insert(0, default_customer)

        self.agree_var = tk.BooleanVar(value=False)
        cb_frame = tk.Frame(self, bg="#12141a")
        cb_frame.pack(pady=8)

        cb = tk.Checkbutton(cb_frame, 
                           text="5846 sayılı telif hakları ve lisans süresi şartlarını okudum, kabul ediyorum.",
                           variable=self.agree_var, bg="#12141a", fg="#4ade80",
                           selectcolor="#1e2330", font=("Segoe UI", 9, "bold"),
                           cursor="hand2")
        cb.pack()

        btn_frame = tk.Frame(self, bg="#12141a", pady=10)
        btn_frame.pack()

        self.accept_btn = tk.Button(btn_frame, text="✅ SÖZLEŞMEYİ İMZALA VE BAŞLAT", 
                                    command=self._submit,
                                    bg="#22c55e", fg="#052e16", 
                                    font=("Segoe UI", 10, "bold"), 
                                    padx=20, pady=8, cursor="hand2",
                                    relief="flat")
        self.accept_btn.pack(side=tk.LEFT, padx=5)

        cancel_btn = tk.Button(btn_frame, text="❌ REDDET / ÇIKIŞ", 
                               command=self._cancel,
                               bg="#ef4444", fg="white", 
                               font=("Segoe UI", 10, "bold"), 
                               padx=20, pady=8, cursor="hand2",
                               relief="flat")
        cancel_btn.pack(side=tk.LEFT, padx=5)

    def _submit(self):
        signer = self.name_entry.get().strip()
        if not signer:
            messagebox.showwarning("Uyarı", "Lütfen Adınızı ve Soyadınızı giriniz!", parent=self)
            return

        if not self.agree_var.get():
            messagebox.showwarning("Uyarı", "Lütfen sözleşme onay kutusunu işaretleyiniz!", parent=self)
            return

        license_key = self.license_key or (self.license_data.get("licenseKey") if isinstance(self.license_data, dict) else "") or (self.license_data.get("key") if isinstance(self.license_data, dict) else "") or (load_saved_license_key() or "")
        license_key = str(license_key).strip().upper()

        if not license_key:
            messagebox.showerror("Hata", "Lisans anahtarı belirlenemedi! Lütfen ana ekrandan lisans anahtarınızı kontrol ediniz.", parent=self)
            return

        res = security_engine.accept_agreement(license_key, signer)

        if res.get("success"):
            save_agreement_signed(signer)
            # Re-verify immediately to ensure HWID is bound and license state is active
            fresh_status = security_engine.verify_license(license_key)
            if fresh_status and fresh_status.get("valid") is True:
                self.license_data = fresh_status
            else:
                self.license_data["valid"] = True
                self.license_data["status"] = "active"
                if "daysRemaining" in res:
                    self.license_data["daysRemaining"] = res["daysRemaining"]

            messagebox.showinfo("Onaylandı", 
                               "✅ 5846 Sayılı Telif Sözleşmesi başarıyla imzalandı ve sisteme kaydedildi.\n\n"
                               f"İmzalayan: {signer}\n"
                               f"Lisans: {license_key}\n"
                               f"Tarih: {datetime.now().strftime('%d.%m.%Y %H:%M')}",
                               parent=self)
            self.agreement_accepted = True
            self.destroy()
            self.on_accepted(self.license_data)
        else:
            messagebox.showerror("Hata", 
                               f"❌ Sözleşme kaydedilemedi!\n\n{res.get('message', 'Bilinmeyen hata')}",
                               parent=self)

    def _cancel(self):
        result = messagebox.askyesno("Çıkış Onayı",
                                    "Sözleşmeyi onaylamadan programa erişim sağlayamazsınız.\n\n"
                                    "Çıkmak istediğinize emin misiniz?",
                                    parent=self, icon='warning')
        if result:
            self.destroy()
            sys.exit(0)

# Entry point caller for Python distribution
def start_application(license_data):
    print("Lisans başarıyla doğrulandı:", license_data)
    # Burada ana UI başlatılır
    root = tk.Tk()
    root.title(f"AKINCI SURFER ULTIMATE - {license_data.get('customerName')}")
    root.geometry("600x400")
    tk.Label(root, text=f"Hoş Geldiniz: {license_data.get('customerName')}", font=("Segoe UI", 14, "bold")).pack(pady=20)
    tk.Label(root, text=f"Kalan Süre: {license_data.get('daysRemaining')} Gün", font=("Segoe UI", 12)).pack(pady=10)
    root.mainloop()

if __name__ == "__main__":
    activation_dialog = LicenseActivationDialog(on_license_verified_callback=start_application)
    activation_dialog.run()
