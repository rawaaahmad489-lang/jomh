// src/components/DoctorVideosSection.jsx
import { useState, useEffect, useRef } from "react";
import { supabase } from "../services/supabaseClient";

const DoctorVideosSection = ({ isAr }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("doctor_videos")
        .select("*")
        .order("created_at", { ascending: false });

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
      videoRef.current.currentTime = 0;
    }
    setActiveVideo(null);
    document.body.style.overflow = "";
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
    const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (longMatch) return `https://www.youtube.com/embed/${longMatch[1]}`;
    if (url.includes("youtube.com/embed/")) return url;
    return null;
  };

  return (
    <section style={{
      padding: "3rem 1rem",
      background: "#FBF9F8",
      textAlign: "center",
    }}>
      {/* Eyebrow */}
      <div style={{
        fontSize: "0.78rem",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "#e89cae",
        marginBottom: "0.4rem",
      }}>
        🎙️ {isAr ? "لقاءات حصرية" : "Exclusive Interviews"}
      </div>

      {/* Title */}
      <h2 style={{
        fontSize: "2rem",
        fontWeight: 800,
        color: "#333",
        marginBottom: "0.5rem",
      }}>
        {isAr ? "لقاءات مع المتخصصين" : "Meet Our Specialists"}
      </h2>

      {/* Sub */}
      <p style={{
        color: "#888",
        fontSize: "0.93rem",
        maxWidth: 540,
        margin: "0 auto 2.2rem",
        lineHeight: 1.7,
      }}>
        {isAr
          ? "مقابلات أجراها فريق المنصة مع أطباء متخصصين — بأصواتهم مباشرةً"
          : "Interviews conducted by our team with certified specialists"}
      </p>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px" }}>
          <div style={{
            width: 44, height: 44,
            border: "4px solid #fdf2f5",
            borderTopColor: "#eab8c6",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto",
          }} />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#ccc" }}>
          <i className="fas fa-exclamation-circle" style={{ fontSize: "3rem", color: "#eab8c6", display: "block", marginBottom: 14 }} />
          <p style={{ color: "#aaa", fontWeight: 700 }}>
            {isAr ? "حدث خطأ في تحميل المقابلات" : "Error loading interviews"}
          </p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && videos.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#ccc" }}>
          <i className="fas fa-video-slash" style={{ fontSize: "3rem", color: "#eab8c6", display: "block", marginBottom: 14 }} />
          <p style={{ color: "#aaa", fontWeight: 700, marginBottom: 6 }}>
            {isAr ? "لا توجد مقابلات متاحة حالياً" : "No interviews available yet"}
          </p>
          <span style={{ fontSize: "0.82rem" }}>
            {isAr ? "سيتم إضافة مقابلات قريباً" : "Interviews coming soon"}
          </span>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && videos.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 24,
          padding: "8px 20px 16px",
          maxWidth: 1200,
          margin: "0 auto",
        }}>
          {videos.map((video, i) => (
            <div
              key={video.id}
              onClick={() => openModal(video)}
              style={{
                background: "#fff",
                borderRadius: 18,
                overflow: "hidden",
                cursor: "pointer",
                boxShadow: "0 4px 18px rgba(232,156,174,0.12)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                animationDelay: `${i * 0.1}s`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 18px 46px rgba(232,156,174,0.25)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 18px rgba(232,156,174,0.12)";
              }}
            >
              {/* Thumbnail */}
              <div style={{
                position: "relative",
                paddingTop: "56.25%", /* 16:9 */
                backgroundImage: video.thumbnail_url
                  ? `url('${video.thumbnail_url}')`
                  : "url('/assets/homePage/experts.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}>
                {/* Overlay */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(232,156,174,0.52)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0,
                  transition: "opacity 0.3s",
                }}
                  className="dv-thumb-overlay"
                >
                  <div style={{
                    width: 60, height: 60,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <div style={{
                      width: 46, height: 46,
                      background: "#fff",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <i className="fas fa-play" style={{ color: "#e89cae", fontSize: 17 }} />
                    </div>
                  </div>
                </div>

                {/* Topic tag */}
                {video.topic && (
                  <span style={{
                    position: "absolute",
                    top: "0.7rem",
                    left: "0.7rem",
                    background: "#e89cae",
                    color: "#fff",
                    fontSize: "0.68rem",
                    padding: "3px 10px",
                    borderRadius: 20,
                    fontWeight: 500,
                  }}>
                    {video.topic}
                  </span>
                )}

                {/* Duration */}
                {video.duration_minutes && (
                  <span style={{
                    position: "absolute",
                    bottom: 10, left: 10,
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    padding: "3px 10px",
                    borderRadius: 20,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}>
                    ⏱ {video.duration_minutes} {isAr ? "دقيقة" : "min"}
                  </span>
                )}
              </div>

              {/* Meta */}
              <div style={{
                padding: "0.9rem 1.1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.7rem",
                textAlign: "start",
              }}>
                {/* Avatar */}
                <div style={{
                  width: 38, height: 38,
                  borderRadius: "50%",
                  background: "#F4E4DF",
                  color: "#e89cae",
                  fontWeight: 700,
                  fontSize: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {video.doctor_name ? video.doctor_name.charAt(0) : "د"}
                </div>

                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "#4A3F3D", margin: 0 }}>
                    {video.doctor_name}
                  </p>
                  <p style={{ fontSize: "0.76rem", color: "#888", marginTop: 2, marginBottom: 0 }}>
                    {video.specialization}
                  </p>
                  {video.interview_title && (
                    <p style={{ fontSize: "0.72rem", color: "#aaa", marginTop: 2, fontWeight: 600, marginBottom: 0 }}>
                      {video.interview_title}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {activeVideo && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(30,10,18,0.85)",
            backdropFilter: "blur(8px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 22,
              padding: "1.5rem",
              maxWidth: 760,
              width: "95vw",
              position: "relative",
            }}
          >
            {/* Close */}
            <button
              onClick={closeModal}
              style={{
                position: "absolute",
                top: "0.9rem",
                right: "0.9rem",
                background: "#F4E4DF",
                border: "none",
                width: 34, height: 34,
                borderRadius: "50%",
                cursor: "pointer",
                color: "#e89cae",
                fontSize: "0.88rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="fas fa-times" />
            </button>

            <p style={{ fontSize: "1.15rem", fontWeight: 600, color: "#e89cae", marginBottom: "0.4rem" }}>
              {activeVideo.doctor_name}
            </p>
            <p style={{ color: "#aaa", fontSize: "0.88rem", marginBottom: 16, fontWeight: 600 }}>
              {activeVideo.interview_title}
            </p>

            {/* Video */}
            {activeVideo.video_url ? (
              (() => {
                const embedUrl = getEmbedUrl(activeVideo.video_url);
                return embedUrl ? (
                  <iframe
                    key={activeVideo.id}
                    src={embedUrl}
                    title={activeVideo.interview_title || activeVideo.doctor_name}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ width: "100%", height: 380, borderRadius: 12, background: "#000", display: "block" }}
                  />
                ) : (
                  <video
                    ref={videoRef}
                    key={activeVideo.id}
                    controls
                    preload="metadata"
                    playsInline
                    style={{ width: "100%", height: 380, borderRadius: 12, background: "#000", display: "block" }}
                  >
                    <source src={activeVideo.video_url} type="video/mp4" />
                  </video>
                );
              })()
            ) : (
              <div style={{
                aspectRatio: "16/9",
                background: "#FBF9F8",
                borderRadius: 14,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                color: "#888",
              }}>
                <i className="fas fa-video" style={{ fontSize: "2.8rem", color: "#eab8c6" }} />
                <p style={{ fontSize: "0.88rem" }}>
                  {isAr ? "الفيديو قيد الإضافة" : "Video coming soon"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline style for spin animation only */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
};

export default DoctorVideosSection;