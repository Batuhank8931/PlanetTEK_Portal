// middleware/auth.js
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {
  // 🚀 SİHİRLİ DOKUNUŞ: app.js'teki cookieParser şifresine tam uyum için
  // hem signedCookies hem de normal cookies kontrolünü yapıyoruz.
  const token = req.signedCookies?.accessToken || req.cookies?.accessToken;

  // OWASP: Token yoksa direkt yetkisiz dön
  if (!token) {
    return res.status(401).json({ message: "Yetkisiz erişim. Oturum bulunamadı." });
  }

  try {
    // JWT Doğrulama (Algorithm: HS256)
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // id ve role bilgilerini istek nesnesine gömüyoruz
    next();
  } catch (error) {
    return res.status(401).json({ message: "Geçersiz veya süresi dolmuş token." });
  }
};

module.exports = verifyToken;