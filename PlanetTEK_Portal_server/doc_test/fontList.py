import json
import os
import re
import xml.etree.ElementTree as ET
import zipfile


def get_offer_number(json_path):
    if not os.path.exists(json_path):
        return None
    with open(json_path, "r", encoding="utf-8") as f:
        form_data = json.load(f)
    customer_info = form_data.get("customerInfo", {})
    offer_number = customer_info.get("offer_number", "").strip()
    if not offer_number:
        return None
    return re.sub(r'[\\/*?:"<>|]', "", offer_number)


def get_docx_fonts(docx_path):
    fonts = set()
    try:
        with zipfile.ZipFile(docx_path, "r") as z:
            if "word/fontTable.xml" in z.namelist():
                xml_content = z.read("word/fontTable.xml")
                root = ET.fromstring(xml_content)
                ns = {
                    "w": (
                        "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                    )
                }

                for font_elem in root.findall("w:font", ns):
                    font_name = font_elem.get(f"{{{ns['w']}}}name")
                    if font_name:
                        fonts.add(font_name)
    except Exception as e:
        print(f"Hata oluştu ({docx_path}): {e}")
    return sorted(list(fonts))


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, "formData.json")
    target_dir = None

    # 1. Klasör yolunu dinamik olarak tespit et
    offer_number_folder = get_offer_number(json_path)
    if offer_number_folder:
        target_dir = os.path.join(base_dir, "final_offer", offer_number_folder)

    # Klasör bulunamazsa final_offer altındaki ilk alt klasöre bak
    if not target_dir or not os.path.exists(target_dir):
        final_offer_dir = os.path.join(base_dir, "final_offer")
        if os.path.exists(final_offer_dir):
            subdirs = [
                os.path.join(final_offer_dir, d)
                for d in os.listdir(final_offer_dir)
                if os.path.isdir(os.path.join(final_offer_dir, d))
            ]
            if subdirs:
                target_dir = subdirs[0]

    if not target_dir or not os.path.exists(target_dir):
        print("❌ Hedef klasör bulunamadı!")
        return

    # 2. Oluşturulan .docx dosyasını bul
    docx_files = [
        f
        for f in os.listdir(target_dir)
        if f.endswith(".docx") and not f.startswith("~$")
    ]
    if not docx_files:
        print(f"❌ '{target_dir}' içinde .docx dosyası bulunamadı!")
        return

    docx_path = os.path.join(target_dir, docx_files[0])
    print(f"🔍 İncelenen Dosya: {os.path.basename(docx_path)}")

    # 3. Fontları tara ve listele
    fonts = get_docx_fonts(docx_path)
    print("\n📄 Belgede Kullanılan Fontlar:")
    for font in fonts:
        print(f"  - {font}")


if __name__ == "__main__":
    main()
