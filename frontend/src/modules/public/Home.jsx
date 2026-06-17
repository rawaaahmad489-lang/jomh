//Home page public
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "../../shared/layout/Navbar";
import "../../styles/HomePage.css";
import { useNavigate } from "react-router-dom";
import useLanguageSetup from "../../core/hooks/useLanguageSetup";
import TopDoctorsSection from "../../components/TopDoctorsSection";
import HomeArticlesSection from "../../components/HomeArticlesSection";
import DoctorVideosPreviewSection from "../../components/DoctorVideosPreviewSection";
import { supabase } from "../../services/supabaseClient";

/* ─── Quotes data ─── */
const QUOTES = [
  {
    ar: "كل يوم تقومين فيه بما تستطيعين هو إنجاز يستحق الاحتفال — أنتِ تبذلين أكثر مما تعرفين.",
    en: "Every day you show up is a victory worth celebrating — you're giving more than you know.",
    tag_ar: "💗 لأجلكِ أنتِ",
  },
  {
    ar: "رحلة كل أم فريدة من نوعها. خطواتكِ، وتيرتكِ، وطريقتكِ — كلها صحيحة.",
    en: "Every mother's journey is one of a kind. Your pace, your path, your way — all are right.",
    tag_ar: "🌸 رحلتكِ الخاصة",
  },
  {
    ar: "التواصل مع من حولكِ ليس ضعفاً — بل هو ما تفعله الأمهات الحكيمات.",
    en: "Reaching out to those around you isn't weakness — it's what wise mothers do.",
    tag_ar: "🤱 معاً نكون أقوى",
  },
  {
    ar: "جسدكِ يعمل بجدٍّ كبير كل يوم — امنحيه اللطف الذي يمنحه لطفلكِ.",
    en: "Your body works hard every single day — give it the same gentleness it gives your child.",
    tag_ar: "💪 اعتني بنفسكِ",
  },
  {
    ar: "لا تحتاجين أن تكوني مثالية لتكوني الأم التي يحتاجها طفلكِ — أنتِ كافية تماماً.",
    en: "You don't need to be perfect to be the mother your child needs — you are already enough.",
    tag_ar: "🌙 أنتِ كافية",
  },
];


/* ─── Animated counter hook ─── */
function useCounter(target) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let cur = 0;
    const step = Math.max(1, Math.ceil(target / 50));
    const iv = setInterval(() => {
      cur = Math.min(cur + step, target);
      setVal(cur);
      if (cur >= target) clearInterval(iv);
    }, 30);
    return () => clearInterval(iv);
  }, [target]);
  return val;
}

