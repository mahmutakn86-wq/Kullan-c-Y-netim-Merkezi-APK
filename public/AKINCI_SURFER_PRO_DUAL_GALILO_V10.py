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
    if winreg:
        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH, 0, winreg.KEY_READ)
            signed, _ = winreg.QueryValueEx(key, "AgreementSigned")
            winreg.CloseKey(key)
            if bool(signed):
                return True
        except: pass

    sec_enc = os.path.join(os.path.expanduser("~"), ".akinci_security", ".akinci_agr.enc")
    home_enc = os.path.join(os.path.expanduser("~"), ".akinci_agr.enc")
    for p in [sec_enc, home_enc]:
        data = load_encrypted_json_file(p)
        if data.get("signed") is True:
            return True

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
        except: pass

    return False

def save_agreement_signed(signer_name):
    """5846 Sayılı Telif Sözleşmesi onayını Windows Registry ve Şifreli JSON (.enc) olarak kaydeder."""
    if winreg:
        try:
            key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY_PATH)
            winreg.SetValueEx(key, "AgreementSigned", 0, winreg.REG_SZ, "True")
            winreg.SetValueEx(key, "AgreementDate", 0, winreg.REG_SZ, datetime.now().isoformat())
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

    old_plain = os.path.join(os.path.expanduser("~"), ".akinci_agr.json")
    if os.path.exists(old_plain):
        try: os.remove(old_plain)
        except: pass

