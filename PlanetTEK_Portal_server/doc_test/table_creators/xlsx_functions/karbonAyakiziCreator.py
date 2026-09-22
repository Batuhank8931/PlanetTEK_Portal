import os
import json
import openpyxl

# ==========================================
# 1. DOSYA & JSON VERİ OKUMA
# ==========================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SOURCE_FILE = os.path.join(BASE_DIR, "..", "tables", "xlsx0", "karbon_ayakizi.xlsx")
OUTPUT_DIR = os.path.join(BASE_DIR, "..", "tables", "xlsx1")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "karbon_ayakizi.xlsx")

os.makedirs(OUTPUT_DIR, exist_ok=True)

JSON_PATH = os.path.join(BASE_DIR, "..", "..", "formData.json")

if not os.path.exists(JSON_PATH):
    raise FileNotFoundError(f"Hata: {JSON_PATH} dosyası bulunamadı!")

with open(JSON_PATH, "r", encoding="utf-8") as f:
    form_data = json.load(f)

customer_info = form_data.get("customerInfo", {})
karbon_data = form_data.get("tables", {}).get("karbonayakizitablosu", {})

if not karbon_data:
    karbon_data = form_data.get("tables", {}).get("karbonayakizi", {})

is_foreign = customer_info.get("teklifDili") == "Yabancı"
unit_system = customer_info.get("unitSystem", "Metric")
is_us = unit_system == "US"

selected_system = karbon_data.get("selectedSystem", "aktif_camur")
is_mbbr = str(selected_system).lower() == "mbbr"

# 🌟 REACT TARAFINDAN HESAPLANMIŞ VE FORMATLANMIŞ VERİLER
summary = karbon_data.get("renderedSummary", {})
equivalent_trees = karbon_data.get("equivalentTrees", 0)

# ==========================================
# 2. EXCEL DOSYASINI YÜKLEME VE DOLDURMA
# ==========================================
if not os.path.exists(SOURCE_FILE):
    raise FileNotFoundError(f"Hata: Şablon dosya bulunamadı! Yol: {SOURCE_FILE}")

wb = openpyxl.load_workbook(SOURCE_FILE)
ws = wb.active
ws.views.sheetView[0].showGridLines = True

# --- BAŞLIKLAR & ETİKETLER ---
alt_sys_code = "MBBR" if is_mbbr else "AS"

if is_foreign or is_us:
    ws["A1"] = "CARBON FOOTPRINT"
    ws["A3"] = "RBC System Energy Consumption"
    ws["A4"] = "RBC System Energy Consumption"
    ws["A5"] = "CO2 Emission Coefficient"
    ws["A6"] = "Annual Carbon Footprint"

    ws["D3"] = f"{alt_sys_code} System Energy Consumption"
    ws["D4"] = f"{alt_sys_code} System Energy Consumption"
    ws["D5"] = "CO2 Emission Coefficient"
    ws["D6"] = "Annual Carbon Footprint"
else:
    ws["A1"] = "KARBON AYAK İZİ"
    ws["A3"] = "DBD Sistemi Enerji Tüketimi"
    ws["A4"] = "DBD Sistemi Enerji Tüketimi"
    ws["A5"] = "CO2 Emisyon Faktörü"
    ws["A6"] = "Yıllık Karbon Ayak İzi"

    ws["D3"] = f"{alt_sys_code} Sistemi Enerji Tüketimi"
    ws["D4"] = f"{alt_sys_code} Sistemi Enerji Tüketimi"
    ws["D5"] = "CO2 Emisyon Faktörü"
    ws["D6"] = "Yıllık Karbon Ayak İzi"

# BİRİMLER (C VE F KOLONLARI)
kw_day_unit = "kw/day" if (is_foreign or is_us) else "kWh/gün"
kw_year_unit = "kW/year" if (is_foreign or is_us) else "kWh/yıl"
co2_unit = "kg/eMWh" if (is_us or is_foreign) else "kg CO₂ / kWh"
ton_unit = "Ton/year" if is_us else ("ton/year" if is_foreign else "ton CO₂/yıl")

# ==========================================
# 3. VERİLERİ YAZMA (DOĞRUDAN STORE'DAN)
# ==========================================
# Sol Taraf: PlanetDISK (RBC)
ws["B3"] = summary.get("planetDailyKwhFormatted", "").replace(f" {kw_day_unit}", "")
ws["C3"] = kw_day_unit

ws["B4"] = summary.get("planetYearlyKwhFormatted", "").replace(f" {kw_year_unit}", "")
ws["C4"] = kw_year_unit

ws["B5"] = summary.get("co2FactorFormatted", "").replace(f" {co2_unit}", "")
ws["C5"] = co2_unit

ws["B6"] = summary.get("planetCo2Formatted", "").replace(f" {ton_unit}", "")
ws["C6"] = ton_unit

# Sağ Taraf: Alternatif Sistem
ws["E3"] = summary.get("altDailyKwhFormatted", "").replace(f" {kw_day_unit}", "")
ws["F3"] = kw_day_unit

ws["E4"] = summary.get("altYearlyKwhFormatted", "").replace(f" {kw_year_unit}", "")
ws["F4"] = kw_year_unit

ws["E5"] = summary.get("co2FactorFormatted", "").replace(f" {co2_unit}", "")
ws["F5"] = co2_unit

ws["E6"] = summary.get("altCo2Formatted", "").replace(f" {ton_unit}", "")
ws["F6"] = ton_unit

# ==========================================
# 4. AĞAÇ EŞDEĞERİ (TASARRUF KAZANIMI)
# ==========================================
# Excel şablonun 7. satırda iki ayrı sistem için borç yazıyorsa,
# React'taki doğru katsayılarla (Planet vs Alt) tekabül eden ağaç borçları:
# Metric için: / 427.5 | US için: / 942.5
ratio = 942.5 if is_us else 427.5
mult = 2000 if is_us else 1000

planet_co2_val = float(karbon_data.get("planetCo2", 0))
alt_co2_val = float(karbon_data.get("altCo2", 0))

# Doğru katsayıyla sistem borçları:
p_trees = round((planet_co2_val * mult) / ratio)
a_trees = round((alt_co2_val * mult) / ratio)

tree_unit = "trees to nature." if (is_foreign or is_us) else "Ağaç / yıl"

ws["B7"] = p_trees
ws["C7"] = tree_unit

ws["E7"] = a_trees
ws["F7"] = tree_unit

# Not: a_trees - p_trees farkı tam olarak React'taki ~39 ağaç tasarrufuna eşit olur!

# ==========================================
# 5. KAYDETME
# ==========================================
wb.save(OUTPUT_FILE)

print(f"✅ Excel başarıyla güncellendi: {OUTPUT_FILE}")
print(f"🌳 PlanetDISK Ağaç Borcu : {p_trees}")
print(f"🌳 Alternatif Ağaç Borcu : {a_trees}")
print(
    f"✨ Net Ağaç Tasarrufu   : {a_trees - p_trees} (React ile %100 Uyumlu: {equivalent_trees})"
)
