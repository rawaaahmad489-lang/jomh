
// src/pages/vendor/VendorDashboard.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../services/supabaseClient";

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("ar-SA", {
    year: "numeric", month: "short", day: "numeric",
  }) : "—";

const DELIVERY_LABELS = {
  pending:          "قيد الانتظار",
  confirmed:        "مؤكد",
  out_for_delivery: "جاري التوصيل",
  delivered:        "تم التوصيل",
  cancelled:        "ملغى",
};
const DELIVERY_COLORS = {
  pending:          { bg: "#fff8f0", color: "#f39c12" },
  confirmed:        { bg: "#f0faf4", color: "#2ecc71" },
  out_for_delivery: { bg: "#f0f4ff", color: "#3498db" },
  delivered:        { bg: "#f0faf4", color: "#27ae60" },
  cancelled:        { bg: "#fef0f0", color: "#e74c3c" },
};

// ═══════════════════════════════════════════════════════════════════════════════
// useVendorData — يجلب كل البيانات المرتبطة بالـ vendor من قاعدة البيانات
// الجداول: users, vendor_profiles, stores, products, product_categories,
//          order_items → orders → users
// ═══════════════════════════════════════════════════════════════════════════════
function useVendorData() {
  const [loading,    setLoading]    = useState(true);
  const [user,       setUser]       = useState(null);
  const [profile,    setProfile]    = useState(null);
  const [store,      setStore]      = useState(null);
  const [products,   setProducts]   = useState([]);
  const [orders,     setOrders]     = useState([]);
  const [categories, setCategories] = useState([]);
const [notifications, setNotifications] = useState([]);
const [unreadCount,   setUnreadCount]   = useState(0);
  const fetchAll = async () => {
    setLoading(true);
    try {
      // ── 1. Auth user ────────────────────────────────────────────────────────
      const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authUser) { setLoading(false); return; }

      // ── 2. users row ─────────────────────────────────────────────────────────
      const { data: u, error: uErr } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authUser.id)
        .single();
      if (uErr || !u) { setLoading(false); return; }
      setUser(u);

      // ── 3. vendor_profiles ───────────────────────────────────────────────────
      // vendor_id = user_id  (FK: vendor_profiles.vendor_id → users.user_id)
      const { data: vp } = await supabase
        .from("vendor_profiles")
        .select("*")
        .eq("vendor_id", u.user_id)
        .maybeSingle();           // ← maybeSingle لأن البروفايل قد لا يكون منشأ بعد
      setProfile(vp || null);

      // ── 4. product_categories ────────────────────────────────────────────────
      const { data: cats } = await supabase
        .from("product_categories")
        .select("category_id, name")
        .order("name");
      setCategories(cats || []);

      // ── 5. store ─────────────────────────────────────────────────────────────
      // stores.vendor_id → vendor_profiles.vendor_id → users.user_id
     const { data: st } = await supabase
  .from("stores")
  .select(`
    store_id, vendor_id, store_name, description, logo, is_verified,
    hero_image, working_hours, whatsapp, instagram,
    return_policy, shipping_policy, privacy_policy, terms_of_service
  `)
  .eq("vendor_id", u.user_id)
  .maybeSingle();
      setStore(st || null);
const { data: notifs } = await supabase
  .from("notifications")
  .select("*")
  .eq("user_id", u.user_id)
  .order("created_at", { ascending: false })
  .limit(20);

setNotifications(notifs || []);
setUnreadCount((notifs || []).filter(n => !n.is_read).length);
      // ── 6. products + orders (فقط إذا يوجد متجر) ────────────────────────────
    



if (st) {
  // products
  const { data: prods } = await supabase
    .from("products")
    .select(`
      product_id, store_id, name, description,
      price, stock, image_url, is_active,
      category_id,
      product_categories ( category_id, name )
    `)
    .eq("store_id", st.store_id)
    .order("is_active", { ascending: false });
  setProducts(prods || []);

  // orders — join مباشر (يعمل بعد إصلاح الـ checkout)
  const { data: oi, error: oiErr } = await supabase
    .from("order_items")
    .select(`
      order_id,
      product_id,
      store_id,
      quantity,
      price,
      product_name_snapshot,
      price_snapshot,
      orders (
        order_id, user_id, total,
        delivery_address, contact_phone,
        payment_method, payment_status,
        delivery_status, is_cod_confirmed,
        tracking_number, created_at,
        users ( name )
      )
    `)
    .eq("store_id", st.store_id);

  if (oiErr) console.error("order_items fetch error:", oiErr);

  const orderMap = {};
  (oi || []).forEach(item => {
    const o = item.orders;
    if (!o) return;
    if (!orderMap[o.order_id]) {
      orderMap[o.order_id] = { ...o, items: [] };
    }
    orderMap[o.order_id].items.push({
      product_id:            item.product_id,
      quantity:              item.quantity,
      price_snapshot:        item.price_snapshot,
      product_name_snapshot: item.product_name_snapshot,
    });
  });
  setOrders(Object.values(orderMap));
} else {
  setProducts([]);
  setOrders([]);
}


    } catch (e) {
      console.error("useVendorData error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return {
    loading,
    user,
    profile,
    store,
    products,
    orders,
    categories,
    refetch: fetchAll,
  };
}
    
