// src/pages/stores/StoreDetailPage.jsx

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../../services/supabaseClient";
import { useCart } from "../../../../core/context/CartContext";
import RecommendationsSection from "../../../../components/recommendations/RecommendationsSection";

export default function StoreDetailPage() {
  const { storeId } = useParams();
  const navigate    = useNavigate();
  const { addToCart, cartCount } = useCart();

  const [store,      setStore]      = useState(null);
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeCategory,  setActiveCategory]  = useState(null);
  const [activeTab,       setActiveTab]       = useState("products");
  const [search,     setSearch]     = useState("");
  const [sortBy,     setSortBy]     = useState("default");
  const [addedIds,   setAddedIds]   = useState(new Set());
  const [selectedProduct, setSelectedProduct] = useState(null);
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    const fetchStore = async () => {
      setLoading(true);

      // ── جلب المتجر — نفس الاستعلام الأصلي الذي كان يعمل ──────
      const { data: st } = await supabase
        .from("stores")
        .select(`*, vendor_profiles(business_name, phone, address)`)
        .eq("store_id", storeId)
        .single();
      setStore(st);

      // ── جلب المنتجات ──────────────────────────────────────────
      const { data: prods } = await supabase
        .from("products")
        .select(`*, product_categories(category_id, name)`)
        .eq("store_id", storeId)
        .eq("is_active", true);
      setProducts(prods || []);

      // ── التصنيفات المتاحة من المنتجات ─────────────────────────
      const cats = [];
      const seen = new Set();
      (prods || []).forEach(p => {
        if (p.product_categories && !seen.has(p.product_categories.category_id)) {
          seen.add(p.product_categories.category_id);
          cats.push(p.product_categories);
        }
      });
      setCategories(cats);
      setLoading(false);
    };
    fetchStore();
  }, [storeId]);

  const handleAddToCart = useCallback(async (product) => {
    await addToCart(product.product_id);
    setAddedIds(prev => new Set(prev).add(product.product_id));
    setTimeout(() => {
      setAddedIds(prev => {
        const n = new Set(prev); n.delete(product.product_id); return n;
      });
    }, 2000);
  }, [addToCart]);

  // ── شاشة التحميل ──────────────────────────────────────────────
  if (loading) return (
    <div style={S.loadingPage} dir="rtl">
      <div className="sd-spinner" />
      <p style={{ color: "#aaa", marginTop: 14, fontFamily: "'Cairo'" }}>جارٍ تحميل المتجر...</p>
    </div>
  );

  // ── متجر غير موجود ────────────────────────────────────────────
  if (!store) return (
    <div style={{ textAlign: "center", padding: 60, direction: "rtl", fontFamily: "'Cairo'" }}>
      <div style={{ fontSize: "3rem", marginBottom: 16 }}>🏪</div>
      <p style={{ fontWeight: 700, marginBottom: 16 }}>المتجر غير موجود</p>
      <button onClick={() => navigate("/stores")} style={S.backBtn}>← العودة للمتاجر</button>
    </div>
  );

  // ── حساب المنتجات المخفّضة ─────────────────────────────────────
  const offeredProducts = products.filter(
    p => p.original_price && p.original_price > p.price &&
      (!p.discount_expires_at || new Date(p.discount_expires_at) > new Date())
  );

  // ── فلترة وترتيب ─────────────────────────────────────────────
  let visible = products
    .filter(p => !activeCategory || p.product_categories?.category_id === activeCategory)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  if (sortBy === "price_asc")  visible = [...visible].sort((a, b) => a.price - b.price);
  if (sortBy === "price_desc") visible = [...visible].sort((a, b) => b.price - a.price);
  if (sortBy === "name")       visible = [...visible].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div dir="rtl" style={S.page}>
      <style>{CSS}</style>

      {/* ── شريط الإعلان ─────────────────────────────────────── */}
      <div style={S.announcementBar}>
        <span>🌸 توصيل مجاني للطلبات فوق ₪500</span>
        {offeredProducts.length > 0 && (
          <>
            <span style={{ margin: "0 16px", opacity: .4 }}>|</span>
            <button style={S.annBtn} onClick={() => setActiveTab("offers")}>
              🔥 {offeredProducts.length} عرض نشط في هذا المتجر
            </button>
          </>
        )}
      </div>

      {/* ── NAVBAR ───────────────────────────────────────────── */}
     <nav style={S.navbar}>
  <div style={S.navLogo} onClick={() => navigate("/boutique")}>
    Minimalist Care
  </div>

  {mobileMenuOpen && (
    <div className="sd-nav-overlay" onClick={() => setMobileMenuOpen(false)} />
  )}

  <ul className={`sd-nav-links ${mobileMenuOpen ? "open" : ""}`} style={S.navLinks}>
    <button className="sd-nav-close" onClick={() => setMobileMenuOpen(false)}>
      <i className="fas fa-times" />
    </button>
    <li><button style={S.navLink} onClick={() => { navigate("/"); setMobileMenuOpen(false); }}>الرئيسية</button></li>
    <li><button style={S.navLink} onClick={() => { navigate("/stores"); setMobileMenuOpen(false); }}>المتاجر</button></li>
    <li><button style={S.navLink} onClick={() => { navigate("/boutique"); setMobileMenuOpen(false); }}>المجموعات</button></li>
  </ul>

  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    {cartCount > 0 && (
      <button className="sd-cart-btn" onClick={() => navigate("/cart")}>
        🛒 <span style={S.cartBadge}>{cartCount}</span>
      </button>
    )}
    <button className="sd-hamburger" onClick={() => setMobileMenuOpen(true)}>
      <i className="fas fa-bars" />
    </button>
  </div>
