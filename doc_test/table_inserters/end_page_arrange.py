import os
from docx import Document
from docx.enum.text import WD_BREAK
from docx.text.paragraph import Paragraph
from docx.table import Table


def process_end_page_():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.abspath(os.path.join(script_dir, ".."))

    documents_dir = os.path.join(root_dir, "Documents")
    docx_path = os.path.join(documents_dir, "document_updated.docx")
    output_docx_path = os.path.join(documents_dir, "end_arranged_document.docx")

    print(f"📄 Sayfa düzenleme için dosya kontrol ediliyor: {docx_path}")

    if not os.path.exists(docx_path):
        print(f"❌ Hata: '{docx_path}' Word dosyası bulunamadı!")
        return

    doc = Document(docx_path)
    found_count = 0

    # Döngü esnasında eleman sildiğimiz için güvenli bir tarama yapabilmek adına
    # her seferinde body içeriğini güncelleyen bir yapıyla ilerleyelim.
    body_elements = doc.element.body

    # xml elementlerini tek tek kontrol edeceğiz
    i = 0
    while i < len(body_elements):
        child = body_elements[i]

        if child.tag.endswith("p"):
            p = Paragraph(child, doc)

            if "##end_page##" in p.text:
                found_count += 1
                print(f"\n--------------------------------------------------")
                print(f"🔍 [İşlem #{found_count}] '##end_page##' etiketi bulundu.")

                # Etiketi temizle ve sayfa sonu ekle
                for run in p.runs:
                    if "##end_page##" in run.text:
                        run.text = run.text.replace("##end_page##", "")

                run = p.add_run()
                run.add_break(WD_BREAK.PAGE)
                print(f"   ➡️ Fiziksel Sayfa Sonu (Page Break) eklendi.")

                # Şimdi end_page'den sonra gelen boş paragrafları silip, ilk gerçek içeriği bulacağız
                next_elem = child.getnext()
                target_found = False

                while next_elem is not None:
                    following_elem = (
                        next_elem.getnext()
                    )  # Bir sonraki adımı kaybetmemek için tutuyoruz

                    if next_elem.tag.endswith("p"):
                        next_p = Paragraph(next_elem, doc)
                        preview_text = next_p.text.strip()

                        if preview_text:
                            # Gerçek yazıyı/başlığı bulduk!
                            print(
                                f"   🚀 Gerçek İçerik Bulundu ve Başa Taşındı: '{preview_text[:50]}'"
                            )
                            next_p.paragraph_format.space_before = 0
                            target_found = True
                            break
                        else:
                            # İçi boş paragraf! Bunu doğrudan belgeden siliyoruz (çöpü atıyoruz)
                            print(f"   🗑️ Aradaki boş paragraf tamamen silindi.")
                            body_elements.remove(next_elem)

                    elif next_elem.tag.endswith("tbl"):
                        # Tablo bulduk, işlem tamam
                        next_table = Table(next_elem, doc)
                        first_cell_text = ""
                        try:
                            first_cell_text = next_table.rows[0].cells[0].text.strip()
                        except:
                            pass
                        print(
                            f"   🚀 Gerçek İçerik Tablo Bulundu: '{first_cell_text[:50]}...'"
                        )
                        target_found = True
                        break
                    else:
                        break

                    next_elem = following_elem

                if not target_found:
                    print(
                        f"   ⚠️ Uyarı: '##end_page##' sonrasında geçerli içerik bulunamadı!"
                    )

        i += 1

    doc.save(output_docx_path)
    print(
        f"\n🎉 Sayfa Düzenleme Tamamlandı! Toplam {found_count} adet 'end_page' işlendi. Yeni Dosya: {output_docx_path}"
    )


if __name__ == "__main__":
    process_end_page_()
