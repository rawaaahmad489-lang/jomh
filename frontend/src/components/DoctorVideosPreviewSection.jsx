// src/components/DoctorVideosPreviewSection.jsx
// نسخة مصغّرة من DoctorVideosSection — تعرض 3 فيديوهات فقط مع زر "مشاهدة المزيد"
// يحوّل الزر المستخدم إلى صفحة تسجيل الدخول
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

const PREVIEW_LIMIT = 3;

const DoctorVideosPreviewSection = ({ isAr }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("doctor_videos")
        .select("*")
        .eq("interview_title", "فيديو اعلاني") // فقط الفيديوهات الإعلانية
        .order("created_at", { ascending: false })
        .limit(PREVIEW_LIMIT); // فقط 3 فيديوهات

      if (fetchError) throw fetchError;
      setVideos(data || []);
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (video) => {
    setActiveVideo(video);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = "";
    }
    setActiveVideo(null);
    document.body.style.overflow = "";
  };

  // عدّلي المسار هنا إذا كان رابط صفحة تسجيل الدخول مختلفاً عندك
  const goToLogin = () => {
    navigate("/login");
  };

  return (
    <section className="mc-videos-section reveal">
      <style>{PREVIEW_CSS}</style>

      <div className="mc-section-eyebrow">🎙️ {isAr ? "لقاءات حصرية" : "Exclusive Interviews"}</div>
      <h2 className="section-title">{isAr ? "لقاءات مع المتخصصين" : "Meet Our Specialists"}</h2>
      <p className="mc-section-sub">
        {isAr
          ? "مقابلات أجراها فريق المنصة مع أطباء متخصصين — بأصواتهم مباشرةً"
          : "Interviews conducted by our team with certified specialists"}
      </p>

      {loading && (
        <div className="dv-loading">
          <div className="dv-spinner" />
        </div>
      )}

      {!loading && error && (
        <div className="dv-empty">
          <i className="fas fa-exclamation-circle" />
          <p>{isAr ? "حدث خطأ في تحميل المقابلات" : "Error loading interviews"}</p>
        </div>
      )}

      {!loading && !error && videos.length === 0 && (
        <div className="dv-empty">
          <i className="fas fa-video-slash" />
          <p>{isAr ? "لا توجد مقابلات متاحة حالياً" : "No interviews available yet"}</p>
          <span>{isAr ? "سيتم إضافة مقابلات قريباً" : "Interviews coming soon"}</span>
        </div>
      )}

      {!loading && !error && videos.length > 0 && (
        <>
          <div className="dv-grid">
            {videos.map((video, i) => (
              <div
                key={video.id}
                className="mc-video-card dv-card reveal"
                style={{ transitionDelay: `${i * 0.1}s` }}
                onClick={() => openModal(video)}
              >
                <div
                  className="mc-video-thumb"
                  style={{
                    backgroundImage: video.thumbnail_url
                      ? `url('${video.thumbnail_url}')`
                      : "url('/assets/homePage/experts.jpg')",
                  }}
                >
                  <div className="mc-video-overlay">
                    <div className="mc-play-ripple">
                      <div className="mc-play-inner">
                        <i className="fas fa-play"></i>
                      </div>
                    </div>
                  </div>
                  <span className="mc-video-tag">{video.topic}</span>
                  {video.duration_minutes && (
                    <span className="dv-duration">
                      ⏱ {video.duration_minutes} {isAr ? "دقيقة" : "min"}
                    </span>
                  )}
                </div>

                <div className="mc-video-meta">
                  <div className="mc-doc-avatar">
                    {video.doctor_name ? video.doctor_name.charAt(3) || video.doctor_name.charAt(0) : "د"}
                  </div>
                  <div>
                    <p className="mc-doc-name">{video.doctor_name}</p>
                    <p className="mc-doc-spec">{video.specialization}</p>
                    {video.interview_title && (
                      <p className="dv-interview-title">{video.interview_title}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── زر مشاهدة المزيد → يحوّل لصفحة تسجيل الدخول ── */}
          <div className="dv-more-wrap">
            <button className="dv-more-btn" onClick={goToLogin}>
              {isAr ? "شاهدي المزيد من المقابلات" : "Watch more interviews"}
              <i className={`fas fa-arrow-${isAr ? "left" : "right"}`}></i>
            </button>
          </div>
        </>
      )}

      {/* المودال — نفس منطق تشغيل الفيديو الأصلي */}
      {activeVideo && (
        <div className="mc-modal-backdrop" onClick={closeModal}>
          <div className="mc-modal dv-modal" onClick={(e) => e.stopPropagation()}>
            <button className="mc-modal-close" onClick={closeModal}>
              <i className="fas fa-times"></i>
            </button>
            <p className="mc-modal-name">{activeVideo.doctor_name}</p>
            <p className="dv-modal-title">{activeVideo.interview_title}</p>

            {activeVideo.video_url ? (
              (() => {
                const getEmbedUrl = (url) => {
                  if (!url) return null;
                  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
                  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
                  const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
                  if (longMatch) return `https://www.youtube.com/embed/${longMatch[1]}`;
                  if (url.includes("youtube.com/embed/")) return url;
                  return null;
                };

                const embedUrl = getEmbedUrl(activeVideo.video_url);

                return embedUrl ? (
                  <iframe
                    key={activeVideo.id}
                    className="dv-video-player"
                    src={embedUrl}
                    title={activeVideo.interview_title || activeVideo.doctor_name}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    ref={videoRef}
                    key={activeVideo.id}
                    className="dv-video-player"
                    controls
                    preload="metadata"
                    playsInline
                  >
                    <source src={activeVideo.video_url} type="video/mp4" />
                    <source src={activeVideo.video_url} type="video/quicktime" />
                    {isAr ? "متصفحك لا يدعم تشغيل الفيديو." : "Your browser does not support video playback."}
                  </video>
                );
              })()
            ) : (
              <div className="mc-modal-placeholder">
                <i className="fas fa-video"></i>
                <p>{isAr ? "الفيديو قيد الإضافة — سيكون متاحاً قريباً" : "Video coming soon"}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

const PREVIEW_CSS = `
.dv-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  padding: 8px 20px 16px;
  max-width: 1200px;
  margin: 0 auto;
}

@media (min-width: 640px) {
  .dv-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .dv-grid { grid-template-columns: repeat(3, 1fr); }
}

.dv-duration {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
}

.dv-interview-title {
  font-size: 0.72rem;
  color: #aaa;
  margin-top: 2px;
  font-weight: 600;
}

.dv-modal { max-width: 760px; width: 95vw; }
.dv-modal-title { color: #aaa; font-size: 0.88rem; margin-bottom: 16px; font-weight: 600; }

.dv-video-player {
  width: 100%;
  border-radius: 12px;
  height: 380px;
  background: #000;
  display: block;
}

.dv-loading { text-align: center; padding: 60px; }
.dv-spinner {
  width: 44px; height: 44px;
  border: 4px solid #fdf2f5;
  border-top-color: #eab8c6;
  border-radius: 50%;
  animation: dv-spin 0.8s linear infinite;
  margin: 0 auto;
}
@keyframes dv-spin { to { transform: rotate(360deg); } }

.dv-empty { text-align: center; padding: 60px 20px; color: #ccc; }
.dv-empty i { font-size: 3rem; display: block; margin-bottom: 14px; color: #eab8c6; }
.dv-empty p { font-size: 1rem; font-weight: 700; color: #aaa; margin-bottom: 6px; }
.dv-empty span { font-size: 0.82rem; color: #ccc; }

.dv-card .mc-video-thumb { position: relative; }

/* زر مشاهدة المزيد */
.dv-more-wrap {
  text-align: center;
  margin-top: 28px;
}
.dv-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #e89cae, #eab8c6);
  color: #fff;
  border: none;
  padding: 13px 30px;
  border-radius: 30px;
  font-weight: 700;
  font-size: 0.95rem;
  font-family: inherit;
  cursor: pointer;
  transition: transform 0.25s, box-shadow 0.25s;
  box-shadow: 0 6px 18px rgba(232,156,174,0.35);
}
.dv-more-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(232,156,174,0.45);
}
.dv-more-btn i { font-size: 0.85rem; }
`;

export default DoctorVideosPreviewSection;