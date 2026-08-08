const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

// 🚀 1. ADIM: Yeni API Rota dosyamızı içeri alıyoruz
const authRouter = require("./routes/auth/auth.js");
const apiRouter = require("./routes/api/api.js"); // 👥 CRUD rotalarının olduğu dosya

const app = express();

app.set("trust proxy", 1);
app.use(helmet());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/auth/login", loginLimiter);

// app.js - CORS Bölümü Güncellemesi

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://192.168.1.109:5173"]; // Fallback lokal adreslerin

app.use(cors({
  origin: function (origin, callback) {
    // Sunucudan sunucuya atılan isteklerde veya postman/insomnia testlerinde origin null gelebilir
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === "development") {
      callback(null, true);
    } else {
      callback(new Error("CORS Engeli: Bu köken üzerinden erişim izni verilmiyor."));
    }
  },
  credentials: true // 🍪 Çerezlerin (HttpOnly tokens) gitmesi/gelmesi için ŞART!
}));

app.use(express.json({ limit: '1000kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb', parameterLimit: 100 }));

if (!process.env.COOKIE_SECRET) {
  throw new Error("KRİTİK HATA: COOKIE_SECRET ortam değişkeni tanımlanmamış!");
}
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(logger("combined"));

// ==========================================
// 🔌 YÖNLENDİRİCİLER (ROUTERS)
// ==========================================
app.use("/auth", authRouter);
app.use("/api", apiRouter); // 🚀 2. ADIM: api/user istekleri için kapıyı açtık!

// Global Hata Yakalayıcı
app.use((err, req, res, next) => {
  console.error(`[SİSTEM HATASI - ${new Date().toISOString()}]:`, err.stack);
  res.status(500).json({ message: "Sistemsel bir hata oluştu." });
});

module.exports = app;