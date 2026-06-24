import React, { useState, useMemo, useEffect } from "react";
import AddPutKullanici from "./KullaniciComponents/AddPutKullanici";
import API from "../utils/utilRequest"; // 🚀 Doğru CRUD servis dosyamıza bağladık
import { AnimatePresence } from "framer-motion";
import AlertModal from "./modals/AlertModal";

function KullanicilarPage() {
  // 💾 Verileri artık statik array yerine boş state olarak başlatıyoruz
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [rolFilter, setRolFilter] = useState("Hepsi");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  // 🌟 AlertModal kontrolü için state
  const [alertConfig, setAlertConfig] = useState({
    show: false,
    title: "",
    message: "",
    type: "success",
    showCancel: false, // İptal butonu olsun mu?
    action: null       // "Evet" denirse ne çalışsın?
  });

  // ==========================================
  // 🔍 1. VERİTABANINDAN KULLANICILARI ÇEKME
  // ==========================================
  const [errorMsg, setErrorMsg] = useState("");

  // 2. fetchUsers fonksiyonunu şu şekilde pürüzsüz hale getir:
  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg(""); // Yeni istek başlarken eski hatayı temizle
    try {
      // 🚀 autoAuth'un arka planda yenileme yapabilmesi için engelini kaldırıyoruz
      const response = await API.getUser();

      const formattedUsers = response.data.map(u => ({
        id: u.id,
        isim: u.isim,
        eposta: u.eposta,
        rol: u.rol,
        durum: u.durum,
        departman: u.departman || "Belirtilmemiş",
        sonGiris: u.sonGiris ? new Date(u.sonGiris).toLocaleString("tr-TR") : "Hiç giriş yapmadı"
      }));

      setUsers(formattedUsers);
    } catch (err) {
      console.error("Kullanıcı listesi çekilirken teknik hata oluştu:", err);
      // 🚨 ARTIK ALERT YOK! Akışı dondurmadan state'e yazıyoruz.
      setErrorMsg("Kullanıcı listesi yüklenemedi. Oturum doğrulanıyor olabilir...");
    } finally {
      setLoading(false);
    }
  };

  // Sayfa ilk ayağa kalktığında canlı verileri MySQL'den yükle
  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. SÜZDÜRMELER / FİLTRELEME
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        (u.isim && u.isim.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.eposta && u.eposta.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.departman && u.departman.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesRol = rolFilter === "Hepsi" || u.rol === rolFilter;
      return matchesSearch && matchesRol;
    });
  }, [users, searchQuery, rolFilter]);

  // 3. SAYFALAMA (PAGINATION) HESAPLAMALARI
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const displayedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  // PANELI AÇMA/KAPAMA AKSİYONLARI
  const openAddPanel = () => {
    setSelectedUser(null);
    setIsPanelOpen(true);
  };

  const openEditPanel = (user) => {
    setSelectedUser(user);
    setIsPanelOpen(true);
  };

  // ==========================================
  // 💾 4. GERÇEK ASENKRON EKLEME / GÜNCELLEME
  // ==========================================
  const handleSaveUser = async (incomingData) => {
    try {
      if (incomingData.id) {
        // 🔄 GERÇEK GÜNCELLEME (PUT)
        // Backend'in beklediği parametre şablonuna çeviriyoruz
        const updatePayload = {
          username: incomingData.isim,
          email: incomingData.eposta,
          role: incomingData.rol,
          status: incomingData.durum,
          department: incomingData.departman,
          password: incomingData.password || "" // Şifre girilmediyse boş gitsin (backend değiştirmez)
        };

        await API.putUser(incomingData.id, updatePayload);
      } else {
        // ➕ GERÇEK YENİ EKLEME (POST)
        const addPayload = {
          username: incomingData.isim,
          email: incomingData.eposta,
          password: incomingData.password, // AddPutKullanici panelinden gelen ham şifre
          role: incomingData.rol,
          department: incomingData.departman
        };

        await API.addUser(addPayload);
      }

      // İşlem başarılı olduktan sonra veritabanındaki en güncel durumu ekrana yansıt
      await fetchUsers();
      setIsPanelOpen(false);

    } catch (err) {
      console.error("Kullanıcı kaydedilirken hata oluştu:", err);
      // Oski alert satırını sil, yerine bunu ekle:
      setAlertConfig({
        show: true,
        title: "Hata",
        message: err.response?.data?.message,
        type: "error",
        showCancel: false,
        action: null
      });

    }
  };

  // ==========================================
  // ❌ 5. GERÇEK SİLME AKSİYONU (DELETE)
  // ==========================================
  const handleDelete = async (id) => {
    setAlertConfig({
      show: true,
      title: "Kullanıcıyı Sil",
      message: "Bu kullanıcıyı sistemden silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
      type: "warning",
      showCancel: true, // İptal butonu gözüksün
      action: async () => {
        // Kullanıcı "Evet, Eminim" dediğinde burası tetiklenir:
        try {
          // Modalı hemen kapat veya loading durumuna al, biz kapatıyoruz:
          setAlertConfig((prev) => ({ ...prev, show: false }));

          await API.deleteUser(id);

          // Silme onaylandıktan sonra state'i yerel olarak da temizle veya listeyi tazele
          setUsers((prev) => prev.filter((u) => u.id !== id));

          // İsteğe bağlı: Silindiğine dair tatlı bir başarı mesajı göstermek istersen:
          setAlertConfig({
            show: true,
            title: "Başarılı",
            message: "Kullanıcı sistemden başarıyla kaldırıldı.",
            type: "success",
            showCancel: false,
            action: null
          });

        } catch (err) {
          console.error("Silme işlemi sırasında hata oluştu:", err);

          // Hata durumunda hata modalı gösteriliyor
          setAlertConfig({
            show: true,
            title: "Kullanıcı Silinemedi",
            message: err?.response?.data?.message || "Silme işlemi sırasında teknik bir hata oluştu.",
            type: "error",
            showCancel: false,
            action: null
          });
        }
      }
    });
  };

  return (
    <div
      className="container-fluid pb-4 min-vh-100"
      style={{
        fontSize: "14px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#1a2d3a",
        paddingTop: window.innerWidth < 768 ? "75px" : "20px"
      }}
    >
      {/* ÜST BAŞLIK */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 pb-3 border-bottom gap-3" style={{ borderColor: "#334155" }}>
        <div>
          <h5 className="mb-1 fw-semibold tracking-tight" style={{ color: "#94a3b8" }}>
            <i className="bi bi-person-gear me-2" style={{ color: "#00874e" }}></i>Kullanıcılar ve Sistem Yetkileri
          </h5>
        </div>
      </div>

      {/* FİLTRELEME ALANI (SÜZDÜRMELER) */}
      <div className="card shadow-sm border-0 mb-4" style={{ backgroundColor: "transparent" }}>
        <div className="card-body m-0 p-0 border-0">
          <div className="row g-2 align-items-center">
            {/* Arama Barı */}
            <div className="col-12 col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text border-end-0 text-white-50" style={{ backgroundColor: "#0f172a", borderColor: "#334155" }}>
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control text-white border-start-0 custom-placeholder"
                  style={{ backgroundColor: "#0f172a", borderColor: "#334155", fontSize: "13px" }}
                  placeholder="İsim, e-posta veya departman ara..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>

            {/* Rol Filtresi */}
            <div className="col-12 col-md-3">
              <select
                className="form-select form-select-sm text-white"
                style={{ backgroundColor: "#0f172a", borderColor: "#334155", fontSize: "13px" }}
                value={rolFilter}
                onChange={(e) => { setRolFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="Hepsi" style={{ backgroundColor: "#0f172a" }}>Rol: Tümü</option>
                <option value="Admin" style={{ backgroundColor: "#0f172a" }}>Admin</option>
                <option value="Satış Temsilcisi" style={{ backgroundColor: "#0f172a" }}>Satış Temsilcisi</option>
                <option value="Yatırım Uzmanı" style={{ backgroundColor: "#0f172a" }}>Yatırım Uzmanı</option>
              </select>
            </div>

            {/* Toplam Sayısı */}
            <div className="col-12 col-md-2 d-flex align-items-center justify-content-start justify-content-md-end" style={{ fontSize: "12px", color: "#94a3b8" }}>
              Toplam: <span className="fw-semibold ms-1" style={{ color: "#f8fafc" }}>{filteredUsers.length} Kullanıcı</span>
            </div>

            {/* Yeni Kullanıcı Ekleme Butonu */}
            <div className="col-12 col-md-3 d-flex justify-content-start justify-content-md-end">
              <button
                onClick={openAddPanel}
                className="btn text-white px-3 py-2 shadow-sm border-0 d-flex align-items-center fw-medium w-md-auto justify-content-center"
                style={{ backgroundColor: "#00874e", fontSize: "13px", borderRadius: "6px", transition: "all 0.2s" }}
              >
                <i className="bi bi-person-plus me-1.5"></i> Yeni Kullanıcı Ekle
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Tablonun hemen üstüne yerleştirebilirsin */}
      {errorMsg && (
        <div className="alert alert-danger py-2 px-3 small border-0 mb-3 text-center rounded-3">
          <i className="bi bi-exfiltration me-2"></i>{errorMsg}
        </div>
      )}
      {/* KULLANICI LİSTESİ (TABLO) */}
      <div className="card shadow-sm border-0" style={{ borderRadius: "8px", overflow: "hidden", backgroundColor: "#1e293b" }}>
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0" style={{ fontSize: "13px", minWidth: "800px", backgroundColor: "#1e293b" }}>
            <thead className="text-muted border-bottom" style={{ fontSize: "11px", letterSpacing: "0.5px", borderColor: "#334155" }}>
              <tr>
                <th className="py-3 px-4 fw-semibold text-uppercase" style={{ color: "#94a3b8", backgroundColor: "#0f172a" }}>Kullanıcı Bilgisi</th>
                <th className="py-3 fw-semibold text-uppercase" style={{ color: "#94a3b8", backgroundColor: "#0f172a" }}>Departman</th>
                <th className="py-3 fw-semibold text-uppercase" style={{ color: "#94a3b8", backgroundColor: "#0f172a" }}>Erişim Rolü</th>
                <th className="py-3 fw-semibold text-uppercase text-center" style={{ color: "#94a3b8", backgroundColor: "#0f172a" }}>Durum</th>
                <th className="py-3 fw-semibold text-uppercase" style={{ color: "#94a3b8", backgroundColor: "#0f172a" }}>Son Giriş</th>
                <th className="py-3 fw-semibold text-uppercase text-end px-4" style={{ color: "#94a3b8", backgroundColor: "#0f172a" }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted" style={{ backgroundColor: "#1e293b" }}>
                    <div className="spinner-border spinner-border-sm me-2 text-success" role="status"></div>
                    Canlı veritabanı verileri yükleniyor...
                  </td>
                </tr>
              ) : displayedUsers.length > 0 ? (
                displayedUsers.map((user) => (
                  <tr key={user.id} style={{ borderColor: "#334155" }}>
                    <td className="px-4 py-3" style={{ backgroundColor: "#1e293b" }}>
                      <div className="fw-semibold" style={{ color: "#f8fafc" }}>{user.isim}</div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>{user.eposta}</div>
                    </td>
                    <td style={{ backgroundColor: "#1e293b" }}>
                      <div className="fw-medium" style={{ color: "#e2e8f0" }}>{user.departman}</div>
                    </td>
                    <td style={{ backgroundColor: "#1e293b" }}>
                      <span
                        className="badge px-2 py-1 fw-semibold"
                        style={user.rol === "Admin"
                          ? { backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)" }
                          : { backgroundColor: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.3)" }
                        }
                      >
                        {user.rol}
                      </span>
                    </td>
                    <td className="text-center" style={{ backgroundColor: "#1e293b" }}>
                      <span
                        className="badge px-2.5 py-1 fw-medium"
                        style={user.durum === "Aktif"
                          ? { backgroundColor: "rgba(34, 197, 94, 0.2)", color: "#4ade80" }
                          : { backgroundColor: "rgba(100, 116, 139, 0.2)", color: "#94a3b8" }
                        }
                      >
                        {user.durum}
                      </span>
                    </td>
                    <td style={{ backgroundColor: "#1e293b" }}>
                      <span className="badge border px-2 py-1 fw-normal" style={{ borderColor: "#475569", backgroundColor: "#0f172a", color: "#cbd5e1" }}>
                        <i className="bi bi-clock me-1" style={{ color: "#38bdf8" }}></i>{user.sonGiris}
                      </span>
                    </td>
                    <td className="text-end px-4" style={{ backgroundColor: "#1e293b" }}>
                      <div className="d-inline-flex gap-1">
                        <button
                          onClick={() => openEditPanel(user)}
                          className="btn btn-sm btn-link text-white p-1 text-decoration-none"
                          title="Düzenle / Bilgileri Güncelle"
                        >
                          <i className="bi bi-pencil" style={{ fontSize: "14px" }}></i>
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="btn btn-sm btn-link text-danger p-1 text-decoration-none"
                          title="Sil"
                        >
                          <i className="bi bi-trash" style={{ fontSize: "14px" }}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted" style={{ fontSize: "13px", color: "#94a3b8", backgroundColor: "#1e293b" }}>Aranan kriterlere uygun kullanıcı bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION (SAYFALAMA) */}
      {totalPages > 1 && (
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mt-3 px-1 gap-2" style={{ fontSize: "12px" }}>
          <div className="text-white text-center text-sm-start">Toplam {totalPages} sayfadan {currentPage}. sayfadasınız.</div>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link border-0 bg-transparent px-2"
                  style={{ color: "#94a3b8" }}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  <i className="bi bi-chevron-left" style={{ fontSize: "10px" }}></i>
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, idx) => (
                <li key={idx + 1} className={`page-item ${currentPage === idx + 1 ? "active" : ""}`}>
                  <button
                    className="page-link border-0 mx-0.5 rounded-circle text-center d-flex align-items-center justify-content-center"
                    style={currentPage === idx + 1
                      ? { backgroundColor: "#00874e", color: "white", width: "24px", height: "24px", padding: 0 }
                      : { color: "#cbd5e1", backgroundColor: "transparent", width: "24px", height: "24px", padding: 0 }
                    }
                    onClick={() => setCurrentPage(idx + 1)}
                  >
                    {idx + 1}
                  </button>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                <button
                  className="page-link border-0 bg-transparent px-2"
                  style={{ color: "#94a3b8" }}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  <i className="bi bi-chevron-right" style={{ fontSize: "10px" }}></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      <AlertModal
        show={alertConfig.show}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        showCancel={alertConfig.showCancel} // State ne derse o (true/false)
        onConfirm={alertConfig.action}     // Varsa fonksiyon çalışır, yoksa pas geçer
        onClose={() => setAlertConfig(prev => ({ ...prev, show: false }))}
      />

      {/* DIŞARIYA ALINAN EKLEME/DÜZENLEME PENCERESİ */}
      <AnimatePresence>
        {isPanelOpen && (
          <AddPutKullanici
            isOpen={isPanelOpen}
            onClose={() => setIsPanelOpen(false)}
            selectedUser={selectedUser}
            onSave={handleSaveUser}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default KullanicilarPage;