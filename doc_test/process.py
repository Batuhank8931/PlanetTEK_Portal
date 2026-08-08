import os
import sys
import subprocess

# --------------------------------------------------------------------------
# 🎯 TÜM SÜREÇ SIRALAMA DİZİLERİ (Sıralamayı Buradan Yönetebilirsin)
# --------------------------------------------------------------------------

# 1. Aşama: Excel Tablolarını Üreten Betikler (xlsx_functions altında)
EXCEL_CREATORS_SEQUENCE = [
    "kapakCreator.py",
    "parametreCreator.py",
    "capexCreator.py",
    "enerjiIsletmeCreator.py",
    "sarfMalzemeCreator.py",
    "opexCreator.py",
    "enerjiKarsilastirmaCreator.py",
    "karbonAyakiziCreator.py",
    "onYillikMaliyetCreator.py",
    "amortismanCreator.py",
    "bilgiSayfasiCreator.py",
    "ozetTablosuCreator.py",
    "ekipmanTablosuCreator.py",
]

# 2. Aşama: Excel'leri HTML'e Çeviren Özel Betikler (html_functions altında)
HTML_CREATORS_SEQUENCE = [
    "kapak_html_creator.py",
    "parametre_html_creator.py",
    "capex_html_creator.py",
    "enerji_isletme_html_creator.py",
    "opex_html_creator.py",
    "enerji_karsilastirma_html_creator.py",
    "sarf_malzeme_html_creator.py",
    "karbon_ayakizi_html_creator.py",
    "amortisman_html_creator.py",
    "on_yillik_maliyet_html_creator.py",
    "bilgi_sayfasi_html_creator.py",
    "ozet_tablosu_html_creator.py",
    "ekipman_tablosu_html_creator.py",
]

# 3. Aşama: HTML'leri Word Belgesine Gömme ve Temizleme Betikleri
# (table_inserters veya table_inserters/clear_functions altında)
WORD_INSERTERS_SEQUENCE = [
    "kapak_inserter.py",
    "clear_after_kapak.py",
    "parametre_inserter.py",
    "clear_after_parameters.py",
    "capex_inserter.py",
    "clear_after_capex.py",
    "opex_inserter.py",  # <-- İleride buraya ekleyebilirsin
    "enerji_isletme_inserter.py",
    "sarf_malzeme_inserter.py",
    "enerji_karsilastirma_inserter.py",
    "karbon_ayakizi_inserter.py",
    "on_yillik_maliyet_inserter.py",
    "amortisman_inserter.py",
    "bilgi_sayfasi_inserter.py",
    "ozet_tablosu_inserter.py",
    "ekipman_tablosu_inserter.py",
    "end_page_arrange.py",
    "process_table_control.py",
]
# --------------------------------------------------------------------------


def run_script(script_path):
    """Betigi çalıştırır ve anlık terminale basar."""
    script_name = os.path.basename(script_path)
    print(f"\n🚀 Çalıştırılıyor: {script_name}")

    python_executable = sys.executable
    script_dir = os.path.dirname(script_path)

    try:
        result = subprocess.run(
            [python_executable, script_path], cwd=script_dir, check=True, text=True
        )
        print(f"✅ Başarıyla tamamlandı: {script_name}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ HATA! '{script_name}' çalışırken bir sorun oluştu.")
        return False
    except Exception as e:
        print(f"❌ BEKLENMEYEN HATA: {str(e)}")
        return False


def get_script_full_path(base_dir, category, script_name):
    """Dosya adının kategorisine göre tam yolunu bulur."""
    if category == "excel":
        return os.path.join(base_dir, "table_creators", "xlsx_functions", script_name)
    elif category == "html":
        return os.path.join(base_dir, "table_creators", "html_functions", script_name)
    elif category == "word":
        if script_name.startswith("clear_"):
            return os.path.join(
                base_dir, "table_inserters", "clear_functions", script_name
            )
        else:
            return os.path.join(base_dir, "table_inserters", script_name)
    return None


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))

    # --- AŞAMA 1: EXCEL CREATORS ---
    print("==================================================")
    print("📊 ADIM 1: EXCEL OLUŞTURUCULAR (EXCEL CREATORS)")
    print("==================================================")
    for creator_file in EXCEL_CREATORS_SEQUENCE:
        full_path = get_script_full_path(base_dir, "excel", creator_file)
        if full_path and os.path.exists(full_path):
            if not run_script(full_path):
                return
        else:
            print(f"⚠️ Dosya bulunamadı, atlanıyor: {full_path}")

    # --- AŞAMA 2: HTML CREATORS ---
    print("\n==================================================")
    print("🌐 ADIM 2: HTML DÖNÜŞTÜRÜCÜLER (HTML CREATORS)")
    print("==================================================")
    for html_script in HTML_CREATORS_SEQUENCE:
        full_path = get_script_full_path(base_dir, "html", html_script)
        if full_path and os.path.exists(full_path):
            if not run_script(full_path):
                return
        else:
            print(f"⚠️ Dosya bulunamadı, atlanıyor: {full_path}")

    # --- AŞAMA 3: WORD INSERTERS & CLEANERS ---
    print("\n==================================================")
    print("📥 ADIM 3: WORD YERLEŞTİRİCİLER & TEMİZLEYİCİLER")
    print("==================================================")
    for inserter_file in WORD_INSERTERS_SEQUENCE:
        full_path = get_script_full_path(base_dir, "word", inserter_file)
        if full_path and os.path.exists(full_path):
            if not run_script(full_path):
                return
        else:
            print(f"⚠️ Dosya bulunamadı, atlanıyor: {full_path}")

    print("\n🎉 Tüm otomasyon zinciri eksiksiz tamamlandı!")


if __name__ == "__main__":
    main()
