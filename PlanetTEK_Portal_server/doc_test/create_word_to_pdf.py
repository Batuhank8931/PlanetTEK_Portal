import json
import os
import re
import subprocess
import docx
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls, qn


def get_offer_folder_name(json_path):
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"'{json_path}' bulunamadı!")

    with open(json_path, "r", encoding="utf-8") as f:
        form_data = json.load(f)

    customer_info = form_data.get("customerInfo", {})
    customer_id = customer_info.get("customer_id")  # 👈 customer_id okundu
    offer_number = customer_info.get("offer_number", "").strip()

    # 📁 Klasör Adı Yapılandırması: {customer_id} - {offer_number}
    if customer_id and offer_number:
        folder_name_raw = f"{customer_id} - {offer_number}"
    elif offer_number:
        folder_name_raw = str(offer_number)
    else:
        folder_name_raw = "Teklif_Klasoru"

    return re.sub(r'[\\/*?:"<>|]', "", folder_name_raw)


def fix_tables_xml_level(word_path):
    """Satır yüksekliklerini, dikey hizalamaları ve birleştirilmiş hücre yapısını
    %100 koruyarak tabloları XML seviyesinde sayfa genişliğine sabitler.
    """
    doc = docx.Document(word_path)

    for section in doc.sections:
        # Sayfanın kullanılabilir net genişliği (twip / dxa cinsinden)
        usable_width_twips = (
            section.page_width - section.left_margin - section.right_margin
        ).twips

        for table in doc.tables:
            tblElem = table._element

            # 1. Tablonun mevcut en geniş satırının toplam genişliğini hesapla
            max_row_width = 0
            for tr in tblElem.xpath("w:tr"):
                row_sum = 0
                for tc in tr.xpath("w:tc"):
                    tcPr = tc.find(qn("w:tcPr"))
                    if tcPr is not None:
                        tcW = tcPr.find(qn("w:tcW"))
                        if tcW is not None and tcW.get(qn("w:w")):
                            try:
                                row_sum += int(tcW.get(qn("w:w")))
                            except ValueError:
                                pass
                if row_sum > max_row_width:
                    max_row_width = row_sum

            # Eğer XML'de hücre genişliği bulunamadıysa tblGrid'i kontrol et
            if max_row_width == 0:
                gridCols = tblElem.xpath("w:tblGrid/w:gridCol")
                for gc in gridCols:
                    w_val = gc.get(qn("w:w"))
                    if w_val:
                        try:
                            max_row_width += int(w_val)
                        except ValueError:
                            pass

            # 2. Eğer tablo sayfa genişliğini aşıyorsa orantılı ölçekle
            if max_row_width > usable_width_twips:
                scale_factor = usable_width_twips / max_row_width

                # A) Tablo grid altyapısını (w:tblGrid) ölçekle
                for gc in tblElem.xpath("w:tblGrid/w:gridCol"):
                    w_val = gc.get(qn("w:w"))
                    if w_val:
                        try:
                            gc.set(qn("w:w"), str(int(int(w_val) * scale_factor)))
                        except ValueError:
                            pass

                # B) Her bir benzersiz XML hücresini (w:tc) ölçekle
                for tr in tblElem.xpath(".//w:tr"):
                    for tc in tr.xpath("w:tc"):
                        tcPr = tc.find(qn("w:tcPr"))
                        if tcPr is not None:
                            tcW = tcPr.find(qn("w:tcW"))
                            if tcW is not None and tcW.get(qn("w:w")):
                                try:
                                    val = int(tcW.get(qn("w:w")))
                                    new_val = int(val * scale_factor)
                                    tcW.set(qn("w:w"), str(new_val))
                                    tcW.set(qn("w:type"), "dxa")
                                except ValueError:
                                    pass

                # C) Tablo ana genişliğini (w:tblW) ayarla ve sol taşma girintisini sıfırla
                tblPr = tblElem.find(qn("w:tblPr"))
                if tblPr is not None:
                    tblW = tblPr.find(qn("w:tblW"))
                    if tblW is not None:
                        tblW.set(qn("w:w"), str(usable_width_twips))
                        tblW.set(qn("w:type"), "dxa")
                    else:
                        tblW_elem = parse_xml(
                            f'<w:tblW {nsdecls("w")} w:w="{usable_width_twips}" w:type="dxa"/>'
                        )
                        tblPr.append(tblW_elem)

                    # Tablonun sola kaymasını veya dışarı taşmasını engelleyen girinti ayarı
                    tblInd = tblPr.find(qn("w:tblInd"))
                    if tblInd is not None:
                        tblInd.set(qn("w:w"), "0")
                        tblInd.set(qn("w:type"), "dxa")

    doc.save(word_path)


def convert_word_to_pdf():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, "formData.json")

    offer_number_folder = get_offer_folder_name(json_path)
    target_dir = os.path.join(base_dir, "final_offer", offer_number_folder)

    if not os.path.exists(target_dir):
        print(f"Hata: Hedef klasör '{target_dir}' bulunamadı!")
        return

    docx_files = [
        f
        for f in os.listdir(target_dir)
        if f.endswith(".docx") and not f.startswith("~$")
    ]

    if not docx_files:
        print(
            f"Hata: '{target_dir}' klasöründe dönüştürülecek .docx dosyası bulunamadı!"
        )
        return

    word_file_name = docx_files[0]
    word_path = os.path.join(target_dir, word_file_name)

    # --- 1. ADIM: Tablo Yapısı ve Yükseklikleri Korunarak XML Seviyesinde Düzenleniyor ---
    print(f"Tablo tasarımları ve yükseklikleri korunarak hizalanıyor: {word_file_name}")
    try:
        fix_tables_xml_level(word_path)
    except Exception as e:
        print(f"Tablo düzenleme sırasında hata/uyarı: {e}")

    # --- 2. ADIM: LibreOffice ile PDF'e Çevirme ---
    print(f"LibreOffice ile PDF'e dönüştürülüyor: {word_file_name}")

    try:
        cmd = [
            "libreoffice",
            "--headless",
            "--convert-to",
            "pdf:writer_pdf_Export",
            word_path,
            "--outdir",
            target_dir,
        ]
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)

        pdf_file_name = os.path.splitext(word_file_name)[0] + ".pdf"
        pdf_path = os.path.join(target_dir, pdf_file_name)

        print("İşlem başarıyla tamamlandı!")
        print(f"PDF Oluşturuldu: {pdf_path}")

    except Exception as e:
        print(f"PDF dönüştürme sırasında hata oluştu: {e}")


if __name__ == "__main__":
    convert_word_to_pdf()
