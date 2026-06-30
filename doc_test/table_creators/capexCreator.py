import os
import json
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# 1. Klasör ve Dosya Yollarının Yönetimi (Mac & Ubuntu Uyumlu)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TARGET_FILE = os.path.join(BASE_DIR, "tables", "capex.xlsx")

if not os.path.exists(TARGET_FILE):
    print(f"Hata: {TARGET_FILE} bulunamadı! Yeni bir tane oluşturuluyor...")
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Capex"
    os.makedirs(os.path.dirname(TARGET_FILE), exist_ok=True)
else:
    wb = openpyxl.load_workbook(TARGET_FILE)
    ws = wb.active

# Sayfayı temizle
ws.delete_rows(1, ws.max_row + 1)

# 2. 1. Satır Kolon Başlıkları
headers = [
    "No", 
    "Description", 
    "Piece", 
    "Unit Price", 
    "Total Price", 
    "Discount Rate", 
    "Total Price After Discount"
]

for col_idx, header_text in enumerate(headers, 1):
    cell = ws.cell(row=1, column=col_idx, value=header_text)
    cell.font = Font(name="Calibri", size=9, bold=True)
    cell.alignment = Alignment(horizontal="center", vertical="center")

# Güncel JSON Verisi
data = [
  {
    "id": "1_ana_mekanik",
    "type": 0,
    "label": "MEKANİK EKİPMANLAR",
    "piece": 0,
    "unitPrice": 0,
    "discount": 0,
    "rawTotal": 0,
    "netTotal": 0,
    "no": "1.",
    "computedNo": "1.",
    "isPrice": False
  },
  {
    "id": "1_alt_fiziksel",
    "type": 1,
    "label": "Fiziksel Arıtma Üniteleri (Birincil Arıtma)",
    "piece": 0,
    "unitPrice": 0,
    "discount": 0,
    "rawTotal": 0,
    "netTotal": 0,
    "no": "1.1.",
    "computedNo": "1.1.",
    "isPrice": False
  },
  {
    "id": "1_alt_izgara",
    "type": 2,
    "label": "Kaba ve İnce Izgara Seçenekleri",
    "piece": 0,
    "unitPrice": 0,
    "discount": 0,
    "rawTotal": 0,
    "netTotal": 0,
    "no": "1.1.1.",
    "computedNo": "1.1.1.",
    "isPrice": False
  },
  {
    "id": "1_izgara_kaba_manuel",
    "type": 3,
    "piece": 1,
    "label": "Elle Temizlemeli Kaba Izgara",
    "unitPrice": 999,
    "discount": 12,
    "rawTotal": 999,
    "netTotal": "Yerinde Tedarik",
    "no": "1.1.1.1.",
    "computedNo": "1.1.1.1.",
    "isPrice": True,
    "isLocalSupply": True,
    "isOptional": False
  },
  {
    "id": "1_izgara_ince_manuel",
    "type": 3,
    "piece": 1,
    "label": "Elle Temizlemeli İnce Izgara",
    "unitPrice": 910,
    "discount": 12,
    "rawTotal": 910,
    "netTotal": 800.8,
    "no": "1.1.1.2.",
    "computedNo": "1.1.1.2.",
    "isPrice": True
  },
  {
    "id": "1_plaka_kum_yag",
    "type": 3,
    "piece": 4,
    "label": "Kum-Yağ Tutucu Plakaları (Boyut: 1000 x 1000 mm)",
    "unitPrice": 108,
    "discount": 12,
    "rawTotal": 432,
    "netTotal": 380.16,
    "no": "1.2.",
    "computedNo": "1.2.",
    "isPrice": True
  },
  {
    "id": "1_pompa_terfi",
    "type": 3,
    "piece": 2,
    "label": "Terfi Pompası (1 asil + 1 yedek) - City Pumps Ranger 10 35",
    "unitPrice": 493.68,
    "discount": 12,
    "rawTotal": 987.36,
    "netTotal": 868.88,
    "no": "1.3.",
    "computedNo": "1.3.",
    "isPrice": True
  },
  {
    "id": "1_alt_biyolojik",
    "type": 1,
    "label": "Biyolojik Arıtma Üniteleri (İkincil Arıtma)",
    "piece": 0,
    "unitPrice": 0,
    "discount": 0,
    "rawTotal": 0,
    "netTotal": 0,
    "no": "1.4.",
    "computedNo": "1.4.",
    "isPrice": False
  },
  {
    "id": "2_rbc_kapakli",
    "type": 3,
    "piece": 1,
    "label": "PlanetDISK® MX 1 DBD Ünitesi;\n- Epoksi Boyalı AISI 1045 (C45) Karbon Çelik Dolu Mil,\n- Islak Parçalar SS304 Paslanmaz ve Galvaniz Kaplı Çelik,\n- Mil Başına 109 disk / ünite ,\n- Disk Yüzey Alanı 719.40 m² / ünite",
    "unitPrice": 29625,
    "discount": 20,
    "rawTotal": 29625,
    "netTotal": 23700,
    "no": "1.5.",
    "computedNo": "1.5.",
    "isPrice": True
  },
  {
    "id": "2_lamella_seperator",
    "type": 3,
    "piece": 1,
    "label": "LS_15 Lamella Seperatör Son Çöktürme Tankı",
    "unitPrice": 6570,
    "discount": 20,
    "rawTotal": 6570,
    "netTotal": 5256,
    "no": "1.6.",
    "computedNo": "1.6.",
    "isPrice": True
  },
  {
    "id": "2_pompa_camur_son_cokturme",
    "type": 3,
    "piece": 1,
    "label": "smt 100A Son Çöktürme Tankı Çamur Pompası",
    "unitPrice": 360.36,
    "discount": 12,
    "rawTotal": 360.36,
    "netTotal": 317.12,
    "no": "1.7.",
    "computedNo": "1.7.",
    "isPrice": True
  },
  {
    "id": "1_ana_insaat",
    "type": 0,
    "label": "İNŞAAT İŞLERİ",
    "piece": 0,
    "unitPrice": 0,
    "discount": 0,
    "rawTotal": 0,
    "netTotal": 0,
    "no": "2.",
    "computedNo": "2.",
    "isPrice": False
  },
  {
    "id": "6_insaat_kanal_izgara",
    "type": 3,
    "piece": 1,
    "label": "Izgara ve Kum-Yağ Tutucu Kanalı",
    "unitPrice": 0,
    "unitData": "TÜM İNŞAAT İŞLERİ İŞVEREN TARAFINDAN YAPILACAKTIR.",
    "discount": 0,
    "isUrgent": True,
    "rawTotal": 0,
    "netTotal": 0,
    "no": "2.1.",
    "computedNo": "2.1.",
    "isPrice": True
  },
  {
    "id": "6_insaat_tank_oncokturme_1",
    "type": 3,
    "piece": 1,
    "label": "Birinci Ön Çöktürme Tankı",
    "unitPrice": 0,
    "unitData": "TÜM İNŞAAT İŞLERİ İŞVEREN TARAFINDAN YAPILACAKTIR.",
    "discount": 0,
    "isUrgent": True,
    "rawTotal": 0,
    "netTotal": 0,
    "no": "2.2.",
    "computedNo": "2.2.",
    "isPrice": True
  },
  {
    "id": "6_insaat_tank_oncokturme_2",
    "type": 3,
    "piece": 1,
    "label": "İkinci Ön Çöktürme Tankı",
    "unitPrice": 0,
    "unitData": "TÜM İNŞAAT İŞLERİ İŞVEREN TARAFINDAN YAPILACAKTIR.",
    "discount": 0,
    "isUrgent": True,
    "rawTotal": 0,
    "netTotal": 0,
    "no": "2.3.",
    "computedNo": "2.3.",
    "isPrice": True
  },
  {
    "id": "6_insaat_tank_dengeleme",
    "type": 3,
    "piece": 1,
    "label": "Dengeleme Tankı",
    "unitPrice": 0,
    "unitData": "TÜM İNŞAAT İŞLERİ İŞVEREN TARAFINDAN YAPILACAKTIR.",
    "discount": 0,
    "isUrgent": True,
    "rawTotal": 0,
    "netTotal": 0,
    "no": "2.4.",
    "computedNo": "2.4.",
    "isPrice": True
  },
  {
    "id": "1_ana_montaj",
    "type": 0,
    "label": "MONTAJ EKİPMANLARI",
    "piece": 0,
    "unitPrice": 0,
    "discount": 0,
    "rawTotal": 0,
    "netTotal": 0,
    "no": "3.",
    "computedNo": "3.",
    "isPrice": False
  },
  {
    "id": "7_montaj_borulama_tesisat",
    "type": 3,
    "piece": 1,
    "label": "Bütün borulama ve elektrik tesisatı",
    "unitPrice": 3626,
    "discount": 12,
    "rawTotal": 3626,
    "netTotal": 3190.88,
    "no": "3.1.",
    "computedNo": "3.1.",
    "isPrice": True
  },
  {
    "id": "1_ana_elektrik",
    "type": 0,
    "label": "ELEKTRİK İŞLERİ",
    "piece": 0,
    "unitPrice": 0,
    "discount": 0,
    "rawTotal": 0,
    "netTotal": 0,
    "no": "4.",
    "computedNo": "4.",
    "isPrice": False
  },
  {
    "id": "7_elektrik_kontrol_panosu",
    "type": 3,
    "piece": 1,
    "label": "PlanetDISK® Kontrol Panosu",
    "unitPrice": 4897,
    "discount": 12,
    "rawTotal": 4897,
    "netTotal": 4309.36,
    "no": "4.1.",
    "computedNo": "4.1.",
    "isPrice": True
  },
  {
    "id": "1_ana_nakliye",
    "type": 0,
    "label": "NAKLİYE",
    "piece": 0,
    "unitPrice": 0,
    "discount": 0,
    "rawTotal": 0,
    "netTotal": 0,
    "no": "5.",
    "computedNo": "5.",
    "isPrice": False
  },
  {
    "id": "7_konteyner",
    "type": 3,
    "piece": 1,
    "label": "40' HC konteyner",
    "unitPrice": 13027,
    "discount": 0,
    "isOptional": True,
    "rawTotal": 13027,
    "netTotal": 13027,
    "no": "5.1.",
    "computedNo": "5.1.",
    "isPrice": True
  },
  {
    "id": "7_nakliye_tir",
    "type": 3,
    "piece": 1,
    "label": "Tır",
    "unitPrice": 0,
    "discount": 0,
    "isOptional": True,
    "rawTotal": 0,
    "netTotal": 0,
    "no": "5.2.",
    "computedNo": "5.2.",
    "isPrice": True
  },
  {
    "id": "1_ana_muhendislik",
    "type": 0,
    "label": "PROJE, MONTAJ, DEVREYE ALMA, EĞİTİM ve MÜHENDİSLİK",
    "piece": 0,
    "unitPrice": 0,
    "discount": 0,
    "rawTotal": 0,
    "netTotal": 0,
    "no": "6.",
    "computedNo": "6.",
    "isPrice": False
  },
  {
    "id": "7_muhendislik_genel_paket",
    "type": 3,
    "piece": 1,
    "label": "Mühendislik Hizmetleri Genel Paketi",
    "unitPrice": 1800,
    "discount": 12,
    "rawTotal": 1800,
    "netTotal": 1584,
    "no": "6.1.",
    "computedNo": "6.1.",
    "isPrice": True
  },
  {
    "id": "1_ana_pod",
    "type": 0,
    "label": "POD HAZIRLANMASI ve ONAYININ ALINMASI-Harçlar Hariç",
    "piece": 0,
    "unitPrice": 0,
    "discount": 0,
    "rawTotal": 0,
    "netTotal": 0,
    "no": "7.",
    "computedNo": "7.",
    "isPrice": False
  },
  {
    "id": "7_pod_resmi_onay_yonetimi",
    "type": 3,
    "piece": 1,
    "label": "Resmi Onay Süreçleri Yönetimi",
    "unitPrice": 2300,
    "discount": 0,
    "rawTotal": 2300,
    "netTotal": 2300,
    "no": "7.1.",
    "computedNo": "7.1.",
    "isPrice": True
  }
]
# Stil ve Renk Tanımlamaları
FILL_LEVEL_0 = PatternFill(start_color="A6A6A6", end_color="A6A6A6", fill_type="solid")
FILL_LEVEL_1 = PatternFill(start_color="C0C0C0", end_color="C0C0C0", fill_type="solid")
FILL_LEVEL_2 = PatternFill(start_color="D9D9D9", end_color="D9D9D9", fill_type="solid")
FILL_WHITE   = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")

