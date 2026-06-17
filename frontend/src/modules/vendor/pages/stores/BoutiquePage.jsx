// src/pages/stores/BoutiquePage.jsx
// الصفحة الرئيسية للبوتيك — تعرض المجموعات من قاعدة البيانات
// عند الضغط على مجموعة تظهر منتجاتها من كل المتاجر


import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../../services/supabaseClient";
import { useCart } from "../../../../core/context/CartContext";

// ── خريطة المجموعات — كل مجموعة تضم عدة collection_group ────────
const BOUQUET_COLLECTIONS = [
  {
    key:          "newborn",
    title:        "أول لقاء 👶",
    subtitle:     "0 — 3 أشهر",
    description:  "أساسيات الترحيب: ملابس قطنية ناعمة، مستلزمات النوم، عناية المولود، وفيتامينات الأم.",
    emoji:        "🌸",
    color:        "#D6A3B0",
    light:        "#fdf2f5",
    groups:       ["newborn"],
    age:          "0-3 أشهر",
  },
  {
    key:          "sensory",
    title:        "اكتشاف الحواس 🌈",
    subtitle:     "3 — 6 أشهر",
    description:  "ألعاب حسية، عضاضات آمنة، وعناية مكثفة ببشرة الطفل الحساسة.",
    emoji:        "🧸",
    color:        "#b4a7d6",
    light:        "#f5f0ff",
    groups:       ["baby_3_6"],
    age:          "3-6 أشهر",
  },
  {
    key:          "flavors",
    title:        "نكهات صغيرة 🥣",
    subtitle:     "6 — 9 أشهر",
    description:  "أدوات الفطام الأولى، أوعية سيليكون صحية، وأكواب تعليمية.",
    emoji:        "🍼",
    color:        "#8fcfc0",
    light:        "#e8f5f2",
    groups:       ["baby_6_9"],
    age:          "6-9 أشهر",
  },
  {
    key:          "achievements",
    title:        "عام الإنجازات 🏆",
    subtitle:     "9 — 12 شهر",
    description:  "مستلزمات التنقل، ألعاب حركية، وكتاب توثيق الذكرى الأولى.",
    emoji:        "🎯",
    color:        "#f5c87e",
    light:        "#fff8f0",
    groups:       ["baby_9_12"],
    age:          "9-12 شهر",
  },
  {
    key:          "mom",
    title:        "راحة الأم 🤱",
    subtitle:     "للأم في كل مرحلة",
    description:  "ملابس منزلية ناعمة، تصاميم مريحة للرضاعة، وأقمشة قطنية.",
    emoji:        "💕",
    color:        "#e8a87c",
    light:        "#fff5f0",
    groups:       ["mom"],
    age:          "للأم",
  },
  {
    key:          "selfcare",
    title:        "لحظة هدوء ✨",
    subtitle:     "عناية ذاتية للأم",
    description:  "شموع طبيعية، شاي أعشاب مهدئ، وكريمات لاسترخاء الأم.",
    emoji:        "🕯️",
    color:        "#85b7eb",
    light:        "#e6f1fb",
    groups:       ["self_care", "general"],
    age:          "العناية الذاتية",
  },
];

