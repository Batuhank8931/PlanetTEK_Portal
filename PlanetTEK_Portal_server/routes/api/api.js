// routes/api/api.js
const express = require("express");
const router = express.Router();

const verifyToken = require("../../middleware/auth.js"); // Token kontrol middleware'in

// Modüllerden fonksiyonların dahil edilmesi
const { getUser, addUser, putUser, deleteUser } = require("../../models/user_data.js");
const {
    getMainUnits,
    getScreenData,
    getLamellaData,
    getStainlessSteelData,
    getFlowDistribution,
    getUnitLaborCosts,
    updatePriceData,
    getFiltrationCosts,
    getSubmersibleCosts,
    getSludgeDewateringCosts
} = require("../../models/price_data.js");

// 🚀 Parametre fonksiyonlarını buraya dahil ediyoruz (İsim hatasını önlemek için getParamteters ve updateParametersData olarak çekildi)
const { getParamteters, updateParametersData } = require("../../models/parameters_data.js");

// 📊 Pompa Eğrisi (Pump Curve) fonksiyonlarını dahil ediyoruz
const { getPumpCurve, updatePumpCurve } = require("../../models/pump_curve_data.js"); // <--- Dosya yolunu kendi yapına göre revize edebilirsin

// ==========================================
// 👥 KULLANICI CRUD ROTALARI
// ==========================================
router.get('/user', verifyToken, getUser);          // Tüm kullanıcıları listeleme / Tek kullanıcı çekme
router.post('/user', verifyToken, addUser);         // Yeni kullanıcı ekleme
router.put('/user/:id', verifyToken, putUser);      // ID bazlı kullanıcı güncelleme
router.delete('/user/:id', verifyToken, deleteUser); // ID bazlı kullanıcı silme (Güvenli Silme)


// ==========================================
// 💰 FİYAT VE PARAMETRE (PRICE DATA) ROTALARI
// ==========================================

// 🔍 6 Adet GET İsteği (Tablolardaki verileri listelemek için)
router.get('/price/main-units', verifyToken, getMainUnits);
router.get('/price/screen-data', verifyToken, getScreenData);
router.get('/price/lamella-data', verifyToken, getLamellaData);
router.get('/price/stainless-steel', verifyToken, getStainlessSteelData);
router.get('/price/flow-distribution', verifyToken, getFlowDistribution);
router.get('/price/unit-labor-costs', verifyToken, getUnitLaborCosts);
router.get('/price/submersible-pumps-costs', verifyToken, getSubmersibleCosts);
router.get('/price/filtration-costs', verifyToken, getFiltrationCosts);
router.get('/price/sludge-dewatering-costs', verifyToken, getSludgeDewateringCosts);

// 📈 Pompa Eğrisi (Pump Curve) Rotaları
router.get('/price/pump-curve/:pump_id', verifyToken, getPumpCurve);       // Belirli bir pompanın eğrisini getirir
router.put('/price/pump-curve/:pump_id', verifyToken, updatePumpCurve);    // Belirli bir pompanın eğrisini günceller

// 🔄 1 Adet Dinamik POST İsteği (Tüm tablolardaki fiyat/parametre güncellemeleri için)
router.post('/price/update', verifyToken, updatePriceData);


router.get('/parameters', verifyToken, getParamteters);
router.post('/parameters/update', verifyToken, updateParametersData);



module.exports = router;