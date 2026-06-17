// src/components/recommendations/DoctorRecModal.jsx
// ================================================================
// نافذة إنشاء / تعديل التوصية للطبيب
// تُستدعى من DoctorDashboard.jsx
// ================================================================
import { useState, useRef, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";

export default function DoctorRecModal({ isAr, doctorId, existing = null, onClose, onSuccess }) {
  const isEdit = !!existing;

  const [form, setForm] = useState({
    title:          existing?.title          || "",
    description:    existing?.description    || "",
    target_age_min: existing?.target_age_min ?? 0,
    target_age_max: existing?.target_age_max ?? 12,
    status:         existing?.status         || "published",
    video_url:      existing?.video_url      || "",
    age_group:      existing?.age_group      || "",
    tagInput:       "",
    tags:           (existing?.recommendation_tags || []).map(t => t.tags?.name).filter(Boolean),
  });

  const [coverFile,    setCoverFile]    = useState(null);
  const [coverPreview, setCoverPreview] = useState(existing?.cover_image || null);
  const [extraFiles,   setExtraFiles]   = useState([]);
  const [saving,       setSaving]       = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error,        setError]        = useState("");

  // جلب المنتجات المتاحة
  const [allProducts, setAllProducts]   = useState([]);
  const [prodSearch,  setProdSearch]    = useState("");
  const [linkedProds, setLinkedProds]   = useState(
    (existing?.recommendation_products || []).map(rp => ({
      product_id:         rp.products?.product_id || rp.product_id,
      name:               rp.products?.name || "",
      image_url:          rp.products?.image_url || "",
      price:              rp.products?.price || 0,
      store_name:         rp.products?.stores?.store_name || "",
      usage_instructions: rp.usage_instructions || "",
      duration_days:      rp.duration_days || "",
      notes:              rp.notes || "",
      is_alternative:     rp.is_alternative || false,
    }))
  );

  const coverRef = useRef();
  const extraRef = useRef();

  useEffect(() => {
    supabase.from("products")
      .select("product_id, name, image_url, price, stores(store_name)")
      .eq("is_active", true)
      .order("name")
      .limit(200)
      .then(({ data }) => setAllProducts(data || []));
  }, []);

  // ── رفع صورة الغلاف ─────────────────────────────────
  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const uploadFile = async (file, folder) => {
    const ext  = file.name.split(".").pop();
    const path = `${doctorId}/${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from("recommendations")
      .upload(path, file, { upsert: true });
    if (error) throw error;
    return supabase.storage.from("recommendations").getPublicUrl(path).data.publicUrl;
  };

  // ── الحفظ ─────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError(isAr ? "العنوان مطلوب" : "Title required"); return; }
    setSaving(true); setError("");
    try {
      // رفع الغلاف
      let coverUrl = existing?.cover_image || null;
      if (coverFile) {
        setUploadingCover(true);
        coverUrl = await uploadFile(coverFile, "covers");
        setUploadingCover(false);
      }

      // رفع الملفات الإضافية
      const mediaUrls = existing?.media_urls || [];
      for (const f of extraFiles) {
        const url = await uploadFile(f, "media");
        mediaUrls.push({ url, name: f.name, type: f.type });
      }

      const payload = {
        doctor_id:      doctorId,
        title:          form.title.trim(),
        description:    form.description.trim(),
        target_age_min: parseInt(form.target_age_min) || 0,
        target_age_max: parseInt(form.target_age_max) || 12,
        status:         form.status,
        cover_image:    coverUrl,
        video_url:      form.video_url.trim() || null,
        media_urls:     mediaUrls,
        age_group:      form.age_group.trim() || null,
      };

      let recId = existing?.id;
      if (isEdit) {
        const { error } = await supabase.from("doctor_recommendations")
          .update(payload).eq("id", recId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("doctor_recommendations")
          .insert(payload).select().single();
        if (error) throw error;
        recId = data.id;
      }

      // Tags — حذف القديم وإضافة الجديد
      await supabase.from("recommendation_tags").delete().eq("recommendation_id", recId);
      for (const tagName of form.tags) {
        if (!tagName.trim()) continue;
        let { data: tag } = await supabase.from("tags").select("tag_id").eq("name", tagName).maybeSingle();
        if (!tag) {
          const { data: nt } = await supabase.from("tags").insert({ name: tagName }).select().single();
          tag = nt;
        }
        if (tag) await supabase.from("recommendation_tags")
          .insert({ recommendation_id: recId, tag_id: tag.tag_id });
      }

      // Products — حذف القديم وإضافة الجديد
      await supabase.from("recommendation_products").delete().eq("recommendation_id", recId);
      for (let i = 0; i < linkedProds.length; i++) {
        const lp = linkedProds[i];
        await supabase.from("recommendation_products").insert({
          recommendation_id:  recId,
          product_id:         lp.product_id,
          usage_instructions: lp.usage_instructions || null,
          duration_days:      lp.duration_days ? parseInt(lp.duration_days) : null,
          notes:              lp.notes || null,
          is_alternative:     lp.is_alternative || false,
          sort_order:         i,
        });
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      setError(err.message || (isAr ? "حدث خطأ" : "Error"));
    } finally { setSaving(false); }
  };

  const addTag = () => {
    const t = form.tagInput.trim();
    if (t && !form.tags.includes(t)) setForm(p => ({ ...p, tags: [...p.tags, t], tagInput: "" }));
  };

  const addProduct = (prod) => {
    if (linkedProds.find(lp => lp.product_id === prod.product_id)) return;
    setLinkedProds(p => [...p, {
      product_id: prod.product_id,
      name: prod.name,
      image_url: prod.image_url,
      price: prod.price,
      store_name: prod.stores?.store_name || "",
      usage_instructions: "",
      duration_days: "",
      notes: "",
      is_alternative: false,
    }]);
  };

  const removeProduct = (pid) => setLinkedProds(p => p.filter(lp => lp.product_id !== pid));
  const updateProd = (pid, field, val) =>
    setLinkedProds(p => p.map(lp => lp.product_id === pid ? { ...lp, [field]: val } : lp));

  const filteredProds = allProducts.filter(p =>
    !linkedProds.find(lp => lp.product_id === p.product_id) &&
    (!prodSearch || p.name.toLowerCase().includes(prodSearch.toLowerCase()))
  );

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal} dir={isAr ? "rtl" : "ltr"}>
        <div style={S.header}>
          <h2 style={{ fontWeight: 900, fontSize: "1.1rem" }}>
            {isEdit
              ? (isAr ? "✏️ تعديل التوصية" : "✏️ Edit Recommendation")
              : (isAr ? "💡 توصية طبية جديدة" : "💡 New Recommendation")}
          </h2>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        {error && (
          <div style={S.errBox}>
            <i className="fas fa-exclamation-circle" /> {error}
          </div>
        )}

        <form onSubmit={handleSave} style={{ overflowY: "auto", maxHeight: "78vh", padding: "18px 22px" }}>

          {/* ── Cover image ── */}
          <div style={S.field}>
            <label style={S.label}>{isAr ? "صورة الغلاف" : "Cover Image"}</label>
            <div style={S.coverWrap} onClick={() => coverRef.current?.click()}>
              {coverPreview
                ? <img src={coverPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }} />
                : <div style={S.coverPlaceholder}>
                    <i className="fas fa-image" style={{ fontSize: "2rem", color: "#ccc" }} />
                    <span style={{ fontSize: ".78rem", color: "#aaa" }}>{isAr ? "انقر لرفع صورة" : "Click to upload"}</span>
                  </div>}
              {uploadingCover && <div style={S.uploadingOverlay}><i className="fas fa-spinner fa-spin" /></div>}
            </div>
            <input ref={coverRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverChange} />
          </div>

          {/* ── Title ── */}
          <div style={S.field}>
            <label style={S.label}>{isAr ? "العنوان *" : "Title *"}</label>
            <input style={S.input} required maxLength={255}
              value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder={isAr ? "عنوان التوصية" : "Recommendation title"} />
          </div>

          {/* ── Description ── */}
          <div style={S.field}>
            <label style={S.label}>{isAr ? "الوصف التفصيلي" : "Description"}</label>
            <textarea style={{ ...S.input, resize: "vertical" }} rows="4"
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder={isAr ? "شرح مفصّل للتوصية..." : "Detailed explanation..."} />
          </div>

          {/* ── Age range ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={S.field}>
              <label style={S.label}>{isAr ? "العمر الأدنى (شهر)" : "Min Age (months)"}</label>
              <input style={S.input} type="number" min="0" max="60"
                value={form.target_age_min} onChange={e => setForm(p => ({ ...p, target_age_min: e.target.value }))} />
            </div>
            <div style={S.field}>
              <label style={S.label}>{isAr ? "العمر الأقصى (شهر)" : "Max Age (months)"}</label>
              <input style={S.input} type="number" min="0" max="60"
                value={form.target_age_max} onChange={e => setForm(p => ({ ...p, target_age_max: e.target.value }))} />
            </div>
          </div>

          {/* ── Video URL ── */}
          <div style={S.field}>
            <label style={S.label}>{isAr ? "رابط فيديو (YouTube / غيره)" : "Video URL (YouTube etc.)"}</label>
            <input style={S.input} type="url"
              value={form.video_url} onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))}
              placeholder="https://youtube.com/watch?v=..." />
          </div>

          {/* ── Extra files ── */}
          <div style={S.field}>
            <label style={S.label}>{isAr ? "ملفات / صور إضافية" : "Extra Files / Images"}</label>
            <button type="button" style={S.uploadBtn} onClick={() => extraRef.current?.click()}>
              <i className="fas fa-paperclip" /> {isAr ? "إرفاق ملفات" : "Attach Files"}
            </button>
            <input ref={extraRef} type="file" multiple accept="image/*,.pdf"
              style={{ display: "none" }}
              onChange={e => setExtraFiles(Array.from(e.target.files))} />
            {extraFiles.length > 0 && (
              <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {extraFiles.map((f, i) => (
                  <span key={i} style={S.fileChip}>{f.name}</span>
                ))}
              </div>
            )}
            {(existing?.media_urls || []).length > 0 && (
              <div style={{ marginTop: 8 }}>
                <small style={{ color: "#aaa" }}>{isAr ? "الملفات الحالية:" : "Existing files:"}</small>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  {existing.media_urls.map((m, i) => (
                    <a key={i} href={m.url} target="_blank" rel="noreferrer" style={S.fileChip}>{m.name}</a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Tags ── */}
          <div style={S.field}>
            <label style={S.label}>{isAr ? "الوسوم (Tags)" : "Tags"}</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...S.input, flex: 1 }}
                value={form.tagInput}
                onChange={e => setForm(p => ({ ...p, tagInput: e.target.value }))}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder={isAr ? "اكتب وسماً واضغط Enter" : "Type tag and press Enter"} />
              <button type="button" style={S.addTagBtn} onClick={addTag}>+</button>
            </div>
            {form.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {form.tags.map((t, i) => (
                  <span key={i} style={S.tagPill}>
                    #{t}
                    <button type="button" onClick={() => setForm(p => ({ ...p, tags: p.tags.filter((_, j) => j !== i) }))}
                      style={S.tagRemove}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Status ── */}
          <div style={S.field}>
            <label style={S.label}>{isAr ? "الحالة" : "Status"}</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { val: "draft",     lbl: isAr ? "مسودة"    : "Draft"        },
                { val: "published", lbl: isAr ? "نشر فوراً" : "Publish Now" },
              ].map(opt => (
                <label key={opt.val} style={{
                  ...S.radioLabel,
                  background: form.status === opt.val ? "#e8f5f2" : "#fafafa",
                  borderColor: form.status === opt.val ? "#1a6b5c" : "#ddd",
                }}>
                  <input type="radio" name="status" value={opt.val}
                    checked={form.status === opt.val}
                    onChange={() => setForm(p => ({ ...p, status: opt.val }))} />
                  {opt.lbl}
                </label>
              ))}
            </div>
          </div>

          {/* ══════════════════════════════════════════
              LINKED PRODUCTS
          ══════════════════════════════════════════ */}
          <div style={S.field}>
            <label style={S.label}>
              <i className="fas fa-box-open" style={{ marginLeft: 6, color: "#1a6b5c" }} />
              {isAr ? "المنتجات الموصى بها" : "Recommended Products"}
            </label>

            {/* Search & Add */}
            <input style={{ ...S.input, marginBottom: 8 }}
              placeholder={isAr ? "ابحث عن منتج..." : "Search product..."}
              value={prodSearch}
              onChange={e => setProdSearch(e.target.value)} />

            {prodSearch && (
              <div style={S.prodDropdown}>
                {filteredProds.slice(0, 8).map(p => (
                  <div key={p.product_id} style={S.prodDropItem} onClick={() => { addProduct(p); setProdSearch(""); }}>
                    {p.image_url && <img src={p.image_url} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: ".82rem" }}>{p.name}</div>
                      <div style={{ fontSize: ".72rem", color: "#aaa" }}>{p.stores?.store_name} — ₪{p.price}</div>
                    </div>
                    <span style={{ color: "#1a6b5c", fontWeight: 800, fontSize: ".8rem" }}>+ {isAr ? "أضف" : "Add"}</span>
                  </div>
                ))}
                {filteredProds.length === 0 && <div style={{ padding: 10, color: "#aaa", fontSize: ".82rem" }}>{isAr ? "لا توجد نتائج" : "No results"}</div>}
              </div>
            )}

            {/* Linked products list */}
            {linkedProds.map((lp, idx) => (
              <div key={lp.product_id} style={S.linkedProdCard}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  {lp.image_url && <img src={lp.image_url} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: ".85rem" }}>{lp.name}</div>
                    <div style={{ fontSize: ".72rem", color: "#aaa" }}>{lp.store_name} — ₪{lp.price}</div>
                  </div>
                  <button type="button" onClick={() => removeProduct(lp.product_id)} style={S.removeProdBtn}>✕</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input style={S.input} placeholder={isAr ? "تعليمات الاستخدام" : "Usage instructions"}
                    value={lp.usage_instructions}
                    onChange={e => updateProd(lp.product_id, "usage_instructions", e.target.value)} />
                  <input style={S.input} type="number" placeholder={isAr ? "مدة الاستخدام (يوم)" : "Duration (days)"}
                    value={lp.duration_days}
                    onChange={e => updateProd(lp.product_id, "duration_days", e.target.value)} />
                  <input style={{ ...S.input, gridColumn: "span 2" }} placeholder={isAr ? "ملاحظات" : "Notes"}
                    value={lp.notes}
                    onChange={e => updateProd(lp.product_id, "notes", e.target.value)} />
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".8rem", fontWeight: 700, cursor: "pointer", gridColumn: "span 2" }}>
                    <input type="checkbox" checked={lp.is_alternative}
                      onChange={e => updateProd(lp.product_id, "is_alternative", e.target.checked)} />
                    {isAr ? "منتج بديل" : "Alternative product"}
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* Save */}
          <button type="submit" style={S.saveBtn} disabled={saving}>
            {saving
              ? <><i className="fas fa-spinner fa-spin" /> {isAr ? "جارٍ الحفظ..." : "Saving..."}</>
              : <><i className="fas fa-save" /> {isEdit ? (isAr ? "حفظ التعديلات" : "Save Changes") : (isAr ? "نشر التوصية" : "Publish Recommendation")}</>}
          </button>
        </form>
      </div>
      <style>{MODAL_CSS}</style>
    </div>
  );
}

const S = {
  overlay:     { position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)", zIndex: 4000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  modal:       { background: "#fff", borderRadius: 22, width: "100%", maxWidth: 640, maxHeight: "94vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 50px rgba(0,0,0,.18)", fontFamily: "'Cairo','Poppins',sans-serif" },
  header:      { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px 0", borderBottom: "1px solid #eee", paddingBottom: 14 },
  closeBtn:    { background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#aaa", transition: ".2s" },
  errBox:      { background: "#fef0f0", color: "#dc2626", padding: "9px 16px", fontSize: ".83rem", fontWeight: 700, margin: "10px 22px 0", borderRadius: 10 },
  field:       { marginBottom: 16 },
  label:       { display: "block", fontWeight: 700, fontSize: ".83rem", color: "#4a5568", marginBottom: 6 },
  input:       { width: "100%", padding: "10px 13px", borderRadius: 11, border: "1px solid #ddd", outline: "none", fontFamily: "'Cairo','Poppins',sans-serif", fontSize: ".85rem", background: "#fafafa" },
  coverWrap:   { width: "100%", height: 160, border: "2px dashed #ddd", borderRadius: 14, cursor: "pointer", overflow: "hidden", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" },
  coverPlaceholder: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  uploadingOverlay: { position: "absolute", inset: 0, background: "rgba(255,255,255,.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", color: "#1a6b5c" },
  uploadBtn:   { background: "#f4f4f4", border: "1px solid #ddd", padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontFamily: "'Cairo'", fontWeight: 700, fontSize: ".82rem", display: "inline-flex", alignItems: "center", gap: 6 },
  fileChip:    { background: "#e8f5f2", color: "#1a6b5c", padding: "3px 10px", borderRadius: 20, fontSize: ".72rem", fontWeight: 700, textDecoration: "none" },
  addTagBtn:   { background: "#1a6b5c", color: "#fff", border: "none", width: 38, borderRadius: 10, cursor: "pointer", fontSize: "1.1rem", fontWeight: 800 },
  tagPill:     { background: "#e8f5f2", color: "#1a6b5c", padding: "4px 10px", borderRadius: 20, fontSize: ".75rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 },
  tagRemove:   { background: "none", border: "none", cursor: "pointer", color: "#1a6b5c", fontWeight: 900, padding: 0, lineHeight: 1 },
  radioLabel:  { display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", border: "1.5px solid", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: ".83rem", flex: 1, justifyContent: "center", transition: ".2s" },
  prodDropdown:{ background: "#fff", border: "1px solid #eee", borderRadius: 12, boxShadow: "0 6px 20px rgba(0,0,0,.08)", maxHeight: 240, overflowY: "auto", marginBottom: 10 },
  prodDropItem:{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f9f9f9", transition: ".2s" },
  linkedProdCard:{ background: "#fafafa", borderRadius: 12, padding: "12px 14px", border: "1px solid #eee", marginBottom: 10 },
  removeProdBtn:{ background: "#fef0f0", color: "#e74c3c", border: "none", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontWeight: 800 },
  saveBtn:     { width: "100%", background: "#1a6b5c", color: "#fff", border: "none", padding: "13px 0", borderRadius: 14, cursor: "pointer", fontFamily: "'Cairo'", fontWeight: 800, fontSize: ".95rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
};

const MODAL_CSS = `
@keyframes spin{to{transform:rotate(360deg)}}
.rec-prod-drop-item:hover{background:#f9f9f9;}
`;