// ── قلوب متحركة ──────────────────────────────────────────────────
function FloatingHearts() {
  const containerRef = useRef(null);
  useEffect(() => {
    const box = containerRef.current;
    if (!box) return;
    const interval = setInterval(() => {
      const heart = document.createElement("div");
      heart.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="#D6A3B0" stroke-width="1.5" style="width:100%;height:100%">
        <path d="M12 21C12 21 3 14 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 13-9 13z"/>
      </svg>`;
      heart.style.cssText = `
        position:absolute;width:${12+Math.random()*16}px;height:${12+Math.random()*16}px;
        left:${Math.random()*100}%;bottom:0;opacity:.4;
        animation:heartFloat ${4+Math.random()*4}s linear forwards;pointer-events:none;`;
      box.appendChild(heart);
      setTimeout(() => heart.remove(), 8000);
    }, 1100);
    return () => clearInterval(interval);
  }, []);
  return (
    <div ref={containerRef} style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }} />
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
export default function BoutiquePage() {
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();

  const [categories,      setCategories]      = useState([]);
  const [activeCollection,setActiveCollection]= useState(null); // key من BOUQUET_COLLECTIONS
  const [activeCatId,     setActiveCatId]     = useState(null); // فلتر تصنيف داخل المجموعة
  const [products,        setProducts]        = useState([]);
  const [discountedProducts, setDiscountedProducts] = useState([]);
  const [stores,          setStores]          = useState([]);
  const [catLoading,      setCatLoading]      = useState(true);
  const [prodLoading,     setProdLoading]     = useState(false);
  const [addedIds,        setAddedIds]        = useState(new Set());
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search,          setSearch]          = useState("");
  const [activeTab,       setActiveTab]       = useState("collections"); // collections | offers
  const collectionsRef = useRef(null);
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // ── جلب البيانات الأولية ───────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setCatLoading(true);
      const [{ data: cats }, { data: sts }, { data: discounted }] = await Promise.all([
        supabase.from("product_categories").select("*").order("sort_order"),
        supabase.from("stores").select("store_id,store_name,logo,is_verified").eq("is_verified", true),
        supabase
          .from("products")
          .select(`
            product_id, name, description, price, original_price,
            discount_label, discount_expires_at, stock, image_url,
            product_categories(name),
            stores(store_id,store_name,logo,is_verified)
          `)
          .eq("is_active", true)
          .gt("stock", 0)
          .not("original_price", "is", null)
          .order("price"),
      ]);
      setCategories(cats || []);
      setStores(sts || []);
      // فلتر العروض النشطة فقط
      const active = (discounted || []).filter(p =>
        p.original_price > p.price &&
        (!p.discount_expires_at || new Date(p.discount_expires_at) > new Date())
      );
      setDiscountedProducts(active);
      setCatLoading(false);
    };
    load();
  }, []);

  // ── جلب منتجات مجموعة ─────────────────────────────────────────
  const loadCollection = useCallback(async (collectionKey) => {
    setActiveCollection(collectionKey);
    setActiveCatId(null);
    setProdLoading(true);
    setSearch("");

    const col = BOUQUET_COLLECTIONS.find(c => c.key === collectionKey);
    if (!col) return;

    // جلب category_ids للمجموعات المطلوبة
    const relevantCats = categories.filter(c => col.groups.includes(c.collection_group));
    const catIds = relevantCats.map(c => c.category_id);

    let query = supabase
      .from("products")
      .select(`
        product_id, name, description, price, original_price,
        discount_label, discount_expires_at, stock, image_url,
        category_id,
        product_categories(category_id,name,emoji),
        stores(store_id,store_name,logo,is_verified)
      `)
      .eq("is_active", true)
      .gt("stock", 0)
      .order("price");

    if (catIds.length > 0) {
      query = query.in("category_id", catIds);
    }

    const { data } = await query;
    setProducts(data || []);
    setProdLoading(false);
    setTimeout(() => collectionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  }, [categories]);

  const handleAddToCart = useCallback(async (product) => {
    await addToCart(product.product_id);
    setAddedIds(prev => new Set(prev).add(product.product_id));
    setTimeout(() => {
      setAddedIds(prev => { const n = new Set(prev); n.delete(product.product_id); return n; });
    }, 2000);
  }, [addToCart]);

  const activeCol = BOUQUET_COLLECTIONS.find(c => c.key === activeCollection);

  // فلتر داخل المجموعة
  let visibleProducts = products
    .filter(p => !activeCatId || p.category_id === activeCatId)
    .filter(p =>
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.stores?.store_name?.toLowerCase().includes(search.toLowerCase())
    );

  // التصنيفات المتاحة في المجموعة الحالية
  const availableCats = categories.filter(c =>
    activeCol && activeCol.groups.includes(c.collection_group) &&
    products.some(p => p.category_id === c.category_id)
  );

  return (
    <div dir="rtl" style={S.page}>
      <style>{CSS}</style>
      <FloatingHearts />

      {/* ── شريط الإعلان ── */}
      <div style={S.announcementBar}>
        <span>🌸 توصيل مجاني للطلبات فوق ₪500</span>
        <span style={{ margin:"0 20px", opacity:.4 }}>|</span>
        <span>✨ عروض يومية حصرية على منتجات الأم والطفل</span>
        {discountedProducts.length > 0 && (
          <>
            <span style={{ margin:"0 20px", opacity:.4 }}>|</span>
            <button style={S.annBtn} onClick={() => setActiveTab("offers")}>
              🔥 {discountedProducts.length} عرض نشط الآن!
            </button>
          </>
        )}
      </div>
{/* ── NAVBAR ── */}
<nav style={S.navbar}>
  <div style={S.navLogo}>Minimalist Care</div>

  {mobileMenuOpen && (
    <div className="bt-nav-overlay" onClick={() => setMobileMenuOpen(false)} />
  )}

  <ul className={`bt-nav-links ${mobileMenuOpen ? "open" : ""}`} style={S.navLinks}>
    <button className="bt-nav-close" onClick={() => setMobileMenuOpen(false)}>
      <i className="fas fa-times" />
    </button>
    <li>
      <button style={S.navLink}
        onClick={() => { navigate("/boutique"); setMobileMenuOpen(false); }}>
        الرئيسية
      </button>
    </li>
    <li>
      <button style={S.navLink}
        onClick={() => { navigate("/stores"); setMobileMenuOpen(false); }}>
        المتاجر
      </button>
    </li>
    <li>
      <button style={S.navLink}
        onClick={() => {
          collectionsRef.current?.scrollIntoView({ behavior:"smooth" });
          setMobileMenuOpen(false);
        }}>
        المجموعات
      </button>
    </li>
    <li>
      <button style={S.navLink}
        onClick={() => {
          document.getElementById("partners")?.scrollIntoView({ behavior:"smooth" });
          setMobileMenuOpen(false);
        }}>
        تواصل معنا
      </button>
    </li>
  </ul>

  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
    {discountedProducts.length > 0 && (
      <button
        className={`bt-offers-pill ${activeTab === "offers" ? "active" : ""}`}
        onClick={() => setActiveTab("offers")}>
        🔥 العروض
        <span style={S.offerCount}>{discountedProducts.length}</span>
      </button>
    )}
    {cartCount > 0 && (
      <button className="bt-cart-btn" onClick={() => navigate("/cart")}>
        🛒 <span>{cartCount}</span>
      </button>
    )}
    <button className="bt-hamburger" onClick={() => setMobileMenuOpen(true)}>
      <i className="fas fa-bars" />
    </button>
  </div>
</nav>
      {/* ── زر رجوع ── */}
      <div style={S.breadcrumb}>
        <button style={S.breadBtn} onClick={() => navigate(-1)}>
          <i className="fas fa-chevron-right" style={{fontSize:".72rem"}} /> رجوع
        </button>
        <span style={S.breadSep}>/</span>
        <span style={S.breadCurrent}>البوتيك</span>
      </div>

      {/* ── HERO ── */}
      <header className="bt-hero">
        <div style={{ position:"relative", zIndex:2, textAlign:"center", maxWidth:600 }}>
          <div style={S.heroBadge}>🌸 Minimalist Care Boutique</div>
          <h1 className="bt-hero-title">رحلة أمومة أكثر هدوءاً</h1>
          <p className="bt-hero-sub">مجموعات مختارة بعناية، ترافق نمو طفلكِ مرحلة بمرحلة.</p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap", marginTop:24 }}>
            <button className="bt-hero-cta"
              onClick={() => collectionsRef.current?.scrollIntoView({ behavior:"smooth" })}>
              استكشفي المجموعات ↓
            </button>
            {discountedProducts.length > 0 && (
              <button
                className="bt-hero-cta"
                style={{ background:"rgba(231,76,60,.8)", borderColor:"rgba(231,76,60,.5)" }}
                onClick={() => { setActiveTab("offers"); collectionsRef.current?.scrollIntoView({ behavior:"smooth" }); }}>
                🔥 عرض العروض ({discountedProducts.length})
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main id="collections" ref={collectionsRef} style={S.main}>

        {catLoading ? (
          <div style={{ textAlign:"center", padding:60 }}>
            <div className="bt-spinner" />
          </div>
        ) : (
          <>
            {/* ── تبويبات: المجموعات | العروض ── */}
            <div style={S.mainTabs}>
              <button
                className={`bt-main-tab ${activeTab === "collections" ? "active" : ""}`}
                onClick={() => setActiveTab("collections")}>
                <i className="fas fa-layer-group" /> المجموعات
              </button>
              <button
                className={`bt-main-tab ${activeTab === "offers" ? "active" : ""}`}
                onClick={() => setActiveTab("offers")}>
                <i className="fas fa-tags" /> العروض الحصرية
                {discountedProducts.length > 0 && (
                  <span style={S.tabBadge}>{discountedProducts.length}</span>
                )}
              </button>
            </div>

            {/* ══════════ TAB: COLLECTIONS ══════════ */}
            {activeTab === "collections" && (
              <>
                <div style={S.sectionIntro}>
                  <h2 style={S.sectionTitle}>مجموعاتنا المختارة</h2>
                  <p style={S.sectionSub}>اختاري المجموعة المناسبة لمرحلة طفلكِ</p>
                </div>

                {/* بطاقات المجموعات */}
                <div className="bt-collection-grid">
                  {BOUQUET_COLLECTIONS.map(col => {
                    const isActive = activeCollection === col.key;
                    // عدد المنتجات المتاحة في هذه المجموعة
                    const colCatIds = categories
                      .filter(c => col.groups.includes(c.collection_group))
                      .map(c => c.category_id);
                    return (
                      <div
                        key={col.key}
                        className={`bt-product-card ${isActive ? "active" : ""}`}
                        onClick={() => loadCollection(col.key)}>
                        <div className="bt-card-img-wrap"
                          style={{ background:`linear-gradient(135deg,${col.light},${col.color}33)` }}>
                          <span style={{ fontSize:"3.5rem" }}>{col.emoji}</span>
                          <span className="bt-card-age-badge" style={{ background:col.color }}>
                            {col.age}
                          </span>
                          {isActive && (
                            <span style={S.activeCheck}>✓ مختارة</span>
                          )}
                        </div>
                        <div style={{ padding:"16px 18px 18px", display:"flex", flexDirection:"column", flex:1 }}>
                          <h3 style={{ fontWeight:800, fontSize:"1rem", color:"#2d2825", marginBottom:4 }}>
                            {col.title}
                          </h3>
                          <div style={{ fontSize:".78rem", color:col.color, fontWeight:700, marginBottom:8 }}>
                            {col.subtitle}
                          </div>
                          <p style={{ fontSize:".83rem", color:"#9d8880", lineHeight:1.65, flex:1, marginBottom:16 }}>
                            {col.description}
                          </p>
                          <button
                            className="bt-view-btn"
                            style={{ background: isActive ? col.color : "#D6A3B0" }}>
                            {isActive ? "✓ المجموعة المختارة" : "استكشفي المجموعة"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ══ قسم المنتجات عند اختيار مجموعة ══ */}
                {activeCollection && (
                  <section style={{ marginTop:56 }}>
                    {/* Header */}
                    <div style={S.productSectionHeader}>
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6, flexWrap:"wrap" }}>
                          <span style={{
                            background: activeCol?.color,
                            color:"#fff", padding:"4px 14px", borderRadius:20,
                            fontSize:".75rem", fontWeight:700,
                          }}>
                            {activeCol?.emoji} {activeCol?.title}
                          </span>
                          <span style={{ fontSize:".78rem", color:"#aaa" }}>
                            {visibleProducts.length} منتج
                          </span>
                        </div>
                        <h2 style={{ fontWeight:900, fontSize:"1.35rem", color:"#2d2825" }}>
                          منتجات "{activeCol?.title}" من كافة المتاجر
                        </h2>
                        <p style={{ fontSize:".82rem", color:"#9d8880", marginTop:4 }}>
                          {activeCol?.description}
                        </p>
                      </div>
                      <button className="bt-close-btn"
                        onClick={() => { setActiveCollection(null); setProducts([]); }}>
                        ✕ إغلاق
                      </button>
                    </div>

                    {/* فلتر التصنيفات الفرعية */}
                    {availableCats.length > 1 && (
                      <div style={S.subCatBar}>
                        <button
                          className={`bt-subcat-btn ${activeCatId === null ? "active" : ""}`}
                          style={activeCatId === null ? { borderColor: activeCol?.color, color: activeCol?.color } : {}}
                          onClick={() => setActiveCatId(null)}>
                          🌟 الكل ({products.length})
                        </button>
                        {availableCats.map(cat => (
                          <button
                            key={cat.category_id}
                            className={`bt-subcat-btn ${activeCatId === cat.category_id ? "active" : ""}`}
                            style={activeCatId === cat.category_id ? { borderColor: activeCol?.color, color: activeCol?.color, background: activeCol?.light } : {}}
                            onClick={() => setActiveCatId(cat.category_id)}>
                            {cat.emoji || ""} {cat.name}
                            <span style={S.subCatCount}>
                              {products.filter(p => p.category_id === cat.category_id).length}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* شريط البحث */}
                    <div style={S.toolbar}>
                      <div style={S.searchBar}>
                        <span style={{ color:"#ccc" }}>🔍</span>
                        <input
                          placeholder="ابحثي في المنتجات أو المتاجر..."
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          style={S.searchInput}
                        />
                        {search && (
                          <button style={S.clearBtn} onClick={() => setSearch("")}>✕</button>
                        )}
                      </div>
                    </div>

                    {prodLoading ? (
                      <div style={{ textAlign:"center", padding:48 }}>
                        <div className="bt-spinner" />
                        <p style={{ marginTop:14, color:"#aaa" }}>جارٍ تحميل المنتجات...</p>
                      </div>
                    ) : visibleProducts.length === 0 ? (
                      <div style={S.empty}>
                        <span style={{ fontSize:"3rem" }}>📦</span>
                        <p style={{ fontWeight:700 }}>لا توجد منتجات في هذه المجموعة بعد</p>
                      </div>
                    ) : (
                      <div className="bt-collection-grid">
                        {visibleProducts.map(product => (
                          <BoutiqueProductCard
                            key={product.product_id}
                            product={product}
                            added={addedIds.has(product.product_id)}
                            onAdd={handleAddToCart}
                            onOpen={setSelectedProduct}
                            navigate={navigate}
                            accentColor={activeCol?.color}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </>
            )}

            {/* ══════════ TAB: OFFERS ══════════ */}
            {activeTab === "offers" && (
              <section>
                <div style={{ textAlign:"center", marginBottom:36 }}>
                  <div style={S.offersBadge}>🔥 عروض حصرية</div>
                  <h2 style={S.sectionTitle}>العروض والخصومات النشطة</h2>
                  <p style={S.sectionSub}>
                    {discountedProducts.length > 0
                      ? `${discountedProducts.length} منتج بخصومات مميزة من متاجرنا المعتمدة`
                      : "لا توجد عروض حالياً — تابعي المتاجر للاطلاع على أحدث العروض"}
                  </p>
                </div>

                {discountedProducts.length === 0 ? (
                  <div style={S.empty}>
                    <span style={{ fontSize:"3.5rem" }}>🏷️</span>
                    <p style={{ fontWeight:700, color:"#5D544F" }}>لا توجد عروض نشطة حالياً</p>
                    <button className="bt-view-btn"
                      onClick={() => setActiveTab("collections")}>
                      تصفّح المجموعات
                    </button>
                  </div>
                ) : (
                  <>
                    {/* مؤشرات إحصائية */}
                    <div style={S.offersStatsBar}>
                      <div style={S.offerStat}>
                        <span style={S.offerStatNum}>{discountedProducts.length}</span>
                        <span style={S.offerStatLabel}>منتج مخفّض</span>
                      </div>
                      <div style={S.offerStatDivider} />
                      <div style={S.offerStat}>
                        <span style={S.offerStatNum}>
                          {Math.max(...discountedProducts.map(p =>
                            Math.round(((p.original_price - p.price) / p.original_price) * 100)
                          ))}%
                        </span>
                        <span style={S.offerStatLabel}>أعلى خصم</span>
                      </div>
                      <div style={S.offerStatDivider} />
                      <div style={S.offerStat}>
                        <span style={S.offerStatNum}>
                          {new Set(discountedProducts.map(p => p.stores?.store_id)).size}
                        </span>
                        <span style={S.offerStatLabel}>متجر مشارك</span>
                      </div>
                    </div>

                    <div className="bt-collection-grid">
                      {discountedProducts.map(product => (
                        <BoutiqueProductCard
                          key={product.product_id}
                          product={product}
                          added={addedIds.has(product.product_id)}
                          onAdd={handleAddToCart}
                          onOpen={setSelectedProduct}
                          navigate={navigate}
                          accentColor="#e74c3c"
                          forceShowDiscount
                        />
                      ))}
                    </div>
                  </>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {/* ── شركاء معتمدون ── */}
      <section id="partners" style={S.partnersSection}>
        <h2 style={S.partnersTitle}>شركاء العناية المعتمدون</h2>
        <div style={S.partnersGrid}>
          {stores.length > 0
            ? stores.map(st => (
                <div key={st.store_id} className="bt-partner-logo"
                  onClick={() => navigate(`/stores/${st.store_id}`)}>
                  {st.logo
                    ? <img src={st.logo} alt={st.store_name}
                        style={{ width:34, height:34, borderRadius:"50%", objectFit:"cover", marginBottom:6 }} />
                    : <span style={{ fontSize:"1.4rem", display:"block", marginBottom:6 }}>🏪</span>}
                  <span>{st.store_name}</span>
                  {st.is_verified && <span style={{ fontSize:".65rem", color:"#8fcfc0", display:"block" }}>✓ موثّق</span>}
                </div>
              ))
            : ["صيدلية الوفاء","بوتيك الأم","عالم الطفل","منتجات الطبيعة"].map(name => (
                <div key={name} className="bt-partner-logo"><span>{name}</span></div>
              ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={S.footer}>
        <div style={S.footerInner}>
          <div style={S.footerTop}>
            <div>
              <div style={S.footerLogo}>Minimalist Care</div>
              <p style={S.footerTagline}>رحلة أمومة أكثر هدوءاً 🌸</p>
            </div>
            <div>
              <div style={S.footerSectionTitle}>روابط سريعة</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <button style={S.footerLink} onClick={() => navigate("/boutique")}>الرئيسية</button>
                <button style={S.footerLink} onClick={() => navigate("/stores")}>المتاجر</button>
                <button style={S.footerLink} onClick={() => navigate("/cart")}>سلة التسوق</button>
                <button style={S.footerLink} onClick={() => setActiveTab("offers")}>العروض</button>
              </div>
            </div>
            <div>
              <div style={S.footerSectionTitle}>المجموعات</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {BOUQUET_COLLECTIONS.map(col => (
                  <button key={col.key} style={S.footerLink}
                    onClick={() => { setActiveTab("collections"); loadCollection(col.key); }}>
                    {col.emoji} {col.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={S.footerBottom}>
            <span>© 2025 Minimalist Care — جميع الحقوق محفوظة</span>
          </div>
        </div>
      </footer>

      {/* ── Modal المنتج ── */}
      {selectedProduct && (
        <BoutiqueProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          addedIds={addedIds}
          navigate={navigate}
        />
      )}
    </div>
  );
}

// ── بطاقة منتج البوتيك ──────────────────────────────────────────
function BoutiqueProductCard({ product, added, onAdd, onOpen, navigate, accentColor, forceShowDiscount }) {
  const hasDiscount = (forceShowDiscount || (product.original_price && product.original_price > product.price)) &&
    (!product.discount_expires_at || new Date(product.discount_expires_at) > new Date());
  const discountPct = hasDiscount
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  return (
    <div className="bt-product-card">
      <div className="bt-product-img-wrap" onClick={() => onOpen(product)}>
        {product.image_url
          ? <img src={product.image_url} alt={product.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : <div style={{ width:"100%", height:"100%", background:"#f5f0ea", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:"3rem" }}>🛍️</span>
            </div>}
        {hasDiscount && (
          <span style={S.discountBadge}>🔥 خصم {discountPct}%</span>
        )}
        {product.stock < 5 && !hasDiscount && (
          <span style={S.lowStockBadge}>آخر {product.stock}</span>
        )}
      </div>

      {product.stores && (
        <div style={S.storeChip} onClick={() => navigate(`/stores/${product.stores.store_id}`)}>
          {product.stores.logo
            ? <img src={product.stores.logo} alt="" style={{ width:16, height:16, borderRadius:"50%", objectFit:"cover" }} />
            : <span style={{ fontSize:".75rem" }}>🏪</span>}
          {product.stores.store_name}
          {product.stores.is_verified && <span style={{ color:"#1a6b5c", fontSize:".65rem" }}>✓</span>}
        </div>
      )}

      <h3 style={S.productName} onClick={() => onOpen(product)}>{product.name}</h3>
      {product.description && (
        <p style={S.productDesc}>
          {product.description.slice(0,60)}{product.description.length > 60 ? "..." : ""}
        </p>
      )}

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px 16px", marginTop:"auto" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
          <span style={{ fontWeight:900, fontSize:"1.05rem", color: accentColor || "#D6A3B0" }}>
            ₪ {product.price}
          </span>
          {hasDiscount && (
            <span style={{ fontSize:".75rem", color:"#bbb", textDecoration:"line-through" }}>
              ₪ {product.original_price}
            </span>
          )}
        </div>
        <button
          className={`bt-add-btn ${added ? "added" : ""}`}
          onClick={() => onAdd(product)}>
          {added ? "✓ أضيف!" : "🛒 أضف"}
        </button>
      </div>
    </div>
  );
}

// ── Modal منتج البوتيك ───────────────────────────────────────────
function BoutiqueProductModal({ product, onClose, onAddToCart, addedIds, navigate }) {
  const added      = addedIds.has(product.product_id);
  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  return (
    <div style={S.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal} dir="rtl">
        <button style={S.modalClose} onClick={onClose}>✕</button>
        <div style={{ height:240, overflow:"hidden", borderRadius:"24px 24px 0 0", position:"relative" }}>
          {product.image_url
            ? <img src={product.image_url} alt={product.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : <div style={{ width:"100%", height:"100%", background:"#f5f0ea", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"5rem" }}>🛍️</div>}
          {hasDiscount && (
            <span style={{ ...S.discountBadge, position:"absolute", top:12, right:12 }}>
              🔥 خصم {discountPct}%
            </span>
          )}
        </div>
        <div style={{ padding:"20px 22px 24px" }}>
          {product.stores && (
            <div style={{ ...S.storeChip, cursor:"pointer", marginBottom:10 }}
              onClick={() => { onClose(); navigate(`/stores/${product.stores.store_id}`); }}>
              {product.stores.logo
                ? <img src={product.stores.logo} alt="" style={{ width:18, height:18, borderRadius:"50%", objectFit:"cover" }} />
                : <span>🏪</span>}
              {product.stores.store_name}
            </div>
          )}
          <h2 style={{ fontWeight:800, fontSize:"1.25rem", marginBottom:8, color:"#2d2825" }}>{product.name}</h2>
          {product.description && (
            <p style={{ fontSize:".88rem", color:"#7d7470", lineHeight:1.7, marginBottom:16 }}>{product.description}</p>
          )}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
            <div>
              <span style={{ fontSize:"1.5rem", fontWeight:900, color:"#D6A3B0" }}>₪ {product.price}</span>
              {hasDiscount && (
                <span style={{ fontSize:".88rem", color:"#bbb", textDecoration:"line-through", marginRight:8 }}>
                  ₪ {product.original_price}
                </span>
              )}
              {product.discount_label && (
                <span style={{ background:"#e74c3c", color:"#fff", fontSize:".72rem", fontWeight:700, padding:"3px 8px", borderRadius:20, marginRight:6 }}>
                  {product.discount_label}
                </span>
              )}
            </div>
            <span style={{ fontSize:".8rem", color:"#aaa" }}>المخزون: {product.stock}</span>
          </div>
          <button
            style={{
              width:"100%", marginTop:18,
              background: added ? "#2ecc71" : "#D6A3B0",
              color:"#fff", border:"none", padding:"13px 0",
              borderRadius:50, cursor:"pointer",
              fontFamily:"'Cairo',sans-serif", fontWeight:700, fontSize:".95rem",
              transition:".3s", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            }}
            onClick={() => onAddToCart(product)}>
            {added ? "✓ تمت الإضافة للسلة!" : "🛒 أضف للسلة"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const S = {
  page: { background:"#F8F1EA", minHeight:"100vh", fontFamily:"'Tajawal','Cairo',sans-serif", color:"#5D544F", position:"relative" },

  announcementBar: {
    background:"linear-gradient(90deg,#D6A3B0,#c27a8c,#D6A3B0)",
    backgroundSize:"200% 100%", animation:"shimmer 4s linear infinite",
    color:"#fff", textAlign:"center", padding:"8px 16px",
    fontSize:".8rem", fontWeight:700,
    display:"flex", alignItems:"center", justifyContent:"center", flexWrap:"wrap", gap:4,
  },
  annBtn: {
    background:"rgba(255,255,255,.25)", border:"1px solid rgba(255,255,255,.5)",
    color:"#fff", padding:"3px 12px", borderRadius:20, cursor:"pointer",
    fontFamily:"'Cairo'", fontWeight:700, fontSize:".78rem",
  },

  navbar: {
    background:"rgba(247,237,226,.96)", backdropFilter:"blur(12px)",
    borderBottom:"1px solid #EADED3",
    padding:"0 32px", height:64,
    display:"flex", alignItems:"center", justifyContent:"space-between",
    position:"sticky", top:0, zIndex:100,
    fontFamily:"'Cairo','Tajawal',sans-serif",
  },
  navLogo: { fontFamily:"'Georgia',serif", fontStyle:"italic", fontSize:"1.25rem", color:"#8C746A", fontWeight:700 },
 navLinks: { display:"flex", listStyle:"none", gap:4, margin:0, padding:0 },
navLink: { background:"none", border:"none", color:"#7d6a63", fontFamily:"'Cairo'", fontWeight:600, fontSize:".88rem", cursor:"pointer", padding:"8px 14px", borderRadius:20 },


  offerCount: { background:"#e74c3c", color:"#fff", borderRadius:"50%", width:18, height:18, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:".62rem", fontWeight:800, marginRight:4 },

  breadcrumb: { maxWidth:1200, margin:"0 auto", padding:"10px 24px", display:"flex", alignItems:"center", gap:7, fontSize:".8rem" },
  breadBtn: { background:"none", border:"none", color:"#9d8880", cursor:"pointer", fontFamily:"'Cairo'", fontWeight:600, padding:0, fontSize:".8rem", display:"flex", alignItems:"center", gap:5 },
  breadSep: { color:"#ccc" },
  breadCurrent: { color:"#D6A3B0", fontWeight:700 },

  heroBadge: { display:"inline-block", background:"rgba(255,255,255,.2)", backdropFilter:"blur(4px)", color:"#fff", fontWeight:700, fontSize:".8rem", padding:"5px 16px", borderRadius:20, marginBottom:14 },

  main: { maxWidth:1200, margin:"0 auto", padding:"48px 24px" },

  mainTabs: { display:"flex", gap:4, marginBottom:36, borderBottom:"2px solid #F0E6DD", paddingBottom:0 },
  tabBadge: { background:"#e74c3c", color:"#fff", borderRadius:"50%", width:20, height:20, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:".65rem", fontWeight:800, marginRight:5 },

  sectionIntro: { textAlign:"center", marginBottom:40 },
  sectionTitle: { fontWeight:800, fontSize:"1.7rem", color:"#2d2825", marginBottom:8 },
  sectionSub: { color:"#9d8880", fontSize:".95rem" },

  activeCheck: { position:"absolute", top:10, left:10, background:"rgba(0,0,0,.6)", color:"#fff", fontSize:".68rem", fontWeight:700, padding:"3px 8px", borderRadius:20 },

  // Sub-category filters
  subCatBar: { display:"flex", gap:8, flexWrap:"wrap", marginBottom:18, overflowX:"auto", paddingBottom:4 },
  subCatCount: { background:"rgba(0,0,0,.08)", borderRadius:12, padding:"1px 6px", fontSize:".68rem", marginRight:4 },

  toolbar: { display:"flex", gap:12, marginBottom:22, flexWrap:"wrap", alignItems:"center" },
  searchBar: { background:"#fff", borderRadius:50, padding:"9px 16px", display:"flex", alignItems:"center", gap:10, flex:1, minWidth:200, border:"1px solid #F0E6DD" },
  searchInput: { border:"none", background:"transparent", outline:"none", fontFamily:"'Cairo'", fontSize:".88rem", width:"100%", color:"#2d2825" },
  clearBtn: { background:"none", border:"none", color:"#aaa", cursor:"pointer" },

  productSectionHeader: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22, flexWrap:"wrap", gap:14 },

  storeChip: { display:"inline-flex", alignItems:"center", gap:5, background:"#f0ebe4", color:"#8C746A", fontSize:".72rem", fontWeight:700, padding:"3px 9px", borderRadius:20, margin:"10px 16px 4px", cursor:"pointer", transition:".2s" },
  productName: { fontWeight:800, fontSize:".93rem", color:"#2d2825", margin:"4px 16px 6px", cursor:"pointer" },
  productDesc: { fontSize:".78rem", color:"#9d8880", margin:"0 16px 10px", lineHeight:1.5 },
  discountBadge: { position:"absolute", top:10, right:10, background:"#e74c3c", color:"#fff", fontSize:".72rem", fontWeight:800, padding:"4px 10px", borderRadius:20 },
  lowStockBadge: { position:"absolute", top:10, right:10, background:"#fff8f0", color:"#f39c12", fontSize:".7rem", fontWeight:700, padding:"3px 9px", borderRadius:20 },

  // Offers
  offersBadge: { display:"inline-block", background:"#fef0f0", color:"#e74c3c", fontWeight:800, fontSize:".8rem", padding:"5px 16px", borderRadius:20, marginBottom:10, border:"1px solid #fca5a5" },
  offersStatsBar: { display:"flex", justifyContent:"center", alignItems:"center", background:"#fff", borderRadius:16, padding:"20px 32px", marginBottom:28, gap:0, border:"1px solid #F0E6DD" },
  offerStat: { display:"flex", flexDirection:"column", alignItems:"center", padding:"0 28px", gap:4 },
  offerStatNum: { fontSize:"1.4rem", fontWeight:900, color:"#e74c3c" },
  offerStatLabel: { fontSize:".72rem", color:"#9d8880", fontWeight:600 },
  offerStatDivider: { width:1, height:36, background:"#F0E6DD" },

  empty: { textAlign:"center", padding:"60px 20px", color:"#aaa", display:"flex", flexDirection:"column", alignItems:"center", gap:14 },

  partnersSection: { background:"#5D6D64", padding:"36px 24px", textAlign:"center" },
  partnersTitle: { color:"#F8F1EA", fontWeight:700, fontSize:"1.2rem", marginBottom:20 },
  partnersGrid: { display:"flex", justifyContent:"center", gap:16, flexWrap:"wrap", maxWidth:1000, margin:"0 auto" },

  footer: { background:"#1a2e2a", color:"#a9c5be", padding:"48px 24px 24px" },
  footerInner: { maxWidth:1200, margin:"0 auto" },
  footerTop: { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:32, marginBottom:32 },
  footerLogo: { fontFamily:"'Georgia',serif", fontStyle:"italic", fontSize:"1.4rem", color:"#8fcfc0", marginBottom:8 },
  footerTagline: { fontSize:".85rem", opacity:.75 },
  footerSectionTitle: { fontWeight:800, color:"#dbe8e5", marginBottom:12, fontSize:".88rem" },
  footerLink: { background:"none", border:"none", color:"#8fcfc0", fontFamily:"'Cairo'", fontWeight:600, fontSize:".82rem", cursor:"pointer", padding:0, textAlign:"right", display:"block", marginBottom:6 },
  footerBottom: { borderTop:"1px solid rgba(255,255,255,.1)", paddingTop:20, textAlign:"center", fontSize:".75rem", opacity:.5 },

  modalOverlay: { position:"fixed", inset:0, background:"rgba(93,84,79,.55)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:4000, padding:16 },
  modal: { background:"#fff", borderRadius:24, width:"100%", maxWidth:420, maxHeight:"88vh", overflowY:"auto", position:"relative", fontFamily:"'Tajawal','Cairo',sans-serif", direction:"rtl" },
  modalClose: { position:"absolute", top:14, left:14, background:"rgba(0,0,0,.18)", border:"none", color:"#fff", width:30, height:30, borderRadius:"50%", cursor:"pointer", fontSize:".85rem", zIndex:2, display:"flex", alignItems:"center", justifyContent:"center" },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap');
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes heartFloat{0%{transform:translateY(0) scale(.8);opacity:.4}100%{transform:translateY(-100vh) scale(1.1);opacity:0}}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

/* Hero */
.bt-hero {
  background-image: linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)), url('/assets/store/hero-image.png');
  background-size:cover; background-position:center; background-attachment:fixed;
  min-height:460px; display:flex; align-items:center;
  justify-content:center; text-align:center; padding:70px 24px;
  position:relative; overflow:hidden;
}
.bt-hero-title { font-size:2.5rem; font-weight:800; color:#fff; margin-bottom:10px; line-height:1.3; text-shadow:0 2px 16px rgba(0,0,0,.4); }
.bt-hero-sub { color:rgba(255,255,255,.88); font-size:1.05rem; margin-bottom:0; max-width:520px; font-weight:500; }
.bt-hero-cta {
  background:rgba(214,163,176,.85); color:#fff; border:1.5px solid rgba(255,255,255,.4);
  padding:12px 28px; border-radius:50px; cursor:pointer;
  font-family:'Tajawal','Cairo',sans-serif; font-weight:700; font-size:.95rem;
  transition:.3s; box-shadow:0 4px 20px rgba(0,0,0,.2); backdrop-filter:blur(4px);
}
.bt-hero-cta:hover { transform:translateY(-2px); opacity:.92; }

/* Main tabs */
.bt-main-tab {
  background:none; border:none; border-bottom:3px solid transparent;
  padding:14px 22px; font-family:'Cairo'; font-weight:700; font-size:.9rem;
  color:#9d8880; cursor:pointer; transition:.25s;
  display:inline-flex; align-items:center; gap:7px;
}
.bt-main-tab:hover { color:#D6A3B0; }
.bt-main-tab.active { color:#D6A3B0; border-bottom-color:#D6A3B0; }

/* Collection grid */
.bt-collection-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:26px; }

/* Product card */
.bt-product-card {
  background:#fff; padding:0; border-radius:20px; border:1px solid #F0E6DD;
  display:flex; flex-direction:column; cursor:pointer; transition:.35s;
  overflow:hidden; animation:fadeUp .5s ease forwards;
}
.bt-product-card:hover { transform:translateY(-6px); box-shadow:0 14px 35px rgba(214,163,176,.22); border-color:#D6A3B0; }
.bt-product-card.active { border:2px solid #D6A3B0; }
.bt-card-img-wrap {
  width:100%; height:180px; display:flex; align-items:center; justify-content:center;
  position:relative; transition:.3s;
}
.bt-card-age-badge {
  position:absolute; bottom:10px; right:10px; color:#fff;
  font-size:.7rem; font-weight:700; padding:4px 10px; border-radius:20px; opacity:.9;
}
.bt-product-img-wrap { height:200px; overflow:hidden; background:#f5f0ea; cursor:pointer; position:relative; transition:.3s; }
.bt-product-img-wrap img { transition:.4s; }
.bt-product-card:hover .bt-product-img-wrap img { transform:scale(1.05); }

/* Sub-cat button */
.bt-subcat-btn {
  background:#fff; border:1.5px solid #F0E6DD; padding:7px 16px; border-radius:25px;
  font-family:'Cairo'; font-weight:700; font-size:.8rem; color:#8C746A;
  cursor:pointer; transition:.3s; white-space:nowrap;
  display:inline-flex; align-items:center; gap:5px;
}
.bt-subcat-btn:hover { border-color:#D6A3B0; }
.bt-subcat-btn.active { font-weight:800; }

/* Buttons */
.bt-view-btn {
  background:#D6A3B0; color:#fff; border:none; padding:10px 22px; border-radius:50px;
  cursor:pointer; font-family:'Tajawal','Cairo',sans-serif; font-weight:700; font-size:.87rem;
  transition:.3s; display:inline-block; margin:0 auto 0; width:calc(100% - 32px);
}
.bt-view-btn:hover { opacity:.88; transform:translateY(-1px); }
.bt-close-btn {
  background:#fff; border:1px solid #F0E6DD; color:#888; padding:8px 16px;
  border-radius:20px; cursor:pointer; font-family:'Cairo'; font-weight:700;
  font-size:.82rem; display:inline-flex; align-items:center; gap:6px; transition:.3s;
  white-space:nowrap;
}
.bt-close-btn:hover { border-color:#D6A3B0; color:#D6A3B0; }
.bt-add-btn {
  background:#F8F1EA; color:#8C746A; border:1.5px solid #F0E6DD; padding:7px 14px;
  border-radius:25px; cursor:pointer; font-family:'Tajawal','Cairo',sans-serif;
  font-weight:700; font-size:.78rem; display:inline-flex; align-items:center; gap:5px; transition:.3s;
}
.bt-add-btn:hover { background:#D6A3B0; color:#fff; border-color:#D6A3B0; }
.bt-add-btn.added { background:#e8f5f2; color:#1a6b5c; border-color:#1a6b5c; }
.bt-cart-btn {
  background:#D6A3B0; color:#fff; border:none; padding:8px 18px; border-radius:25px;
  cursor:pointer; font-family:'Cairo'; font-weight:700; font-size:.85rem;
  display:flex; align-items:center; gap:8px; transition:.3s;
}
.bt-cart-btn span { background:rgba(255,255,255,.3); border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; font-size:.72rem; }
.bt-cart-btn:hover { background:#c27a8c; }
.bt-offers-pill {
  background:#fff8f0; color:#f39c12; border:1.5px solid #fde8c8;
  padding:7px 14px; border-radius:25px; cursor:pointer; font-family:'Cairo';
  font-weight:700; font-size:.82rem; display:inline-flex; align-items:center; gap:5px; transition:.3s;
}
.bt-offers-pill:hover,.bt-offers-pill.active { background:#fef0f0; color:#e74c3c; border-color:#fca5a5; }

/* Partner */
.bt-partner-logo {
  background:rgba(248,241,234,.15); border:1px solid rgba(248,241,234,.3);
  color:#F8F1EA; padding:12px 22px; border-radius:12px; font-weight:700;
  font-size:.88rem; cursor:pointer; transition:.3s; text-align:center;
  display:flex; flex-direction:column; align-items:center; min-width:110px;
}
.bt-partner-logo:hover { background:rgba(248,241,234,.25); transform:translateY(-2px); }
.bt-spinner { width:36px; height:36px; border-radius:50%; border:4px solid #F0E6DD; border-top-color:#D6A3B0; animation:spin .8s linear infinite; margin:0 auto; }

.bt-hamburger {
  display: none;
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  color: #7d6a63;
  padding: 8px;
}

.bt-nav-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.35);
  z-index: 99;
}

.bt-nav-close {
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
  .bt-hero { background-attachment:scroll; }
  .bt-hero-title { font-size:1.7rem; }
  .bt-collection-grid { grid-template-columns:repeat(2,1fr); gap:14px; }
  .bt-main-tab { padding:10px 12px; font-size:.82rem; }
  .bt-hamburger { display: flex; align-items: center; }

  .bt-nav-links {
    position: fixed !important;
    top: 0; right: 0; bottom: 0;
    width: 260px;
    height :300px;
    background: rgba(247,237,226,.98) !important;
    backdrop-filter: blur(12px);
    flex-direction: column !important;
    padding: 70px 16px 30px !important;
    gap: 4px !important;
    z-index: 100;
    box-shadow: -4px 0 20px rgba(0,0,0,.12);
    display: none !important;
    list-style: none;
  }

  .bt-nav-links.open { display: flex !important; }
  .bt-nav-close { display: flex; }
}

@media(max-width:480px) {
  .bt-collection-grid { grid-template-columns: 1fr; }
}

`;