// src/pages/doctor/DoctorArticlesSection.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../services/supabaseClient";

const STATUS_STYLE = {
  pending:  { bg: "#fff8f0", color: "#f39c12" },
  approved: { bg: "#f0faf4", color: "#2ecc71" },
  rejected: { bg: "#fef0f0", color: "#e74c3c" },
};

// Helper: Upload file to Supabase Storage
async function uploadFile(file, doctorId, articleId = null) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const folder = articleId 
    ? `doctors/${doctorId}/articles/${articleId}`
    : `doctors/${doctorId}/temp`;
  const filePath = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('article-media')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('article-media')
    .getPublicUrl(filePath);

  return {
    storage_path: filePath,
    url: publicUrl,
    file_name: fileName,
    file_size: file.size,
    mime_type: file.type
  };
}

// Helper: Delete file from storage
async function deleteFile(storagePath) {
  if (!storagePath) return;
  const { error } = await supabase.storage
    .from('article-media')
    .remove([storagePath]);
  if (error) console.error('Error deleting file:', error);
}

export default function DoctorArticlesSection({ articles, isAr, userId, refetch }) {
  const navigate      = useNavigate();
  const [filter,      setFilter]      = useState("all");
  const [articleModal,setArticleModal]= useState(false);
  const [editArticle, setEditArticle] = useState(null);
  const [delReqModal, setDelReqModal] = useState(null);

  const filtered = filter === "all"
    ? articles
    : articles.filter(a => a.status === filter);

  const FILTERS = [
    { key: "all",      lbl: isAr ? "الكل" : "All" },
    { key: "approved", lbl: isAr ? "معتمدة" : "Approved" },
    { key: "pending",  lbl: isAr ? "انتظار" : "Pending" },
    { key: "rejected", lbl: isAr ? "مرفوضة" : "Rejected" },
  ];

  const avgRating = (ratings) =>
    ratings?.length
      ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
      : null;

  const commentCount = (comments) =>
    (comments || []).filter(c => !c.is_deleted).length;

  return (
    <div>
      <div className="doc-section-header">
        <h2><i className="fas fa-newspaper" /> {isAr ? "مقالاتي" : "My Articles"}</h2>
        <button className="doc-btn-primary" onClick={() => { setEditArticle(null); setArticleModal(true); }}>
          <i className="fas fa-plus" /> {isAr ? "مقال جديد" : "New Article"}
        </button>
      </div>

      <div className="doc-filter-bar">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`doc-filter-btn ${filter === f.key ? "active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.lbl}
            {f.key !== "all" && (
              <span className="filter-count">
                {articles.filter(a => a.status === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="doc-empty">
          <span>📝</span>
          <p>{isAr ? "لا توجد مقالات" : "No articles"}</p>
          <button className="doc-btn-primary" onClick={() => setArticleModal(true)}>
            <i className="fas fa-plus" /> {isAr ? "اكتب أول مقال" : "Write first article"}
          </button>
        </div>
      ) : (
        <div className="das-grid">
          {filtered.map(art => {
            const sc   = STATUS_STYLE[art.status] || {};
            const avg  = avgRating(art.article_ratings);
            const cmts = commentCount(art.article_comments);
            const subcatName = isAr
              ? art.article_subcategories?.name_ar
              : art.article_subcategories?.name_en;
            const mainTarget = art.article_subcategories?.article_main_categories?.target;

            return (
              <div key={art.article_id} className="das-card">
                {art.cover_image_url || art.cover_image_storage_path ? (
                  <div
                    className="das-cover"
                    style={{ backgroundImage: `url(${art.cover_image_url || art.cover_image_storage_path})` }}
                  />
                ) : (
                  <div className="das-cover das-cover-default">
                    <i className="fas fa-newspaper" />
                  </div>
                )}

                <div className="das-card-body">
                  <div className="das-top-row">
                    <span className="doc-status-pill" style={sc}>
                      {isAr
                        ? { pending:"انتظار", approved:"معتمد", rejected:"مرفوض" }[art.status]
                        : art.status}
                    </span>
                    {subcatName && (
                      <span className="das-subcat-chip">
                        <i className={art.article_subcategories?.icon || "fas fa-tag"} />
                        {subcatName}
                      </span>
                    )}
                    {mainTarget && (
                      <span className="das-target-chip" data-target={mainTarget}>
                        <i className={mainTarget === "mother" ? "fas fa-heart" : "fas fa-baby"} />
                        {isAr
                          ? (mainTarget === "mother" ? "الأم" : "الطفل")
                          : (mainTarget === "mother" ? "Mother" : "Child")}
                      </span>
                    )}
                  </div>

                  <h3 className="das-title">{art.title || (isAr ? "بدون عنوان" : "Untitled")}</h3>

                  <p className="das-excerpt">
                    {(art.content || "").replace(/<[^>]+>/g, "").slice(0, 100)}
                    {art.content?.length > 100 ? "…" : ""}
                  </p>

                  {art.status === "rejected" && art.rejection_reason && (
                    <div className="das-rejection-note">
                      <i className="fas fa-exclamation-circle" />
                      <span>{art.rejection_reason}</span>
                    </div>
                  )}

                  <div className="das-footer">
                    <div className="das-meta">
                      {avg && (
                        <span className="das-meta-item">
                          <i className="fas fa-star" style={{ color: "#f1c40f" }} /> {avg}
                        </span>
                      )}
                      <span className="das-meta-item">
                        <i className="fas fa-comment" /> {cmts}
                      </span>
                      {art.reading_time_minutes && (
                        <span className="das-meta-item">
                          <i className="fas fa-clock" /> {art.reading_time_minutes}m
                        </span>
                      )}
                    </div>
                    <div className="das-actions">
                      {art.status === "approved" && (
                        <button
                          className="das-icon-btn das-view-btn"
                          title={isAr ? "عرض" : "View"}
                          onClick={() => navigate(`/articles/${art.article_id}`)}
                        >
                          <i className="fas fa-eye" />
                        </button>
                      )}
                      <button
                        className="das-icon-btn das-edit-btn"
                        title={isAr ? "تعديل" : "Edit"}
                        onClick={() => { setEditArticle(art); setArticleModal(true); }}
                      >
                        <i className="fas fa-edit" />
                      </button>
                      <button
                        className="das-icon-btn das-del-btn"
                        title={isAr ? "طلب حذف" : "Request deletion"}
                        onClick={() => setDelReqModal(art)}
                      >
                        <i className="fas fa-trash-alt" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {articleModal && (
        <ArticleModal
          isAr={isAr}
          doctorId={userId}
          editData={editArticle}
          onClose={() => { setArticleModal(false); setEditArticle(null); }}
          onSuccess={() => { setArticleModal(false); setEditArticle(null); refetch(); }}
        />
      )}

      {delReqModal && (
        <DeletionRequestModal
          isAr={isAr}
          article={delReqModal}
          doctorId={userId}
          onClose={() => setDelReqModal(null)}
          onSuccess={() => { setDelReqModal(null); refetch(); }}
        />
      )}

      <style>{DAS_CSS}</style>
    </div>
  );
}

// ── UPDATED ARTICLE MODAL WITH FILE UPLOAD ────────────────────────────────────
function ArticleModal({ isAr, doctorId, editData, onClose, onSuccess }) {
  const [mainCats,  setMainCats]  = useState([]);
  const [subcats,   setSubcats]   = useState([]);
  const [activeMain,setActiveMain]= useState(null);
  const [saving,    setSaving]    = useState(false);
  const [tab,       setTab]       = useState("content");
  
  // Upload states
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const coverInputRef = useRef(null);
  const mediaInputRef = useRef(null);

  const [form, setForm] = useState({
    title:                editData?.title                 || "",
    content:              editData?.content               || "",
    subcategory_id:       editData?.subcategory_id        || "",
    reading_time_minutes: editData?.reading_time_minutes  || 3,
    cover_image_url:      editData?.cover_image_url       || "",
    cover_image_storage_path: editData?.cover_image_storage_path || null,
    cover_image_file_name: editData?.cover_image_file_name || null,
  });

  const [mediaList, setMediaList] = useState(() => {
    if (editData?.media_files && Array.isArray(editData.media_files)) {
      return editData.media_files;
    }
    if (editData?.media_urls && Array.isArray(editData.media_urls)) {
      // Migrate old format
      return editData.media_urls.map(m => ({
        ...m,
        type: m.type || 'image',
        source: 'url'
      }));
    }
    return [];
  });

  const [newMediaUrl, setNewMediaUrl] = useState({ type: "image", url: "", caption: "" });

  // Load categories
  useEffect(() => {
    supabase.from("article_main_categories")
      .select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => setMainCats(data || []));
  }, []);

  useEffect(() => {
    if (editData?.article_subcategories?.article_main_categories?.id) {
      setActiveMain(editData.article_subcategories.article_main_categories.id);
    } else if (mainCats.length) {
      setActiveMain(mainCats[0].id);
    }
  }, [editData, mainCats]);

  useEffect(() => {
    if (!activeMain) return;
    supabase.from("article_subcategories")
      .select("*").eq("main_category_id", activeMain).eq("is_active", true).order("sort_order")
      .then(({ data }) => {
        setSubcats(data || []);
        if (!editData?.subcategory_id && data?.length) {
          setForm(p => ({ ...p, subcategory_id: data[0].id }));
        }
      });
  }, [activeMain]);

  // Handle cover image upload
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert(isAr ? "يرجى اختيار ملف صورة" : "Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(isAr ? "حجم الصورة يجب أن لا يتجاوز 5 ميجابايت" : "Image size must not exceed 5MB");
      return;
    }

    setUploadingCover(true);
    try {
      // Delete old cover if exists
      if (form.cover_image_storage_path) {
        await deleteFile(form.cover_image_storage_path);
      }

      const uploaded = await uploadFile(file, doctorId, editData?.article_id);
      setForm(prev => ({
        ...prev,
        cover_image_url: uploaded.url,
        cover_image_storage_path: uploaded.storage_path,
        cover_image_file_name: uploaded.file_name
      }));
    } catch (err) {
      console.error('Upload error:', err);
      alert(isAr ? "خطأ في رفع الصورة" : "Error uploading image");
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  // Handle media file upload
  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingMedia(true);
    const newMediaItems = [];

    for (const file of files) {
      // Validate file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        alert(isAr ? `الملف ${file.name} غير مدعوم. يرجى اختيار صورة أو فيديو` : `File ${file.name} not supported. Please choose image or video`);
        continue;
      }

      if (file.size > 50 * 1024 * 1024) {
        alert(isAr ? `الملف ${file.name} حجمه كبير جداً (حد أقصى 50 ميجابايت)` : `File ${file.name} is too large (max 50MB)`);
        continue;
      }

      try {
        const uploaded = await uploadFile(file, doctorId, editData?.article_id);
        newMediaItems.push({
          id: Date.now() + Math.random(),
          type: isImage ? 'image' : 'video',
          source: 'file',
          url: uploaded.url,
          storage_path: uploaded.storage_path,
          file_name: uploaded.file_name,
          mime_type: uploaded.mime_type,
          caption: '',
          file_size: uploaded.file_size
        });
      } catch (err) {
        console.error('Upload error:', err);
        alert(isAr ? `خطأ في رفع ${file.name}` : `Error uploading ${file.name}`);
      }
    }

    setMediaList(prev => [...prev, ...newMediaItems]);
    setUploadingMedia(false);
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  // Add media URL
  const addMediaUrl = () => {
    if (!newMediaUrl.url.trim()) return;
    setMediaList(prev => [...prev, {
      id: Date.now(),
      type: newMediaUrl.type,
      source: 'url',
      url: newMediaUrl.url.trim(),
      caption: newMediaUrl.caption.trim(),
    }]);
    setNewMediaUrl({ type: "image", url: "", caption: "" });
  };

  // Remove media item
  const removeMedia = async (index) => {
    const item = mediaList[index];
    if (item.source === 'file' && item.storage_path) {
      await deleteFile(item.storage_path);
    }
    setMediaList(prev => prev.filter((_, i) => i !== index));
  };

  // Save article
  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      alert(isAr ? "يرجى إدخال العنوان والمحتوى" : "Please enter title and content");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        doctor_id: doctorId,
        title: form.title.trim(),
        content: form.content.trim(),
        subcategory_id: form.subcategory_id || null,
        reading_time_minutes: parseInt(form.reading_time_minutes) || 3,
        status: "pending",
        updated_at: new Date().toISOString(),
        media_files: mediaList.map(m => ({
          type: m.type,
          url: m.url,
          caption: m.caption,
          source: m.source,
          ...(m.storage_path && { storage_path: m.storage_path }),
          ...(m.file_name && { file_name: m.file_name }),
          ...(m.mime_type && { mime_type: m.mime_type })
        })),
        cover_image_url: form.cover_image_url || null,
        cover_image_storage_path: form.cover_image_storage_path || null,
        cover_image_file_name: form.cover_image_file_name || null
      };

      if (editData) {
        // Update existing article
        const { error } = await supabase
          .from("articles")
          .update(payload)
          .eq("article_id", editData.article_id);
        if (error) throw error;
      } else {
        // Create new article
        const { error } = await supabase
          .from("articles")
          .insert([payload]);
        if (error) throw error;
      }

      onSuccess();
    } catch (err) {
      console.error('Save error:', err);
      alert(isAr ? "خطأ في الحفظ: " + err.message : "Save error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const T = {
    addTitle:  isAr ? "✍️ كتابة مقال جديد" : "✍️ Write New Article",
    editTitle: isAr ? "✏️ تعديل المقال" : "✏️ Edit Article",
    note: isAr ? "سيتم إرسال المقال لمراجعة الإدارة قبل النشر." : "Article will be sent for admin review before publishing.",
    for: isAr ? "هذا المقال لـ:" : "This article is for:",
    subcat: isAr ? "القسم الفرعي" : "Subcategory",
    title: isAr ? "العنوان *" : "Title *",
    content: isAr ? "المحتوى *" : "Content *",
    cover: isAr ? "صورة الغلاف" : "Cover Image",
    coverUpload: isAr ? "رفع صورة" : "Upload Image",
    coverUrl: isAr ? "أو رابط صورة" : "Or image URL",
    readTime: isAr ? "وقت القراءة (دقيقة)" : "Reading time (minutes)",
    save: editData ? (isAr ? "حفظ التعديلات" : "Save Changes") : (isAr ? "إرسال للمراجعة" : "Submit for Review"),
    mediaTab: isAr ? "الوسائط" : "Media",
    contentTab: isAr ? "المحتوى" : "Content",
    addMediaFile: isAr ? "رفع ملفات (صور/فيديوهات)" : "Upload Files (Images/Videos)",
    addMediaUrl: isAr ? "إضافة رابط" : "Add URL",
    mediaUrl: isAr ? "الرابط" : "URL",
    mediaCaption: isAr ? "تعليق (اختياري)" : "Caption (optional)",
    mediaType: isAr ? "نوع الوسيط" : "Media type",
    dragDrop: isAr ? "اسحب وأفلت الملفات هنا أو انقر للاختيار" : "Drag & drop files here or click to select",
    supportedFormats: isAr ? "يدعم: صور (JPG, PNG, GIF) وفيديوهات (MP4, MOV) - حد أقصى 50 ميجابايت" : "Supports: Images (JPG, PNG, GIF) and Videos (MP4, MOV) - max 50MB",
  };

  return (
    <div className="doc-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="doc-modal das-modal" dir={isAr ? "rtl" : "ltr"}>

        <div className="doc-modal-head">
          <h2>{editData ? T.editTitle : T.addTitle}</h2>
          <button onClick={onClose}><i className="fas fa-times" /></button>
        </div>

        <div className="doc-modal-info">
          <i className="fas fa-info-circle" /> {T.note}
        </div>

        {/* Main category selector */}
        <div className="doc-modal-field">
          <label>{T.for}</label>
          <div className="das-main-tabs">
            {mainCats.map(mc => (
              <button
                key={mc.id}
                type="button"
                className={`das-main-tab ${activeMain === mc.id ? "active" : ""}`}
                onClick={() => setActiveMain(mc.id)}
              >
                <i className={mc.icon} />
                {isAr ? mc.name_ar : mc.name_en}
              </button>
            ))}
          </div>
        </div>

        {/* Subcategory */}
        <div className="doc-modal-field">
          <label>{T.subcat}</label>
          <div className="das-subcat-chips">
            {subcats.map(sc => (
              <button
                key={sc.id}
                type="button"
                className={`das-subcat-chip-btn ${form.subcategory_id === sc.id ? "active" : ""}`}
                onClick={() => setForm(p => ({ ...p, subcategory_id: sc.id }))}
              >
                <i className={sc.icon} />
                {isAr ? sc.name_ar : sc.name_en}
              </button>
            ))}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="das-modal-tabs">
          <button
            type="button"
            className={`das-modal-tab ${tab === "content" ? "active" : ""}`}
            onClick={() => setTab("content")}
          >
            <i className="fas fa-edit" /> {T.contentTab}
          </button>
          <button
            type="button"
            className={`das-modal-tab ${tab === "media" ? "active" : ""}`}
            onClick={() => setTab("media")}
          >
            <i className="fas fa-photo-video" /> {T.mediaTab}
            {mediaList.length > 0 && (
              <span className="das-media-badge">{mediaList.length}</span>
            )}
          </button>
        </div>

        {/* CONTENT TAB */}
        {tab === "content" && (
          <>
            <div className="doc-modal-field">
              <label>{T.title}</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="doc-modal-input"
                placeholder={isAr ? "عنوان واضح ومعبّر" : "Clear, descriptive title"}
                required
              />
            </div>

            <div className="doc-modal-field">
              <label>{T.content}</label>
              <textarea
                value={form.content}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                className="doc-modal-input das-content-area"
                placeholder={isAr
                  ? "اكتب محتوى المقال هنا... يمكنك استخدام HTML للتنسيق\n\nمثال:\n<h2>عنوان فرعي</h2>\n<p>فقرة نصية</p>"
                  : "Write article content here... HTML is supported\n\nExample:\n<h2>Section title</h2>\n<p>Paragraph text</p>"}
                rows="12"
                required
              />
              <small style={{ color: "#aaa", fontSize: ".73rem" }}>
                {isAr ? "يدعم HTML للتنسيق (h2, p, ul, li, b, blockquote, img...)"
                       : "Supports HTML formatting (h2, p, ul, li, b, blockquote, img...)"}
              </small>
            </div>

            {/* Cover Image Section */}
            <div className="doc-modal-field">
              <label>{T.cover}</label>
              <div className="das-cover-upload-area">
                {form.cover_image_url ? (
                  <div className="das-cover-preview">
                    <img src={form.cover_image_url} alt="Cover" />
                    <button 
                      type="button" 
                      className="das-cover-remove"
                      onClick={() => {
                        if (form.cover_image_storage_path) {
                          deleteFile(form.cover_image_storage_path);
                        }
                        setForm(prev => ({
                          ...prev,
                          cover_image_url: '',
                          cover_image_storage_path: null,
                          cover_image_file_name: null
                        }));
                      }}
                    >
                      <i className="fas fa-times" />
                    </button>
                  </div>
                ) : (
                  <div className="das-upload-placeholder">
                    <i className="fas fa-cloud-upload-alt" />
                    <p>{T.dragDrop}</p>
                    <button 
                      type="button"
                      className="doc-btn-secondary"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={uploadingCover}
                    >
                      {uploadingCover ? (
                        <><i className="fas fa-spinner fa-spin" /> {isAr ? "جاري الرفع..." : "Uploading..."}</>
                      ) : (
                        <><i className="fas fa-upload" /> {T.coverUpload}</>
                      )}
                    </button>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                )}
              </div>
              <div className="das-cover-url-option">
                <small>{T.coverUrl}</small>
                <input
                  type="url"
                  value={form.cover_image_url}
                  onChange={e => setForm(p => ({ ...p, cover_image_url: e.target.value }))}
                  className="doc-modal-input"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="doc-modal-two-col">
              <div className="doc-modal-field">
                <label>{T.readTime}</label>
                <input
                  type="number"
                  value={form.reading_time_minutes}
                  min="1" max="60"
                  onChange={e => setForm(p => ({ ...p, reading_time_minutes: e.target.value }))}
                  className="doc-modal-input"
                />
              </div>
            </div>
          </>
        )}

        {/* MEDIA TAB */}
        {tab === "media" && (
          <div>
            {/* Existing media files */}
            {mediaList.length > 0 && (
              <div className="das-media-list">
                {mediaList.map((m, i) => (
                  <div key={m.id || i} className="das-media-row">
                    <div className={`das-media-preview ${m.type}`}>
                      {m.type === 'image' ? (
                        <img src={m.url} alt={m.caption || 'Media'} />
                      ) : m.type === 'video' ? (
                        <video src={m.url} controls />
                      ) : (
                        <i className="fas fa-link" />
                      )}
                    </div>
                    <div className="das-media-info">
                      <input
                        type="text"
                        value={m.caption || ''}
                        onChange={(e) => {
                          const newList = [...mediaList];
                          newList[i].caption = e.target.value;
                          setMediaList(newList);
                        }}
                        className="das-media-caption-input"
                        placeholder={T.mediaCaption}
                      />
                      {m.source === 'file' && (
                        <span className="das-media-badge-file">
                          <i className="fas fa-check-circle" /> {isAr ? "مرفوع" : "Uploaded"}
                        </span>
                      )}
                    </div>
                    <button className="das-media-remove" onClick={() => removeMedia(i)}>
                      <i className="fas fa-times" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* File upload section */}
            <div className="das-add-media das-file-upload-section">
              <div className="das-file-upload-area">
                <i className="fas fa-cloud-upload-alt" />
                <p>{T.dragDrop}</p>
                <p className="das-upload-hint">{T.supportedFormats}</p>
                <button 
                  type="button"
                  className="doc-btn-secondary"
                  onClick={() => mediaInputRef.current?.click()}
                  disabled={uploadingMedia}
                >
                  {uploadingMedia ? (
                    <><i className="fas fa-spinner fa-spin" /> {isAr ? "جاري الرفع..." : "Uploading..."}</>
                  ) : (
                    <><i className="fas fa-upload" /> {T.addMediaFile}</>
                  )}
                </button>
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaUpload}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* URL addition section */}
            <div className="das-add-media das-url-add-section">
              <div className="das-url-header">
                <i className="fas fa-link" />
                <span>{T.addMediaUrl}</span>
              </div>
              <div className="doc-modal-two-col">
                <div className="doc-modal-field">
                  <label>{T.mediaType}</label>
                  <select
                    value={newMediaUrl.type}
                    onChange={e => setNewMediaUrl(p => ({ ...p, type: e.target.value }))}
                    className="doc-modal-input"
                  >
                    <option value="image">{isAr ? "صورة" : "Image"}</option>
                    <option value="video">{isAr ? "فيديو" : "Video"}</option>
                    <option value="link">{isAr ? "رابط" : "Link"}</option>
                  </select>
                </div>
                <div className="doc-modal-field">
                  <label>{T.mediaUrl}</label>
                  <input
                    type="url"
                    value={newMediaUrl.url}
                    onChange={e => setNewMediaUrl(p => ({ ...p, url: e.target.value }))}
                    className="doc-modal-input"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="doc-modal-field">
                <label>{T.mediaCaption}</label>
                <input
                  type="text"
                  value={newMediaUrl.caption}
                  onChange={e => setNewMediaUrl(p => ({ ...p, caption: e.target.value }))}
                  className="doc-modal-input"
                />
              </div>
              <button type="button" className="doc-btn-secondary" onClick={addMediaUrl}>
                <i className="fas fa-plus" /> {T.addMediaUrl}
              </button>
            </div>
          </div>
        )}

        {/* Save button */}
        <button
          type="button"
          className="doc-btn-primary"
          style={{ width: "100%", justifyContent: "center", marginTop: 18 }}
          onClick={handleSave}
          disabled={saving || !form.title.trim() || !form.content.trim()}
        >
          {saving
            ? <i className="fas fa-spinner fa-spin" />
            : <i className="fas fa-paper-plane" />}
          {" "}{T.save}
        </button>
      </div>
    </div>
  );
}

// DeletionRequestModal remains the same as before
function DeletionRequestModal({ isAr, article, doctorId, onClose, onSuccess }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    const { data: existing } = await supabase
      .from("article_deletion_requests")
      .select("id,status")
      .eq("article_id", article.article_id)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      alert(isAr ? "طلب حذف قيد المراجعة بالفعل." : "A deletion request is already pending review.");
      setSaving(false);
      return;
    }

    if (article.status !== "approved") {
      // Delete associated files first
      if (article.cover_image_storage_path) {
        await deleteFile(article.cover_image_storage_path);
      }
      if (article.media_files && Array.isArray(article.media_files)) {
        for (const media of article.media_files) {
          if (media.storage_path) {
            await deleteFile(media.storage_path);
          }
        }
      }
      await supabase.from("articles").delete().eq("article_id", article.article_id);
      onSuccess();
      return;
    }

    await supabase.from("article_deletion_requests").insert({
      article_id: article.article_id,
      doctor_id: doctorId,
      reason: reason.trim() || null,
    });
    alert(isAr ? "تم إرسال طلب الحذف للإدارة." : "Deletion request sent to admin for review.");
    onSuccess();
  };

  const isApproved = article.status === "approved";

  return (
    <div className="doc-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="doc-modal" dir={isAr ? "rtl" : "ltr"}>
        <div className="doc-modal-head">
          <h2>
            <i className="fas fa-trash-alt" style={{ color: "#e74c3c" }} />
            {" "}{isAr ? (isApproved ? "طلب حذف المقال" : "حذف المقال") : (isApproved ? "Request Article Deletion" : "Delete Article")}
          </h2>
          <button onClick={onClose}><i className="fas fa-times" /></button>
        </div>

        {isApproved ? (
          <div className="doc-modal-info" style={{ background: "#fef0f0", color: "#e74c3c" }}>
            <i className="fas fa-shield-alt" />
            {isAr ? "المقالات المعتمدة تحتاج موافقة الإدارة للحذف. سيتم مراجعة طلبك." : "Approved articles require admin approval to delete. Your request will be reviewed."}
          </div>
        ) : (
          <div className="doc-modal-info" style={{ background: "#fff8f0", color: "#f39c12" }}>
            <i className="fas fa-exclamation-triangle" />
            {isAr ? "سيتم حذف هذا المقال نهائياً." : "This article will be permanently deleted."}
          </div>
        )}

        <p style={{ fontWeight: 700, marginBottom: 12, fontSize: ".9rem" }}>
          {isAr ? "المقال:" : "Article:"} <em>{article.title}</em>
        </p>

        <div className="doc-modal-field">
          <label>{isAr ? "سبب الحذف (اختياري)" : "Reason for deletion (optional)"}</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="doc-modal-input"
            rows="3"
            placeholder={isAr ? "اذكر السبب إن أردت..." : "State your reason..."}
          />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button
            className="doc-btn-primary"
            style={{ flex: 1, justifyContent: "center", background: "#e74c3c" }}
            onClick={submit}
            disabled={saving}
          >
            {saving ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-trash-alt" />}
            {" "}{isApproved ? (isAr ? "إرسال الطلب" : "Send Request") : (isAr ? "حذف نهائي" : "Delete")}
          </button>
          <button className="doc-btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={onClose}>
            {isAr ? "إلغاء" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Updated CSS with new styles
const DAS_CSS = `
.das-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px;}
.das-card{background:var(--white);border-radius:var(--radius);border:1px solid var(--border);
  box-shadow:var(--shadow);overflow:hidden;display:flex;flex-direction:column;transition:.3s;}
.das-card:hover{box-shadow:0 8px 28px rgba(0,0,0,.08);transform:translateY(-2px);}
.das-cover{height:120px;background-size:cover;background-position:center;}
.das-cover-default{background:linear-gradient(135deg,#f0faf4,#e8f5f2);display:flex;
  align-items:center;justify-content:center;}
.das-cover-default i{font-size:2rem;color:#2ecc71;opacity:.5;}
.das-card-body{padding:16px;flex:1;display:flex;flex-direction:column;gap:8px;}
.das-top-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;}
.das-subcat-chip{display:inline-flex;align-items:center;gap:4px;background:#f0f4ff;color:#3498db;
  padding:3px 9px;border-radius:12px;font-size:.72rem;font-weight:700;}
.das-target-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;
  border-radius:12px;font-size:.72rem;font-weight:700;}
.das-target-chip[data-target="mother"]{background:#fdf2f5;color:#d68b9d;}
.das-target-chip[data-target="child"]{background:#f0faf4;color:#2ecc71;}
.das-title{font-size:.95rem;font-weight:700;color:var(--text);line-height:1.4;}
.das-excerpt{font-size:.8rem;color:var(--gray);line-height:1.5;}
.das-rejection-note{display:flex;gap:7px;background:#fef0f0;padding:8px 10px;
  border-radius:9px;font-size:.76rem;color:#e74c3c;font-weight:600;}
.das-footer{display:flex;justify-content:space-between;align-items:center;
  padding-top:10px;border-top:1px solid var(--border);margin-top:auto;}
.das-meta{display:flex;gap:10px;}
.das-meta-item{font-size:.76rem;color:var(--gray);font-weight:600;
  display:flex;align-items:center;gap:4px;}
.das-actions{display:flex;gap:6px;}
.das-icon-btn{width:30px;height:30px;border-radius:8px;border:none;cursor:pointer;
  display:flex;align-items:center;justify-content:center;font-size:.8rem;transition:.25s;}
.das-view-btn{background:#f0f4ff;color:#3498db;}
.das-view-btn:hover{background:#3498db;color:white;}
.das-edit-btn{background:#f0faf4;color:#2ecc71;}
.das-edit-btn:hover{background:#2ecc71;color:white;}
.das-del-btn{background:#fef0f0;color:#e74c3c;}
.das-del-btn:hover{background:#e74c3c;color:white;}

/* Cover upload styles */
.das-cover-upload-area{margin-bottom:12px;}
.das-cover-preview{position:relative;border-radius:12px;overflow:hidden;background:#f0f0f0;}
.das-cover-preview img{width:100%;height:180px;object-fit:cover;}
.das-cover-remove{position:absolute;top:8px;right:8px;width:32px;height:32px;border-radius:50%;
  background:#e74c3c;color:white;border:none;cursor:pointer;display:flex;align-items:center;
  justify-content:center;transition:.2s;}
.das-cover-remove:hover{background:#c0392b;}
.das-upload-placeholder{display:flex;flex-direction:column;align-items:center;gap:12px;
  padding:24px;border:2px dashed #ddd;border-radius:12px;background:#fafafa;}
.das-upload-placeholder i{font-size:2rem;color:#3498db;}
.das-upload-placeholder p{font-size:.85rem;color:var(--gray);margin:0;}
.das-cover-url-option{margin-top:8px;padding-top:8px;border-top:1px solid var(--border);}
.das-cover-url-option small{display:block;margin-bottom:6px;color:var(--gray);}

/* Media list styles */
.das-media-list{display:flex;flex-direction:column;gap:12px;margin-bottom:20px;max-height:300px;overflow-y:auto;}
.das-media-row{display:flex;align-items:center;gap:12px;background:#fafafa;padding:12px;
  border-radius:12px;border:1px solid #eee;}
.das-media-preview{width:80px;height:60px;border-radius:8px;overflow:hidden;background:#f0f0f0;
  display:flex;align-items:center;justify-content:center;}
.das-media-preview img,.das-media-preview video{width:100%;height:100%;object-fit:cover;}
.das-media-preview.link{background:var(--primary-light);color:var(--primary);font-size:1.2rem;}
.das-media-info{flex:1;min-width:0;}
.das-media-caption-input{width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:6px;
  font-size:.75rem;background:white;}
.das-media-badge-file{display:inline-block;font-size:.65rem;padding:2px 6px;background:#e8f5e9;
  color:#4caf50;border-radius:4px;margin-top:4px;}
.das-media-remove{width:28px;height:28px;border-radius:6px;background:#fee;color:#e74c3c;
  border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.2s;}
.das-media-remove:hover{background:#fcc;}

/* File upload areas */
.das-add-media{margin-bottom:20px;}
.das-file-upload-section .das-file-upload-area{display:flex;flex-direction:column;align-items:center;
  gap:10px;padding:24px;border:2px dashed #3498db;border-radius:12px;background:#f0f8ff;}
.das-file-upload-section i{font-size:2rem;color:#3498db;}
.das-upload-hint{font-size:.7rem;color:var(--gray);margin:0;}
.das-url-add-section{padding:16px;background:#fafafa;border-radius:12px;border:1px solid #eee;}
.das-url-header{display:flex;align-items:center;gap:8px;margin-bottom:12px;font-weight:600;
  color:var(--primary);}
.das-url-header i{font-size:1rem;}

/* Modal extras */
.das-modal{max-width:700px !important;}
.das-content-area{min-height:220px;font-family:monospace !important;font-size:.82rem !important;}
.das-main-tabs{display:flex;gap:8px;flex-wrap:wrap;}
.das-main-tab{display:flex;align-items:center;gap:7px;padding:9px 18px;border-radius:12px;
  border:2px solid var(--border);background:#fafafa;font-family:'Poppins';font-weight:700;
  font-size:.82rem;cursor:pointer;transition:.3s;color:var(--gray);}
.das-main-tab:hover{border-color:var(--primary);color:var(--primary);}
.das-main-tab.active{border-color:var(--primary);background:var(--primary-light);color:var(--primary);}
.das-subcat-chips{display:flex;flex-wrap:wrap;gap:7px;}
.das-subcat-chip-btn{display:flex;align-items:center;gap:5px;padding:6px 14px;border-radius:20px;
  border:1.5px solid var(--border);background:#fafafa;font-family:'Poppins';font-weight:700;
  font-size:.78rem;cursor:pointer;transition:.3s;color:var(--gray);}
.das-subcat-chip-btn:hover{border-color:var(--primary);color:var(--primary);}
.das-subcat-chip-btn.active{border-color:var(--primary);background:var(--primary-light);color:var(--primary);}
.das-modal-tabs{display:flex;gap:0;margin-bottom:16px;border-bottom:2px solid var(--border);}
.das-modal-tab{display:flex;align-items:center;gap:7px;padding:9px 18px;border:none;background:none;
  font-family:'Poppins';font-weight:700;font-size:.85rem;color:var(--gray);cursor:pointer;
  border-bottom:2px solid transparent;margin-bottom:-2px;transition:.2s;}
.das-modal-tab.active{color:var(--primary);border-bottom-color:var(--primary);}
.das-media-badge{background:var(--primary);color:white;width:18px;height:18px;border-radius:50%;
  font-size:.65rem;display:flex;align-items:center;justify-content:center;font-weight:700;}

@media(max-width:768px){.das-grid{grid-template-columns:1fr;}}
`;

/*
const deleteFile = async (storagePath) => {
  if (!storagePath) return;
  const { error } = await supabase.storage
    .from('article-media')
    .remove([storagePath]);
  if (error) console.error('Error deleting file:', error);
};

const uploadFile = async (file, doctorId, articleId = null) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const folder = articleId 
    ? `doctors/${doctorId}/articles/${articleId}`
    : `doctors/${doctorId}/temp`;
  const filePath = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('article-media')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('article-media')
    .getPublicUrl(filePath);

  return {
    storage_path: filePath,
    url: publicUrl,
    file_name: fileName,
    file_size: file.size,
    mime_type: file.type
  };
};*/