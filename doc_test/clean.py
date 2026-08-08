import os
import shutil

# Projenin kök dizini (process.py'ın bulunduğu klasör)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 1. Silinecek spesifik Documents dosyaları
DOCUMENTS_DIR = os.path.join(BASE_DIR, "Documents")
FILES_TO_DELETE = [
    "document_updated.docx",
    "end_arranged_document.docx",
    "table_arranged_document.docx",
]

# 2. İçeriği tamamen temizlenecek klasörler
FOLDERS_TO_EMPTY = [
    os.path.join(BASE_DIR, "table_creators", "tables", "htmls"),
    os.path.join(BASE_DIR, "table_creators", "tables", "xlsx1"),
]


def clean_documents():
    """Documents klasöründeki belirli dosyaları siler."""
    print("--- Documents Dosyaları Temizleniyor ---")
    for file_name in FILES_TO_DELETE:
        file_path = os.path.join(DOCUMENTS_DIR, file_name)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                print(f"[SİLİNDİ] {file_name}")
            except Exception as e:
                print(f"[HATA] {file_name} silinemedi: {e}")
        else:
            print(f"[BULUNAMADI] {file_name}")


def clear_folder_contents(folder_path):
    """Verilen klasörün içindeki tüm dosya ve alt klasörleri siler, klasörün kendisini bırakır."""
    folder_name = os.path.basename(folder_path)
    print(f"\n--- {folder_name} Klasör İçeriği Temizleniyor ---")

    if not os.path.exists(folder_path):
        print(f"[BULUNAMADI] Klasör mevcut değil: {folder_path}")
        return

    for item in os.listdir(folder_path):
        item_path = os.path.join(folder_path, item)
        try:
            if os.path.isfile(item_path) or os.path.islink(item_path):
                os.unlink(item_path)
                print(f"[SİLİNDİ] {item}")
            elif os.path.isdir(item_path):
                shutil.rmtree(item_path)
                print(f"[KLASÖR SİLİNDİ] {item}")
        except Exception as e:
            print(f"[HATA] {item} silinemedi: {e}")


if __name__ == "__main__":
    clean_documents()
    for folder in FOLDERS_TO_EMPTY:
        clear_folder_contents(folder)
    print("\nTemizlik işlemi tamamlandı!")
