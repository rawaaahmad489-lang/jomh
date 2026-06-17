// src/pages/stores/StoresPage.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../../services/supabaseClient";
import { useCart } from "../../../../core/context/CartContext";

export default function StoresPage() {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const [stores, setStores]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [onlyVerified, setOnlyVerified] = useState(false);
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("stores")
        .select(`
          store_id, store_name, description, logo, hero_image, is_verified,
          vendor_profiles(business_name, address, phone),
          products(product_id, is_active)
        `)
        .order("store_name");
      setStores(data || []);
      setLoading(false);
    };
    fetchStores();
  }, []);

  const filtered = stores
    .filter(s => !onlyVerified || s.is_verified)
    .filter(s =>
      !search ||
      s.store_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div style={S.page} dir="rtl">
      <style>{CSS}</style>

      {/* ── شريط الإعلان ── */}
      <div style={S.announcementBar}>
        <span>🌸 توصيل مجاني لجميع المناطق على الطلبات فوق ₪500</span>
        <span style={{ margin: "0 24px", opacity: .4 }}>|</span>
        <span>✨ أكثر من {stores.length || 20} متجر معتمد بانتظارك</span>
      </div>

      {/* ── الناف بار ── */}
    <nav style={S.navbar}>
  <div style={S.navLogo} onClick={() => navigate("/boutique")}>
    Minimalist Care
  </div>

  {/* Overlay */}
  {mobileMenuOpen && (
    <div className="sp-nav-overlay" onClick={() => setMobileMenuOpen(false)} />
  )}

  <ul className={`sp-nav-links ${mobileMenuOpen ? "open" : ""}`} style={S.navLinks}>
    <button className="sp-nav-close" onClick={() => setMobileMenuOpen(false)}>
      <i className="fas fa-times" />
    </button>
    <li><button style={S.navLink} onClick={() => { navigate("/"); setMobileMenuOpen(false); }}>الرئيسية</button></li>
    <li><button style={S.navLink} onClick={() => { navigate("/stores"); setMobileMenuOpen(false); }}>المتاجر</button></li>
    <li><button style={S.navLink} onClick={() => { navigate("/boutique"); setMobileMenuOpen(false); }}>المجموعات</button></li>
  </ul>

  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    {cartCount > 0 && (
      <button className="sp-cart-btn" onClick={() => navigate("/cart")}>
        🛒 <span>{cartCount}</span>
      </button>
    )}
    {/* هامبرغر */}
    <button className="sp-hamburger" onClick={() => setMobileMenuOpen(true)}>
      <i className="fas fa-bars" />
    </button>
  </div>
</nav>

      {/* ── زر الرجوع ── */}
      <div style={S.breadcrumb}>
        <button style={S.backLink} onClick={() => navigate(-1)}>
          <i className="fas fa-chevron-right" style={{ fontSize: ".75rem" }} /> رجوع
        </button>
        <span style={S.breadSep}>/</span>
        <span style={S.breadCurrent}>المتاجر</span>
      </div>

      {/* ── HERO ── */}
      <section className="sp-hero">
        <div style={S.heroContent}>
          <div style={S.heroBadge}>🏪 تصفّحي متاجرنا</div>
          <h1 className="sp-hero-title">اكتشفي أفضل المتاجر المعتمدة</h1>
          <p className="sp-hero-sub">
            منتجات مختارة بعناية للأم والطفل، من متاجر موثّقة ومعتمدة لديكِ
          </p>
          <div style={S.heroSearch}>
            <i className="fas fa-search" style={{ color: "#9d8880", fontSize: ".9rem" }} />
            <input
              style={S.heroInput}
              placeholder="ابحثي عن متجر..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button style={S.clearSearch} onClick={() => setSearch("")}>✕</button>
            )}
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
            <button className="sp-pill-btn" onClick={() => navigate("/boutique")}>
              🛍️ تصفّح بالمجموعات
            </button>
            <button className="sp-pill-btn sp-pill-outline" onClick={() => navigate("/categories")}>
              🏷️ تصفّح بالتصنيفات
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div style={S.statsBar}>
        <div style={S.statItem}>
          <span style={S.statNum}>{stores.length}+</span>
          <span style={S.statLabel}>متجر معتمد</span>
        </div>
        <div style={S.statDivider} />
        <div style={S.statItem}>
          <span style={S.statNum}>100%</span>
          <span style={S.statLabel}>منتجات آمنة</span>
        </div>
        <div style={S.statDivider} />
        <div style={S.statItem}>
          <span style={S.statNum}>🚚</span>
          <span style={S.statLabel}>توصيل سريع</span>
        </div>
        
        <div style={S.statDivider} />
        <div style={S.statItem}>
          <span style={S.statNum}>↩️</span>
          <span style={S.statLabel}>إرجاع مضمون</span>
        </div>
      </div>

      <div style={S.container}>
        {/* ── Toolbar ── */}
        <div style={S.toolbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={S.resultCount}>{filtered.length} متجر</span>
            {search && (
              <span style={S.searchTag}>"{search}" <button style={S.tagClose} onClick={() => setSearch("")}>✕</button></span>
            )}
          </div>
          <label style={S.verifiedToggle}>
            <div
              className={`sp-toggle ${onlyVerified ? "on" : ""}`}
              onClick={() => setOnlyVerified(!onlyVerified)}>
              <div className="sp-toggle-thumb" />
            </div>
            <i className="fas fa-check-circle" style={{ color: "#1a6b5c", fontSize: ".8rem" }} />
            متاجر موثّقة فقط
          </label>
        </div>

        {/* ── GRID ── */}
        {loading ? (
          <div style={S.loadingWrap}>
            <div className="sp-spinner" />
            <p style={{ color: "#aaa", marginTop: 14 }}>جارٍ تحميل المتاجر...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={S.empty}>
            <span style={{ fontSize: "3.5rem" }}>🔍</span>
            <p style={{ fontWeight: 700, color: "#5D544F" }}>لا توجد متاجر مطابقة</p>
            <button className="sp-pill-btn" onClick={() => { setSearch(""); setOnlyVerified(false); }}>
              عرض جميع المتاجر
            </button>
          </div>
        ) : (
          <div style={S.grid}>
            {filtered.map((store, idx) => {
              const activeProducts = store.products?.filter(p => p.is_active).length || 0;
              return (
                <div
                  key={store.store_id}
                  className="sp-store-card"
                  style={{ animationDelay: `${idx * 0.06}s` }}
                  onClick={() => navigate(`/stores/${store.store_id}`)}>

                  {/* صورة الغلاف */}
                  <div style={S.storeImgWrap}>
                    {store.logo
                      ? <img src={store.logo} alt={store.store_name} style={S.storeLogo} />
                      : <div style={S.storeLogoPlaceholder}>🏪</div>}

                    {/* طبقة تدرج لونية */}
                    <div style={S.storeImgOverlay} />

                    {store.is_verified && (
                      <span style={S.verifiedBadge}>
                        <i className="fas fa-check-circle" /> موثّق
                      </span>
                    )}

                    {/* عدد المنتجات */}
                    <span style={S.productCountBadge}>
                      {activeProducts} منتج
                    </span>
                  </div>

                  <div style={{ padding: "16px 18px 18px" }}>
                    <h3 style={S.storeName}>{store.store_name}</h3>

                    {store.vendor_profiles?.address && (
                      <div style={S.storeAddress}>
                        <i className="fas fa-map-marker-alt" style={{ color: "#D6A3B0" }} />
                        {store.vendor_profiles.address}
                      </div>
                    )}

                    <p style={S.storeDesc}>
                      {store.description?.slice(0, 90) || "متجر متخصص في منتجات الأم والطفل"}
                      {(store.description?.length || 0) > 90 ? "..." : ""}
                    </p>

                    <button className="sp-visit-btn">
                      تصفّح المتجر <i className="fas fa-arrow-left" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer style={S.footer}>
        <div style={S.footerInner}>
          <div style={S.footerLogo}>Minimalist Care</div>
          <p style={S.footerTagline}>رحلة أمومة أكثر هدوءاً 🌸</p>
          <div style={S.footerLinks}>
            <button style={S.footerLink} onClick={() => navigate("/boutique")}>الرئيسية</button>
            <button style={S.footerLink} onClick={() => navigate("/stores")}>المتاجر</button>
            <button style={S.footerLink} onClick={() => navigate("/cart")}>السلة</button>
          </div>
          <p style={S.footerCopy}>© 2025 Minimalist Care. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const S = {
  page:        { background: "#F8F1EA", minHeight: "100vh", fontFamily: "'Cairo','Tajawal',sans-serif", color: "#2d2825" },

  // Announcement bar
  announcementBar: {
    background: "linear-gradient(90deg, #D6A3B0, #c27a8c, #D6A3B0)",
    backgroundSize: "200% 100%",
    animation: "shimmer 3s linear infinite",
    color: "#fff", textAlign: "center",
    padding: "9px 16px", fontSize: ".8rem", fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexWrap: "wrap", gap: 4,
  },

  // Navbar
  navbar: {
    background: "rgba(247,237,226,.96)", backdropFilter: "blur(12px)",
    borderBottom: "1px solid #EADED3", padding: "0 32px",
    height: 64, display: "flex", alignItems: "center",
    justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100,
    fontFamily: "'Cairo','Tajawal',sans-serif",
  },
  navLogo: {
    fontFamily: "'Georgia',serif", fontStyle: "italic",
    fontSize: "1.25rem", color: "#8C746A", fontWeight: 700,
    cursor: "pointer", letterSpacing: ".5px",
  },
  navLinks: {
    display: "flex", listStyle: "none", gap: 4, margin: 0, padding: 0,
  },
  navLink: {
    background: "none", border: "none", color: "#7d6a63",
    fontFamily: "'Cairo'", fontWeight: 600, fontSize: ".88rem",
    cursor: "pointer", padding: "8px 14px", borderRadius: 20, transition: ".2s",
  },

  // Breadcrumb
  breadcrumb: {
    maxWidth: 1200, margin: "0 auto", padding: "12px 24px",
    display: "flex", alignItems: "center", gap: 8, fontSize: ".8rem",
  },
  backLink: {
    background: "none", border: "none", color: "#9d8880",
    cursor: "pointer", fontFamily: "'Cairo'", fontWeight: 700,
    display: "flex", alignItems: "center", gap: 5, padding: 0,
  },
  breadSep: { color: "#ccc" },
  breadCurrent: { color: "#D6A3B0", fontWeight: 700 },

  // Hero
  heroContent: { maxWidth: 680, margin: "0 auto", textAlign: "center" },
  heroBadge: {
    display: "inline-block", background: "rgba(255,255,255,.3)",
    color: "#fff", fontWeight: 700, fontSize: ".8rem",
    padding: "5px 16px", borderRadius: 20, marginBottom: 14,
    backdropFilter: "blur(4px)",
  },
  heroSearch: {
    background: "rgba(255,255,255,.95)", borderRadius: 50,
    padding: "13px 22px", display: "flex", alignItems: "center",
    gap: 12, maxWidth: 460, margin: "24px auto 0",
    boxShadow: "0 8px 30px rgba(0,0,0,.12)",
  },
  heroInput: {
    border: "none", background: "transparent", outline: "none",
    flex: 1, fontFamily: "'Cairo'", fontSize: ".92rem", color: "#2d2825",
  },
  clearSearch: {
    background: "none", border: "none", color: "#aaa",
    cursor: "pointer", fontSize: ".85rem", padding: 2,
  },

  // Stats bar
  statsBar: {
    background: "#fff", borderBottom: "1px solid #F0E6DD",
    display: "flex", justifyContent: "center", alignItems: "center",
    padding: "16px 24px", gap: 0, flexWrap: "wrap",
  },
  statItem: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "0 28px", gap: 2,
  },
  statNum: { fontSize: "1.2rem", fontWeight: 900, color: "#2d2825" },
  statLabel: { fontSize: ".72rem", color: "#9d8880", fontWeight: 600 },
  statDivider: { width: 1, height: 36, background: "#F0E6DD" },

  // Container
  container: { maxWidth: 1200, margin: "0 auto", padding: "28px 24px" },

  // Toolbar
  toolbar: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 24, flexWrap: "wrap", gap: 12,
  },
  resultCount: { fontWeight: 800, color: "#2d2825", fontSize: ".95rem" },
  searchTag: {
    background: "#fdf2f5", color: "#D6A3B0", fontWeight: 700,
    fontSize: ".78rem", padding: "4px 10px", borderRadius: 20,
    display: "inline-flex", alignItems: "center", gap: 6,
  },
  tagClose: {
    background: "none", border: "none", cursor: "pointer",
    color: "#D6A3B0", fontSize: ".75rem", padding: 0, lineHeight: 1,
  },
  verifiedToggle: {
    display: "flex", alignItems: "center", gap: 8,
    cursor: "pointer", fontSize: ".85rem", fontWeight: 700, color: "#5D544F",
  },

  // Grid
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))",
    gap: 24,
  },

  // Store card
  storeImgWrap: {
    height: 170, background: "#f0ebe4",
    position: "relative", overflow: "hidden",
    borderRadius: "16px 16px 0 0",
  },
  storeLogo: { width: "100%", height: "100%", objectFit: "cover", transition: ".5s" },
  storeLogoPlaceholder: {
    width: "100%", height: "100%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "3.5rem",
  },
  storeImgOverlay: {
    position: "absolute", inset: 0,
    background: "linear-gradient(to top, rgba(0,0,0,.3) 0%, transparent 60%)",
  },
  verifiedBadge: {
    position: "absolute", top: 10, right: 10,
    background: "#e8f5f2", color: "#1a6b5c",
    fontSize: ".72rem", fontWeight: 700,
    padding: "4px 10px", borderRadius: 20,
    display: "flex", alignItems: "center", gap: 4,
  },
  productCountBadge: {
    position: "absolute", bottom: 10, left: 10,
    background: "rgba(255,255,255,.9)",
    color: "#5D544F", fontSize: ".7rem", fontWeight: 700,
    padding: "3px 9px", borderRadius: 20,
  },
  storeName: { fontWeight: 800, fontSize: "1.05rem", color: "#2d2825", marginBottom: 4 },
  storeAddress: {
    fontSize: ".76rem", color: "#9d8880",
    display: "flex", alignItems: "center", gap: 5, marginBottom: 6,
  },
  storeDesc: {
    fontSize: ".82rem", color: "#9d8880",
    lineHeight: 1.65, marginBottom: 14,
  },

  // Loading/empty
  loadingWrap: {
    textAlign: "center", padding: "80px 20px",
    display: "flex", flexDirection: "column", alignItems: "center",
  },
  empty: {
    textAlign: "center", padding: "80px 20px",
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 16,
  },

  // Footer
  footer: {
    background: "#1a2e2a", color: "#a9c5be",
    marginTop: 60, padding: "40px 24px 28px",
  },
  footerInner: { maxWidth: 600, margin: "0 auto", textAlign: "center" },
  footerLogo: {
    fontFamily: "'Georgia',serif", fontStyle: "italic",
    fontSize: "1.5rem", color: "#8fcfc0", marginBottom: 6,
  },
  footerTagline: { fontSize: ".87rem", marginBottom: 20, opacity: .8 },
  footerLinks: { display: "flex", justifyContent: "center", gap: 6, marginBottom: 20, flexWrap: "wrap" },
  footerLink: {
    background: "none", border: "none", color: "#8fcfc0",
    fontFamily: "'Cairo'", fontWeight: 600, fontSize: ".83rem",
    cursor: "pointer", padding: "4px 12px",
  },
  footerCopy: { fontSize: ".74rem", opacity: .5 },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

/* Hero */



.sp-hero {
  background-image:
  linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)), 
    url('/assets/store/hero-image.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  position: relative;
}
.sp-hero-title {
  color: #fff;
  font-size: 2.4rem;
  font-weight: 900;
  text-shadow: 0 2px 16px rgba(0,0,0,.35);
  margin-bottom: 10px;
  line-height: 1.3;
}
.sp-hero-sub {
  color: rgba(255,255,255,.85);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.6;
}

/* Toggle */
.sp-toggle {
  width:42px; height:24px; border-radius:12px;
  background:#ddd; position:relative; cursor:pointer;
  transition:.3s; flex-shrink:0;
}
.sp-toggle.on { background:#1a6b5c; }
.sp-toggle-thumb {
  position:absolute; top:3px; right:3px;
  width:18px; height:18px; border-radius:50%;
  background:#fff; transition:.3s;
  box-shadow:0 1px 4px rgba(0,0,0,.2);
}
.sp-toggle.on .sp-toggle-thumb { right:calc(100% - 21px); }

/* Store card */
.sp-store-card {
  background:#fff; border-radius:18px;
  border:1px solid #F0E6DD; cursor:pointer;
  transition:.35s; overflow:hidden;
  animation:fadeUp .5s ease forwards;
  opacity:0;
}
.sp-store-card:hover {
  transform:translateY(-6px);
  box-shadow:0 14px 36px rgba(214,163,176,.22);
  border-color:#D6A3B0;
}
.sp-store-card:hover img { transform:scale(1.06); }

/* Visit button */
.sp-visit-btn {
  width:100%; background:#D6A3B0; color:#fff; border:none;
  padding:11px 0; border-radius:25px; cursor:pointer;
  font-family:'Cairo'; font-weight:700; font-size:.87rem;
  display:flex; align-items:center; justify-content:center; gap:8px;
  transition:.3s;
}
.sp-visit-btn:hover { background:#c27a8c; }

/* Pill buttons */
.sp-pill-btn {
  background:rgba(255,255,255,.25); color:#fff;
  border:1.5px solid rgba(255,255,255,.5);
  padding:9px 20px; border-radius:25px; cursor:pointer;
  font-family:'Cairo'; font-weight:700; font-size:.85rem;
  backdrop-filter:blur(4px); transition:.3s;
}
.sp-pill-btn:hover { background:rgba(255,255,255,.35); }
.sp-pill-outline {
  background:transparent;
  border-color:rgba(255,255,255,.4);
}

/* Cart button */
.sp-cart-btn {
  background:#D6A3B0; color:#fff; border:none;
  padding:8px 18px; border-radius:25px; cursor:pointer;
  font-family:'Cairo'; font-weight:700; font-size:.85rem;
  display:flex; align-items:center; gap:8px; transition:.3s;
}
.sp-cart-btn:hover { background:#c27a8c; }
.sp-cart-btn span {
  background:rgba(255,255,255,.3); border-radius:50%;
  width:20px; height:20px; display:flex;
  align-items:center; justify-content:center; font-size:.75rem;
}

/* Spinner */
.sp-spinner {
  width:40px; height:40px; border-radius:50%;
  border:4px solid #F0E6DD; border-top-color:#D6A3B0;
  animation:spin .8s linear infinite;
}

/* Responsive */
@media(max-width:768px) {
  .sp-hero { background-attachment:scroll; }
  .sp-hero-title { font-size:1.7rem; }
}
.sp-hamburger {
  display: none;
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  color: #7d6a63;
  padding: 8px;
}

.sp-nav-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.35);
  z-index: 99;
}

.sp-nav-close {
  display: none;
  position: absolute;
  top: 16px;
  left: 16px;
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  color: #8C746A;
}

@media(max-width:768px) {
  .sp-hamburger { display: flex; align-items: center; }

  .sp-nav-links {
    position: fixed !important;
    top: 0; right: 0; bottom: 0;
    width: 260px;
    height :250px;
    background: rgba(247,237,226,.98) !important;
    backdrop-filter: blur(12px);
    flex-direction: column !important;
    padding: 70px 16px 30px !important;
    gap: 4px !important;
    z-index: 100;
    box-shadow: -4px 0 20px rgba(0,0,0,.12);
    display: none !important;
  }

  .sp-nav-links.open { display: flex !important; }
  .sp-nav-close { display: flex; }
}
`;