FONT_BASE = {"name": "Calibri", "size": 8}
font_level_0 = Font(bold=True, italic=True, **FONT_BASE)
font_level_1 = Font(bold=True, **FONT_BASE)
font_level_2 = Font(bold=False, italic=True, **FONT_BASE)
font_item    = Font(bold=False, **FONT_BASE)

thin_side = Side(border_style="thin", color="D3D3D3")
border_all = Border(left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)

EURO_FORMAT = '#,##0.00" €"'
PERCENT_FORMAT = '0"%"'

current_row = 2

# 3. Verileri Döngüyle Basma ve Satır Yüksekliği Hesaplama
for item in data:
    is_header = (item.get("piece") == 0 and item.get("unitPrice") == 0) or item.get("type") in [0, 1, 2]
    label_value = item.get("label", "")
    
    if item.get("type") == 0:
        label_value = label_value.upper()

    ws.cell(row=current_row, column=1, value=item.get("computedNo", ""))
    ws.cell(row=current_row, column=2, value=label_value)
    
    # --- Dinamik Satır Yüksekliği Ayarı ---
    line_count = str(label_value).count('\n') + 1
    calculated_height = max(18, line_count * 12.5)
    ws.row_dimensions[current_row].height = calculated_height
    # --------------------------------------

    if is_header:
        if item.get("type") == 0 or "." not in item.get("computedNo", "").strip("."):
            row_fill = FILL_LEVEL_0
            row_font = font_level_0
        elif item.get("computedNo", "").count(".") == 2:
            row_fill = FILL_LEVEL_1
            row_font = font_level_1
        else:
            row_fill = FILL_LEVEL_2
            row_font = font_level_2
            
        for col in range(1, 8):
            cell = ws.cell(row=current_row, column=col)
            cell.fill = row_fill
            cell.font = row_font
            cell.border = border_all
            cell.alignment = Alignment(horizontal="center" if col == 1 else "left", vertical="center", wrap_text=True)
            
    else:
        ws.cell(row=current_row, column=3, value=item.get("piece"))
        
        # Eğer satır isUrgent ise sadece temel çerçevelerini basıyoruz, sağ sütunlar birazdan birleştirilecek
        if item.get("isUrgent"):
            for col in range(1, 8):
                cell = ws.cell(row=current_row, column=col)
                cell.fill = FILL_WHITE
                cell.font = font_item
                cell.border = border_all
                if col in [1, 3]:
                    cell.alignment = Alignment(horizontal="center", vertical="center")
                elif col == 2:
                    cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
        else:
            # Standart Fiyatlı Kalem Yapısı
            ws.cell(row=current_row, column=4, value=item.get("unitPrice"))
            ws.cell(row=current_row, column=5, value=f"=C{current_row}*D{current_row}")
            ws.cell(row=current_row, column=6, value=item.get("discount") / 100 if item.get("discount") else 0)
            
            # Kural 1: isOptional veya isLocalSupply ise doğrudan netTotal'daki metni / değeri basıyoruz
            if item.get("isOptional") or item.get("isLocalSupply"):
                ws.cell(row=current_row, column=7, value=item.get("netTotal"))
            else:
                ws.cell(row=current_row, column=7, value=f"=E{current_row}*(1-F{current_row})")
                
            for col in range(1, 8):
                cell = ws.cell(row=current_row, column=col)
                cell.fill = FILL_WHITE
                cell.font = font_item
                cell.border = border_all
                
                if col == 1:
                    cell.alignment = Alignment(horizontal="center", vertical="center")
                elif col == 2:
                    cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
                elif col == 3:
                    cell.alignment = Alignment(horizontal="center", vertical="center")
                    cell.number_format = '#,##0'
                elif col in [4, 5]:
                    cell.alignment = Alignment(horizontal="right", vertical="center")
                    cell.number_format = EURO_FORMAT
                elif col == 6:
                    cell.alignment = Alignment(horizontal="right", vertical="center")
                    cell.number_format = PERCENT_FORMAT
                elif col == 7:
                    if item.get("isOptional") or item.get("isLocalSupply"):
                        # Eğer gelen veri string ise ortala, sayıysa sağa yasla ve para birimi formatı ekle
                        if isinstance(cell.value, str):
                            cell.alignment = Alignment(horizontal="center", vertical="center")
                        else:
                            cell.alignment = Alignment(horizontal="right", vertical="center")
                            cell.number_format = EURO_FORMAT
                    else:
                        cell.alignment = Alignment(horizontal="right", vertical="center")
                        cell.number_format = EURO_FORMAT

    current_row += 1

