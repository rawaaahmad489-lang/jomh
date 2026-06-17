
import "../../styles/WhyChooseUs.css";
import useReveal from "../../core/hooks/Usereveal";
import { useTranslation } from "react-i18next";
import Navbar from "../../shared/layout/Navbar";


/* ── Render intro with <highlight> tags ── */
const renderIntro = (raw) => {
  const parts = raw.split(/<highlight>|<\/highlight>/);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="highlight">
        {part}
      </span>
    ) : (
      part
    )
  );
};

const features = (t) => [
  {
    num: "01",
    icon: "fas fa-heartbeat",
    title: t("whyy.f1Title"),
    text: t("whyy.f1Text"),
  },
  {
    num: "02",
    icon: "fas fa-user-md",
    title: t("whyy.f2Title"),
    text: t("whyy.f2Text"),
  },
  {
    num: "03",
    icon: "fas fa-microchip",
    title: t("whyy.f3Title"),
    text: t("whyy.f3Text"),
  },
  {
    num: "04",
    icon: "fas fa-hands-holding-child",
    title: t("whyy.f4Title"),
    text: t("whyy.f4Text"),
  },
];

const WhyChooseUs = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  useReveal("why-main-content");

  return (
    <div className={`why-page-body ${isAr ? "rtl" : "ltr"}`} dir={isAr ? "rtl" : "ltr"}>
      <Navbar />
      <main className="why-main-content" id="why-main-content">
        <div className="why-containerr">

          {/* Title */}
          <div className="why-title-block reveal-text">
            <h1 className="why-page-title">{t("whyy.title")}</h1>
            <div className="why-title-bar" />
          </div>

          {/* Intro */}
          <p className="why-intro-text reveal-text">
            {renderIntro(t("whyy.intro"))}
          </p>

          {/* Features zig-zag */}
          <div className="features-list">
            {features(t).map((f) => (
              <div className="feature-item reveal-text" key={f.num}>
                <div className="watermark">{f.num}</div>
                <div className="feature-icon">
                  <i className={f.icon} />
                </div>
                <div className="feature-text">
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <footer className="why-footer">
          <p>&copy; {t("whyy.footer")}</p>
        </footer>
      </main>
    </div>
  );
};

export default WhyChooseUs;