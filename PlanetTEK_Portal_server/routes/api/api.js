// routes/api/api.js
const express = require("express");
const router = express.Router();

const verifyToken = require("../../middleware/auth.js"); // Token kontrol middleware'in
const { getUser, addUser, putUser, deleteUser } = require("../../models/user_data.js");

// 👥 Kullanıcı CRUD Rotaları
router.get('/user', verifyToken, getUser);          // Tüm kullanıcıları listeleme / Tek kullanıcı çekme
router.post('/user', verifyToken, addUser);         // Yeni kullanıcı ekleme
router.put('/user/:id', verifyToken, putUser);      // ID bazlı kullanıcı güncelleme
router.delete('/user/:id', verifyToken, deleteUser); // ID bazlı kullanıcı silme (Güvenli Silme)

module.exports = router;