/* ══════════════════════════════════════
   COMPONENT
══════════════════════════════════════ */
const HomePage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  useLanguageSetup();

  const isAr = i18n.language === "ar";

  /* stats */
  const [visits, setVisits]   = useState(0);
  const [mothers, setMothers] = useState(0);
  const dispVisits  = useCounter(visits);
  const dispMothers = useCounter(mothers);

  /* quotes */
  const [qIdx, setQIdx]   = useState(0);
  const [qFade, setQFade] = useState(false);
  const qTimerRef = useRef(null);

  const goQuote = (n) => {
    setQFade(true);
    setTimeout(() => { setQIdx(n); setQFade(false); }, 320);
  };

  useEffect(() => {
    qTimerRef.current = setInterval(
      () => goQuote((prev) => (prev + 1) % QUOTES.length),
      5000
    );
    return () => clearInterval(qTimerRef.current);
  }, []);

  /* video modal */
  const [activeVideo, setActiveVideo] = useState(null);

  /* scroll reveal */
  useEffect(() => {
    const reveal = () => {
      document.querySelectorAll(".reveal").forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight - 80)
          el.classList.add("active");
      });
    };
    window.addEventListener("scroll", reveal);
    reveal();
    return () => window.removeEventListener("scroll", reveal);
  }, []);

  /* supabase visit tracking */
  useEffect(() => {
    const run = async () => {
      try {
        const today = new Date().toDateString();
        if (localStorage.getItem("home_visit") !== today) {
          await supabase.from("site_visits").insert({});
          localStorage.setItem("home_visit", today);
        }
        const { count: vc } = await supabase
          .from("site_visits")
          .select("*", { count: "exact", head: true });
        setVisits(vc || 0);

        const { count: mc } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("role", "mother");
        setMothers(mc || 0);
      } catch (err) {
        console.log("visit error", err);
      }
    };
    run();
  }, []);

  return (
    <div dir={i18n.language === "ar" ? "rtl" : "ltr"}>
      <Navbar />

      {/* ════ HERO ════ */}
      <header
        className="hero-section"
        style={{ backgroundImage: "url('/assets/homePage/mum.png')" }}
      >
        {/* الـ overlay الأصلي من النسخة القديمة */}
        <div className="hero-overlay"></div>

        {/* orbs جوية خفية */}
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />

        <div className="hero-content reveal active">
          <h1>{t("hero.title")}</h1>
          <p>{t("hero.subtitle")}</p>

          <div className="hero-actions">
            <div className="hero-actions-top">
              <a
                href="/register"
                className="btn-primary"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/register", { state: { role: "mother" } });
                }}
              >
                {t("hero.start")}
              </a>
              <a
                href="/register"
                className="btn-outline-light"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/register", { state: { role: "doctor" } });
                }}
              >
                {t("hero.doctor")}
              </a>
            </div>
            <div className="hero-actions-bottom">
<a href="https://www.youtube.com/watch?v=GXna8cKFhHg"
  className="btn-outline-light"
  target="_blank"
  rel="noopener noreferrer"
>
  <i className="fas fa-play-circle"></i> {t("hero.watch")}
</a>
            </div>
          </div>
        </div>

        {/* scroll bounce indicator */}
        <div className="scroll-indicator">
          <div className="scroll-dot" />
        </div>
      </header>

      {/* ════ STATS BAR ════ */}
      <div className="stats-bar-wrapper">
        <div className="stats-bar reveal">
          <div className="stat-item">
            <span className="stat-emoji">👀</span>
            <strong>{dispVisits}+</strong>
            <span>{t("hero.visitors")}</span>
          </div>
          <div className="stats-sep" />
          <div className="stat-item">
            <span className="stat-emoji">🤱</span>
            <strong>{dispMothers}+</strong>
            <span>{t("hero.mothers")}</span>
          </div>
        </div>
      </div>


      {/* ════ WHY US ════ */}
      <section className="why-us-section reveal">
        <h2 className="section-title">{t("why.title")}</h2>
        <div className="why-container">
          <div className="why-box">
            <i
              className="fas fa-tired"
              style={{ fontSize: "4rem", color: "#e89cae", marginBottom: "20px" }}
            ></i>
            <p>{t("why.left")}</p>
          </div>
          <div className="divider"></div>
          <div className="why-box">
            <i
              className="fas fa-lightbulb"
              style={{ fontSize: "4rem", color: "#C89991", marginBottom: "20px" }}
            ></i>
            <p>{t("why.right")}</p>
          </div>
        </div>
      </section>

      {/* ════ SERVICES ════ */}
      <section className="services-section reveal">
        <h2 className="section-title">{t("services.title")}</h2>
        <div className="services-grid">
          <div
            className="service-card"
            style={{ backgroundImage: "url('/assets/homePage/nutrition.jpg')" }}
          >
            <div className="service-content">
              <i className="fas fa-apple-alt"></i>
              <h3>{t("services.nutrition")}</h3>
            </div>
          </div>
          <div
            className="service-card"
            style={{ backgroundImage: "url('/assets/homePage/baby.jpg')" }}
          >
            <div className="service-content">
              <i className="fas fa-baby"></i>
              <h3>{t("services.baby")}</h3>
            </div>
          </div>
          <div
            className="service-card"
            style={{ backgroundImage: "url('/assets/homePage/experts.jpg')" }}
          >
            <div className="service-content">
              <i className="fas fa-stethoscope"></i>
              <h3>{t("services.experts")}</h3>
            </div>
          </div>
          <div
            className="service-card"
            style={{ backgroundImage: "url('/assets/homePage/healing.jpg')" }}
          >
            <div className="service-content">
              <i className="fas fa-heartbeat"></i>
              <h3>{t("services.recovery")}</h3>
            </div>
          </div>
        </div>
      </section>

   {/* ════ DOCTOR VIDEOS — Dynamic ════ */}
