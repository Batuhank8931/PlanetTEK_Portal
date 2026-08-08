import os
from docx import Document
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.table import WD_TABLE_ALIGNMENT


def fix_table_outer_borders_and_width(doc):
    """Tabloların sadece dış sınırlarına ince çerçeve ekler,

    iç border'lara dokunmaz ve tabloları ortalar.
    """
    for table in doc.tables:
        # Tabloyu ortala ve autofit'i kapat
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False

        tblPr = table._tbl.tblPr

        # Tablonun mevcut w:tblBorders yapısını al veya oluştur
        tblBorders = tblPr.find(qn("w:tblBorders"))
        if tblBorders is None:
            tblBorders = OxmlElement("w:tblBorders")
            tblPr.append(tblBorders)

        # Dış kenarlar için özellikler (1/4 pt için sz='2')
        outer_props = {
            "val": "single",
            "sz": "2",  # 1/4 pt = 2 (Word ölçü birimi: 1/8 pt)
            "space": "0",
            "color": "auto",
        }

        # Sadece dış kenarları (top, left, bottom, right) güncelliyoruz
        for border_name in ["top", "left", "bottom", "right"]:
            border = tblBorders.find(qn(f"w:{border_name}"))
            if border is None:
                border = OxmlElement(f"w:{border_name}")
                tblBorders.append(border)

            border.set(qn("w:val"), outer_props["val"])
            border.set(qn("w:sz"), outer_props["sz"])
            border.set(qn("w:space"), outer_props["space"])
            border.set(qn("w:color"), outer_props["color"])

        # Bölünmüş tablo ve başlık satırı korumaları (cantSplit & tblHeader)
        if len(table.rows) > 0:
            trPr = table.rows[0]._tr.get_or_add_trPr()
            if trPr.find(qn("w:tblHeader")) is None:
                trPr.append(OxmlElement("w:tblHeader"))

        for row in table.rows:
            trPr = row._tr.get_or_add_trPr()
            if trPr.find(qn("w:cantSplit")) is None:
                trPr.append(OxmlElement("w:cantSplit"))


def process_table_control_():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.abspath(os.path.join(script_dir, ".."))

    documents_dir = os.path.join(root_dir, "Documents")
    docx_path = os.path.join(documents_dir, "end_arranged_document.docx")
    output_docx_path = os.path.join(documents_dir, "table_arranged_document.docx")

    print(f"📄 Sayfa düzenleme için dosya kontrol ediliyor: {docx_path}")

    if not os.path.exists(docx_path):
        print(f"❌ Dosya bulunamadı: {docx_path}")
        return

    doc = Document(docx_path)

    print(
        "Tabloların dış çerçeveleri ve genişlikleri düzenleniyor (İç border'lara dokunulmuyor)..."
    )
    fix_table_outer_borders_and_width(doc)

    doc.save(output_docx_path)
    print(f"✅ Düzenlenen dosya kaydedildi: {output_docx_path}")


if __name__ == "__main__":
    process_table_control_()