</nav>

      {/* ── Breadcrumb ───────────────────────────────────────── */}
      <div style={S.breadcrumb}>
        <button style={S.breadBtn} onClick={() => navigate("/boutique")}>
          <i className="fas fa-home" style={{ fontSize: ".72rem" }} /> الرئيسية
        </button>
        <span style={S.breadSep}>/</span>
        <button style={S.breadBtn} onClick={() => navigate("/stores")}>المتاجر</button>
        <span style={S.breadSep}>/</span>
        <span style={S.breadCurrent}>{store.store_name}</span>
      </div>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div style={{
        ...S.heroBg,
        backgroundImage: store.hero_image ? `url(${store.hero_image})` : "none",
      }}>
        <div style={S.heroOverlay}>
          <div style={S.heroCenter}>
            {store.logo
              ? <img src={store.logo} alt="" style={S.heroLogo} />
              : <div style={S.heroLogoPlaceholder}>🏪</div>}
            <h1 style={S.heroName}>{store.store_name}</h1>
            {store.is_verified && (
              <span style={S.verifiedBadge}>
                <i className="fas fa-check-circle" /> متجر موثّق
              </span>
            )}
            {store.description && <p style={S.heroDesc}>{store.description}</p>}
            <div style={S.heroMeta}>
              {store.vendor_profiles?.address && (
                <span><i className="fas fa-map-marker-alt" /> {store.vendor_profiles.address}</span>
              )}
              {store.vendor_profiles?.phone && (
                <span><i className="fas fa-phone" /> {store.vendor_profiles.phone}</span>
              )}
              <span><i className="fas fa-box-open" /> {products.length} منتج</span>
              {offeredProducts.length > 0 && (
                <span style={S.offerHeroBadge}>
                  🔥 {offeredProducts.length} عروض
                </span>
              )}
            </div>
            {/* أزرار تواصل سريع */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 10 }}>
              {store.whatsapp && (
                <a href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noreferrer" style={S.socialBtn}>
                  <i className="fab fa-whatsapp" /> واتساب
                </a>
              )}
              {store.instagram && (
                <a href={`https://instagram.com/${store.instagram}`} target="_blank" rel="noreferrer"
                  style={{ ...S.socialBtn, background: "rgba(195,42,163,.65)" }}>
                  <i className="fab fa-instagram" /> إنستغرام
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ─────────────────────────────────────────────── */}
      <div style={S.tabsBar}>
        <div style={S.tabsInner}>
          {[
            { key: "products", label: "المنتجات",  icon: "fa-box-open"     },
            { key: "offers",   label: `العروض`,    icon: "fa-tags"         },
            { key: "about",    label: "عن المتجر", icon: "fa-info-circle"  },
          ].map(tab => (
            <button
              key={tab.key}
              className={`sd-tab ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}>
              <i className={`fas ${tab.icon}`} /> {tab.label}
              {tab.key === "offers" && offeredProducts.length > 0 && (
                <span style={S.offerTabBadge}>{offeredProducts.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      <div style={S.container}>

        {/* ── TAB: العروض ─────────────────────────────────── */}
        {activeTab === "offers" && (
          <div>
            {offeredProducts.length === 0 ? (
              <div style={S.empty}>
                <span style={{ fontSize: "3rem" }}>🏷️</span>
                <p style={{ fontWeight: 700 }}>لا توجد عروض حالية في هذا المتجر</p>
                <button className="sd-pill-btn" onClick={() => setActiveTab("products")}>
                  تصفّح جميع المنتجات
                </button>
              </div>
            ) : (
              <>
                <div style={S.offersBanner}>
                  <span style={{ fontSize: "1.5rem" }}>🔥</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "1rem", color: "#2d2825" }}>
                      عروض {store.store_name}
                    </div>
                    <div style={{ fontSize: ".82rem", color: "#9d8880" }}>
                      {offeredProducts.length} منتج بخصومات مميزة — لا تفوّتي!
                    </div>
                  </div>
                  {/* بار إحصاء */}
                  <div style={{ marginRight: "auto", display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <div style={S.offerStat}>
                      <span style={S.offerStatNum}>
                        {Math.max(...offeredProducts.map(p =>
                          Math.round(((p.original_price - p.price) / p.original_price) * 100)
                        ))}%
                      </span>
                      <span style={S.offerStatLabel}>أعلى خصم</span>
                    </div>
                  </div>
                </div>
                <div style={S.productsGrid}>
                  {offeredProducts.map(product => (
                    <ProductCard
                      key={product.product_id}
                      product={product}
                      added={addedIds.has(product.product_id)}
                      onAdd={handleAddToCart}
                      onOpen={setSelectedProduct}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── TAB: المنتجات ────────────────────────────────── */}
        {activeTab === "products" && (
          <div>
            {/* بروموشن صغير للعروض */}
            {offeredProducts.length > 0 && (
              <div style={S.offersPreviewSection}>
                <div style={S.offersPreviewHeader}>
                  <span>🔥 عروض مميزة حصرية</span>
                  <button className="sd-see-all-btn" onClick={() => setActiveTab("offers")}>
                    عرض الكل ({offeredProducts.length}) →
                  </button>
                </div>
                <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6 }}>
                  {offeredProducts.slice(0, 5).map(product => {
                    const pct = Math.round(
                      ((product.original_price - product.price) / product.original_price) * 100
                    );
                    return (
                      <div key={product.product_id} style={S.offerMiniCard}
                        onClick={() => setSelectedProduct(product)}>
                        <div style={S.offerMiniImg}>
                          {product.image_url
                            ? <img src={product.image_url} alt={product.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <span style={{ fontSize: "2rem" }}>🛍️</span>}
                          <span style={S.discountTag}>{pct}%</span>
                        </div>
                        <div style={{ padding: "8px 10px" }}>
                          <div style={{ fontWeight: 700, fontSize: ".8rem", color: "#2d2825", lineHeight: 1.3 }}>
                            {product.name.slice(0, 20)}{product.name.length > 20 ? "…" : ""}
                          </div>
                          <div style={{ display: "flex", gap: 5, alignItems: "center", marginTop: 3 }}>
                            <span style={{ fontWeight: 900, color: "#e74c3c", fontSize: ".88rem" }}>
                              ₪{product.price}
                            </span>
                            <span style={{ textDecoration: "line-through", color: "#bbb", fontSize: ".72rem" }}>
                              ₪{product.original_price}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* تبويبات الفئات */}
            {categories.length > 0 && (
              <div style={S.catScrollWrap}>
                <div style={S.catTabs}>
                  <button
                    className={`sd-cat-tab ${activeCategory === null ? "active" : ""}`}
                    onClick={() => setActiveCategory(null)}>
                    🌟 الكل ({products.length})
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.category_id}
                      className={`sd-cat-tab ${activeCategory === cat.category_id ? "active" : ""}`}
                      onClick={() => setActiveCategory(cat.category_id)}>
                      {cat.name}
                      <span style={S.catCount}>
                        {products.filter(p => p.product_categories?.category_id === cat.category_id).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* شريط البحث والترتيب */}
            <div style={S.toolbar}>
              <div style={S.searchBar}>
                <i className="fas fa-search" style={{ color: "#ccc" }} />
                <input
                  placeholder="ابحث في منتجات المتجر..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={S.searchInput}
                />
                {search && (
                  <button style={S.clearBtn} onClick={() => setSearch("")}>✕</button>
                )}
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={S.sortSelect}>
                <option value="default">ترتيب افتراضي</option>
                <option value="price_asc">السعر: الأقل أولاً</option>
                <option value="price_desc">السعر: الأعلى أولاً</option>
                <option value="name">الاسم أبجدياً</option>
              </select>
              <div style={{ color: "#888", fontSize: ".83rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                {visible.length} منتج
              </div>
            </div>

            {visible.length === 0 ? (
              <div style={S.empty}>
                <span style={{ fontSize: "3rem" }}>📦</span>
                <p>لا توجد منتجات في هذا التصنيف</p>
              </div>
            ) : (
              <div style={S.productsGrid}>
                {visible.map(product => (
                  <ProductCard
                    key={product.product_id}
                    product={product}
                    added={addedIds.has(product.product_id)}
                    onAdd={handleAddToCart}
                    onOpen={setSelectedProduct}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: عن المتجر ───────────────────────────────── */}
        {activeTab === "about" && (
          <div style={S.aboutGrid}>
            {/* معلومات المتجر */}
            <div style={S.aboutCard}>
              <h3 style={S.aboutCardTitle}>
                <i className="fas fa-store" style={{ color: "#D6A3B0" }} /> عن المتجر
              </h3>
              <p style={S.aboutText}>
                {store.description || "لا يوجد وصف متاح لهذا المتجر."}
              </p>
              <div style={S.aboutMeta}>
                {store.vendor_profiles?.address && (
                  <div style={S.aboutMetaRow}>
                    <i className="fas fa-map-marker-alt" style={{ color: "#D6A3B0", width: 18 }} />
                    <span>{store.vendor_profiles.address}</span>
                  </div>
                )}
                {store.vendor_profiles?.phone && (
                  <div style={S.aboutMetaRow}>
                    <i className="fas fa-phone" style={{ color: "#D6A3B0", width: 18 }} />
                    <span>{store.vendor_profiles.phone}</span>
                  </div>
                )}
                {store.working_hours && (
                  <div style={S.aboutMetaRow}>
                    <i className="fas fa-clock" style={{ color: "#D6A3B0", width: 18 }} />
                    <span>{store.working_hours}</span>
                  </div>
                )}
                {store.whatsapp && (
                  <div style={S.aboutMetaRow}>
                    <i className="fab fa-whatsapp" style={{ color: "#25D366", width: 18 }} />
                    <a href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noreferrer"
                      style={{ color: "#25D366", fontWeight: 700 }}>
                      {store.whatsapp}
                    </a>
                  </div>
                )}
                {store.instagram && (
                  <div style={S.aboutMetaRow}>
                    <i className="fab fa-instagram" style={{ color: "#C33ABC", width: 18 }} />
                    <a href={`https://instagram.com/${store.instagram}`} target="_blank" rel="noreferrer"
                      style={{ color: "#C33ABC", fontWeight: 700 }}>
                      @{store.instagram}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* سياسة الاسترجاع */}
            {store.return_policy && (
              <div style={S.aboutCard}>
                <h3 style={S.aboutCardTitle}>
                  <i className="fas fa-undo" style={{ color: "#D6A3B0" }} /> سياسة الاسترجاع والاستبدال
                </h3>
                <p style={S.aboutText}>{store.return_policy}</p>
              </div>
            )}

            {/* سياسة الشحن */}
            {store.shipping_policy && (
              <div style={S.aboutCard}>
                <h3 style={S.aboutCardTitle}>
                  <i className="fas fa-truck" style={{ color: "#D6A3B0" }} /> سياسة الشحن والتوصيل
                </h3>
                <p style={S.aboutText}>{store.shipping_policy}</p>
              </div>
            )}

            {/* سياسة الخصوصية */}
            {store.privacy_policy && (
              <div style={S.aboutCard}>
                <h3 style={S.aboutCardTitle}>
                  <i className="fas fa-shield-alt" style={{ color: "#D6A3B0" }} /> سياسة الخصوصية
                </h3>
                <p style={S.aboutText}>{store.privacy_policy}</p>
              </div>
            )}

            {/* شروط الاستخدام */}
            {store.terms_of_service && (
              <div style={S.aboutCard}>
                <h3 style={S.aboutCardTitle}>
                  <i className="fas fa-file-contract" style={{ color: "#D6A3B0" }} /> شروط الاستخدام
                </h3>
                <p style={S.aboutText}>{store.terms_of_service}</p>
              </div>
            )}

            {/* لا توجد سياسات */}
            {!store.return_policy && !store.shipping_policy && !store.privacy_policy && !store.terms_of_service && (
              <div style={{ ...S.aboutCard, gridColumn: "1 / -1", textAlign: "center", color: "#aaa" }}>
                <i className="fas fa-info-circle" style={{ fontSize: "2rem", marginBottom: 10, display: "block" }} />
                <p>لم يضف هذا المتجر سياساته بعد. للاستفسار تواصل معهم مباشرة.</p>
              </div>
            )}
          </div>
        )}

        {/* توصيات */}
        {store && products.length > 0 && activeTab === "products" && (
          <div style={{ marginTop: 48 }}>
            <RecommendationsSection
              isAr={true}
              mode="store"
              storeId={store.store_id}
              myUserId={null}
              maxCards={3}
            />
          </div>
        )}
      </div>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={S.footer}>
        <div style={S.footerInner}>
          <div style={S.footerTop}>
            <div>
              <div style={S.footerLogo}>Minimalist Care</div>
              <p style={S.footerTagline}>رحلة أمومة أكثر هدوءاً 🌸</p>
              {/* سوشيال */}
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                {store.whatsapp && (
                  <a href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noreferrer"
                    style={S.footerSocial}>
                    <i className="fab fa-whatsapp" />
                  </a>
                )}
                {store.instagram && (
                  <a href={`https://instagram.com/${store.instagram}`} target="_blank" rel="noreferrer"
                    style={{ ...S.footerSocial, background: "rgba(195,42,163,.2)" }}>
                    <i className="fab fa-instagram" />
                  </a>
                )}
              </div>
            </div>
            <div>
              <div style={S.footerSectionTitle}>روابط سريعة</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button style={S.footerLink} onClick={() => navigate("/boutique")}>الرئيسية</button>
                <button style={S.footerLink} onClick={() => navigate("/stores")}>جميع المتاجر</button>
                <button style={S.footerLink} onClick={() => navigate("/cart")}>سلة التسوق</button>
                {offeredProducts.length > 0 && (
                  <button style={S.footerLink} onClick={() => setActiveTab("offers")}>
                    🔥 عروض المتجر
                  </button>
                )}
              </div>
            </div>
            <div>
              <div style={S.footerSectionTitle}>تواصل مع المتجر</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {store.vendor_profiles?.phone && (
                  <span style={S.footerInfo}>
                    <i className="fas fa-phone" /> {store.vendor_profiles.phone}
                  </span>
                )}
                {store.vendor_profiles?.address && (
                  <span style={S.footerInfo}>
                    <i className="fas fa-map-marker-alt" /> {store.vendor_profiles.address}
                  </span>
                )}
                {store.working_hours && (
                  <span style={S.footerInfo}>
                    <i className="fas fa-clock" /> {store.working_hours}
                  </span>
                )}
              </div>
            </div>
            <div>
              <div style={S.footerSectionTitle}>السياسات</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {store.return_policy && (
                  <button style={S.footerLink} onClick={() => setActiveTab("about")}>
                    ↩ سياسة الاسترجاع
                  </button>
                )}
                {store.shipping_policy && (
                  <button style={S.footerLink} onClick={() => setActiveTab("about")}>
                    🚚 سياسة الشحن
                  </button>
                )}
                {store.privacy_policy && (
                  <button style={S.footerLink} onClick={() => setActiveTab("about")}>
                    🛡 سياسة الخصوصية
                  </button>
                )}
                {store.terms_of_service && (
                  <button style={S.footerLink} onClick={() => setActiveTab("about")}>
                    📄 شروط الاستخدام
                  </button>
                )}
                {!store.return_policy && !store.shipping_policy && !store.privacy_policy && !store.terms_of_service && (
                  <span style={{ ...S.footerInfo, opacity: .45 }}>لا توجد سياسات مضافة</span>
                )}
              </div>
            </div>
          </div>
          <div style={S.footerBottom}>
            © 2025 Minimalist Care — {store.store_name} — جميع الحقوق محفوظة
          </div>
        </div>
      </footer>

      {/* ── Modal المنتج ─────────────────────────────────────── */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          storeName={store.store_name}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          addedIds={addedIds}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// مكوّن بطاقة المنتج — مع شارة الخصم
// ═══════════════════════════════════════════════════════════════════
function ProductCard({ product, added, onAdd, onOpen }) {
  const hasDiscount = product.original_price && product.original_price > product.price &&
    (!product.discount_expires_at || new Date(product.discount_expires_at) > new Date());
  const discountPercent = hasDiscount
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  return (
    <div className="sd-product-card">
      {/* صورة المنتج */}
      <div style={S.productImgWrap} onClick={() => onOpen(product)}>
        {product.image_url
          ? <img src={product.image_url} alt={product.name} style={S.productImg} />
          : <div style={S.productImgPlaceholder}>🛍️</div>}

        {/* شارة الخصم */}
        {hasDiscount && (
          <div style={S.discountBadge}>
            <span style={S.discountBadgeIcon}>🔥</span>
            <span>خصم {discountPercent}%</span>
          </div>
        )}

        {/* نص العرض */}
        {hasDiscount && product.discount_label && (
          <div style={S.offerLabelBadge}>{product.discount_label}</div>
        )}

        {/* مخزون منخفض */}
        {!hasDiscount && product.stock < 5 && product.stock > 0 && (
          <span style={S.lowStockBadge}>آخر {product.stock} قطع</span>
        )}

        {/* نفد المخزون */}
        {product.stock === 0 && (
          <div style={S.outOfStockOverlay}>نفد المخزون</div>
        )}
      </div>

      {/* بيانات المنتج */}
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={S.productCatChip}>
          {product.product_categories?.name || "منتج"}
        </div>
        <h3 style={S.productName} onClick={() => onOpen(product)}>
          {product.name}
        </h3>
        {product.description && (
          <p style={S.productDesc}>
            {product.description.slice(0, 60)}
            {product.description.length > 60 ? "..." : ""}
          </p>
        )}

        <div style={S.productFooter}>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ ...S.productPrice, color: hasDiscount ? "#e74c3c" : "#D6A3B0" }}>
              ₪ {product.price}
            </span>
            {hasDiscount && (
              <span style={S.originalPrice}>₪ {product.original_price}</span>
            )}
          </div>
          <button
            className={`sd-add-btn ${added ? "added" : ""}`}
            disabled={product.stock === 0}
            onClick={() => onAdd(product)}>
            {added
              ? <><i className="fas fa-check" /> أضيف!</>
              : product.stock === 0
                ? "نفد"
                : <><i className="fas fa-shopping-cart" /> أضف</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Modal تفاصيل المنتج
// ═══════════════════════════════════════════════════════════════════
function ProductModal({ product, storeName, onClose, onAddToCart, addedIds }) {
  const added = addedIds.has(product.product_id);
  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  return (
    <div style={S.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal} dir="rtl">
        <button style={S.modalClose} onClick={onClose}>
          <i className="fas fa-times" />
        </button>

        {/* صورة */}
        <div style={{ ...S.modalImgWrap, position: "relative" }}>
          {product.image_url
            ? <img src={product.image_url} alt={product.name} style={S.modalImg} />
            : <div style={S.modalImgPlaceholder}>🛍️</div>}
          {hasDiscount && (
            <div style={{ ...S.discountBadge, position: "absolute", top: 14, right: 14, fontSize: ".82rem" }}>
              <span>🔥</span> خصم {discountPercent}%
            </div>
          )}
        </div>

        <div style={{ padding: "20px 24px 28px" }}>
          <div style={S.productCatChip}>{product.product_categories?.name}</div>
          <h2 style={{ fontWeight: 900, fontSize: "1.3rem", marginBottom: 6, color: "#2d2825" }}>
            {product.name}
          </h2>
          <div style={{ fontSize: ".82rem", color: "#aaa", marginBottom: 14 }}>
            <i className="fas fa-store" /> {storeName}
          </div>

          {product.description && (
            <p style={{ fontSize: ".9rem", color: "#666", lineHeight: 1.75, marginBottom: 18 }}>
              {product.description}
            </p>
          )}

          {/* السعر */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{ fontSize: "1.65rem", fontWeight: 900, color: hasDiscount ? "#e74c3c" : "#D6A3B0" }}>
              ₪ {product.price}
            </span>
            {hasDiscount && (
              <>
                <span style={{ fontSize: "1rem", color: "#bbb", textDecoration: "line-through" }}>
                  ₪ {product.original_price}
                </span>
                {product.discount_label && (
                  <span style={S.offerLabelBadge}>{product.discount_label}</span>
                )}
              </>
            )}
          </div>

          <div style={{ fontSize: ".82rem", color: "#aaa", marginBottom: 18 }}>
            <i className="fas fa-boxes" /> المخزون: {product.stock} قطعة
          </div>

          <button
            className={`sd-add-btn ${added ? "added" : ""}`}
            style={{ width: "100%", justifyContent: "center", padding: "13px 0", fontSize: ".9rem" }}
            disabled={product.stock === 0}
            onClick={() => onAddToCart(product)}>
            {added
              ? <><i className="fas fa-check" /> تمت الإضافة للسلة!</>
              : product.stock === 0
                ? "نفد المخزون"
                : <><i className="fas fa-shopping-cart" /> أضف للسلة</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════
const S = {
  page:        { background: "#F8F1EA", minHeight: "100vh", fontFamily: "'Cairo','Tajawal',sans-serif", color: "#2d2825" },
  loadingPage: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#F8F1EA", gap: 14, direction: "rtl" },

  announcementBar: {
    background: "linear-gradient(90deg,#1a2e2a,#2e5d52,#1a2e2a)",
    color: "#8fcfc0", textAlign: "center",
    padding: "8px 20px", fontSize: ".78rem", fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 6, flexWrap: "wrap",
  },
  annBtn: {
    background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)",
    color: "#fff", padding: "2px 12px", borderRadius: 20, cursor: "pointer",
    fontFamily: "'Cairo'", fontWeight: 700, fontSize: ".76rem",
  },

  navbar: {
    background: "rgba(247,237,226,.96)", backdropFilter: "blur(12px)",
    borderBottom: "1px solid #EADED3", padding: "0 32px", height: 64,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    position: "sticky", top: 0, zIndex: 100,
  },
  navLogo: {
    fontFamily: "'Georgia',serif", fontStyle: "italic",
    fontSize: "1.25rem", color: "#8C746A", fontWeight: 700, cursor: "pointer",
  },
  navLinks: { display: "flex", listStyle: "none", gap: 4, margin: 0, padding: 0 },
  navLink:  {
    background: "none", border: "none", color: "#7d6a63",
    fontFamily: "'Cairo'", fontWeight: 600, fontSize: ".88rem",
    cursor: "pointer", padding: "8px 14px", borderRadius: 20, transition: ".2s",
  },
  cartBadge: {
    background: "rgba(255,255,255,.25)", borderRadius: "50%",
    width: 20, height: 20, display: "inline-flex",
    alignItems: "center", justifyContent: "center", fontSize: ".72rem",
  },

  breadcrumb: {
    maxWidth: 1200, margin: "0 auto", padding: "10px 28px",
    display: "flex", alignItems: "center", gap: 7, fontSize: ".8rem",
  },
  breadBtn: {
    background: "none", border: "none", color: "#9d8880",
    cursor: "pointer", fontFamily: "'Cairo'", fontWeight: 600,
    padding: 0, fontSize: ".8rem", display: "flex", alignItems: "center", gap: 4,
  },
  breadSep:     { color: "#ddd" },
  breadCurrent: { color: "#D6A3B0", fontWeight: 700 },

  heroBg: {
    minHeight: 400, backgroundSize: "cover", backgroundPosition: "center",
    position: "relative", backgroundColor: "#1a2e2a",
  },
  heroOverlay: {
    position: "absolute", inset: 0, background: "rgba(0,0,0,.52)",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", padding: "44px 28px",
  },
  heroCenter:  { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center" },
  heroLogo:    { width: 88, height: 88, borderRadius: 20, objectFit: "cover", border: "3px solid rgba(255,255,255,.28)" },
  heroLogoPlaceholder: { width: 88, height: 88, borderRadius: 20, background: "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" },
  heroName:    { color: "#fff", fontWeight: 900, fontSize: "1.9rem" },
  heroDesc:    { color: "rgba(255,255,255,.75)", fontSize: ".9rem", maxWidth: 500 },
  heroMeta:    { display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", color: "rgba(255,255,255,.65)", fontSize: ".82rem" },
  verifiedBadge: { background: "rgba(26,107,92,.8)", color: "#8fcfc0", fontSize: ".75rem", fontWeight: 700, padding: "4px 12px", borderRadius: 20 },
  offerHeroBadge: { background: "rgba(231,76,60,.85)", color: "#fff", fontWeight: 700, borderRadius: 20, padding: "2px 10px", fontSize: ".76rem" },
  backBtn:     { background: "rgba(255,255,255,.15)", border: "none", color: "#fff", padding: "8px 16px", borderRadius: 20, cursor: "pointer", fontFamily: "'Cairo'", fontWeight: 700, fontSize: ".83rem" },
  socialBtn:   { background: "rgba(37,211,102,.65)", color: "#fff", border: "none", padding: "7px 16px", borderRadius: 20, cursor: "pointer", fontFamily: "'Cairo'", fontWeight: 700, fontSize: ".8rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 },

  tabsBar:   { background: "#fff", borderBottom: "1px solid #F0E6DD", position: "sticky", top: 64, zIndex: 90 },
  tabsInner: { maxWidth: 1200, margin: "0 auto", padding: "0 28px", display: "flex", gap: 4 },
  offerTabBadge: { background: "#e74c3c", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: ".62rem", fontWeight: 800, marginRight: 4 },

  container:  { maxWidth: 1200, margin: "0 auto", padding: "28px 24px" },

  // Offers banner
  offersBanner: {
    background: "linear-gradient(135deg,#fff8f0,#fef0f0)",
    border: "1px solid #fde8c8", borderRadius: 16,
    padding: "18px 22px", marginBottom: 28,
    display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
  },
  offerStat:      { display: "flex", flexDirection: "column", alignItems: "center" },
  offerStatNum:   { fontSize: "1.3rem", fontWeight: 900, color: "#e74c3c" },
  offerStatLabel: { fontSize: ".7rem", color: "#9d8880", fontWeight: 600 },

  // Offers preview strip
  offersPreviewSection: {
    background: "#fff", borderRadius: 16, border: "1px solid #F0E6DD",
    padding: "18px 20px", marginBottom: 24,
  },
  offersPreviewHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 14, fontWeight: 800, fontSize: ".95rem", color: "#2d2825",
  },
  offerMiniCard: {
    background: "#F8F1EA", borderRadius: 12, overflow: "hidden",
    border: "1px solid #F0E6DD", cursor: "pointer",
    minWidth: 145, maxWidth: 155, flexShrink: 0, transition: ".3s",
  },
  offerMiniImg: {
    height: 100, background: "#f0ebe4", position: "relative",
    overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
  },
  discountTag: {
    position: "absolute", top: 6, right: 6,
    background: "#e74c3c", color: "#fff",
    fontSize: ".65rem", fontWeight: 800, padding: "2px 7px", borderRadius: 20,
  },

  // Cats
  catScrollWrap: { overflowX: "auto", marginBottom: 20, paddingBottom: 6 },
  catTabs:       { display: "flex", gap: 10, minWidth: "max-content" },
  catCount:      { background: "rgba(255,255,255,.35)", borderRadius: 12, padding: "1px 7px", fontSize: ".7rem", marginRight: 5 },

  // Toolbar
  toolbar:    { display: "flex", gap: 12, alignItems: "center", marginBottom: 22, flexWrap: "wrap" },
  searchBar:  { background: "#fff", borderRadius: 50, padding: "9px 16px", display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 180, border: "1px solid #F0E6DD" },
  searchInput:{ border: "none", background: "transparent", outline: "none", fontFamily: "'Cairo'", fontSize: ".88rem", width: "100%" },
  clearBtn:   { background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: ".85rem" },
  sortSelect: { padding: "9px 14px", borderRadius: 12, border: "1px solid #F0E6DD", background: "#fff", fontFamily: "'Cairo'", fontSize: ".83rem", outline: "none", cursor: "pointer" },

  // Products grid
  productsGrid:       { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 20 },
  productImgWrap:     { height: 195, overflow: "hidden", position: "relative", cursor: "pointer", background: "#f5f0ea" },
  productImg:         { width: "100%", height: "100%", objectFit: "cover", transition: ".45s" },
  productImgPlaceholder:{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" },

  // Discount badge — prominent
  discountBadge: {
    position: "absolute", top: 0, right: 0,
    background: "linear-gradient(135deg,#e74c3c,#c0392b)",
    color: "#fff", fontSize: ".72rem", fontWeight: 800,
    padding: "6px 12px 6px 10px",
    borderRadius: "0 0 0 14px",
    display: "flex", alignItems: "center", gap: 4,
    boxShadow: "0 2px 8px rgba(231,76,60,.4)",
  },
  discountBadgeIcon: { fontSize: ".85rem" },

  offerLabelBadge: {
    position: "absolute", bottom: 8, right: 8,
    background: "rgba(231,76,60,.92)", color: "#fff",
    fontSize: ".68rem", fontWeight: 700, padding: "3px 9px", borderRadius: 20,
  },
  lowStockBadge: {
    position: "absolute", top: 8, right: 8,
    background: "#fff8f0", color: "#f39c12",
    fontSize: ".7rem", fontWeight: 700, padding: "3px 9px", borderRadius: 20,
  },
  outOfStockOverlay: {
    position: "absolute", inset: 0, background: "rgba(0,0,0,.42)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: 700, fontSize: ".9rem",
  },
  productCatChip: {
    background: "#F8F1EA", color: "#8C746A",
    fontSize: ".72rem", fontWeight: 700, padding: "3px 9px",
    borderRadius: 20, display: "inline-block", marginBottom: 6,
  },
  productName:   { fontWeight: 800, fontSize: ".95rem", color: "#2d2825", marginBottom: 4, cursor: "pointer" },
  productDesc:   { fontSize: ".78rem", color: "#aaa", lineHeight: 1.5, marginBottom: 10 },
  productFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" },
  productPrice:  { fontWeight: 900, fontSize: "1.05rem" },
  originalPrice: { fontSize: ".76rem", color: "#bbb", textDecoration: "line-through" },
  empty:         { textAlign: "center", padding: "52px 20px", color: "#aaa", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 },

  // About
  aboutGrid:       { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 20 },
  aboutCard:       { background: "#fff", borderRadius: 16, padding: "22px 24px", border: "1px solid #F0E6DD" },
  aboutCardTitle:  { fontWeight: 800, fontSize: ".95rem", color: "#2d2825", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 },
  aboutText:       { fontSize: ".85rem", color: "#666", lineHeight: 1.8 },
  aboutMeta:       { marginTop: 18, display: "flex", flexDirection: "column", gap: 10 },
  aboutMetaRow:    { display: "flex", alignItems: "center", gap: 10, fontSize: ".85rem", color: "#555" },

  // Modal
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.52)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: 16 },
  modal:        { background: "#fff", borderRadius: 22, width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto", position: "relative", fontFamily: "'Cairo'" },
  modalClose:   { position: "absolute", top: 14, left: 14, background: "rgba(0,0,0,.28)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: ".9rem", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center" },
  modalImgWrap: { height: 250, overflow: "hidden", borderRadius: "22px 22px 0 0" },
  modalImg:     { width: "100%", height: "100%", objectFit: "cover" },
  modalImgPlaceholder: { width: "100%", height: "100%", background: "#f5f0ea", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "4rem" },

  // Footer
  footer:       { background: "#1a2e2a", color: "#a9c5be", marginTop: 64, padding: "52px 24px 28px" },
  footerInner:  { maxWidth: 1200, margin: "0 auto" },
  footerTop:    { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 36, marginBottom: 36 },
  footerLogo:   { fontFamily: "'Georgia',serif", fontStyle: "italic", fontSize: "1.4rem", color: "#8fcfc0", marginBottom: 8 },
  footerTagline:{ fontSize: ".85rem", opacity: .75 },
  footerSectionTitle: { fontWeight: 800, color: "#dbe8e5", marginBottom: 14, fontSize: ".88rem" },
  footerLink:   { background: "none", border: "none", color: "#8fcfc0", fontFamily: "'Cairo'", fontWeight: 600, fontSize: ".82rem", cursor: "pointer", padding: 0, textAlign: "right", display: "block", marginBottom: 6 },
  footerInfo:   { fontSize: ".82rem", color: "#8fcfc0", display: "flex", alignItems: "center", gap: 8 },
  footerSocial: { background: "rgba(37,211,102,.2)", color: "#8fcfc0", width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", fontSize: "1rem", transition: ".3s" },
  footerBottom: { borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 22, textAlign: "center", fontSize: ".74rem", opacity: .45 },
};

// ═══════════════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════════════
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}

.sd-spinner{
  width:38px;height:38px;border-radius:50%;
  border:4px solid #F0E6DD;border-top-color:#D6A3B0;
  animation:spin .8s linear infinite;
}

/* Tab */
.sd-tab{
  background:none;border:none;border-bottom:3px solid transparent;
  padding:15px 20px;font-family:'Cairo';font-weight:700;
  font-size:.87rem;color:#9d8880;cursor:pointer;transition:.25s;
  display:inline-flex;align-items:center;gap:7px;white-space:nowrap;
}
.sd-tab:hover{color:#D6A3B0;}
.sd-tab.active{color:#D6A3B0;border-bottom-color:#D6A3B0;}

/* Cat tab */
.sd-cat-tab{
  background:#fff;border:1.5px solid #F0E6DD;padding:8px 18px;
  border-radius:25px;font-family:'Cairo';font-weight:700;
  font-size:.82rem;color:#8C746A;cursor:pointer;transition:.3s;white-space:nowrap;
}
.sd-cat-tab:hover{border-color:#D6A3B0;color:#D6A3B0;}
.sd-cat-tab.active{background:#D6A3B0;color:#fff;border-color:#D6A3B0;}

/* Product card */
.sd-product-card{
  background:#fff;border-radius:16px;border:1px solid #F0E6DD;
  overflow:hidden;transition:.35s;animation:fadeUp .4s ease forwards;
}
.sd-product-card:hover{transform:translateY(-5px);box-shadow:0 12px 30px rgba(214,163,176,.2);}
.sd-product-card:hover img{transform:scale(1.06);}

/* Add button */
.sd-add-btn{
  background:#F8F1EA;color:#8C746A;border:1.5px solid #F0E6DD;
  padding:8px 14px;border-radius:25px;cursor:pointer;
  font-family:'Cairo';font-weight:700;font-size:.78rem;
  display:inline-flex;align-items:center;gap:6px;transition:.3s;
}
.sd-add-btn:hover:not(:disabled){background:#D6A3B0;color:#fff;border-color:#D6A3B0;}
.sd-add-btn.added{background:#e8f5f2;color:#1a6b5c;border-color:#1a6b5c;}
.sd-add-btn:disabled{opacity:.5;cursor:not-allowed;}

/* Pill button */
.sd-pill-btn{
  background:#D6A3B0;color:#fff;border:none;
  padding:10px 24px;border-radius:25px;cursor:pointer;
  font-family:'Cairo';font-weight:700;font-size:.87rem;transition:.3s;
}
.sd-pill-btn:hover{background:#c27a8c;}

/* See all */
.sd-see-all-btn{
  background:none;border:none;color:#D6A3B0;
  font-family:'Cairo';font-weight:700;font-size:.82rem;
  cursor:pointer;transition:.2s;
}
.sd-see-all-btn:hover{text-decoration:underline;}

/* Cart */
.sd-cart-btn{
  background:#D6A3B0;color:#fff;border:none;
  padding:8px 18px;border-radius:25px;cursor:pointer;
  font-family:'Cairo';font-weight:700;font-size:.85rem;
  display:flex;align-items:center;gap:8px;transition:.3s;
}
.sd-cart-btn:hover{background:#c27a8c;}

/* Offer mini card hover */
.sd-offer-mini:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(0,0,0,.1);}

.sd-hamburger {
  display: none;
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  color: #7d6a63;
  padding: 8px;
}

.sd-nav-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.35);
  z-index: 99;
}

.sd-nav-close {
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

@media(max-width:768px){
  .sd-tab { padding:12px 10px; font-size:.8rem; }
  .sd-hamburger { display: flex; align-items: center; }

  .sd-nav-links {
    position: fixed !important;
    top: 0; right: 0; bottom: 0;
    width: 260px;
    background: rgba(247,237,226,.98) !important;
    backdrop-filter: blur(12px);
    flex-direction: column !important;
    padding: 70px 16px 30px !important;
    gap: 4px !important;
    z-index: 100;
    box-shadow: -4px 0 20px rgba(0,0,0,.12);
    display: none !important;
  }

  .sd-nav-links.open { display: flex !important; }
  .sd-nav-close { display: flex; }
}`;