// routes/api/api.js
const express = require("express");
const router = express.Router();

const verifyToken = require("../../middleware/auth.js"); // Token kontrol middleware'i

// 💰 Fiyat Yönetim Modülü (Fiyat ve Maliyet Kontrolleri)
// updatePriceData artık işi kendi içinde tablo bazlı alt uzman metotlara dağıtan merkezi orkestra şefidir.
const {
    getMainUnits,
    getScreenData, // 👈 Artık grease_trap_data, coarse_screen_data ve fine_screen_data'yı toplu paket dönüyor
    getLamellaData,
    getStainlessSteelData,
    getFlowDistribution,
    getUnitLaborCosts,
    updatePriceData, // 👈 İçeride modüler metotlara (updateAddDeleteMainUnits vb.) bölünen ana şefimiz
    getFiltrationCosts,
    getSubmersibleCosts,
    getSludgeDewateringCosts,
    getIlerAritmaEquipmentsCosts,
    getMembraneCosts
} = require("../../models/price_data.js");

// 👥 Kullanıcı CRUD Kontrolleri
const { getUser, addUser, putUser, deleteUser } = require("../../models/user_data.js");

// 🚀 Parametre Kontrolleri
const { getParamteters, updateParametersData } = require("../../models/parameters_data.js");

// 📊 Pompa Eğrisi (Pump Curve) Kontrolleri
const { getPumpCurve, updatePumpCurve, getAllPumpCurves, getCentrifugePumps } = require("../../models/pump_curve_data.js");


// ==========================================
// 👥 KULLANICI CRUD ROTALARI
// ==========================================
router.get('/user', verifyToken, getUser);
router.post('/user', verifyToken, addUser);
router.put('/user/:id', verifyToken, putUser);
router.delete('/user/:id', verifyToken, deleteUser);


// ==========================================
// 💰 FİYAT VE PARAMETRE (PRICE DATA) ROTALARI
// ==========================================

// 🔍 GET İSTEKLERİ (Fiyat listeleme ekranları ve dropdown besleyiciler için)
router.get('/price/main-units', verifyToken, getMainUnits);
router.get('/price/screen-data', verifyToken, getScreenData); // 👈 Frontend'deki 3 ExcelGrid'i tek seferde besler
router.get('/price/lamella-data', verifyToken, getLamellaData);
router.get('/price/stainless-steel', verifyToken, getStainlessSteelData);
router.get('/price/flow-distribution', verifyToken, getFlowDistribution);
router.get('/price/unit-labor-costs', verifyToken, getUnitLaborCosts);
router.get('/price/submersible-pumps-costs', verifyToken, getSubmersibleCosts);
router.get('/price/filtration-costs', verifyToken, getFiltrationCosts);
router.get('/price/sludge-dewatering-costs', verifyToken, getSludgeDewateringCosts);
router.get('/price/ileri-aritma-costs', verifyToken, getIlerAritmaEquipmentsCosts);
router.get('/price/membrane-costs', verifyToken, getMembraneCosts);

// 📊 POMPA EĞRİSİ (PUMP CURVE) ROTALARI
router.get('/price/pump-curve/:pump_id', verifyToken, getPumpCurve);
router.put('/price/pump-curve/:pump_id', verifyToken, updatePumpCurve);
router.get('/price/pumps-with-curves', verifyToken, getAllPumpCurves);
router.get('/price/centrifuge-pumps', verifyToken, getCentrifugePumps);

// 🔄 MERKEZİ DİNAMİK YAZMA/GÜNCELLEME/SİLME ENDPOINT'İ
// Bu rota gelen istekteki `tableName` parametresine göre arka planda ilgili "updateAddDelete..." alt fonksiyonunu tetikler.
router.post('/price/update', verifyToken, updatePriceData);


// ==========================================
// ⚙️ GLOBAL PARAMETRE ROTALARI
// ==========================================
router.get('/parameters', verifyToken, getParamteters);
router.post('/parameters/update', verifyToken, updateParametersData);


module.exports = router;