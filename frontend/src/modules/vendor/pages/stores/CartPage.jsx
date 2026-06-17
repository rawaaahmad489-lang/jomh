// src/pages/stores/CartPage.jsx
// ═══════════════════════════════════════════════════════════
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../../core/context/CartContext";

export function CartPage() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, cartCount, updateQty, removeItem, loading } = useCart();

  if (loading) return (
    <div style={CS.loading} dir="rtl">
      <div style={CS.spinner} /><p>جارٍ تحميل السلة...</p>
    </div>
  );

  // group items by store
  const byStore = {};
  cartItems.forEach(item => {
    const storeId = item.products?.stores?.store_id || "unknown";
    if (!byStore[storeId]) {
      byStore[storeId] = {
        store: item.products?.stores,
        items: [],
      };
    }
    byStore[storeId].items.push(item);
  });

  return (
    <div dir="rtl" style={CS.page}>
      <style>{CART_CSS}</style>

      {/* Header */}
      <div style={CS.header}>
        <button style={CS.backBtn} onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-right" /> متابعة التسوق
        </button>
        <h1 style={CS.title}>
          <i className="fas fa-shopping-cart" /> سلة التسوق
          {cartCount > 0 && <span style={CS.badge}>{cartCount}</span>}
        </h1>
      </div>

      {cartItems.length === 0 ? (
        <div style={CS.empty}>
          <span style={{ fontSize: "4rem", display: "block", marginBottom: 14 }}>🛒</span>
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>سلتك فارغة!</h3>
          <p style={{ color: "#aaa", marginBottom: 20 }}>تصفّحي متاجرنا وأضيفي ما يعجبكِ</p>
          <button style={CS.shopBtn} onClick={() => navigate("/stores")}>
            <i className="fas fa-store" /> تصفّح المتاجر
          </button>
        </div>
      ) : (
        <div style={CS.layout}>
          {/* Cart items */}
          <div style={{ flex: 1 }}>
            {Object.values(byStore).map(({ store, items }) => (
              <div key={store?.store_id || "x"} style={CS.storeGroup}>
                {/* Store header */}
                <div style={CS.storeGroupHeader}>
                  {store?.logo
                    ? <img src={store.logo} alt="" style={CS.storeGroupLogo} />
                    : <span>🏪</span>}
                  <span style={{ fontWeight: 700 }}>{store?.store_name || "متجر"}</span>
                </div>

                {items.map(item => {
                  const product = item.products;
                  return (
                    <div key={item.cart_item_id} className="cart-item-row">
                      {/* Image */}
                      <div style={CS.itemImg}>
                        {product?.image_url
                          ? <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} />
                          : <div style={{ width: "100%", height: "100%", background: "#f5f0ea", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>🛍️</div>}
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{product?.name}</div>
                        <div style={{ fontWeight: 900, color: "#D6A3B0", fontSize: "1rem" }}>
                          ₪ {((product?.price || 0) * item.quantity).toFixed(0)}
                        </div>
                        <div style={{ fontSize: ".75rem", color: "#aaa", marginTop: 2 }}>
                          ₪ {product?.price} / قطعة
                        </div>
                      </div>
                      {/* Qty control */}
                      <div style={CS.qtyControl}>
                        <button className="qty-btn" onClick={() => updateQty(item.cart_item_id, item.quantity - 1)}>
                          <i className="fas fa-minus" />
                        </button>
                        <span style={{ fontWeight: 700, minWidth: 24, textAlign: "center" }}>{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQty(item.cart_item_id, item.quantity + 1)}>
                          <i className="fas fa-plus" />
                        </button>
                      </div>
                      {/* Remove */}
                      <button className="remove-btn" onClick={() => removeItem(item.cart_item_id)}>
                        <i className="fas fa-trash-alt" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div style={CS.summary}>
            <h3 style={{ fontWeight: 800, marginBottom: 18, fontSize: "1.05rem" }}>
              <i className="fas fa-receipt" /> ملخص الطلب
            </h3>
            <div style={CS.summaryRow}>
              <span>المنتجات ({cartCount})</span>
              <span>₪ {cartTotal.toFixed(0)}</span>
            </div>
            <div style={CS.summaryRow}>
              <span>التوصيل</span>
              <span style={{ color: "#2ecc71", fontWeight: 700 }}>مجاني</span>
            </div>
            <div style={{ ...CS.summaryRow, borderTop: "2px solid #f0e8e0", paddingTop: 14, marginTop: 6 }}>
              <span style={{ fontWeight: 800, fontSize: "1.05rem" }}>الإجمالي</span>
              <span style={{ fontWeight: 900, fontSize: "1.2rem", color: "#D6A3B0" }}>₪ {cartTotal.toFixed(0)}</span>
            </div>
            <button style={CS.checkoutBtn} onClick={() => navigate("/checkout")}>
              <i className="fas fa-lock" /> إتمام الطلب
            </button>
            <button style={CS.continueBtn} onClick={() => navigate("/stores")}>
              <i className="fas fa-store" /> متابعة التسوق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const CS = {
  page:      { background: "#F8F1EA", minHeight: "100vh", fontFamily: "'Cairo','Tajawal',sans-serif", padding: "24px", direction: "rtl" },
  loading:   { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "#F8F1EA" },
  spinner:   { width: 34, height: 34, borderRadius: "50%", border: "4px solid #F0E6DD", borderTopColor: "#D6A3B0", animation: "spin .8s linear infinite" },
  header:    { maxWidth: 1100, margin: "0 auto 24px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" },
  backBtn:   { background: "#fff", border: "1px solid #F0E6DD", color: "#8C746A", padding: "8px 16px", borderRadius: 20, cursor: "pointer", fontFamily: "'Cairo'", fontWeight: 700, fontSize: ".82rem", display: "inline-flex", alignItems: "center", gap: 7 },
  title:     { fontWeight: 900, fontSize: "1.4rem", color: "#2d2825", display: "flex", alignItems: "center", gap: 10 },
  badge:     { background: "#D6A3B0", color: "#fff", borderRadius: "50%", width: 26, height: 26, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: ".82rem", fontWeight: 800 },
  empty:     { maxWidth: 420, margin: "60px auto", textAlign: "center", color: "#5D544F" },
  shopBtn:   { background: "#D6A3B0", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 25, cursor: "pointer", fontFamily: "'Cairo'", fontWeight: 700, fontSize: ".9rem", display: "inline-flex", alignItems: "center", gap: 8 },
  layout:    { maxWidth: 1100, margin: "0 auto", display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" },
  storeGroup:{ background: "#fff", borderRadius: 16, border: "1px solid #F0E6DD", marginBottom: 16, overflow: "hidden" },
  storeGroupHeader:{ background: "#f5f0ea", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, fontSize: ".88rem", fontWeight: 700, color: "#5D544F" },
  storeGroupLogo:{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover" },
  itemImg:   { width: 72, height: 72, flexShrink: 0 },
  qtyControl:{ display: "flex", alignItems: "center", gap: 10, background: "#f5f0ea", borderRadius: 20, padding: "5px 12px" },
  summary:   { width: 300, minWidth: 260, background: "#fff", borderRadius: 18, padding: "22px", border: "1px solid #F0E6DD", position: "sticky", top: 20 },
  summaryRow:{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: ".88rem", fontWeight: 600 },
  checkoutBtn:{ width: "100%", background: "#D6A3B0", color: "#fff", border: "none", padding: "13px 0", borderRadius: 25, cursor: "pointer", fontFamily: "'Cairo'", fontWeight: 800, fontSize: ".95rem", marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  continueBtn:{ width: "100%", background: "transparent", color: "#8C746A", border: "1px solid #F0E6DD", padding: "10px 0", borderRadius: 25, cursor: "pointer", fontFamily: "'Cairo'", fontWeight: 700, fontSize: ".85rem", marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
};

const CART_CSS = `
@keyframes spin{to{transform:rotate(360deg)}}
.cart-item-row{display:flex;align-items:center;gap:14px;padding:14px 16px;border-bottom:1px solid #f5f0ea;}
.cart-item-row:last-child{border:none;}
.qty-btn{background:none;border:none;width:26px;height:26px;cursor:pointer;color:#8C746A;font-size:.75rem;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:.2s;}
.qty-btn:hover{background:#F0E6DD;}
.remove-btn{background:none;border:none;color:#ddd;cursor:pointer;font-size:.9rem;padding:6px;border-radius:8px;transition:.3s;}
.remove-btn:hover{color:#e74c3c;background:#fef0f0;}
`;