<DoctorVideosPreviewSection isAr={isAr} />

      {/* ════ AI SECTION ════ */}
      <section className="ai-section reveal">
        <h2 className="section-title">{t("ai.title")}</h2>
        <i className="fas fa-robot floating-icon" style={{ top: "20%", right: "15%" }}></i>
        <i className="fas fa-comment-medical floating-icon" style={{ bottom: "30%", left: "20%", animationDelay: "2s" }}></i>
        <div className="phone-mockup">
          <div className="chat-container">
            <div className="chat-bubble user-bubble">{t("ai.user")}</div>
            <div className="chat-bubble ai-bubble">{t("ai.ai")}</div>
          </div>
          <div className="chat-input">
            <span>{t("ai.typing")}</span>
            <i className="fas fa-paper-plane"></i>
          </div>
        </div>
      </section>

     

      {/* ════ QUOTES SLIDER ════ */}
      <section
        className="mc-quotes-section reveal"
        onMouseEnter={() => clearInterval(qTimerRef.current)}
        onMouseLeave={() => {
          qTimerRef.current = setInterval(
            () => goQuote((prev) => (prev + 1) % QUOTES.length),
            5000
          );
        }}
      >
        <div className="mc-quotes-bigmark">"</div>
        <div className="mc-section-eyebrow mc-quotes-eyebrow">
          💗 {isAr ? "صحتك تهمنا" : "Your wellbeing matters"}
        </div>
        <h2 className="section-title mc-quotes-title">
          {isAr ? "كلمات تُشعل الأمل" : "Words That Ignite Hope"}
        </h2>

        <div className={`mc-quote-body ${qFade ? "mc-fading" : ""}`}>
          <p className="mc-quote-ar">{QUOTES[qIdx].ar}</p>
          <span className="mc-quote-en">{QUOTES[qIdx].en}</span>
          <span className="mc-quote-tag">{QUOTES[qIdx].tag_ar}</span>
        </div>

        <div className="mc-dots">
          {QUOTES.map((_, i) => (
            <button
              key={i}
              className={`mc-dot${i === qIdx ? " mc-dot-active" : ""}`}
              onClick={() => goQuote(i)}
              aria-label={`اقتباس ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ════ TOP DOCTORS ════ */}
      <TopDoctorsSection />

      {/* ════ ARTICLES ════ */}
      <HomeArticlesSection isAr={i18n.language === "ar"} />

      {/* ════ TRUST BANNER ════ */}
      <div className="trust-banner">
        <i className="fas fa-user-md"></i>
        Certified and reviewed by doctors and specialists
        <i className="fas fa-hands-holding-child"></i>
      </div>

      {/* ════ FOOTER ════ */}
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-links">
            <a href="#">{t("nav.home")}</a>
            <a href="#">{t("nav.about")}</a>
            <a href="#">{t("footer.contact")}</a>
          </div>
          <div className="social-icons">
            <i className="fa-brands fa-facebook-f"></i>
            <i className="fa-brands fa-instagram"></i>
            <i className="fa-solid fa-phone"></i>
          </div>
        </div>
        <div className="copyright">
          <span>{t("footer.copyright")}</span>
          <span>{t("footer.slogan")}</span>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
