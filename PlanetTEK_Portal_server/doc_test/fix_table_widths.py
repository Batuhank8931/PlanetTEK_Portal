import json
import os
import re
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


def freeze_table_widths(word_path):
    """Word dosyasındaki tüm tabloların 'fit to page/autofit' özelliğini kaldırır.

    Mevcut sütun ve hücre genişliklerini XML seviyesinde dxa (sabit genişlik)
    olarak kilitler. Böylece LibreOffice PDF çevirisinde tabloları tüm
    sayfaya yaymaz.
    """
    doc = docx.Document(word_path)

    for table in doc.tables:
        tblElem = table._element
        tblPr = tblElem.find(qn("w:tblPr"))

        if tblPr is not None:
            # 1. Tablonun AutoFit / Otomatik Sığdır özelliğini kapat (w:autofit w:val="0")
            tblAutofit = tblPr.find(qn("w:tblAutofit"))
            if tblAutofit is not None:
                tblAutofit.set(qn("w:val"), "0")
            else:
                tblPr.append(parse_xml(f'<w:tblAutofit {nsdecls("w")} w:val="0"/>'))

            # 2. Tablonun genel genişlik tipini 'dxa' (fixed) yap
            tblW = tblPr.find(qn("w:tblW"))
            if tblW is not None:
                if tblW.get(qn("w:type")) != "dxa":
                    tblW.set(qn("w:type"), "dxa")

        # 3. GridCol ve TC (Hücre) seviyesinde genişlikleri 'dxa' olarak sabitle
        for gc in tblElem.xpath("w:tblGrid/w:gridCol"):
            w_val = gc.get(qn("w:w"))
            if w_val:
                gc.set(qn("w:w"), str(w_val))

        for tr in tblElem.xpath(".//w:tr"):
            for tc in tr.xpath("w:tc"):
                tcPr = tc.find(qn("w:tcPr"))
                if tcPr is not None:
                    tcW = tcPr.find(qn("w:tcW"))
                    if tcW is not None:
                        tcW.set(qn("w:type"), "dxa")

    doc.save(word_path)
    print(f"Tablo genişlikleri başarıyla sabitlendi: {os.path.basename(word_path)}")


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, "formData.json")

    try:
        offer_number_folder = get_offer_folder_name(json_path)
        target_dir = os.path.join(base_dir, "final_offer", offer_number_folder)
    except Exception:
        target_dir = base_dir

    if not os.path.exists(target_dir):
        print(f"Hata: Klasör bulunamadı '{target_dir}'")
        return

    docx_files = [
        f
        for f in os.listdir(target_dir)
        if f.endswith(".docx") and not f.startswith("~$")
    ]

    if not docx_files:
        print(f"'{target_dir}' klasöründe .docx dosyası bulunamadı!")
        return

    for docx_file in docx_files:
        word_path = os.path.join(target_dir, docx_file)
        freeze_table_widths(word_path)


if __name__ == "__main__":
    main()
