
// src/pages/stores/CategoriesPage.jsx

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../../../services/supabaseClient";
import { useCart } from "../../../../core/context/CartContext";

// أيقونة لكل فئة حسب الاسم
const CAT_ICONS = {
  "ملابس":       "👗",
  "أدوية":       "💊",
  "عناية":       "🧴",
  "ألعاب":       "🧸",
  "غذاء":        "🍼",
  "أمان":        "🛡️",
  "نوم":         "😴",
  "تعليم":       "📚",
  "رياضة":       "🏃",
  "default":     "🛍️",
};
const getIcon = (name = "") => {
  const key = Object.keys(CAT_ICONS).find(k => name.includes(k));
  return key ? CAT_ICONS[key] : CAT_ICONS.default;
};

export default function CategoriesPage() {
  const navigate = useNavigate();
  // optional: open category directly via URL /categories/:categoryId
  const { categoryId: urlCategoryId } = useParams();

  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(urlCategoryId || null);
  const [products, setProducts]     = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [prodLoading, setProdLoading] = useState(false);
  const [search, setSearch]         = useState("");
  const [sortBy, setSortBy]         = useState("default");
  const [addedIds, setAddedIds]     = useState(new Set());
  const { addToCart }               = useCart();

  // Load categories
  useEffect(() => {
    const load = async () => {
      setCatLoading(true);
      const { data } = await supabase
        .from("product_categories")
        .select("*, products(product_id, is_active)");
      setCategories(data || []);
      setCatLoading(false);
      // If URL has categoryId, auto-load
      if (urlCategoryId) loadProducts(urlCategoryId);
    };
    load();
  }, []);

  // Load products for a category
  const loadProducts = useCallback(async (catId) => {
    setProdLoading(true);
    setActiveCategory(catId);
    setSearch("");
    const { data } = await supabase
      .from("products")
      .select(`
        *,
        product_categories(name),
        stores(store_id, store_name, logo, is_verified)
      `)
      .eq("category_id", catId)
      .eq("is_active", true)
      .gt("stock", 0)
      .order("price");
    setProducts(data || []);
    setProdLoading(false);
  }, []);

  const handleAddToCart = useCallback(async (product) => {
    await addToCart(product.product_id);
    setAddedIds(prev => new Set(prev).add(product.product_id));
    setTimeout(() => {
      setAddedIds(prev => {
        const n = new Set(prev);
        n.delete(product.product_id);
        return n;
      });
    }, 2000);
  }, [addToCart]);

  const activeCat = categories.find(c => c.category_id === activeCategory);

  let visible = products.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.stores?.store_name?.toLowerCase().includes(search.toLowerCase())
  );
  if (sortBy === "price_asc")  visible = [...visible].sort((a, b) => a.price - b.price);
  if (sortBy === "price_desc") visible = [...visible].sort((a, b) => b.price - a.price);
  if (sortBy === "store")      visible = [...visible].sort((a, b) => (a.stores?.store_name || "").localeCompare(b.stores?.store_name || ""));

  return (
    <div dir="rtl" style={S.page}>
      <style>{CSS}</style>

      {/* ── HERO ── */}
      <section style={S.hero}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <h1 style={S.heroTitle}>
            {activeCategory && activeCat
              ? <>{getIcon(activeCat.name)} {activeCat.name}</>
              : <>🏷️ تصفّحي حسب التصنيف</>}
          </h1>
          <p style={S.heroSub}>
            {activeCategory
              ? `عرض جميع منتجات "${activeCat?.name}" من كافة المتاجر`
              : "اختاري تصنيفاً لعرض جميع المنتجات المتاحة من كل المتاجر"}
          </p>
        </div>
      </section>

      <div style={S.container}>

        {/* ── CATEGORIES GRID ── */}
        {catLoading ? (
          <div style={S.loadingWrap}><div style={S.spinner} /></div>
        ) : (
          <div style={S.catGrid}>
            {categories.map(cat => {
              const activeCount = cat.products?.filter(p => p.is_active).length || 0;
              const isActive = activeCategory === cat.category_id;
              return (
                <button
                  key={cat.category_id}
                  className={`cat-big-btn ${isActive ? "active" : ""}`}
                  onClick={() => loadProducts(cat.category_id)}>
                  <span style={{ fontSize: "2rem", display: "block", marginBottom: 8 }}>
                    {getIcon(cat.name)}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: ".88rem" }}>{cat.name}</span>
                  <span style={S.catProductCount}>{activeCount} منتج</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── PRODUCTS SECTION ── */}
        {activeCategory && (
          <div style={{ marginTop: 36 }}>
            {/* Section header */}
            <div style={S.sectionHeader}>
              <div>
                <h2 style={S.sectionTitle}>
                  {getIcon(activeCat?.name)} {activeCat?.name}
                  <span style={S.sectionCount}>{visible.length} منتج</span>
                </h2>
                <p style={S.sectionSub}>من كافة المتاجر المعتمدة</p>
              </div>
              <button style={S.clearBtn} onClick={() => { setActiveCategory(null); setProducts([]); }}>
                <i className="fas fa-times" /> إغلاق
              </button>
            </div>

            {/* Toolbar */}
            <div style={S.toolbar}>
              <div style={S.searchBar}>
                <i className="fas fa-search" style={{ color: "#ccc" }} />
                <input
                  placeholder="ابحثي في المنتجات أو المتاجر..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={S.searchInput}
                />
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={S.sortSelect}>
                <option value="default">الترتيب الافتراضي</option>
                <option value="price_asc">السعر: الأقل أولاً</option>
                <option value="price_desc">السعر: الأعلى أولاً</option>
                <option value="store">حسب المتجر</option>
              </select>
            </div>

            {prodLoading ? (
              <div style={S.loadingWrap}><div style={S.spinner} /><p>جارٍ تحميل المنتجات...</p></div>
            ) : visible.length === 0 ? (
              <div style={S.empty}><span>📦</span><p>لا توجد منتجات</p></div>
            ) : (
              <div style={S.productsGrid}>
                {visible.map(product => {
                  const added = addedIds.has(product.product_id);
                  return (
                    <div key={product.product_id} className="cat-product-card">
                      {/* Product Image */}
                      <div style={S.productImgWrap}>
                        {product.image_url
                          ? <img src={product.image_url} alt={product.name} style={S.productImg} />
                          : <div style={S.imgPlaceholder}>{getIcon(activeCat?.name)}</div>}
                        {product.stock < 5 && (
                          <span style={S.lowStock}>آخر {product.stock}</span>
                        )}
                      </div>

                      <div style={{ padding: "12px 14px 14px" }}>
                        {/* Store chip — clickable */}
                        <div
                          style={S.storeChip}
                          onClick={() => navigate(`/stores/${product.stores?.store_id}`)}>
                          {product.stores?.logo
                            ? <img src={product.stores.logo} alt="" style={S.storeChipLogo} />
                            : <span>🏪</span>}
                          {product.stores?.store_name}
                          {product.stores?.is_verified && (
                            <i className="fas fa-check-circle" style={{ color: "#1a6b5c", fontSize: ".7rem" }} />
                          )}
                        </div>

                        <h3 style={S.productName}>{product.name}</h3>
                        {product.description && (
                          <p style={S.productDesc}>
                            {product.description.slice(0, 55)}{product.description.length > 55 ? "..." : ""}
                          </p>
                        )}

                        <div style={S.productFooter}>
                          <span style={S.price}>₪ {product.price}</span>
                          <button
                            className={`cat-add-btn ${added ? "added" : ""}`}
                            onClick={() => handleAddToCart(product)}>
                            {added
                              ? <><i className="fas fa-check" /> أضيف!</>
                              : <><i className="fas fa-shopping-cart" /> سلة</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ──
const S = {
  page:      { background: "#F8F1EA", minHeight: "100vh", fontFamily: "'Cairo','Tajawal',sans-serif" },
  hero:      { background: "linear-gradient(135deg,#D6A3B0,#e8c4cd)", padding: "50px 24px 44px" },
  heroTitle: { color: "#fff", fontWeight: 900, fontSize: "1.9rem", marginBottom: 8, textShadow: "0 2px 10px rgba(0,0,0,.15)" },
  heroSub:   { color: "rgba(255,255,255,.85)", fontSize: ".95rem", fontWeight: 600 },
  container: { maxWidth: 1200, margin: "0 auto", padding: "32px 24px" },
  catGrid:   { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 14 },
  catProductCount:{ display: "block", fontSize: ".72rem", color: "#888", marginTop: 4 },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 },
  sectionTitle:  { fontWeight: 900, fontSize: "1.3rem", color: "#2d2825", display: "flex", alignItems: "center", gap: 10 },
  sectionCount:  { background: "#F0E6DD", color: "#8C746A", fontSize: ".78rem", fontWeight: 700, padding: "3px 12px", borderRadius: 20 },
  sectionSub:    { fontSize: ".82rem", color: "#aaa", marginTop: 3 },
  clearBtn:  { background: "#fff", border: "1px solid #F0E6DD", color: "#888", padding: "8px 16px", borderRadius: 20, cursor: "pointer", fontFamily: "'Cairo'", fontWeight: 700, fontSize: ".82rem", display: "inline-flex", alignItems: "center", gap: 6 },
  toolbar:   { display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap", alignItems: "center" },
  searchBar: { background: "#fff", borderRadius: 50, padding: "9px 16px", display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 200, border: "1px solid #F0E6DD" },
  searchInput:{ border: "none", background: "transparent", outline: "none", fontFamily: "'Cairo'", fontSize: ".88rem", width: "100%" },
  sortSelect:{ padding: "9px 14px", borderRadius: 12, border: "1px solid #F0E6DD", background: "#fff", fontFamily: "'Cairo'", fontSize: ".83rem", outline: "none", cursor: "pointer" },
  productsGrid:{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 18 },
  productImgWrap:{ height: 170, overflow: "hidden", position: "relative", background: "#f5f0ea", borderRadius: "14px 14px 0 0" },
  productImg:{ width: "100%", height: "100%", objectFit: "cover", transition: ".4s" },
  imgPlaceholder:{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" },
  lowStock:  { position: "absolute", top: 8, right: 8, background: "#fff8f0", color: "#f39c12", fontSize: ".68rem", fontWeight: 700, padding: "3px 8px", borderRadius: 20 },
  storeChip: { display: "inline-flex", alignItems: "center", gap: 5, background: "#f0ebe4", color: "#8C746A", fontSize: ".72rem", fontWeight: 700, padding: "3px 9px", borderRadius: 20, marginBottom: 7, cursor: "pointer", transition: ".2s" },
  storeChipLogo:{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover" },
  productName:{ fontWeight: 800, fontSize: ".93rem", color: "#2d2825", marginBottom: 4 },
  productDesc:{ fontSize: ".76rem", color: "#aaa", lineHeight: 1.5, marginBottom: 8 },
  productFooter:{ display: "flex", alignItems: "center", justifyContent: "space-between" },
  price:     { fontWeight: 900, fontSize: "1rem", color: "#D6A3B0" },
  loadingWrap:{ textAlign: "center", padding: 40, color: "#aaa", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  spinner:   { width: 34, height: 34, borderRadius: "50%", border: "4px solid #F0E6DD", borderTopColor: "#D6A3B0", animation: "spin .8s linear infinite" },
  empty:     { textAlign: "center", padding: "40px 20px", color: "#aaa" },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}

.cat-big-btn{
  background:#fff;border:1.5px solid #F0E6DD;border-radius:16px;
  padding:18px 10px;cursor:pointer;transition:.3s;text-align:center;
  font-family:'Cairo';color:#5D544F;
  display:flex;flex-direction:column;align-items:center;
}
.cat-big-btn:hover{border-color:#D6A3B0;box-shadow:0 6px 20px rgba(214,163,176,.2);transform:translateY(-3px);}
.cat-big-btn.active{background:#D6A3B0;border-color:#D6A3B0;color:#fff;}
.cat-big-btn.active span{color:#fff!important;}

.cat-product-card{
  background:#fff;border-radius:16px;border:1px solid #F0E6DD;
  overflow:hidden;transition:.3s;animation:fadeUp .4s ease forwards;
}
.cat-product-card:hover{transform:translateY(-4px);box-shadow:0 10px 26px rgba(214,163,176,.18);}
.cat-product-card:hover img{transform:scale(1.05);}

.cat-add-btn{
  background:#F8F1EA;color:#8C746A;border:1.5px solid #F0E6DD;
  padding:7px 14px;border-radius:25px;cursor:pointer;
  font-family:'Cairo';font-weight:700;font-size:.76rem;
  display:inline-flex;align-items:center;gap:5px;transition:.3s;
}
.cat-add-btn:hover{background:#D6A3B0;color:#fff;border-color:#D6A3B0;}
.cat-add-btn.added{background:#e8f5f2;color:#1a6b5c;border-color:#1a6b5c;}
`;


