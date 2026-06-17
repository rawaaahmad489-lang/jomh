// src/pages/stores/CheckoutPage.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../../services/supabaseClient";
import { useCart } from "../../../../core/context/CartContext";

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();

  const [form, setForm] = useState({
    delivery_address: "",
    contact_phone: "",
    payment_method: "cash_on_delivery",
  });
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(false);

  const placeOrder = async () => {
  if (!form.delivery_address || !form.contact_phone) {
    alert("يرجى إدخال عنوان التوصيل ورقم الهاتف");
    return;
  }
  setPlacing(true);
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const { data: u } = await supabase
      .from("users")
      .select("user_id")
      .eq("auth_id", authUser.id)
      .single();

    // ── 1. إنشاء الطلب ──────────────────────────────────────
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id:          u.user_id,
        total:            cartTotal,
        delivery_address: form.delivery_address,
        contact_phone:    form.contact_phone,
        payment_method:   form.payment_method,
        delivery_status:  "pending",
        payment_status:   "pending",
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    // ── 2. تحضير order_items مع التحقق من store_id ───────────
    // إذا store_id غير موجود في cartItems، نجلبه من products مباشرة
    const orderItems = [];

    for (const item of cartItems) {
      const productId = item.products?.product_id;
      if (!productId) continue;

      // جلب store_id مباشرة من products إذا لم يكن موجوداً
      let storeId = item.products?.stores?.store_id || item.products?.store_id;

      if (!storeId) {
        const { data: prod } = await supabase
          .from("products")
          .select("store_id")
          .eq("product_id", productId)
          .single();
        storeId = prod?.store_id || null;
      }

      orderItems.push({
        order_id:              order.order_id,
        product_id:            productId,
        store_id:              storeId,            // ← مضمون الآن
        quantity:              item.quantity,
        price:                 item.products.price,
        product_name_snapshot: item.products.name,
        price_snapshot:        item.products.price,
      });
    }

    // ── 3. حفظ order_items ────────────────────────────────────
    if (orderItems.length > 0) {
      const { error: itemsErr } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsErr) {
        console.error("order_items insert error:", itemsErr);
        throw itemsErr;
      }
    }

    // ── 4. تحديث المخزون ─────────────────────────────────────
    for (const item of cartItems) {
      if (!item.products?.product_id) continue;
      await supabase
        .from("products")
        .update({
          stock: Math.max(0, (item.products.stock || 0) - item.quantity),
        })
        .eq("product_id", item.products.product_id);
    }

    await clearCart();
    setSuccess(true);
  } catch (err) {
    console.error("placeOrder error:", err);
    alert("حدث خطأ أثناء إتمام الطلب: " + err.message);
  } finally {
    setPlacing(false);
  }
};
  // ── Success screen ────────────────────────────────────────
  if (success) return (
    <div style={{ ...CS.page, display: "flex", alignItems: "center", justifyContent: "center" }} dir="rtl">
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ fontSize: "4rem", marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontWeight: 900, marginBottom: 8, color: "#1a6b5c" }}>تم تقديم طلبك بنجاح!</h2>
        <p style={{ color: "#888", lineHeight: 1.7, marginBottom: 24 }}>
          شكراً لطلبكِ! سيتواصل معكِ المتجر قريباً لتأكيد الطلب.
        </p>
        <button style={CS.shopBtn} onClick={() => navigate("/stores")}>
          <i className="fas fa-store" /> مواصلة التسوق
        </button>
      </div>
    </div>
  );

  // ── Checkout form ─────────────────────────────────────────
  return (
    <div dir="rtl" style={{ ...CS.page, padding: "28px 24px" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <button style={CS.backBtn} onClick={() => navigate("/cart")}>
          <i className="fas fa-arrow-right" /> العودة للسلة
        </button>
        <h1 style={{ ...CS.title, margin: "16px 0 26px" }}>
          <i className="fas fa-lock" /> إتمام الطلب
        </h1>

        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", alignItems: "flex-start" }}>
          {/* ── Delivery form ── */}
          <div style={{
            flex: 1, minWidth: 260, background: "#fff",
            borderRadius: 18, padding: "24px", border: "1px solid #F0E6DD",
          }}>
            <h3 style={{ fontWeight: 800, marginBottom: 18, fontSize: "1rem" }}>
              <i className="fas fa-map-marker-alt" style={{ color: "#D6A3B0" }} /> بيانات التوصيل
            </h3>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontWeight: 700, fontSize: ".83rem", marginBottom: 6 }}>
                عنوان التوصيل *
              </label>
              <textarea
                rows="3"
                style={CS.inputBase}
                placeholder="المدينة، الحي، الشارع، رقم البناية..."
                value={form.delivery_address}
                onChange={e => setForm(p => ({ ...p, delivery_address: e.target.value }))}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontWeight: 700, fontSize: ".83rem", marginBottom: 6 }}>
                رقم الهاتف *
              </label>
              <input
                type="tel"
                style={CS.inputBase}
                placeholder="05xxxxxxxx"
                value={form.contact_phone}
                onChange={e => setForm(p => ({ ...p, contact_phone: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 700, fontSize: ".83rem", marginBottom: 10 }}>
                <i className="fas fa-credit-card" style={{ color: "#D6A3B0" }} /> طريقة الدفع
              </label>
              {[
                { val: "cash_on_delivery", label: "💵 الدفع عند الاستلام", desc: "ادفعي عند وصول طلبكِ" },
                { val: "card",             label: "💳 بطاقة ائتمان",       desc: "Visa / Mastercard"   },
                { val: "online",           label: "📱 دفع إلكتروني",       desc: "PayPal / محفظة"     },
              ].map(opt => (
                <label key={opt.val} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", borderRadius: 12, cursor: "pointer", marginBottom: 8,
                  border: `1.5px solid ${form.payment_method === opt.val ? "#D6A3B0" : "#F0E6DD"}`,
                  background: form.payment_method === opt.val ? "#fdf2f5" : "#fafafa",
                  transition: ".25s",
                }}>
                  <input
                    type="radio" name="payment" value={opt.val}
                    checked={form.payment_method === opt.val}
                    onChange={() => setForm(p => ({ ...p, payment_method: opt.val }))}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: ".88rem" }}>{opt.label}</div>
                    <div style={{ fontSize: ".74rem", color: "#aaa" }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* ── Order summary ── */}
          <div style={{
            width: 280, minWidth: 240, background: "#fff",
            borderRadius: 18, padding: "22px", border: "1px solid #F0E6DD",
          }}>
            <h3 style={{ fontWeight: 800, marginBottom: 14, fontSize: "1rem" }}>
              <i className="fas fa-receipt" style={{ color: "#D6A3B0" }} /> ملخص الطلب
            </h3>

            {cartItems.map(item => (
              <div key={item.cart_item_id} style={{
                display: "flex", justifyContent: "space-between",
                padding: "7px 0", fontSize: ".83rem", borderBottom: "1px solid #f5f0ea",
              }}>
                <span style={{ flex: 1 }}>
                  {item.products?.name} × {item.quantity}
                </span>
                <span style={{ fontWeight: 700 }}>
                  ₪ {((item.products?.price || 0) * item.quantity).toFixed(0)}
                </span>
              </div>
            ))}

            <div style={{
              display: "flex", justifyContent: "space-between",
              padding: "14px 0 0", fontWeight: 900, fontSize: "1.05rem", marginTop: 4,
            }}>
              <span>الإجمالي</span>
              <span style={{ color: "#D6A3B0" }}>₪ {cartTotal.toFixed(0)}</span>
            </div>

            <button
              style={{ ...CS.checkoutBtn, marginTop: 18 }}
              onClick={placeOrder}
              disabled={placing}>
              {placing
                ? <><i className="fas fa-spinner fa-spin" /> جارٍ تقديم الطلب...</>
                : <><i className="fas fa-check-circle" /> تأكيد وإتمام الطلب</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────
const CS = {
  page: {
    background: "#F8F1EA",
    minHeight: "100vh",
    fontFamily: "'Cairo', sans-serif",
    color: "#2d2825",
  },
  inputBase: {
    width: "100%",
    padding: "10px 13px",
    borderRadius: 12,
    border: "1px solid #ddd",
    fontFamily: "'Cairo'",
    fontSize: ".85rem",
    resize: "vertical",
    outline: "none",
    background: "#fafafa",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#8C746A",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: ".9rem",
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: 0,
    marginBottom: 10,
  },
  title: {
    fontSize: "1.8rem",
    fontWeight: 900,
    color: "#2d2825",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  checkoutBtn: {
    width: "100%",
    background: "#D6A3B0",
    color: "#fff",
    border: "none",
    padding: "12px 0",
    borderRadius: 12,
    cursor: "pointer",
    fontFamily: "'Cairo'",
    fontWeight: 800,
    fontSize: "1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: ".3s",
    boxShadow: "0 4px 12px rgba(214, 163, 176, 0.3)",
  },
  shopBtn: {
    background: "#1a6b5c",
    color: "#fff",
    border: "none",
    padding: "10px 24px",
    borderRadius: 25,
    cursor: "pointer",
    fontFamily: "'Cairo'",
    fontWeight: 700,
    fontSize: ".9rem",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    transition: ".3s",
  },
};