export default function VendorDashboard() {
  const navigate = useNavigate();
  const { loading, user, profile, store, products, orders, categories, refetch } = useVendorData();

  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen,   setSidebarOpen]   = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const NAV = [
    { key: "overview",  label: "نظرة عامة",   icon: "fas fa-th-large"    },
    { key: "store",     label: "إعداد المتجر", icon: "fas fa-store"       },
    { key: "products",  label: "المنتجات",     icon: "fas fa-box-open"    },
    { key: "orders",    label: "الطلبات",      icon: "fas fa-shopping-bag"},
    { key: "profile",   label: "ملفي",         icon: "fas fa-user-cog"    },
  ];

  if (loading) return (
    <div style={S.loading}>
      <div style={S.spinner} />
      <p style={{ color: "#718096", fontFamily: "'Cairo'" }}>جارٍ التحميل...</p>
    </div>
  );

  // ── حسابات الـ Overview ──────────────────────────────────────────────────
  const vendorName    = user?.name || "التاجر";
  const totalRevenue  = orders
    .filter(o => o.delivery_status === "delivered")
    .reduce((s, o) => s + (o.items?.reduce((a, i) => a + (i.price_snapshot ?? 0) * i.quantity, 0) || 0), 0);
  const pendingOrders  = orders.filter(o => o.delivery_status === "pending").length;
  const activeProducts = products.filter(p => p.is_active).length;

  return (
    <div style={S.root} dir="rtl">
      <style>{CSS}</style>

      {/* Overlay للموبايل */}
      {sidebarOpen && (
        <div style={S.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* ══════════ SIDEBAR ══════════ */}
      <aside
        className={`vnd-sidebar ${sidebarOpen ? "open" : ""}`}
        style={S.sidebar}>

        <div style={S.sbLogo}>Minimalist Care</div>

        {/* Avatar */}
        <div style={S.sbAvatar}>
          {user?.avatar_url
            ? <img src={user.avatar_url} alt="" style={S.avatarImg} />
            : <div style={S.avatarInit}>{vendorName.charAt(0)}</div>}
          <div>
            <div style={{ fontWeight: 700, fontSize: ".93rem", color: "#dbe8e5" }}>
              {vendorName}
            </div>
            <div style={{ fontSize: ".73rem", color: "#8fcfc0", marginTop: 2 }}>
              {store?.store_name || "لم يتم إنشاء متجر"}
            </div>
            {store?.is_verified && (
              <div style={{ fontSize: ".68rem", color: "#2ecc71", marginTop: 2 }}>
                <i className="fas fa-check-circle" /> موثّق
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "12px 10px", flex: 1, overflowY: "auto" }}>
          {NAV.map(n => (
            <button
              key={n.key}
              className={`vnd-nav ${activeSection === n.key ? "active" : ""}`}
              onClick={() => { setActiveSection(n.key); setSidebarOpen(false); }}>
              <i className={n.icon} />
              <span>{n.label}</span>
              {/* Badge طلبات معلقة */}
              {n.key === "orders" && pendingOrders > 0 && (
                <span style={S.navBadge}>{pendingOrders}</span>
              )}
            </button>
          ))}

          {/* زر عرض المتجر العام */}
          {store && (
            <button
              className="vnd-nav"
              onClick={() => navigate(`/stores/${store.store_id}`)}>
              <i className="fas fa-external-link-alt" />
              <span>عرض المتجر</span>
            </button>
          )}

          <button className="vnd-nav vnd-logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt" />
            <span>تسجيل الخروج</span>
          </button>
        </nav>
      </aside>

      {/* ══════════ MAIN ══════════ */}
      <div style={S.main}>

        {/* Topbar */}
        <header style={S.topbar}>
          <button 
  className="vnd-hamburger-btn"
  style={S.hamburger} 
  onClick={() => setSidebarOpen(true)}>
  <i className="fas fa-bars" />
</button>
          <div style={{ fontWeight: 800, fontSize: "1rem", color: "#1a2e2a" }}>
            {NAV.find(n => n.key === activeSection)?.label}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {store && (
              <button
                className="vnd-btn-secondary"
                style={{ fontSize: ".8rem", padding: "7px 14px" }}
                onClick={() => navigate(`/stores/${store.store_id}`)}>
                <i className="fas fa-eye" /> معاينة
              </button>
            )}
            <div style={S.topAvatarWrap}>
              {user?.avatar_url
                ? <img src={user.avatar_url} alt=""
                    style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }} />
                : <div style={S.topAvatarInit}>{vendorName.charAt(0)}</div>}
            </div>
          </div>
        </header>

        {/* Content */}
        <div style={S.content}>
          {activeSection === "overview" && (
            <OverviewSection
              vendorName={vendorName}
              store={store}
              products={products}
              orders={orders}
              totalRevenue={totalRevenue}
              pendingOrders={pendingOrders}
              activeProducts={activeProducts}
              setActiveSection={setActiveSection}
            />
          )}
          {activeSection === "store" && (
            <StoreSection
              store={store}
              vendorId={user?.user_id}
              refetch={refetch}
            />
          )}
          {activeSection === "products" && (
            <ProductsSection
              products={products}
              store={store}
              categories={categories}
              refetch={refetch}
            />
          )}
          {activeSection === "orders" && (
            <OrdersSection orders={orders} refetch={refetch} />
          )}
          {activeSection === "profile" && (
            <ProfileSection user={user} profile={profile} refetch={refetch} />
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════
function OverviewSection({
  vendorName, store, products, orders,
  totalRevenue, pendingOrders, activeProducts, setActiveSection,
}) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? `صباح الخير، ${vendorName} ☀️` :
    hour < 18 ? `مساء الخير، ${vendorName} ☕`  :
                `طاب مساؤك، ${vendorName} 🌙`;

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const STATS = [
    { icon: "fa-coins",        val: `₪ ${totalRevenue.toFixed(0)}`, lbl: "إجمالي الإيرادات",  bg: "#e8f5f2", color: "#1a6b5c" },
    { icon: "fa-shopping-bag", val: orders.length,                   lbl: "إجمالي الطلبات",   bg: "#fdf2f5", color: "#d68b9d" },
    { icon: "fa-clock",        val: pendingOrders,                   lbl: "طلبات معلقة",      bg: "#fff8f0", color: "#f39c12" },
    { icon: "fa-box-open",     val: activeProducts,                  lbl: "منتجات نشطة",      bg: "#f0f4ff", color: "#3498db" },
    { icon: "fa-boxes",        val: products.length,                 lbl: "إجمالي المنتجات",  bg: "#f5f0ff", color: "#9b59b6" },
    {
      icon: "fa-check-circle",
      val: orders.filter(o => o.delivery_status === "delivered").length,
      lbl: "طلبات مكتملة", bg: "#f0faf4", color: "#2ecc71",
    },
  ];

  return (
    <div>
      {/* Welcome */}
      <div className="vnd-welcome">
        <div>
          <h1 style={{ fontSize: "1.7rem", fontWeight: 900, marginBottom: 5 }}>{greeting}</h1>
          <p style={{ color: "#718096", fontSize: ".9rem" }}>إليك ملخص أداء متجرك.</p>
        </div>
        {!store && (
          <div className="vnd-alert-warn">
            <i className="fas fa-exclamation-triangle" />
            لم تقم بإنشاء متجرك بعد!
            <button
              className="vnd-btn-primary"
              style={{ marginRight: 12 }}
              onClick={() => setActiveSection("store")}>
              إنشاء متجر الآن
            </button>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="vnd-stats-grid">
        {STATS.map((s, i) => (
          <div key={i} className="vnd-stat-card">
            <div className="vnd-stat-icon" style={{ background: s.bg, color: s.color }}>
              <i className={`fas ${s.icon}`} />
            </div>
            <div className="vnd-stat-val">{s.val}</div>
            <div className="vnd-stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Store banner */}
      {store && (
        <div className="vnd-store-banner">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {store.logo
              ? <img src={store.logo} alt="" style={{ width: 60, height: 60, borderRadius: 14, objectFit: "cover" }} />
              : <div style={{ width: 60, height: 60, borderRadius: 14, background: "#e8f5f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>🏪</div>}
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{store.store_name}</div>
              <div style={{ fontSize: ".82rem", color: "#5D6D64", marginTop: 3 }}>
                {store.description?.slice(0, 90) || "لا يوجد وصف"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {store.is_verified && (
              <span style={{ background: "#e8f5f2", color: "#1a6b5c", padding: "4px 12px", borderRadius: 20, fontSize: ".78rem", fontWeight: 700 }}>
                <i className="fas fa-check-circle" /> موثّق
              </span>
            )}
            {!store.is_verified && (
              <span style={{ background: "#fff8f0", color: "#f39c12", padding: "4px 12px", borderRadius: 20, fontSize: ".78rem", fontWeight: 700 }}>
                <i className="fas fa-clock" /> في انتظار التوثيق
              </span>
            )}
            <button className="vnd-btn-secondary" onClick={() => setActiveSection("store")}>
              <i className="fas fa-edit" /> تعديل المتجر
            </button>
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div className="vnd-panel">
        <div className="vnd-panel-hd">
          <h3><i className="fas fa-shopping-bag" /> آخر الطلبات</h3>
          <button className="vnd-panel-more" onClick={() => setActiveSection("orders")}>
            عرض الكل ←
          </button>
        </div>
        {recentOrders.length === 0 ? (
          <div className="vnd-empty" style={{ padding: "24px 0" }}>
            <span>🛍️</span>
            <p>لا توجد طلبات بعد</p>
          </div>
        ) : (
          recentOrders.map(o => {
            const itemsTotal = o.items?.reduce((a, i) => a + (i.price_snapshot ?? 0) * i.quantity, 0) || 0;
            return (
              <div key={o.order_id} className="vnd-order-row">
                <div className="vnd-order-info">
                  <strong>{o.users?.name || "عميل"}</strong>
                  <span>{fmt(o.created_at)}</span>
                </div>
                <div style={{ fontSize: ".82rem", color: "#888" }}>
                  {o.items?.length || 0} منتج
                </div>
                <div style={{ fontWeight: 700, fontSize: ".92rem" }}>
                  ₪ {itemsTotal.toFixed(0)}
                </div>
                <span className="vnd-status-pill" style={DELIVERY_COLORS[o.delivery_status] || {}}>
                  {DELIVERY_LABELS[o.delivery_status] || o.delivery_status}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STORE SECTION
// إنشاء أو تعديل المتجر في جدول stores
// الأعمدة: store_id, vendor_id, store_name, description, logo, is_verified
// ملاحظة: hero_image وbanner_text غير موجودين في الـ schema الحالي،
//         يمكن إضافتهما كـ ALTER TABLE أو حذفهما من الـ form
// ═══════════════════════════════════════════════════════════════════════════════
// ─────────────────────────────────────────────────────────────────
// STORE SECTION — مع حقول السياسات ومعلومات التواصل
// ─────────────────────────────────────────────────────────────────
function StoreSection({ store, vendorId, refetch }) {
  const [form, setForm] = useState({
    store_name:       store?.store_name        || "",
    description:      store?.description       || "",
    logo:             store?.logo              || "",
    hero_image:       store?.hero_image        || "",
    working_hours:    store?.working_hours      || "",
    whatsapp:         store?.whatsapp           || "",
    instagram:        store?.instagram          || "",
    return_policy:    store?.return_policy      || "",
    shipping_policy:  store?.shipping_policy    || "",
    privacy_policy:   store?.privacy_policy     || "",
    terms_of_service: store?.terms_of_service   || "",
  });
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const logoRef = useRef(null);
  const heroRef = useRef(null);
 
  useEffect(() => {
    if (store) {
      setForm({
        store_name:       store.store_name        || "",
        description:      store.description       || "",
        logo:             store.logo              || "",
        hero_image:       store.hero_image        || "",
        working_hours:    store.working_hours      || "",
        whatsapp:         store.whatsapp           || "",
        instagram:        store.instagram          || "",
        return_policy:    store.return_policy      || "",
        shipping_policy:  store.shipping_policy    || "",
        privacy_policy:   store.privacy_policy     || "",
        terms_of_service: store.terms_of_service   || "",
      });
    }
  }, [store]);
 
  const uploadFile = async (file, prefix) => {
    setUploading(true);
    try {
      const ext  = file.name.split(".").pop();
      const path = `stores/${vendorId}/${prefix}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("store-assets").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("store-assets").getPublicUrl(path);
      return data.publicUrl;
    } catch (e) {
      setError("فشل رفع الملف: " + e.message);
      return null;
    } finally {
      setUploading(false);
    }
  };
 
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.store_name.trim()) { setError("اسم المتجر مطلوب"); return; }
    if (!vendorId)               { setError("خطأ: لم يتم التعرف على المستخدم"); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        store_name:       form.store_name.trim(),
        description:      form.description.trim()      || null,
        logo:             form.logo                    || null,
        hero_image:       form.hero_image              || null,
        working_hours:    form.working_hours.trim()    || null,
        whatsapp:         form.whatsapp.trim()         || null,
        instagram:        form.instagram.trim()        || null,
        return_policy:    form.return_policy.trim()    || null,
        shipping_policy:  form.shipping_policy.trim()  || null,
        privacy_policy:   form.privacy_policy.trim()   || null,
        terms_of_service: form.terms_of_service.trim() || null,
      };
 
      if (store) {
        const { error: upErr } = await supabase
          .from("stores").update(payload).eq("store_id", store.store_id);
        if (upErr) throw upErr;
      } else {
        const { data: vpCheck } = await supabase
          .from("vendor_profiles").select("vendor_id").eq("vendor_id", vendorId).maybeSingle();
        if (!vpCheck) {
          await supabase.from("vendor_profiles").insert({ vendor_id: vendorId });
        }
        const { error: insErr } = await supabase
          .from("stores").insert({ vendor_id: vendorId, is_verified: false, ...payload });
        if (insErr) throw insErr;
      }
      setSaved(true); refetch();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };
 
  const TABS = [
    { key: "basic",    label: "المعلومات",    icon: "fa-store"         },
    { key: "contact",  label: "التواصل",      icon: "fa-phone"         },
    { key: "policies", label: "السياسات",     icon: "fa-file-contract" },
  ];
 
  return (
    <div>
      <div className="vnd-section-hd">
        <h2><i className="fas fa-store" /> {store ? "تعديل المتجر" : "إنشاء متجر جديد"}</h2>
        {!store && (
          <span style={{ background: "#fff8f0", color: "#f39c12", padding: "4px 12px", borderRadius: 20, fontSize: ".78rem", fontWeight: 700 }}>
            <i className="fas fa-info-circle" /> لا يوجد متجر بعد
          </span>
        )}
      </div>
 
      {/* معاينة الهيرو */}
      <div className="vnd-hero-preview">
       <div style={{
  width: "100%", height: "100%",
  background: form.hero_image
    ? "linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.45))"
    : "linear-gradient(135deg,#1a2e2a,#2e5d52)",
  backgroundImage: form.hero_image
    ? `linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.45)), url(${form.hero_image})`
    : undefined,
  backgroundSize: "cover",
  backgroundPosition: "center",
  display: "flex", alignItems: "center", justifyContent: "center",
  flexDirection: "column", gap: 10,
}}>
          {form.logo
            ? <img src={form.logo} alt="logo" style={{ width: 72, height: 72, borderRadius: 16, objectFit: "cover", border: "3px solid rgba(255,255,255,.3)" }} />
            : <div style={{ fontSize: "3rem" }}>🏪</div>}
          <div style={{ color: "white", fontWeight: 800, fontSize: "1.1rem" }}>
            {form.store_name || "اسم متجرك"}
          </div>
          {form.description && (
            <div style={{ color: "rgba(255,255,255,.7)", fontSize: ".8rem", maxWidth: 280, textAlign: "center" }}>
              {form.description.slice(0, 60)}
            </div>
          )}
        </div>
      </div>
 
      {error && (
        <div style={{ background: "#fef0f0", border: "1px solid #fca5a5", color: "#dc2626", padding: "10px 14px", borderRadius: 10, marginBottom: 16, fontSize: ".85rem", fontWeight: 700 }}>
          <i className="fas fa-exclamation-circle" /> {error}
        </div>
      )}
 
      {/* تبويبات */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid #e2e8f0" }}>
        {TABS.map(tab => (
          <button key={tab.key}
            style={{
              background: "none", border: "none",
              borderBottom: `3px solid ${activeTab === tab.key ? "#1a6b5c" : "transparent"}`,
              padding: "10px 16px", fontFamily: "'Cairo'", fontWeight: 700, fontSize: ".83rem",
              color: activeTab === tab.key ? "#1a6b5c" : "#718096",
              cursor: "pointer", transition: ".25s",
              display: "flex", alignItems: "center", gap: 7,
            }}
            onClick={() => setActiveTab(tab.key)}>
            <i className={`fas ${tab.icon}`} /> {tab.label}
          </button>
        ))}
      </div>
 
      <form onSubmit={handleSave} className="vnd-form">
 
        {/* ── المعلومات الأساسية ── */}
        {activeTab === "basic" && (
          <>
            {/* لوجو */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontWeight: 700, fontSize: ".83rem", color: "#4a5568", marginBottom: 8 }}>
                شعار المتجر
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="vnd-img-upload-card"
                  style={{ width: 88, height: 88, borderRadius: 14, flexShrink: 0, position: "relative" }}
                  onClick={() => logoRef.current?.click()}>
                  {form.logo
                    ? <img src={form.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }} />
                    : <i className="fas fa-store" style={{ fontSize: "1.8rem", color: "#aaa" }} />}
                  {uploading && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,.8)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12 }}>
                      <i className="fas fa-spinner fa-spin" style={{ color: "#1a6b5c" }} />
                    </div>
                  )}
                </div>
                <div style={{ fontSize: ".78rem", color: "#888", lineHeight: 1.8 }}>
                  <p>اضغط لرفع شعار المتجر</p>
                  <p>صورة مربعة PNG/JPG، أقصى 2MB</p>
                </div>
                <input type="file" accept="image/*" ref={logoRef} style={{ display: "none" }}
                  onChange={async e => {
                    if (!e.target.files[0]) return;
                    const url = await uploadFile(e.target.files[0], "logo");
                    if (url) setForm(p => ({ ...p, logo: url }));
                  }} />
              </div>
            </div>
 
            {/* صورة الخلفية */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontWeight: 700, fontSize: ".83rem", color: "#4a5568", marginBottom: 8 }}>
                صورة خلفية المتجر (Hero)
              </label>
              <div className="vnd-img-upload-card"
                style={{ width: "100%", height: 120, borderRadius: 14, position: "relative" }}
                onClick={() => heroRef.current?.click()}>
                {form.hero_image
                  ? <img src={form.hero_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }} />
                  : <div style={{ textAlign: "center" }}>
                      <i className="fas fa-image" style={{ fontSize: "1.8rem", color: "#aaa", display: "block", marginBottom: 6 }} />
                      <span style={{ fontSize: ".78rem", color: "#aaa" }}>صورة الخلفية (1200×400 مثلاً)</span>
                    </div>}
              </div>
              <input type="file" accept="image/*" ref={heroRef} style={{ display: "none" }}
                onChange={async e => {
                  if (!e.target.files[0]) return;
                  const url = await uploadFile(e.target.files[0], "hero");
                  if (url) setForm(p => ({ ...p, hero_image: url }));
                }} />
            </div>
 
            <div className="vnd-form-grid">
              <div className="vnd-field vnd-full">
                <label>اسم المتجر *</label>
                <input className="vnd-input" value={form.store_name} required maxLength={150}
                  onChange={e => setForm(p => ({ ...p, store_name: e.target.value }))}
                  placeholder="مثال: صيدلية الوفاء، بوتيك الأم..." />
              </div>
              <div className="vnd-field vnd-full">
                <label>وصف المتجر</label>
                <textarea className="vnd-input" rows="4" maxLength={500}
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="اكتب وصفاً يجذب العملاء..." />
                <span style={{ fontSize: ".72rem", color: "#aaa" }}>{form.description.length}/500</span>
              </div>
            </div>
          </>
        )}
 
        {/* ── التواصل والمواعيد ── */}
        {activeTab === "contact" && (
          <div className="vnd-form-grid">
            <div className="vnd-field">
              <label>
                <i className="fab fa-whatsapp" style={{ color: "#25D366", marginLeft: 5 }} />
                رقم الواتساب
              </label>
              <input className="vnd-input" type="tel" value={form.whatsapp}
                placeholder="972591234567 (بدون +)"
                onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} />
              <span style={{ fontSize: ".72rem", color: "#888" }}>الرقم بالصيغة الدولية بدون + مثل 972591234567</span>
            </div>
            <div className="vnd-field">
              <label>
                <i className="fab fa-instagram" style={{ color: "#C33ABC", marginLeft: 5 }} />
                حساب الإنستغرام
              </label>
              <input className="vnd-input" value={form.instagram}
                placeholder="اسم المستخدم بدون @"
                onChange={e => setForm(p => ({ ...p, instagram: e.target.value }))} />
            </div>
            <div className="vnd-field vnd-full">
              <label>
                <i className="fas fa-clock" style={{ color: "#1a6b5c", marginLeft: 5 }} />
                ساعات العمل
              </label>
              <input className="vnd-input" value={form.working_hours}
                placeholder="مثال: السبت - الخميس: 9 صباحاً - 9 مساءً"
                onChange={e => setForm(p => ({ ...p, working_hours: e.target.value }))} />
            </div>
          </div>
        )}
 
        {/* ── السياسات ── */}
        {activeTab === "policies" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              {
                key: "return_policy",
                label: "سياسة الاسترجاع والاستبدال",
                icon: "fa-undo", iconColor: "#f39c12",
                placeholder: "مثال: يمكن استرجاع المنتجات خلال 7 أيام من تاريخ الاستلام بشرط أن تكون بحالتها الأصلية وغير مستخدمة وبعبوتها الأصلية...",
              },
              {
                key: "shipping_policy",
                label: "سياسة الشحن والتوصيل",
                icon: "fa-truck", iconColor: "#3498db",
                placeholder: "مثال: نوفر التوصيل لجميع مناطق الضفة الغربية. الطلبات فوق ₪150 توصيل مجاني. متوسط مدة التوصيل 2-3 أيام عمل...",
              },
              {
                key: "privacy_policy",
                label: "سياسة الخصوصية",
                icon: "fa-shield-alt", iconColor: "#9b59b6",
                placeholder: "مثال: نحترم خصوصيتكم ولا نشارك بياناتكم الشخصية مع أي طرف ثالث. تُستخدم المعلومات فقط لأغراض إتمام الطلب والتواصل معكم...",
              },
              {
                key: "terms_of_service",
                label: "شروط الاستخدام",
                icon: "fa-file-contract", iconColor: "#1a6b5c",
                placeholder: "مثال: باستخدام خدماتنا فأنت توافق على شروط الاستخدام. نحتفظ بحق تعديل الأسعار والمنتجات في أي وقت. جميع الأسعار بالشيكل الإسرائيلي...",
              },
            ].map(field => (
              <div key={field.key} className="vnd-field">
                <label style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <i className={`fas ${field.icon}`} style={{ color: field.iconColor }} />
                  {field.label}
                  <span style={{ fontSize: ".7rem", color: "#aaa", fontWeight: 400 }}>
                    — يظهر في صفحة "عن المتجر"
                  </span>
                </label>
                <textarea className="vnd-input" rows="4" maxLength={1000}
                  value={form[field.key]}
                  placeholder={field.placeholder}
                  onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))} />
                <span style={{ fontSize: ".72rem", color: "#aaa", textAlign: "left" }}>
                  {(form[field.key] || "").length}/1000
                </span>
              </div>
            ))}
          </div>
        )}
 
        <div style={{ marginTop: 24 }}>
          <button type="submit" className="vnd-btn-primary"
            disabled={saving || uploading}
            style={{ background: saved ? "#2ecc71" : undefined }}>
            {saving
              ? <><i className="fas fa-spinner fa-spin" /> جارٍ الحفظ...</>
              : saved
                ? <><i className="fas fa-check-circle" /> {store ? "تم التحديث ✅" : "تم إنشاء المتجر ✅"}</>
                : <><i className="fas fa-save" /> {store ? "حفظ التعديلات" : "إنشاء المتجر"}</>}
          </button>
        </div>
      </form>
    </div>
  );
}
 




/*function StoreSection({ store, vendorId, refetch }) {
  const [form, setForm] = useState({
    store_name:  store?.store_name  || "",
    description: store?.description || "",
    logo:        store?.logo        || "",
    hero_image:  store?.hero_image  || "",
  });
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");
  const logoRef = useRef(null);
  const heroRef = useRef(null);

  // تحديث الـ form عند تغيّر الـ store (بعد refetch)
  useEffect(() => {
    if (store) {
      setForm({
        store_name:  store.store_name  || "",
        description: store.description || "",
        logo:        store.logo        || "",
        hero_image:  store.hero_image  || "",
      });
    }
  }, [store]);

  const uploadLogo = async (file) => {
    setUploading(true);
    try {
      const ext  = file.name.split(".").pop();
      const path = `stores/${vendorId}/logo_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("store-assets")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("store-assets").getPublicUrl(path);
      setForm(p => ({ ...p, logo: data.publicUrl }));
    } catch (e) {
      console.error("Logo upload error:", e);
      setError("فشل رفع الصورة، تأكد من إعداد Supabase Storage bucket باسم store-assets");
    } finally {
      setUploading(false);
    }
  };
const uploadHero = async (file) => {
  setUploading(true);
  try {
    const ext  = file.name.split(".").pop();
    const path = `stores/${vendorId}/hero_${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("store-assets")
      .upload(path, file, { upsert: true });
    if (upErr) throw upErr;
    const { data } = supabase.storage.from("store-assets").getPublicUrl(path);
    setForm(p => ({ ...p, hero_image: data.publicUrl }));
  } catch (e) {
    setError("فشل رفع صورة الخلفية");
  } finally {
    setUploading(false);
  }
};
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.store_name.trim()) {
      setError("اسم المتجر مطلوب");
      return;
    }
    if (!vendorId) {
      setError("خطأ: لم يتم التعرف على المستخدم");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (store) {
        // تحديث متجر موجود
        const { error: upErr } = await supabase
          .from("stores")
          .update({
            store_name:  form.store_name.trim(),
            description: form.description.trim() || null,
            logo:        form.logo || null,
            hero_image:  form.hero_image || null,
          })
          .eq("store_id", store.store_id);
        if (upErr) throw upErr;
      } else {
        // إنشاء متجر جديد
        // vendor_id يجب أن يكون موجوداً في vendor_profiles أولاً
        // تأكد أن vendor_profiles row موجود
        const { data: vpCheck } = await supabase
          .from("vendor_profiles")
          .select("vendor_id")
          .eq("vendor_id", vendorId)
          .maybeSingle();

        if (!vpCheck) {
          // إنشاء vendor_profile إذا لم يكن موجوداً
          await supabase.from("vendor_profiles").insert({ vendor_id: vendorId });
        }

        const { error: insErr } = await supabase
          .from("stores")
          .insert({
            vendor_id:   vendorId,
            store_name:  form.store_name.trim(),
            description: form.description.trim() || null,
            logo:        form.logo || null,
             hero_image:  form.hero_image || null,
            is_verified: false,   

          });
        if (insErr) throw insErr;
      }
      setSaved(true);
      refetch();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Store save error:", err);
      setError(err.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="vnd-section-hd">
        <h2><i className="fas fa-store" /> {store ? "تعديل المتجر" : "إنشاء متجر جديد"}</h2>
        {!store && (
          <span style={{ background: "#fff8f0", color: "#f39c12", padding: "4px 12px", borderRadius: 20, fontSize: ".78rem", fontWeight: 700 }}>
            <i className="fas fa-info-circle" /> لا يوجد متجر بعد
          </span>
        )}
      </div>

      {/* Preview /}
      <div className="vnd-hero-preview">
        <div style={{
          width: "100%", height: "100%",
          background: form.hero_image
  ? `url(${form.hero_image})`
  : "linear-gradient(135deg,#1a2e2a,#2e5d52)",
backgroundSize: "cover",
backgroundPosition: "center",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 10,
        }}>
          {form.logo
            ? <img src={form.logo} alt="logo"
                style={{ width: 80, height: 80, borderRadius: 18, objectFit: "cover", border: "3px solid rgba(255,255,255,.3)" }} />
            : <div style={{ fontSize: "3rem" }}>🏪</div>}
          <div style={{ color: "white", fontWeight: 800, fontSize: "1.2rem", textAlign: "center" }}>
            {form.store_name || "اسم متجرك"}
          </div>
          {form.description && (
            <div style={{ color: "rgba(255,255,255,.7)", fontSize: ".82rem", maxWidth: 300, textAlign: "center" }}>
              {form.description.slice(0, 60)}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef0f0", border: "1px solid #fca5a5", color: "#dc2626", padding: "10px 14px", borderRadius: 10, marginBottom: 16, fontSize: ".85rem", fontWeight: 700 }}>
          <i className="fas fa-exclamation-circle" /> {error}
        </div>
      )}

      <form onSubmit={handleSave} className="vnd-form">
        {/* Logo upload /}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontWeight: 700, fontSize: ".83rem", color: "#4a5568", marginBottom: 8 }}>
            شعار المتجر
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              className="vnd-img-upload-card"
              style={{ width: 90, height: 90, borderRadius: 14, flexShrink: 0 }}
              onClick={() => logoRef.current?.click()}>
              {form.logo
                ? <img src={form.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }} />
                : <i className="fas fa-store" style={{ fontSize: "1.8rem", color: "#aaa" }} />}
              {uploading && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,.8)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12 }}>
                  <i className="fas fa-spinner fa-spin" style={{ color: "#1a6b5c" }} />
                </div>
              )}
            </div>
            <div style={{ fontSize: ".78rem", color: "#888", lineHeight: 1.6 }}>
              <p>اضغط لرفع شعار المتجر</p>
              <p>يُنصح بصورة مربعة، PNG أو JPG</p>
              <p>الحجم الأقصى: 2MB</p>
            </div>
            <input
              type="file" accept="image/*" ref={logoRef} style={{ display: "none" }}
              onChange={e => e.target.files[0] && uploadLogo(e.target.files[0])} />
          </div>
        </div>
{/* بعد input اللوجو الخفي مباشرة /}
<div style={{ marginBottom: 20 }}>
  <label style={{ display: "block", fontWeight: 700, fontSize: ".83rem", color: "#4a5568", marginBottom: 8 }}>
    صورة خلفية المتجر (Hero)
  </label>
  <div
    className="vnd-img-upload-card"
    style={{ width: "100%", height: 120, borderRadius: 14, position: "relative" }}
    onClick={() => heroRef.current?.click()}>
    {form.hero_image
      ? <img src={form.hero_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }} />
      : <div style={{ textAlign: "center" }}>
          <i className="fas fa-image" style={{ fontSize: "1.8rem", color: "#aaa", display: "block", marginBottom: 6 }} />
          <span style={{ fontSize: ".78rem", color: "#aaa" }}>صورة الخلفية (1200×400 مثلاً)</span>
        </div>}
  </div>
  <input
    type="file" accept="image/*" ref={heroRef} style={{ display: "none" }}
    onChange={e => e.target.files[0] && uploadHero(e.target.files[0])} />
</div>
        <div className="vnd-form-grid">
          <div className="vnd-field vnd-full">
            <label>اسم المتجر *</label>
            <input
              className="vnd-input"
              value={form.store_name}
              required
              maxLength={150}
              onChange={e => setForm(p => ({ ...p, store_name: e.target.value }))}
              placeholder="مثال: صيدلية الوفاء، بوتيك الأم..." />
          </div>
          <div className="vnd-field vnd-full">
            <label>وصف المتجر</label>
            <textarea
              className="vnd-input"
              rows="4"
              maxLength={500}
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="اكتب وصفاً يجذب العملاء..." />
            <span style={{ fontSize: ".72rem", color: "#aaa", textAlign: "left" }}>
              {form.description.length}/500
            </span>
          </div>
        </div>

        <button
          type="submit"
          className="vnd-btn-primary"
          disabled={saving || uploading}
          style={{ background: saved ? "#2ecc71" : undefined }}>
          {saving
            ? <><i className="fas fa-spinner fa-spin" /> جارٍ الحفظ...</>
            : saved
              ? <><i className="fas fa-check-circle" /> {store ? "تم التحديث ✅" : "تم إنشاء المتجر ✅"}</>
              : <><i className="fas fa-save" /> {store ? "حفظ التعديلات" : "إنشاء المتجر"}</>}
        </button>
      </form>
    </div>
  );
}*/

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTS SECTION
// الجداول: products, product_categories
// ═══════════════════════════════════════════════════════════════════════════════
// ─────────────────────────────────────────────────────────────────
// A) PRODUCTS SECTION — مع تاج العرض
// ─────────────────────────────────────────────────────────────────
function ProductsSection({ products, store, categories, refetch }) {
  const [showModal,  setShowModal]  = useState(false);
  const [editProduct,setEditProduct]= useState(null);
  const [filter,     setFilter]     = useState("all");
  const [search,     setSearch]     = useState("");
  const [deletingId, setDeletingId] = useState(null);
 
  const filtered = products
    .filter(p => filter === "all" ? true : filter === "active" ? p.is_active : !p.is_active)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));
 
  const toggleActive = async (p) => {
    await supabase.from("products").update({ is_active: !p.is_active }).eq("product_id", p.product_id);
    refetch();
  };
 
  const deleteProduct = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    setDeletingId(id);
    await supabase.from("products").delete().eq("product_id", id);
    setDeletingId(null);
    refetch();
  };
 
  return (
    <div>
      <div className="vnd-section-hd">
        <h2><i className="fas fa-box-open" /> المنتجات</h2>
        <button
          className="vnd-btn-primary"
          disabled={!store}
          title={!store ? "يجب إنشاء المتجر أولاً" : ""}
          onClick={() => { setEditProduct(null); setShowModal(true); }}>
          <i className="fas fa-plus" /> إضافة منتج
        </button>
      </div>
 
      {!store && (
        <div className="vnd-alert-warn" style={{ marginBottom: 20 }}>
          <i className="fas fa-info-circle" />
          يجب إنشاء المتجر أولاً قبل إضافة المنتجات
        </div>
      )}
 
      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div className="vnd-search-bar">
          <i className="fas fa-search" style={{ color: "#aaa" }} />
          <input
            placeholder="بحث عن منتج..."
            value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        {[
          { key: "all",      lbl: `الكل (${products.length})` },
          { key: "active",   lbl: `نشط (${products.filter(p => p.is_active).length})` },
          { key: "inactive", lbl: `مخفي (${products.filter(p => !p.is_active).length})` },
        ].map(f => (
          <button
            key={f.key}
            className={`vnd-filter-btn ${filter === f.key ? "active" : ""}`}
            onClick={() => setFilter(f.key)}>
            {f.lbl}
          </button>
        ))}
      </div>
 
      {filtered.length === 0 ? (
        <div className="vnd-empty">
          <span>📦</span>
          <p>{search ? "لا توجد نتائج" : "لا توجد منتجات بعد"}</p>
          {!search && store && (
            <button className="vnd-btn-primary"
              onClick={() => { setEditProduct(null); setShowModal(true); }}>
              <i className="fas fa-plus" /> أضف أول منتج
            </button>
          )}
        </div>
      ) : (
        <div className="vnd-products-grid">
          {filtered.map(p => {
            // ── هل على المنتج عرض نشط؟ ──────────────────────────
            const hasDiscount = p.original_price && p.original_price > p.price &&
              (!p.discount_expires_at || new Date(p.discount_expires_at) > new Date());
            const discountPct = hasDiscount
              ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
              : 0;
 
            return (
              <div key={p.product_id} className={`vnd-product-card ${!p.is_active ? "inactive" : ""}`}>
                <div className="vnd-product-img-wrap">
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} />
                    : <div className="vnd-product-img-placeholder"><i className="fas fa-image" /></div>}
 
                  {/* تاج حالة المنتج */}
                  <span className={`vnd-product-badge ${p.is_active ? "active" : "inactive"}`}>
                    {p.is_active ? "نشط" : "مخفي"}
                  </span>
 
                  {/* ── تاج العرض / الخصم ── */}
                  {hasDiscount && (
                    <span style={{
                      position: "absolute", top: 8, left: 8,
                      background: "linear-gradient(135deg,#e74c3c,#c0392b)",
                      color: "#fff", fontSize: ".65rem", fontWeight: 800,
                      padding: "3px 9px", borderRadius: 20,
                      boxShadow: "0 2px 6px rgba(231,76,60,.45)",
                      display: "flex", alignItems: "center", gap: 3,
                    }}>
                      🔥 {discountPct}%
                    </span>
                  )}
 
                  {/* نفد / آخر قطع */}
                  {p.stock === 0 && (
                    <span style={{ position: "absolute", bottom: 8, right: 8, background: "#fef0f0", color: "#e74c3c", fontSize: ".68rem", fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                      نفد
                    </span>
                  )}
                  {p.stock > 0 && p.stock < 5 && (
                    <span style={{ position: "absolute", bottom: 8, right: 8, background: "#fff8f0", color: "#f39c12", fontSize: ".68rem", fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                      آخر {p.stock}
                    </span>
                  )}
                </div>
 
                <div style={{ padding: "12px 14px" }}>
                  <h4 style={{ fontWeight: 700, marginBottom: 4, fontSize: ".92rem" }}>{p.name}</h4>
                  <div style={{ fontSize: ".75rem", color: "#888", marginBottom: 6 }}>
                    <i className="fas fa-tag" style={{ marginLeft: 4 }} />
                    {p.product_categories?.name || "غير مصنّف"}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <span style={{ fontWeight: 800, color: hasDiscount ? "#e74c3c" : "#1a6b5c", fontSize: "1rem" }}>
                        ₪ {p.price}
                      </span>
                      {hasDiscount && (
                        <span style={{ fontSize: ".72rem", color: "#bbb", textDecoration: "line-through" }}>
                          ₪ {p.original_price}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: ".75rem", color: p.stock === 0 ? "#e74c3c" : "#888" }}>
                      مخزون: {p.stock}
                    </span>
                  </div>
 
                  {/* نص العرض */}
                  {hasDiscount && p.discount_label && (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ background: "#fef0f0", color: "#e74c3c", border: "1px solid #fca5a5", fontSize: ".68rem", fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                        {p.discount_label}
                      </span>
                    </div>
                  )}
                </div>
 
                <div className="vnd-product-actions">
                  <button className="vnd-icon-btn" title="تعديل"
                    onClick={() => { setEditProduct(p); setShowModal(true); }}>
                    <i className="fas fa-edit" />
                  </button>
                  <button className="vnd-icon-btn"
                    title={p.is_active ? "إخفاء" : "إظهار"}
                    onClick={() => toggleActive(p)}>
                    <i className={`fas fa-${p.is_active ? "eye-slash" : "eye"}`} />
                  </button>
                  <button className="vnd-icon-btn danger" title="حذف"
                    disabled={deletingId === p.product_id}
                    onClick={() => deleteProduct(p.product_id)}>
                    {deletingId === p.product_id
                      ? <i className="fas fa-spinner fa-spin" />
                      : <i className="fas fa-trash-alt" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
 
      {showModal && (
        <ProductModal
          storeId={store?.store_id}
          categories={categories}
          product={editProduct}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
          onSuccess={() => { setShowModal(false); setEditProduct(null); refetch(); }}
        />
      )}
    </div>
  );
}
 

// ── Product Modal ─────────────────────────────────────────────────
function ProductModal({ storeId, categories, product, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name:             product?.name             || "",
    description:      product?.description      || "",
    price:            product?.price            || "",
    stock:            product?.stock            || 0,
    category_id:      product?.category_id      || "",
    image_url:        product?.image_url        || "",
    is_active:        product?.is_active        ?? true,
    has_discount:     !!(product?.original_price),
    original_price:   product?.original_price   || "",
    discount_label:   product?.discount_label   || "",
    discount_expires_at: product?.discount_expires_at
      ? new Date(product.discount_expires_at).toISOString().split("T")[0]
      : "",
  });
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");
  const imgRef = useRef(null);
 
  const discountPercent =
    form.has_discount && form.original_price && form.price &&
    parseFloat(form.original_price) > parseFloat(form.price)
      ? Math.round(((parseFloat(form.original_price) - parseFloat(form.price)) / parseFloat(form.original_price)) * 100)
      : 0;
 
  const uploadImg = async (file) => {
    if (!storeId) return;
    setUploading(true);
    try {
      const ext  = file.name.split(".").pop();
      const path = `products/${storeId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("store-assets").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("store-assets").getPublicUrl(path);
      setForm(p => ({ ...p, image_url: data.publicUrl }));
    } catch (e) {
      setError("فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  };
 
  const handleSave = async (e) => {
    e.preventDefault();
    if (!storeId)            { setError("يجب إنشاء المتجر أولاً"); return; }
    if (!form.name.trim())   { setError("اسم المنتج مطلوب"); return; }
    if (!form.price || parseFloat(form.price) <= 0) { setError("السعر يجب أن يكون أكبر من 0"); return; }
    if (form.has_discount) {
      if (!form.original_price || parseFloat(form.original_price) <= parseFloat(form.price)) {
        setError("السعر الأصلي يجب أن يكون أكبر من سعر العرض"); return;
      }
    }
 
    setSaving(true); setError("");
    try {
      const payload = {
        store_id:             storeId,
        name:                 form.name.trim(),
        description:          form.description.trim() || null,
        price:                parseFloat(form.price),
        stock:                parseInt(form.stock) || 0,
        category_id:          form.category_id   || null,
        image_url:            form.image_url      || null,
        is_active:            form.is_active,
        original_price:       form.has_discount ? parseFloat(form.original_price) : null,
        discount_label:       form.has_discount && form.discount_label ? form.discount_label.trim() : null,
        discount_expires_at:  form.has_discount && form.discount_expires_at
          ? new Date(form.discount_expires_at).toISOString()
          : null,
      };
 
      if (product) {
        const { error: upErr } = await supabase
          .from("products").update(payload).eq("product_id", product.product_id);
        if (upErr) throw upErr;
      } else {
        const { error: insErr } = await supabase.from("products").insert(payload);
        if (insErr) throw insErr;
      }
      onSuccess();
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };
 
  // تجميع التصنيفات حسب المجموعة
  const GROUP_LABELS = {
    newborn:   "👶 المولود (0-3 أشهر)",
    baby_3_6:  "🌈 اكتشاف الحواس (3-6 أشهر)",
    baby_6_9:  "🥣 نكهات صغيرة (6-9 أشهر)",
    baby_9_12: "🏆 عام الإنجازات (9-12 شهر)",
    mom:       "💕 راحة الأم",
    self_care: "✨ لحظة هدوء",
    general:   "🏥 عام / صيدلية",
  };
 
  return (
    <div className="vnd-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="vnd-modal" dir="rtl">
        <div className="vnd-modal-hd">
          <h2>{product ? "✏️ تعديل المنتج" : "📦 إضافة منتج جديد"}</h2>
          <button onClick={onClose}><i className="fas fa-times" /></button>
        </div>
 
        {error && (
          <div style={{ background: "#fef0f0", color: "#dc2626", padding: "8px 12px", borderRadius: 8, marginBottom: 12, fontSize: ".83rem", fontWeight: 700 }}>
            <i className="fas fa-exclamation-circle" /> {error}
          </div>
        )}
 
        <form onSubmit={handleSave}>
          {/* رفع الصورة */}
          <div className="vnd-product-img-upload" onClick={() => imgRef.current?.click()} style={{ marginBottom: 16 }}>
            {form.image_url
              ? <img src={form.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }} />
              : <div style={{ textAlign: "center" }}>
                  <i className="fas fa-camera" style={{ fontSize: "1.8rem", color: "#aaa", display: "block", marginBottom: 6 }} />
                  <span style={{ fontSize: ".78rem", color: "#aaa" }}>انقر لرفع صورة المنتج</span>
                </div>}
            {uploading && (
              <div className="vnd-img-uploading">
                <i className="fas fa-spinner fa-spin" style={{ fontSize: "1.5rem", color: "#1a6b5c" }} />
              </div>
            )}
          </div>
          <input type="file" accept="image/*" ref={imgRef} style={{ display: "none" }}
            onChange={e => e.target.files[0] && uploadImg(e.target.files[0])} />
 
          <div className="vnd-modal-grid">
 
            {/* اسم المنتج */}
            <div className="vnd-field vnd-full">
              <label>اسم المنتج *</label>
              <input className="vnd-input" required maxLength={255}
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
 
            {/* السعر */}
            <div className="vnd-field">
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {form.has_discount
                  ? <><span style={{ color: "#e74c3c", fontWeight: 800 }}>سعر العرض (₪) *</span></>
                  : "السعر (₪) *"}
              </label>
              <input className="vnd-input" type="number" step="0.01" min="0.01" required
                value={form.price}
                style={form.has_discount ? { borderColor: "#e74c3c", color: "#e74c3c", fontWeight: 800 } : {}}
                onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
            </div>
 
            {/* المخزون */}
            <div className="vnd-field">
              <label>المخزون *</label>
              <input className="vnd-input" type="number" min="0" required
                value={form.stock}
                onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} />
            </div>
 
            {/* التصنيف */}
            <div className="vnd-field vnd-full">
              <label>التصنيف</label>
              <select className="vnd-input" value={form.category_id}
                onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}>
                <option value="">-- اختر التصنيف --</option>
                {Object.entries(GROUP_LABELS).map(([group, label]) => {
                  const groupCats = categories.filter(c => c.collection_group === group);
                  if (groupCats.length === 0) return null;
                  return (
                    <optgroup key={group} label={label}>
                      {groupCats.map(c => (
                        <option key={c.category_id} value={c.category_id}>
                          {c.emoji || ""} {c.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
                {categories.filter(c => !c.collection_group).length > 0 && (
                  <optgroup label="🏷️ تصنيفات أخرى">
                    {categories.filter(c => !c.collection_group).map(c => (
                      <option key={c.category_id} value={c.category_id}>{c.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
 
            {/* الوصف */}
            <div className="vnd-field vnd-full">
              <label>الوصف</label>
              <textarea className="vnd-input" rows="3"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
 
            {/* ═══════ قسم العرض ═══════ */}
            <div className="vnd-field vnd-full">
              <div style={{
                background: form.has_discount ? "#fff8f0" : "#f9fafb",
                border: `1.5px solid ${form.has_discount ? "#f39c12" : "#e2e8f0"}`,
                borderRadius: 14, padding: "16px 18px", transition: ".3s",
              }}>
                {/* تفعيل العرض */}
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontWeight: 700, fontSize: ".88rem", marginBottom: form.has_discount ? 18 : 0 }}>
                  <input type="checkbox" checked={form.has_discount}
                    onChange={e => setForm(p => ({
                      ...p,
                      has_discount: e.target.checked,
                      original_price: e.target.checked ? p.price : "",
                    }))}
                    style={{ width: 16, height: 16, accentColor: "#e74c3c" }} />
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    🔥 تفعيل عرض / خصم على هذا المنتج
                  </span>
                  {form.has_discount && discountPercent > 0 && (
                    <span style={{ background: "#e74c3c", color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: ".72rem", fontWeight: 800, marginRight: "auto" }}>
                      خصم {discountPercent}%
                    </span>
                  )}
                </label>
 
                {form.has_discount && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
 
                    {/* السعر الأصلي */}
                    <div className="vnd-field">
                      <label>
                        السعر الأصلي (₪) *
                        <span style={{ fontSize: ".7rem", color: "#888", fontWeight: 400, marginRight: 4 }}>
                          قبل الخصم
                        </span>
                      </label>
                      <input className="vnd-input" type="number" step="0.01" min="0.01"
                        placeholder="أدخل السعر قبل الخصم"
                        value={form.original_price}
                        style={{ borderColor: "#f39c12" }}
                        onChange={e => setForm(p => ({ ...p, original_price: e.target.value }))} />
                    </div>
 
                    {/* نص العرض */}
                    <div className="vnd-field">
                      <label>نص العرض <span style={{ fontSize: ".7rem", color: "#888", fontWeight: 400 }}>(اختياري)</span></label>
                      <input className="vnd-input"
                        placeholder="مثال: عرض محدود، خصم العيد"
                        maxLength={50}
                        value={form.discount_label}
                        onChange={e => setForm(p => ({ ...p, discount_label: e.target.value }))} />
                    </div>
 
                    {/* تاريخ الانتهاء */}
                    <div className="vnd-field vnd-full">
                      <label>
                        تاريخ انتهاء العرض
                        <span style={{ fontSize: ".7rem", color: "#888", fontWeight: 400, marginRight: 4 }}>
                          (اتركه فارغاً لعرض بدون تاريخ انتهاء)
                        </span>
                      </label>
                      <input className="vnd-input" type="date"
                        value={form.discount_expires_at}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={e => setForm(p => ({ ...p, discount_expires_at: e.target.value }))} />
                    </div>
 
                    {/* معاينة بطاقة السعر */}
                    {discountPercent > 0 && (
                      <div className="vnd-field vnd-full">
                        <label style={{ marginBottom: 8 }}>معاينة شارة السعر</label>
                        <div style={{
                          background: "#fff", borderRadius: 12, padding: "14px 16px",
                          border: "1px solid #F0E6DD",
                          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
                        }}>
                          {/* شارة الخصم */}
                          <div style={{
                            background: "linear-gradient(135deg,#e74c3c,#c0392b)",
                            color: "#fff", borderRadius: 20, padding: "5px 13px",
                            fontSize: ".78rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 4,
                          }}>
                            🔥 خصم {discountPercent}%
                          </div>
                          {/* الأسعار */}
                          <span style={{ fontWeight: 900, color: "#e74c3c", fontSize: "1.1rem" }}>
                            ₪{form.price}
                          </span>
                          <span style={{ textDecoration: "line-through", color: "#bbb", fontSize: ".9rem" }}>
                            ₪{form.original_price}
                          </span>
                          {form.discount_label && (
                            <span style={{
                              background: "#fef0f0", color: "#e74c3c",
                              border: "1px solid #fca5a5",
                              borderRadius: 20, padding: "3px 10px", fontSize: ".75rem", fontWeight: 700,
                            }}>
                              {form.discount_label}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
 
            {/* مرئي للعملاء */}
            <div className="vnd-field vnd-full">
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontWeight: 700 }}>
                <input type="checkbox" checked={form.is_active}
                  onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: "#1a6b5c" }} />
                <span>المنتج نشط ومرئي للعملاء</span>
              </label>
            </div>
          </div>
 
          <button type="submit" className="vnd-btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
            disabled={saving || uploading}>
            {saving
              ? <><i className="fas fa-spinner fa-spin" /> جارٍ الحفظ...</>
              : product
                ? <><i className="fas fa-save" /> حفظ التعديلات</>
                : <><i className="fas fa-plus" /> إضافة المنتج</>}
          </button>
        </form>
      </div>
    </div>
  );
}

/*function ProductModal({ storeId, categories, product, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name:        product?.name        || "",
    description: product?.description || "",
    price:       product?.price       || "",
    stock:       product?.stock       || 0,
    category_id: product?.category_id || "",
    image_url:   product?.image_url   || "",
    is_active:   product?.is_active   ?? true,
  });
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");
  const imgRef = useRef(null);

  const uploadImg = async (file) => {
    if (!storeId) return;
    setUploading(true);
    try {
      const ext  = file.name.split(".").pop();
      const path = `products/${storeId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("store-assets")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("store-assets").getPublicUrl(path);
      setForm(p => ({ ...p, image_url: data.publicUrl }));
    } catch (e) {
      setError("فشل رفع الصورة");
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!storeId) { setError("يجب إنشاء المتجر أولاً"); return; }
    if (!form.name.trim()) { setError("اسم المنتج مطلوب"); return; }
    if (!form.price || parseFloat(form.price) <= 0) { setError("السعر يجب أن يكون أكبر من 0"); return; }

    setSaving(true);
    setError("");
    try {
      const payload = {
        store_id:    storeId,
        name:        form.name.trim(),
        description: form.description.trim() || null,
        price:       parseFloat(form.price),
        stock:       parseInt(form.stock) || 0,
        category_id: form.category_id || null,
        image_url:   form.image_url   || null,
        is_active:   form.is_active,
      };

      if (product) {
        const { error: upErr } = await supabase
          .from("products")
          .update(payload)
          .eq("product_id", product.product_id);
        if (upErr) throw upErr;
      } else {
        const { error: insErr } = await supabase
          .from("products")
          .insert(payload);
        if (insErr) throw insErr;
      }
      onSuccess();
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="vnd-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="vnd-modal" dir="rtl">
        <div className="vnd-modal-hd">
          <h2>{product ? "✏️ تعديل المنتج" : "📦 إضافة منتج جديد"}</h2>
          <button onClick={onClose}><i className="fas fa-times" /></button>
        </div>

        {error && (
          <div style={{ background: "#fef0f0", color: "#dc2626", padding: "8px 12px", borderRadius: 8, marginBottom: 12, fontSize: ".83rem", fontWeight: 700 }}>
            <i className="fas fa-exclamation-circle" /> {error}
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Image upload /}
          <div className="vnd-product-img-upload" onClick={() => imgRef.current?.click()} style={{ marginBottom: 16 }}>
            {form.image_url
              ? <img src={form.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }} />
              : <div style={{ textAlign: "center" }}>
                  <i className="fas fa-camera" style={{ fontSize: "1.8rem", color: "#aaa", display: "block", marginBottom: 6 }} />
                  <span style={{ fontSize: ".78rem", color: "#aaa" }}>انقر لرفع صورة المنتج</span>
                </div>}
            {uploading && (
              <div className="vnd-img-uploading">
                <i className="fas fa-spinner fa-spin" style={{ fontSize: "1.5rem", color: "#1a6b5c" }} />
              </div>
            )}
          </div>
          <input
            type="file" accept="image/*" ref={imgRef} style={{ display: "none" }}
            onChange={e => e.target.files[0] && uploadImg(e.target.files[0])} />

          <div className="vnd-modal-grid">
            <div className="vnd-field vnd-full">
              <label>اسم المنتج *</label>
              <input
                className="vnd-input" required maxLength={255}
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="vnd-field">
              <label>السعر (₪) *</label>
              <input
                className="vnd-input" type="number" step="0.01" min="0.01" required
                value={form.price}
                onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
            </div>
            <div className="vnd-field">
              <label>المخزون *</label>
              <input
                className="vnd-input" type="number" min="0" required
                value={form.stock}
                onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} />
            </div>
            <div className="vnd-field vnd-full">
              <label>التصنيف</label>
              <select
                className="vnd-input"
                value={form.category_id}
                onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}>
                <option value="">-- بدون تصنيف --</option>
                {categories.map(c => (
                  <option key={c.category_id} value={c.category_id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="vnd-field vnd-full">
              <label>الوصف</label>
              <textarea
                className="vnd-input" rows="3"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="vnd-field vnd-full">
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontWeight: 700 }}>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: "#1a6b5c" }} />
                <span>المنتج نشط ومرئي للعملاء</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="vnd-btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
            disabled={saving || uploading}>
            {saving
              ? <><i className="fas fa-spinner fa-spin" /> جارٍ الحفظ...</>
              : product
                ? <><i className="fas fa-save" /> حفظ التعديلات</>
                : <><i className="fas fa-plus" /> إضافة المنتج</>}
          </button>
        </form>
      </div>
    </div>
  );
}*/

// ═══════════════════════════════════════════════════════════════════════════════
// ORDERS SECTION
// الجداول: orders (update delivery_status)
// ═══════════════════════════════════════════════════════════════════════════════
function OrdersSection({ orders, refetch }) {
  const [filter,     setFilter]     = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [updating,   setUpdating]   = useState(null);

  const filtered = filter === "all"
    ? orders
    : orders.filter(o => o.delivery_status === filter);

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ delivery_status: status })
        .eq("order_id", orderId);
      if (error) throw error;
      refetch();
    } catch (e) {
      alert("فشل تحديث حالة الطلب: " + e.message);
    } finally {
      setUpdating(null);
    }
  };

  const FILTERS = [
    { key: "all",              lbl: "الكل" },
    { key: "pending",          lbl: "معلق" },
    { key: "confirmed",        lbl: "مؤكد" },
    { key: "out_for_delivery", lbl: "جاري التوصيل" },
    { key: "delivered",        lbl: "مكتمل" },
    { key: "cancelled",        lbl: "ملغى" },
  ];

  return (
    <div>
      <div className="vnd-section-hd">
        <h2><i className="fas fa-shopping-bag" /> الطلبات</h2>
        <span className="vnd-count-badge">{orders.length} طلب</span>
      </div>

      <div className="vnd-filter-bar">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`vnd-filter-btn ${filter === f.key ? "active" : ""}`}
            onClick={() => setFilter(f.key)}>
            {f.lbl}
            {f.key !== "all" && (
              <span className="vnd-filter-count">
                {orders.filter(o => o.delivery_status === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="vnd-empty"><span>🛍️</span><p>لا توجد طلبات</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[...filtered]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map(o => {
              const isExpanded = expandedId === o.order_id;
              const itemsTotal = o.items?.reduce(
                (a, i) => a + (i.price_snapshot ?? 0) * i.quantity, 0
              ) || 0;
              const sc = DELIVERY_COLORS[o.delivery_status] || {};
              return (
                <div key={o.order_id} className="vnd-order-card">
                  {/* Card top */}
                  <div
                    className="vnd-order-card-top"
                    onClick={() => setExpandedId(isExpanded ? null : o.order_id)}>
                    <div className="vnd-order-id">
                      <i className="fas fa-receipt" />
                      <span title={o.order_id}>#{o.order_id?.slice(0, 8)}</span>
                    </div>
                    <div className="vnd-order-customer">
                      <i className="fas fa-user" />
                      <span>{o.users?.name || "عميل"}</span>
                    </div>
                    <div className="vnd-order-date">{fmt(o.created_at)}</div>
                    <div style={{ fontWeight: 700 }}>₪ {itemsTotal.toFixed(0)}</div>
                    <span className="vnd-status-pill" style={sc}>
                      {DELIVERY_LABELS[o.delivery_status] || o.delivery_status}
                    </span>
                    <i
                      className={`fas fa-chevron-${isExpanded ? "up" : "down"}`}
                      style={{ color: "#aaa", fontSize: ".85rem" }} />
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="vnd-order-detail">
                      {/* Products */}
                      <div className="vnd-order-items">
                        <div style={{ fontWeight: 700, marginBottom: 10, fontSize: ".88rem", color: "#1a2e2a" }}>
                          <i className="fas fa-box" style={{ marginLeft: 6 }} />
                          المنتجات المطلوبة
                        </div>
                        {o.items?.map((item, idx) => (
                          <div key={idx} className="vnd-order-item-row">
                            <span style={{ flex: 1 }}>{item.product_name_snapshot}</span>
                            <span style={{ color: "#888", fontSize: ".82rem" }}>× {item.quantity}</span>
                            <span style={{ fontWeight: 700, color: "#1a6b5c" }}>
                              ₪ {((item.price_snapshot ?? 0) * item.quantity).toFixed(0)}
                            </span>
                          </div>
                        ))}
                        <div style={{
                          display: "flex", justifyContent: "space-between",
                          paddingTop: 8, marginTop: 8,
                          borderTop: "1px dashed #eee",
                          fontWeight: 800, fontSize: ".9rem",
                        }}>
                          <span>الإجمالي</span>
                          <span style={{ color: "#1a6b5c" }}>₪ {itemsTotal.toFixed(0)}</span>
                        </div>
                      </div>

                      {/* Delivery info */}
                      <div className="vnd-order-delivery-info">
                        <div><i className="fas fa-map-marker-alt" /> {o.delivery_address}</div>
                        {o.contact_phone && (
                          <div>
                            <i className="fas fa-phone" /> {o.contact_phone}
                          </div>
                        )}
                        <div>
                          <i className="fas fa-credit-card" />
                          {o.payment_method === "cash_on_delivery" ? " الدفع عند الاستلام"
                          : o.payment_method === "card"            ? " بطاقة ائتمان"
                          :                                          " دفع إلكتروني"}
                          {" — "}
                          <span style={{
                            color: o.payment_status === "paid" ? "#2ecc71" : "#f39c12",
                            fontWeight: 700,
                          }}>
                            {o.payment_status === "paid"    ? "مدفوع" :
                             o.payment_status === "failed"  ? "فشل"   : "معلق"}
                          </span>
                        </div>
                        {o.tracking_number && (
                          <div><i className="fas fa-truck" /> رقم التتبع: {o.tracking_number}</div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="vnd-order-actions">
                        {updating === o.order_id ? (
                          <span style={{ color: "#888", fontSize: ".85rem" }}>
                            <i className="fas fa-spinner fa-spin" /> جارٍ التحديث...
                          </span>
                        ) : (
                          <>
                            {o.delivery_status === "pending" && (
                              <>
                                <button
                                  className="vnd-confirm-btn"
                                  onClick={() => updateStatus(o.order_id, "confirmed")}>
                                  <i className="fas fa-check" /> تأكيد الطلب
                                </button>
                                <button
                                  className="vnd-reject-btn"
                                  onClick={() => updateStatus(o.order_id, "cancelled")}>
                                  <i className="fas fa-times" /> رفض
                                </button>
                              </>
                            )}
                            {o.delivery_status === "confirmed" && (
                              <button
                                className="vnd-confirm-btn"
                                onClick={() => updateStatus(o.order_id, "out_for_delivery")}>
                                <i className="fas fa-truck" /> إرسال للتوصيل
                              </button>
                            )}
                            {o.delivery_status === "out_for_delivery" && (
                              <button
                                className="vnd-confirm-btn"
                                onClick={() => updateStatus(o.order_id, "delivered")}>
                                <i className="fas fa-flag-checkered" /> تم التوصيل
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE SECTION
// الجداول: users (name, avatar_url), vendor_profiles (business_name, business_email, phone, address)
// ═══════════════════════════════════════════════════════════════════════════════
function ProfileSection({ user, profile, refetch }) {
  const [form, setForm] = useState({
    name:           user?.name              || "",
    business_name:  profile?.business_name  || "",
    business_email: profile?.business_email || "",
    phone:          profile?.phone          || "",
    address:        profile?.address        || "",
    avatar_url:     user?.avatar_url        || "",
  });
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    setForm({
      name:           user?.name              || "",
      business_name:  profile?.business_name  || "",
      business_email: profile?.business_email || "",
      phone:          profile?.phone          || "",
      address:        profile?.address        || "",
      avatar_url:     user?.avatar_url        || "",
    });
  }, [user, profile]);

  const handleAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext  = file.name.split(".").pop();
      const path = `${user.user_id}/avatar_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setForm(p => ({ ...p, avatar_url: data.publicUrl }));
    } catch (e) {
      setError("فشل رفع الصورة: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      // تحديث users
      const { error: uErr } = await supabase
        .from("users")
        .update({ name: form.name.trim(), avatar_url: form.avatar_url || null })
        .eq("user_id", user.user_id);
      if (uErr) throw uErr;

      // upsert vendor_profiles
      const { error: vpErr } = await supabase
        .from("vendor_profiles")
        .upsert({
          vendor_id:      user.user_id,
          business_name:  form.business_name.trim()  || null,
          business_email: form.business_email.trim() || null,
          phone:          form.phone.trim()           || null,
          address:        form.address.trim()         || null,
        }, { onConflict: "vendor_id" });
      if (vpErr) throw vpErr;

      setSaved(true);
      refetch();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="vnd-section-hd">
        <h2><i className="fas fa-user-cog" /> ملفي الشخصي</h2>
      </div>

      {error && (
        <div style={{ background: "#fef0f0", color: "#dc2626", padding: "10px 14px", borderRadius: 10, marginBottom: 16, fontSize: ".85rem", fontWeight: 700 }}>
          <i className="fas fa-exclamation-circle" /> {error}
        </div>
      )}

      <form onSubmit={handleSave} className="vnd-form">
        {/* Avatar */}
        <div className="vnd-profile-avatar-section">
          <div className="vnd-profile-avatar-wrap" onClick={() => fileRef.current?.click()}>
            {form.avatar_url
              ? <img src={form.avatar_url} alt="" />
              : <div className="vnd-profile-avatar-init">
                  {form.name ? form.name.charAt(0).toUpperCase() : "V"}
                </div>}
            <div className="vnd-profile-avatar-overlay">
              {uploading
                ? <i className="fas fa-spinner fa-spin" />
                : <i className="fas fa-camera" />}
            </div>
          </div>
          <input type="file" ref={fileRef} accept="image/*" onChange={handleAvatar} style={{ display: "none" }} />
          <p style={{ fontSize: ".78rem", color: "#888", marginTop: 6 }}>انقر لتغيير الصورة الشخصية</p>
        </div>

        <div className="vnd-form-grid">
          {[
            { key: "name",           label: "الاسم الكامل *",                  type: "text",  icon: "fa-user",     required: true  },
            { key: "business_name",  label: "اسم الشركة / النشاط التجاري",    type: "text",  icon: "fa-building", required: false },
            { key: "business_email", label: "البريد الإلكتروني للأعمال",       type: "email", icon: "fa-envelope", required: false },
            { key: "phone",          label: "رقم الهاتف",                       type: "tel",   icon: "fa-phone",    required: false },
          ].map(f => (
            <div key={f.key} className="vnd-field">
              <label>
                <i className={`fas ${f.icon}`} style={{ marginLeft: 5, color: "#1a6b5c" }} />
                {f.label}
              </label>
              <input
                className="vnd-input"
                type={f.type}
                required={f.required}
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}

          <div className="vnd-field vnd-full">
            <label>
              <i className="fas fa-map-marker-alt" style={{ marginLeft: 5, color: "#1a6b5c" }} />
              العنوان
            </label>
            <textarea
              className="vnd-input"
              rows="3"
              value={form.address}
              placeholder="المدينة، الحي..."
              onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
          </div>
        </div>

        <button
          type="submit"
          className="vnd-btn-primary"
          disabled={saving || uploading}
          style={{ background: saved ? "#2ecc71" : undefined }}>
          {saving
            ? <><i className="fas fa-spinner fa-spin" /> جارٍ الحفظ...</>
            : saved
              ? <><i className="fas fa-check-circle" /> تم الحفظ ✅</>
              : <><i className="fas fa-save" /> حفظ التغييرات</>}
        </button>
      </form>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES + CSS
// ═══════════════════════════════════════════════════════════════════════════════
const S = {
  root:        { display: "flex", minHeight: "100vh", background: "#f4f7f6", fontFamily: "'Cairo',sans-serif", color: "#2d3748" },
  loading:     { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f4f7f6", gap: 14 },
  spinner:     { width: 40, height: 40, borderRadius: "50%", border: "4px solid #e8f5f2", borderTopColor: "#1a6b5c", animation: "spin .8s linear infinite" },
  overlay:     { position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 150 },
  sidebar:     { width: 255, minWidth: 255, background: "#1a2e2a", color: "#dbe8e5", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflowY: "auto", zIndex: 200, transition: ".35s" },
  sbLogo:      { fontFamily: "'Georgia',serif", fontStyle: "italic", fontWeight: "bold", fontSize: "1.1rem", color: "#8fcfc0", padding: "22px 20px 14px", borderBottom: "1px solid rgba(255,255,255,.08)" },
  sbAvatar:    { display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,.08)" },
  avatarImg:   { width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,.15)" },
  avatarInit:  { width: 44, height: 44, borderRadius: "50%", background: "#2e4d47", color: "#8fcfc0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.2rem" },
  navBadge:    { background: "#f39c12", color: "white", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".65rem", fontWeight: 800, marginRight: "auto" },
  main:        { flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowX: "hidden" },
  topbar:      { background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 99 },
hamburger: { background: "none", border: "none", fontSize: "1.4rem", 
             cursor: "pointer", color: "#718096", padding: 8 },
  topAvatarWrap:{ display: "flex", alignItems: "center" },
  topAvatarInit:{ width: 34, height: 34, borderRadius: "50%", background: "#e8f5f2", color: "#1a6b5c", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: ".95rem" },
  content:     { padding: 28, flex: 1, maxWidth: 1100, margin: "0 auto", width: "100%" },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

/* Sidebar */
.vnd-sidebar{transition:.35s;}
.vnd-nav{width:100%;background:none;border:none;padding:11px 14px;border-radius:12px;display:flex;align-items:center;gap:12px;text-align:start;cursor:pointer;font-family:'Cairo';font-size:.87rem;font-weight:600;color:#a9c5be;transition:.25s;margin-bottom:4px;}
.vnd-nav i{width:20px;text-align:center;flex-shrink:0;}
.vnd-nav:hover{background:rgba(255,255,255,.07);color:#e0f0ec;}
.vnd-nav.active{background:rgba(255,255,255,.12);color:#8fcfc0;font-weight:700;}
.vnd-logout{margin-top:auto;border-top:1px solid rgba(255,255,255,.08);padding-top:14px;color:#f08080!important;border-radius:0!important;}
.vnd-logout:hover{background:rgba(240,128,128,.1)!important;color:#f08080!important;}

/* Welcome */
.vnd-welcome{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:26px;flex-wrap:wrap;gap:14px;}
.vnd-alert-warn{background:#fff8f0;border:1px solid #fde8c8;color:#c17f24;padding:10px 16px;border-radius:12px;display:flex;align-items:center;gap:10px;font-weight:700;font-size:.87rem;flex-wrap:wrap;}

/* Stats */
.vnd-stats-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px;margin-bottom:24px;}
.vnd-stat-card{background:#fff;border-radius:16px;padding:18px 14px;text-align:center;border:1px solid #e2e8f0;box-shadow:0 2px 10px rgba(0,0,0,.04);transition:.3s;}
.vnd-stat-card:hover{transform:translateY(-3px);box-shadow:0 6px 20px rgba(0,0,0,.07);}
.vnd-stat-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;margin:0 auto 10px;}
.vnd-stat-val{font-size:1.5rem;font-weight:900;line-height:1;color:#1a2e2a;}
.vnd-stat-lbl{font-size:.72rem;color:#718096;font-weight:700;margin-top:4px;}

/* Store banner */
.vnd-store-banner{background:#fff;border-radius:16px;padding:18px 22px;margin-bottom:22px;border:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;}

/* Panel */
.vnd-panel{background:#fff;border-radius:16px;padding:20px;border:1px solid #e2e8f0;box-shadow:0 2px 10px rgba(0,0,0,.04);}
.vnd-panel-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
.vnd-panel-hd h3{font-size:.95rem;font-weight:700;display:flex;align-items:center;gap:8px;color:#1a2e2a;}
.vnd-panel-hd h3 i{color:#1a6b5c;}
.vnd-panel-more{background:none;border:none;color:#1a6b5c;font-weight:700;font-size:.8rem;cursor:pointer;font-family:'Cairo';}
.vnd-panel-more:hover{text-decoration:underline;}

/* Orders row */
.vnd-order-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #f5f5f5;flex-wrap:wrap;}
.vnd-order-row:last-child{border:none;}
.vnd-order-info{flex:1;min-width:100px;}
.vnd-order-info strong{display:block;font-size:.87rem;font-weight:700;}
.vnd-order-info span{font-size:.73rem;color:#aaa;}
.vnd-status-pill{font-size:.73rem;font-weight:700;padding:3px 10px;border-radius:20px;white-space:nowrap;}

/* Hero preview */
.vnd-hero-preview{min-height:180px;border-radius:16px;margin-bottom:20px;overflow:hidden;position:relative;}

/* Img upload */
.vnd-img-upload-row{display:flex;gap:14px;margin-bottom:20px;flex-wrap:wrap;}
.vnd-img-upload-card{position:relative;border:2px dashed #ddd;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:.3s;overflow:hidden;}
.vnd-img-upload-card:hover{border-color:#1a6b5c;background:#e8f5f2;}

/* Form */
.vnd-form{background:#fff;border-radius:16px;padding:24px;border:1px solid #e2e8f0;}
.vnd-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;}
.vnd-field{display:flex;flex-direction:column;gap:6px;}
.vnd-field label{font-size:.83rem;font-weight:700;color:#4a5568;}
.vnd-full{grid-column:span 2;}
.vnd-input{width:100%;padding:10px 13px;border-radius:11px;border:1px solid #ddd;outline:none;font-family:'Cairo';font-size:.85rem;background:#fafafa;transition:.3s;color:#2d3748;}
.vnd-input:focus{border-color:#1a6b5c;background:#fff;box-shadow:0 0 0 3px rgba(26,107,92,.1);}

/* Products */
.vnd-products-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px;}
.vnd-product-card{background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;transition:.3s;}
.vnd-product-card:hover{box-shadow:0 6px 20px rgba(0,0,0,.07);transform:translateY(-2px);}
.vnd-product-card.inactive{opacity:.65;}
.vnd-product-img-wrap{position:relative;height:160px;overflow:hidden;background:#f4f4f4;}
.vnd-product-img-wrap img{width:100%;height:100%;object-fit:cover;transition:.4s;}
.vnd-product-card:hover .vnd-product-img-wrap img{transform:scale(1.05);}
.vnd-product-img-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;color:#ddd;}
.vnd-product-badge{position:absolute;top:8px;right:8px;font-size:.7rem;font-weight:700;padding:3px 9px;border-radius:20px;}
.vnd-product-badge.active{background:#e8f5f2;color:#1a6b5c;}
.vnd-product-badge.inactive{background:#f0f0f0;color:#888;}
.vnd-product-actions{display:flex;gap:6px;padding:10px 14px;border-top:1px solid #f0f0f0;}
.vnd-icon-btn{background:#f4f4f4;border:none;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:.85rem;color:#888;transition:.3s;display:flex;align-items:center;justify-content:center;}
.vnd-icon-btn:hover{background:#e8f5f2;color:#1a6b5c;}
.vnd-icon-btn.danger:hover{background:#fef0f0;color:#e74c3c;}
.vnd-icon-btn:disabled{opacity:.5;cursor:not-allowed;}

/* Orders */
.vnd-order-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;}
.vnd-order-card-top{display:flex;align-items:center;gap:14px;padding:14px 18px;cursor:pointer;transition:.2s;flex-wrap:wrap;}
.vnd-order-card-top:hover{background:#f9f9f9;}
.vnd-order-id{display:flex;align-items:center;gap:7px;font-size:.78rem;color:#888;font-weight:700;font-family:monospace;}
.vnd-order-customer{display:flex;align-items:center;gap:7px;font-weight:700;font-size:.88rem;flex:1;min-width:100px;}
.vnd-order-date{font-size:.78rem;color:#aaa;}
.vnd-order-detail{border-top:1px solid #f0f0f0;padding:18px;background:#fafafa;animation:fadeUp .3s ease;}
.vnd-order-items{background:#fff;border-radius:10px;padding:14px;margin-bottom:14px;border:1px solid #eee;}
.vnd-order-item-row{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #f5f5f5;font-size:.85rem;}
.vnd-order-item-row:last-child{border:none;}
.vnd-order-delivery-info{display:flex;flex-direction:column;gap:7px;font-size:.84rem;color:#718096;margin-bottom:14px;}
.vnd-order-delivery-info i{width:18px;color:#1a6b5c;flex-shrink:0;}
.vnd-order-actions{display:flex;gap:8px;flex-wrap:wrap;}

/* Profile avatar */
.vnd-profile-avatar-section{text-align:center;margin-bottom:24px;}
.vnd-profile-avatar-wrap{width:90px;height:90px;border-radius:50%;margin:0 auto;position:relative;cursor:pointer;overflow:hidden;border:3px solid #e8f5f2;}
.vnd-profile-avatar-wrap img{width:100%;height:100%;object-fit:cover;}
.vnd-profile-avatar-init{width:100%;height:100%;background:#e8f5f2;color:#1a6b5c;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.8rem;}
.vnd-profile-avatar-overlay{position:absolute;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;opacity:0;transition:.3s;color:#fff;font-size:1.3rem;}
.vnd-profile-avatar-wrap:hover .vnd-profile-avatar-overlay{opacity:1;}

/* Section header */
.vnd-section-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;gap:12px;flex-wrap:wrap;}
.vnd-section-hd h2{font-size:1.25rem;font-weight:900;color:#1a2e2a;display:flex;align-items:center;gap:9px;}
.vnd-section-hd h2 i{color:#1a6b5c;}
.vnd-count-badge{background:#e8f5f2;color:#1a6b5c;padding:4px 12px;border-radius:20px;font-weight:700;font-size:.83rem;}

/* Filters */
.vnd-filter-bar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;}
.vnd-filter-btn{background:#fff;border:1.5px solid #e2e8f0;padding:7px 16px;border-radius:25px;font-family:'Cairo';font-weight:700;font-size:.8rem;color:#718096;cursor:pointer;transition:.3s;display:flex;align-items:center;gap:6px;}
.vnd-filter-btn:hover{border-color:#1a6b5c;color:#1a6b5c;}
.vnd-filter-btn.active{background:#1a6b5c;color:#fff;border-color:#1a6b5c;}
.vnd-filter-count{background:rgba(255,255,255,.25);padding:1px 7px;border-radius:10px;font-size:.7rem;}

/* Search */
.vnd-search-bar{background:#fff;border-radius:14px;padding:9px 14px;display:flex;align-items:center;gap:10px;border:1px solid #e2e8f0;min-width:200px;}
.vnd-search-bar input{border:none;background:transparent;outline:none;font-family:'Cairo';font-size:.85rem;width:100%;color:#2d3748;}

/* Buttons */
.vnd-btn-primary{background:#1a6b5c;color:#fff;border:none;padding:10px 20px;border-radius:12px;font-family:'Cairo';font-weight:700;font-size:.87rem;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:.3s;}
.vnd-btn-primary:hover{background:#145e50;transform:translateY(-1px);}
.vnd-btn-primary:disabled{opacity:.6;cursor:not-allowed;transform:none;}
.vnd-btn-secondary{background:#fff;color:#1a6b5c;border:1.5px solid #1a6b5c;padding:8px 16px;border-radius:12px;font-family:'Cairo';font-weight:700;font-size:.84rem;cursor:pointer;display:inline-flex;align-items:center;gap:7px;transition:.3s;}
.vnd-btn-secondary:hover{background:#e8f5f2;}
.vnd-confirm-btn{background:#e8f5f2;color:#1a6b5c;border:none;padding:8px 16px;border-radius:10px;font-family:'Cairo';font-weight:700;font-size:.83rem;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:.3s;}
.vnd-confirm-btn:hover{background:#1a6b5c;color:#fff;}
.vnd-reject-btn{background:#fef0f0;color:#e74c3c;border:none;padding:8px 16px;border-radius:10px;font-family:'Cairo';font-weight:700;font-size:.83rem;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:.3s;}
.vnd-reject-btn:hover{background:#e74c3c;color:#fff;}

/* Modal */
.vnd-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);display:flex;justify-content:center;align-items:center;z-index:3000;padding:15px;}
.vnd-modal{background:#fff;width:100%;max-width:490px;border-radius:22px;padding:28px;box-shadow:0 20px 50px rgba(0,0,0,.15);max-height:92vh;overflow-y:auto;}
.vnd-modal-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;}
.vnd-modal-hd h2{font-size:1.1rem;font-weight:800;color:#1a2e2a;}
.vnd-modal-hd button{background:none;border:none;font-size:1.3rem;color:#aaa;cursor:pointer;transition:.3s;line-height:1;}
.vnd-modal-hd button:hover{color:#e74c3c;transform:rotate(90deg);}
.vnd-modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;}

/* Product image upload */
.vnd-product-img-upload{width:100%;height:140px;border:2px dashed #ddd;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:.3s;overflow:hidden;position:relative;}
.vnd-product-img-upload:hover{border-color:#1a6b5c;background:#f9fffe;}
.vnd-img-uploading{position:absolute;inset:0;background:rgba(255,255,255,.8);display:flex;align-items:center;justify-content:center;}

/* Empty */
.vnd-empty{text-align:center;padding:40px 20px;color:#aaa;display:flex;flex-direction:column;align-items:center;gap:10px;}
.vnd-empty span{font-size:3rem;}
.vnd-empty p{font-weight:700;font-size:.9rem;}

/* Responsive */
@media(max-width:900px){
  .vnd-sidebar{position:fixed!important;top:0;bottom:0;right:0;transform:translateX(100%);z-index:200;}
  .vnd-sidebar.open{transform:translateX(0);}
@media(max-width:900px){
  .vnd-hamburger-btn { display:flex!important; align-items:center; }
}
}
@media(max-width:768px){
  .vnd-form-grid,.vnd-modal-grid{grid-template-columns:1fr!important;}
  .vnd-full{grid-column:span 1!important;}
  .vnd-products-grid{grid-template-columns:repeat(2,1fr);}
  .vnd-stats-grid{grid-template-columns:repeat(2,1fr);}
}
@media(max-width:480px){
  .vnd-products-grid{grid-template-columns:1fr;}
  .vnd-stats-grid{grid-template-columns:repeat(2,1fr);}
}
`;






