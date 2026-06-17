import "../../styles/Services.css";
import useReveal from "../../core/hooks/Usereveal";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "../../shared/layout/Navbar";

/* ── Floating hearts (same JS as original) ── */
const FloatingHearts = () => {
  useEffect(() => {
    const container = document.getElementById("floating-hearts");
    if (!container || container.childElementCount > 0) return;
    for (let i = 0; i < 15; i++) {
      const heart = document.createElement("i");
      heart.classList.add("fas", "fa-heart", "heart");
      heart.style.fontSize = Math.random() * 20 + 10 + "px";
      heart.style.left = Math.random() * 100 + "vw";
      heart.style.animationDelay = Math.random() * 10 + "s";
      heart.style.animationDuration = Math.random() * 10 + 15 + "s";
      container.appendChild(heart);
    }
  }, []);

  return <div id="floating-hearts" />;
};

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

const Services = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  useReveal("services-main-content");

  return (
    <div className={`services-page-body ${isAr ? "rtl" : "ltr"}`}>
      <Navbar />
      <FloatingHearts />

      <main
        className="services-main-content"
        id="services-main-content"
      >
        <div className="services-container">
          {/* Title */}
          <h1 className="services-page-title reveal-text">
            {t("servicess.title")}
          </h1>

          {/* Intro */}
          <p className="services-intro-text reveal-text">
            {renderIntro(t("servicess.intro"))}
          </p>

          {/* Top Row — 3 cards */}
          <div className="services-top-row reveal-text">
            {/* Card 1 */}
            <div className="service-cards">
              <div className="icon-wrapper">
                <i className="fas fa-female" />
              </div>
              <h3>{t("servicess.card1Title")}</h3>
              <p>{t("servicess.card1Text")}</p>
              <button className="btn-service">{t("servicess.card1Btn")}</button>
            </div>

            {/* Card 2 */}
            <div className="service-cards">
              <div className="icon-wrapper">
                <i className="fas fa-baby" />
              </div>
              <h3>{t("servicess.card2Title")}</h3>
              <p>{t("servicess.card2Text")}</p>
              <button className="btn-service">{t("servicess.card2Btn")}</button>
            </div>

            {/* Card 3 */}
            <div className="service-cards">
              <div className="icon-wrapper">
                <i className="fas fa-user-md" />
              </div>
              <h3>{t("servicess.card3Title")}</h3>
              <p>{t("servicess.card3Text")}</p>
              <button className="btn-service">{t("servicess.card3Btn")}</button>
            </div>
          </div>

          {/* Bottom Row — AI card */}
          <div className="services-bottom-row reveal-text">
            <div className="service-cards ai-card">
              <div
                className="icon-wrapper"
                style={{ backgroundColor: "#f7dbe3" }}
              >
                <i className="fas fa-robot" style={{ color: "#c45b77" }} />
              </div>
              <h3>{t("servicess.card4Title")}</h3>
              <p>{t("servicess.card4Text")}</p>
              <button className="btn-service primary">
                {t("servicess.card4Btn")}
              </button>
            </div>
          </div>
        </div>

        <footer className="services-footer">
          <p>&copy; {t("servicess.footer")}</p>
        </footer>
      </main>
    </div>
  );
};

export default Services;