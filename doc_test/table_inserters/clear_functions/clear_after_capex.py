import os
from bs4 import BeautifulSoup
from docx import Document


def get_capex_row_count(html_path):
    """capex.html dosyasındaki tr (satır) sayısını sayar."""
    if not os.path.exists(html_path):
        return 0
    with open(html_path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")
    return len(soup.find_all("tr"))


def clear_after_capex():
    """
    ##clear_after_capex## etiketini bulur ve Capex tablosunda eklenen satır sayısı kadar
    boş paragrafı (Enter) silerek altındaki içeriği yukarı çeker.
    """
    # Dizin ayarları (kapak örneğindeki yapıya uygun olarak)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    doc_test_dir = os.path.abspath(os.path.join(script_dir, "..", ".."))

    documents_dir = os.path.join(doc_test_dir, "Documents")
    tables_dir = os.path.join(doc_test_dir, "table_creators", "tables")

    updated_docx_path = os.path.join(documents_dir, "document_updated.docx")

    # capex.html dosyasının yolu (htmls klasörü altında olduğunu varsayarak)
    capex_html_path = os.path.join(tables_dir, "htmls", "capex.html")

    if not os.path.exists(updated_docx_path):
        print(f"Hata: '{updated_docx_path}' bulunamadı!")
        return

    # 1. capex.html Üzerinden Satır Sayısını Al
    row_count = get_capex_row_count(capex_html_path)
    print(f"📊 Capex tablosundaki satır sayısı: {row_count}")

    if row_count == 0:
        print("  ⚠️ Satır sayısı 0 olduğu için temizleme yapılmadı.")
        return

    doc = Document(updated_docx_path)
    placeholder = "##clear_after_capex##"

    # 2. Etiketin Bulunduğu Paragrafı Tespit Et
    target_p = None
    for p in doc.paragraphs:
        if placeholder in p.text.lower():
            target_p = p
            break

    if not target_p:
        print(f"  ⚠️ Belge içinde '{placeholder}' etiketi bulunamadı!")
        return

    parent = target_p._p.getparent()
    target_idx = parent.index(target_p._p)

    # 3. Etiketin Olduğu Yerden Başlayarak Yukarı/Aşağı Yönde Boş Paragrafları Sil
    deleted_count = 0
    elements_to_remove = [target_p._p]  # İlk olarak etiketin kendisini ekle

    # Etiketten önceki boş paragrafları topla (yukarı doğru)
    for i in range(target_idx - 1, -1, -1):
        if deleted_count >= row_count:
            break
        elem = parent[i]
        if elem.tag.endswith("p"):
            text = "".join(elem.itertext()).strip()
            if not text:  # Boş Enter ise
                elements_to_remove.append(elem)
                deleted_count += 1
            else:
                break  # Metin içeren paragrafta dur
        elif elem.tag.endswith("tbl"):
            break  # Tabloya ulaştıysak dur

    # Yukarıdaki boşluklar yetmediyse aşağıya doğru boşlukları da topla
    for i in range(target_idx + 1, len(parent)):
        if deleted_count >= row_count:
            break
        elem = parent[i]
        if elem.tag.endswith("p"):
            text = "".join(elem.itertext()).strip()
            if not text:
                elements_to_remove.append(elem)
                deleted_count += 1
            else:
                break
        elif elem.tag.endswith("tbl"):
            break

    # Toplanan tüm boş paragrafları sil
    for elem in elements_to_remove:
        parent.remove(elem)

    doc.save(updated_docx_path)
    print(
        f"  ✅ '{placeholder}' etiketi ve etrafındaki {deleted_count} adet boş paragraf silindi!"
    )


if __name__ == "__main__":
    clear_after_capex()