# Kural 2: Alt alta gelen isUrgent satırlarını tespit edip 4. ve 7. kolonlar arasını dikeyde birleştirme
current_row = 2
urgent_groups = []
current_group = []

for item in data:
    if item.get("isUrgent"):
        current_group.append((current_row, item))
    else:
        if current_group:
            urgent_groups.append(current_group)
            current_group = []
    current_row += 1
if current_group:
    urgent_groups.append(current_group)

# Tespit edilen grupları Excel'de birleştirip ilk elemanın unitData'sını yazıyoruz
for group in urgent_groups:
    start_r = group[0][0]
    end_r = group[-1][0]
    unit_data_text = group[0][1].get("unitData", "")
    
    # 4. Kolon (Unit Price) ile 7. Kolon (Total After Discount) arasını dikey ve yatay blok olarak birleştir
    ws.merge_cells(start_row=start_r, start_column=4, end_row=end_r, end_column=7)
    merged_cell = ws.cell(row=start_r, column=4, value=unit_data_text)
    merged_cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    merged_cell.font = font_item

# 4. Dinamik Kolon Genişliği Ayarı
for col in ws.columns:
    max_len = 0
    col_letter = get_column_letter(col[0].column)
    for cell in col:
        if cell.value:
            lines = str(cell.value).split('\n')
            for line in lines:
                if len(line) > max_len:
                    max_len = len(line)
    
    if col_letter == "B":
        ws.column_dimensions[col_letter].width = min(max(max_len + 3, 20), 50)
    else:
        ws.column_dimensions[col_letter].width = max(max_len + 3, 11)

wb.save(TARGET_FILE)
print(f"Excel başarıyla yeni kurallara göre güncellendi ve kaydedildi: {TARGET_FILE}")