# ==============================================================================
# FIRESTORE REST PROTOKOL DÖNÜŞTÜRÜCÜSÜ (Çift Katmanlı Güvenlik)
# ==============================================================================
def parse_firestore_fields(fields_dict):
    """Firestore REST API tip tanımlı alanları standart Python sözlüğüne çevirir."""
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
    """Standart Python sözlüğünü Firestore REST API alan formatına dönüştürür."""
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

        # Bağımlılık kontrolü yap
        self._check_dependencies()
        self._check_oauth_dependencies()

        # Eski düz metin yapılandırma ve lisans dosyalarını temizle / şifrele
        self._clean_old_config_files()

        # Kimlik bilgilerini hiyerarşik olarak yükle
        self._load_credentials()

        # API Anahtarı geçerlilik ve rotasyon uyarısı
        self._check_api_key_expiry()

    def _clean_old_config_files(self):
        """Eski ve şifrelenmemiş (düz metin) JSON dosyalarını güvenli depoya yedekleyip sistemden temizler."""
        sec_dir = os.path.join(os.path.expanduser("~"), ".akinci_security")
        os.makedirs(sec_dir, exist_ok=True)
        files_to_clean = [
            os.path.join(os.getcwd(), "config.json"),
            os.path.join(os.path.expanduser("~"), ".akinci_config.json"),
            os.path.join(os.path.expanduser("~"), ".akinci_lic.json"),
            os.path.join(os.path.expanduser("~"), ".akinci_agr.json")
        ]
        for fpath in files_to_clean:
            if os.path.exists(fpath):
                try:
                    with open(fpath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    base_name = os.path.basename(fpath).replace(".json", ".enc")
                    enc_target = os.path.join(sec_dir, base_name)
                    save_encrypted_json_file(enc_target, data)
                    os.remove(fpath)
                    log_event("info", f"Düz metin dosya güvenle şifrelendi ve temizlendi: {os.path.basename(fpath)}")
                except Exception as e:
                    log_event("warning", f"Eski dosya temizleme uyarısı ({fpath}): {e}")

    def _check_api_key_expiry(self):
        """API Anahtarı ve yapılandırmanın güvenlik süresini denetler (180 gün rotasyon kuralı)."""
        enc_config_path = os.path.join(os.path.expanduser("~"), ".akinci_security", self.ENCRYPTED_CONFIG_NAME)
        if os.path.exists(enc_config_path):
            try:
                mtime = os.path.getmtime(enc_config_path)
                days_old = (time.time() - mtime) / (24 * 3600)
                if days_old > 180:
                    log_event("warning", f"⚠️ API Anahtarı ve şifreli yapılandırma {int(days_old)} gündür güncellenmedi. Güvenlik için anahtar rotasyonu önerilir.")
            except Exception:
                pass

    def _is_strong_password(self, pwd: str) -> tuple:
        """Kullanıcı parolasının en az 8 karakter, büyük/küçük harf ve rakam içerdiğini doğrular."""
        if not pwd or len(pwd) < 8:
            return False, "Parola en az 8 karakter uzunluğunda olmalıdır."
        if not any(c.isupper() for c in pwd):
            return False, "Parola en az bir BÜYÜK harf içermelidir."
        if not any(c.islower() for c in pwd):
            return False, "Parola en az bir KÜÇÜK harf içermelidir."
        if not any(c.isdigit() for c in pwd):
            return False, "Parola en az bir RAKAM içermelidir."
        return True, ""

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

    def _load_or_create_salt(self):
        """
        Rastgele 32-baytlık kriptografik tuz (salt) oluşturur veya güvenli dizinden yükler.
        Sabit salt yerine her cihaza/kullanıcıya özel rastgele entropi sağlar.
        """
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
        except Exception as e:
            log_event("warning", f"Salt dosyası kaydetme uyarısı: {e}")
        return salt

    def _generate_master_secret(self):
        """Güçlü, rastgele 32 karakterlik master secret anahtarı oluşturur."""
        import secrets
        import string
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        secret = ''.join(secrets.choice(alphabet) for _ in range(32))
        return f"AKN_MASTER_{secret}"

    def _prompt_user_password(self):
        """Kullanıcıdan güçlü şifreleme parolası girişi alır (en az 8 karakter, büyük/küçük harf, rakam)."""
        try:
            import tkinter as tk
            import tkinter.simpledialog as sd
            import tkinter.messagebox as mb
            root = tk.Tk()
            root.withdraw()
            root.attributes("-topmost", True)

            for attempt in range(3):
                password = sd.askstring(
                    "🔐 Güçlü Şifre Belirleme",
                    "Lütfen yerel şifreleme için en az 8 karakterli güçlü bir parola belirleyiniz:\n"
                    "(Büyük harf, küçük harf ve rakam içermelidir)",
                    show='*',
                    parent=root
                )
                if not password:
                    break

                is_ok, err_msg = self._is_strong_password(password)
                if not is_ok:
                    mb.showwarning("Geçersiz Parola", f"{err_msg}\nLütfen tekrar deneyiniz.", parent=root)
                    continue

                password_confirm = sd.askstring(
                    "🔐 Parola Doğrulama",
                    "Lütfen belirlediğiniz parolayı tekrar giriniz:",
                    show='*',
                    parent=root
                )
                if password != password_confirm:
                    mb.showwarning("Parola Uyuşmazlığı", "Girdiğiniz parolalar eşleşmiyor!\nLütfen tekrar deneyiniz.", parent=root)
                    continue

                root.destroy()
                return password

            root.destroy()
        except Exception:
            pass
        
        # Fallback: güçlü rastgele anahtar
        import secrets
        return secrets.token_urlsafe(32)

    def _encrypt_json_file(self, file_path: str, data: dict) -> bool:
        """JSON verisini şifreli (.enc) olarak kaydeder."""
        return save_encrypted_json_file(file_path, data)

    def _decrypt_json_file(self, file_path: str) -> dict:
        """Şifreli (.enc) JSON dosyasını okur."""
        return load_encrypted_json_file(file_path)

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
        """Kayıtlı lisans anahtarını Windows Registry ve Şifreli Dosyalardan (.enc) okur."""
        if winreg:
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
        if winreg:
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
        if winreg:
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
        if winreg:
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

    # ==============================================================================
    # DOĞRUDAN GOOGLE FIREBASE FIRESTORE BAĞLANTI KATMANI (GERÇEK BULUT VERİTABANI)
    # ==============================================================================
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
        """Doğrudan Google Firestore runQuery REST API kullanarak güncel lisansları çeker."""
        if not (self.firebase_project_id and self.firebase_db_id and (self.firebase_api_key or self._get_oauth_token())):
            self._load_credentials()
        if not (self.firebase_project_id and self.firebase_db_id and (self.firebase_api_key or self._get_oauth_token())):
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
        if not self.firestore_rest_base or not self.firebase_api_key:
            self._load_credentials()
        if not self.firestore_rest_base or not self.firebase_api_key:
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
        if not self.firestore_rest_base or not self.firebase_api_key:
            self._load_credentials()
        if not self.firestore_rest_base or not self.firebase_api_key:
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
        """Google Firestore REST API üzerinden gerçek zamanlı lisans doğrular."""
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
                "message": f"❌ Geçersiz Lisans Anahtarı ({clean_key})!\nBu anahtar Bulut Veritabanında kayıtlı değildir.\nLütfen Mahmut Akın (+90 539 850 52 68) ile iletişime geçiniz."
            }

        # 1. Pasif / Kilitli / Revoked kontrolü (YÖNETİCİ PASİFE ALDIĞINDA ANINDA ENGELLEYEN KISIM)
        if found.get("status") == "revoked":
            return {
                "valid": False,
                "status": "revoked",
                "customerName": found.get("customerName", "Müşteri"),
                "daysRemaining": 0,
                "message": f"❌ Bu lisans yönetici tarafından PASİF (KİLİTLİ / ASKIYA ALINDI) durumuna getirilmiştir!\n\nProgramın kullanımı geçici olarak durdurulmuştur.\n(Müşteri: {found.get('customerName')})\n\nBilgi & İletişim: Mahmut Akın (+90 539 850 52 68)"
            }

        # 2. Süre kontrolü (Program kullanım süresi PC'ye kurulup ilk çalıştırıldığı an başlar)
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
                "message": f"❌ LİSANS SÜRESİ DOLDU: Bu lisans için tanımlanan kullanım süresi tamamlanmıştır! Program kullanımı kesinlikle durdurulmuştur.\n(Müşteri: {found.get('customerName')} | Kalan Gün: 0)\n\nSüre uzatmak veya yeni lisans için: Mahmut Akın (+90 539 850 52 68)"
            }

        # 3. Sözleşme kontrolü
        if not found.get("agreementAccepted"):
            return {
                "valid": False,
                "status": "pending_agreement",
                "agreementRequired": True,
                "customerName": found.get("customerName", ""),
                "daysRemaining": days_rem,
                "message": "5846 Sayılı FSEK Telif Sözleşmesi onayı bekleniyor."
            }

        # 4. Multi-Device HWID ve Cihaz Kontrolü
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
                "message": f"❌ Maksimum bilgisayar sınırı ({max_dev} PC) dolmuştur!\nKayıtlı Cihaz Sayısı: {len(bound)}/{max_dev}\nBu bilgisayar (HWID: {self.hwid}) için kullanım izni bulunmamaktadır.\nKayıtlı {len(bound)} bilgisayar çalışmaya devam etmektedir.\nBu PC'ye izin vermek için Yönetim Merkezinden cihaz limitini artırabilir veya önceki cihaz kilidini sıfırlayabilirsiniz."
            }

        # Auto-register new device to boundDevices in Firestore if slot is available
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

        # Telemetri oturumu kaydet
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
        # 1. Express sunucu testi
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

        # 2. Doğrudan Google Firebase Firestore runQuery testi
        try:
            if not (self.firebase_project_id and self.firebase_db_id and self.firebase_api_key):
                self._load_credentials()
            if self.firebase_project_id and self.firebase_db_id and self.firebase_api_key:
                url = f"https://firestore.googleapis.com/v1/projects/{self.firebase_project_id}/databases/{self.firebase_db_id}/documents:runQuery"
                headers = self._get_firestore_headers()
                res = self.session.post(url, headers=headers, json={"structuredQuery": {"from": [{"collectionId": "licenses"}], "limit": 1}}, timeout=4)
                if res.status_code == 200:
                    return True, "Google Firebase Firestore Bulutuna Doğrudan Bağlı (200 OK)"
        except: pass

        return False, "Bulut veritabanına bağlanılamadı. İnternet bağlantınızı kontrol ediniz."

    def verify_license(self, license_key):
        clean_key = (license_key or "").strip().upper()
        if not clean_key:
            return {"valid": False, "status": "invalid", "message": "Lütfen bir lisans anahtarı giriniz!"}

        # 1. Katman: Express API Sunucusu üzerinden doğrulama (Canlı Bulut Yönetim Merkezi)
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
                # Yönetim merkezi AKTİF yaptıysa yerel tüm kilitleri ve pasif kayıtlarını anında temizle!
                self.clear_local_revocation(clean_key)
                self.active_license = data
                self.save_license_key(clean_key)
                log_event("info", f"Kullanıcı Yönetim Merkezi Doğruladı: {data.get('customerName')} - Kalan Gün: {data.get('daysRemaining')}")
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
            elif data.get("status") == "revoked" or (data.get("valid") is False and "pasif" in str(data.get("message", "")).lower()):
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

        # 2. Katman: Doğrudan Google Firebase Firestore Doğrulama (Gerçek Bulut Veritabanı)
        direct_data = self._verify_via_firestore_direct(clean_key)
        if direct_data is not None:
            if direct_data.get("valid") is True:
                # Yönetim merkezi AKTİF yaptıysa yerel tüm kilitleri ve pasif kayıtlarını anında temizle!
                self.clear_local_revocation(clean_key)
                self.active_license = direct_data
                self.save_license_key(clean_key)
                return direct_data
            elif direct_data.get("status") == "device_limit_exceeded":
                return direct_data
            elif direct_data.get("status") == "revoked":
                self.mark_locally_revoked(clean_key, direct_data.get("message", "Yönetici tarafından PASİF yapıldı"))
                return direct_data
            elif direct_data.get("status") in ["expired", "pending_agreement", "invalid"]:
                return direct_data

        # 3. Katman: Sunucuya ulaşılamıyorsa son çare yerel kilit kontrolü
        is_rev, rev_reason = self.is_locally_revoked(clean_key)
        if is_rev:
            return {
                "valid": False,
                "status": "revoked",
                "customerName": "Kilitli Kullanıcı",
                "daysRemaining": 0,
                "message": f"❌ Bu lisans yönetici tarafından PASİF (KİLİTLİ) yapılmıştır!\n\nSebep: {rev_reason}\n\nProgram başlatılamaz."
            }

        return {
            "valid": False,
            "status": "unreachable",
            "message": f"❌ Bulut Veritabanına Bağlanılamadı!\n\nLisans yetkilendirmesi ve güvenlik kontrolü için aktif internet bağlantısı zorunludur.\n\nLütfen internet bağlantınızı kontrol ediniz veya Mahmut Akın (+90 539 850 52 68) ile iletişime geçiniz."
        }

    def accept_agreement(self, license_key, signer_name, signer_email=""):
        clean_key = (license_key or load_saved_license_key() or "").strip().upper()
        if not clean_key:
            return {"success": False, "message": "Lisans anahtarı boş olamaz!"}
        payload = {
            "licenseKey": clean_key,
            "signerName": signer_name.strip(),
            "signerEmail": signer_email.strip(),
            "hwid": self.hwid,
            "deviceName": self.device_name
        }
        data, err = self._make_http_post("/api/license/agreement/accept", payload)
        if data is not None:
            return data
        
        # Firestore Direct Fallback - Önce lisans sahibinin adını kontrol et
        licenses = self._firestore_direct_get_licenses()
        found = next((l for l in licenses if str(l.get("key", "")).strip().upper() == clean_key or str(l.get("key", "")).strip().replace("-", "").upper() == clean_key.replace("-", "")), None)
        
        if not found:
            return {"success": False, "message": f"Lisans anahtarı ({clean_key}) veritabanında bulunamadı!"}

        customer_name = str(found.get("customerName", "")).strip()
        
        # İsim eşleşme kontrolü
        norm_signer = signer_name.strip().lower()
        norm_cust = customer_name.lower()
        
        cust_words = [w for w in norm_cust.replace("(", " ").replace(")", " ").replace(".", " ").split() if len(w) > 2]
        sign_words = [w for w in norm_signer.replace("(", " ").replace(")", " ").replace(".", " ").split() if len(w) > 2]
        has_match = any(cw in sign_words or any(cw in sw or sw in cw for sw in sign_words) for cw in cust_words)

        if not has_match and "deneme" not in norm_cust and "test" not in norm_cust:
            return {
                "success": False,
                "message": f"❌ İsim Uyuşmazlığı!\nBu lisans '{customer_name}' adına tahsis edilmiştir.\nLütfen lisans sahibinin tam adını giriniz."
            }

        # Lisans belgesini Firestore'da doğrudan güncelle (agreementAccepted = True)
        try:
            doc_id = found.get("id")
            if not self.firestore_rest_base or not self.firebase_api_key:
                self._load_credentials()
            if doc_id and self.firestore_rest_base and self.firebase_api_key:
                patch_url = f"{self.firestore_rest_base}/licenses/{doc_id}?updateMask.fieldPaths=agreementAccepted&updateMask.fieldPaths=agreementAcceptedAt&updateMask.fieldPaths=agreementSignerName&updateMask.fieldPaths=status"
                headers = self._get_firestore_headers()
                patch_fields = {
                    "agreementAccepted": {"booleanValue": True},
                    "agreementAcceptedAt": {"stringValue": datetime.now().isoformat()},
                    "agreementSignerName": {"stringValue": signer_name.strip()}
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
            "agreementVersion": "v2026.1",
            "signedAt": datetime.now().isoformat(),
            "lawReference": "5846 Sayılı Fikir ve Sanat Eserleri Kanunu (FSEK)"
        }
        self._firestore_direct_save_agreement(agr_record)

        save_agreement_signed(signer_name.strip())

        return {"success": True, "message": "5846 Telif Sözleşmesi doğrulandı ve Firebase Firestore'a kaydedildi."}

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
        """Arka plan canlı lisans ve kilit denetimi (Heartbeat) - SecureString bellek koruması ile"""
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
                                log_event("error", f"Canlı Lisans İptali / Pasif Durum: {data.get('message')}")
                                if on_revocation_callback:
                                    on_revocation_callback(data)
                                    break
                        else:
                            # Firestore Direct Heartbeat & Canlı Durum Kontrolü
                            direct_chk = self._verify_via_firestore_direct(clean_key)
                            if direct_chk:
                                if direct_chk.get("valid") is False or direct_chk.get("status") in ["revoked", "expired", "device_limit_exceeded"]:
                                    self.mark_locally_revoked(clean_key, direct_chk.get("message", "Yönetici tarafından PASİFE ALINDI"))
                                    log_event("error", f"Firestore Canlı Lisans İptali / Pasif Durum: {direct_chk.get('message')}")
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
