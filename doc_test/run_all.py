import sys
import subprocess
import os
import json

# Çalıştırılacak scriptler ve kullanıcıya gösterilecek Türkçe açıklamaları
STEPS = [
    {"script": "clean.py", "message": "Geçici dosyalar ve önbellek temizleniyor..."},
    {
        "script": "preparedoc.py",
        "message": "Teklif şablonu ve kapak sayfaları hazırlanıyor...",
    },
    {
        "script": "process.py",
        "message": "Hesaplama tabloları ve ekipman listeleri Word'e aktarılıyor...",
    },
    {
        "script": "finalDocument.py",
        "message": "Belge biçimlendiriliyor ve final Word dosyası oluşturuluyor...",
    },
]


def report_progress(step_index, total_steps, message, script):
    # Node.js stdout üzerinden bu JSON'ı okuyacak
    progress_data = {
        "type": "PROGRESS",
        "step": step_index + 1,
        "totalSteps": total_steps,
        "script": script,
        "message": message,
    }
    print(f"PROGRESS_JSON:{json.dumps(progress_data)}", flush=True)


def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    total_steps = len(STEPS)

    for index, step_info in enumerate(STEPS):
        script_name = step_info["script"]
        message = step_info["message"]

        # Aşama bilgisini konsola bas
        report_progress(index, total_steps, message, script_name)

        script_path = os.path.join(current_dir, script_name)
        if not os.path.exists(script_path):
            print(f"❌ HATA: {script_name} dosyası bulunamadı!", file=sys.stderr)
            sys.exit(1)

        # Scripti çalıştır
        result = subprocess.run([sys.executable, script_path], cwd=current_dir)

        if result.returncode != 0:
            print(
                f"❌ HATA: {script_name} başarısız oldu (Kod {result.returncode})",
                file=sys.stderr,
            )
            sys.exit(result.returncode)

    print(
        f"PROGRESS_JSON:{json.dumps({'type': 'COMPLETED', 'message': 'Tüm adımlar başarıyla tamamlandı.'})}",
        flush=True,
    )


if __name__ == "__main__":
    main()
