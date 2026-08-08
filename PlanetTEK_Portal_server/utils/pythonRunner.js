const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs-extra");

let isPythonBusy = false;

/**
 * @param {Object} formData - Form verileri
 * @param {Function} onProgressCallback - Her adımda tetiklenecek callback (step, total, message)
 */
const runPythonDocGenerator = async (formData, onProgressCallback) => {
  if (isPythonBusy) {
    const error = new Error("Sistem şu an başka bir belge üretiyor. Lütfen birkaç saniye sonra tekrar deneyiniz.");
    error.statusCode = 429;
    throw error;
  }

  isPythonBusy = true;

  try {
    const serverDir = path.join(__dirname, "..");
    const docTestDir = path.join(serverDir, "doc_test");

    const isWindows = process.platform === "win32";
    const venvPythonPath = isWindows
      ? path.join(docTestDir, ".venv", "Scripts", "python.exe")
      : path.join(docTestDir, ".venv", "bin", "python");

    const publicDocsDir = path.join(serverDir, "public", "generated_docs");
    await fs.ensureDir(publicDocsDir);

    // 1. formData.json'ı güncelle
    const jsonPath = path.join(docTestDir, "formData.json");
    await fs.writeJson(jsonPath, formData, { spaces: 2 });

    // 2. Python'u başlat
    return await new Promise((resolve, reject) => {
      const pyProcess = spawn(venvPythonPath, ["run_all.py"], {
        cwd: docTestDir,
        env: { ...process.env },
      });

      let stderrData = "";

      pyProcess.stdout.on("data", (data) => {
        const lines = data.toString().split("\n");
        lines.forEach((line) => {
          if (line.startsWith("PROGRESS_JSON:")) {
            try {
              const jsonStr = line.replace("PROGRESS_JSON:", "").trim();
              const progressObj = JSON.parse(jsonStr);

              // Eğer dışarıdan bir progress callback verilmişse çalıştır
              if (typeof onProgressCallback === "function") {
                onProgressCallback(progressObj);
              }
            } catch (e) {
              // JSON parse hatası
            }
          }
        });
      });

      pyProcess.stderr.on("data", (data) => {
        stderrData += data.toString();
      });

      pyProcess.on("close", async (code) => {
        if (code !== 0) {
          return reject(new Error(`Python işlemi durdu (Kod ${code}): ${stderrData}`));
        }

        const docTestDocumentsDir = path.join(docTestDir, "Documents");

        try {
          const files = await fs.readdir(docTestDocumentsDir);
          const docxFiles = files.filter((f) => f.endsWith(".docx"));

          if (docxFiles.length === 0) {
            return reject(new Error("Üretilen .docx bulunamadı."));
          }

          docxFiles.sort((a, b) => {
            const statA = fs.statSync(path.join(docTestDocumentsDir, a));
            const statB = fs.statSync(path.join(docTestDocumentsDir, b));
            return statB.mtimeMs - statA.mtimeMs;
          });

          const latestFile = docxFiles[0];
          const srcPath = path.join(docTestDocumentsDir, latestFile);

          const offerNo = formData.customerInfo?.teklifNo || "Teklif";
          const uniqueFileName = `Teklif_${offerNo}_${Date.now()}.docx`;
          const destPath = path.join(publicDocsDir, uniqueFileName);

          await fs.copy(srcPath, destPath);

          resolve(`/generated_docs/${uniqueFileName}`);
        } catch (err) {
          reject(err);
        }
      });
    });
  } finally {
    isPythonBusy = false;
  }
};

module.exports = { runPythonDocGenerator };