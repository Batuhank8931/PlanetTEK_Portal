import os
import json
import shutil
import glob


def prepare_document():
    # 1. Yolların belirlenmesi
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, "formData.json")
    docs_dir = os.path.join(base_dir, "Documents")
    target_file = os.path.join(docs_dir, "document.docx")

    # 2. formData.json dosyasını okuma
    if not os.path.exists(json_path):
        print(f"Hata: '{json_path}' bulunamadı!")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        form_data = json.load(f)

    # 3. Documents içindeki eski document.docx dosyasını silme
    if os.path.exists(target_file):
        try:
            os.remove(target_file)
            print(f"Eski dosya silindi: {target_file}")
        except Exception as e:
            print(f"Eski dosya silinirken hata oluştu: {e}")

    # 4. teklifDili kontrolü ve kaynak dosya deseni belirleme
    customer_info = form_data.get("customerInfo", {})
    teklif_dili = customer_info.get("teklifDili", "").strip().lower()

    print(f"Tespit edilen Teklif Dili: '{customer_info.get('teklifDili')}'")

    if teklif_dili == "yerli":
        source_pattern = os.path.join(docs_dir, "TR-*.docx")
    elif teklif_dili == "yabancı":
        source_pattern = os.path.join(docs_dir, "ENG-*.docx")
    else:
        print(f"Tanınmayan veya boş teklifDili: {teklif_dili}")
        return

    # 5. İlgili dosyayı bulma ve kopyalama
    matched_files = glob.glob(source_pattern)
    if not matched_files:
        print(f"Hata: '{source_pattern}' desenine uygun dosya bulunamadı!")
        return

    source_file = matched_files[0]

    try:
        shutil.copy2(source_file, target_file)
        print(f"İşlem başarılı!")
        print(f"Kaynak: {os.path.basename(source_file)}")
        print(f"Hedef:  document.docx")
    except Exception as e:
        print(f"Kopyalama hatası: {e}")


if __name__ == "__main__":
    prepare_document()
