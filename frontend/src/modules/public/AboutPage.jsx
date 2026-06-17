
import "../../styles/AboutPage.css";
import useReveal from "../../core/hooks/Usereveal";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import whyAr from "../../../public/assets/homePage/why-ar.png";
import whyEn from "../../../public/assets/homePage/why-en.png";
import Navbar from "../../shared/layout/Navbar";

const accordionData = (t) => [
  { title: t("about.acc1Title"), text: t("about.acc1Text") },
  { title: t("about.acc2Title"), text: t("about.acc2Text") },
  { title: t("about.acc3Title"), text: t("about.acc3Text") },
  { title: t("about.acc4Title"), text: t("about.acc4Text") },
];

const AccordionItem = ({ title, text }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="accordion-item">
      <button
        className={`accordion-header ${open ? "active" : ""}`}
        onClick={() => setOpen(!open)}
      >
        {title}
        <i className="fas fa-chevron-down" />
      </button>
      <div className={`accordion-content ${open ? "open" : ""}`}>
        <p>{text}</p>
      </div>
    </div>
  );
};

const FlipCard = ({ icon, title, text }) => {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      className={`flip-card ${flipped ? "flipped" : ""}`}
      onClick={() => setFlipped(!flipped)}
    >
      <div className="flip-card-inner">
        <div className="flip-card-front">
          <i className={icon} />
          <h3>{title}</h3>
        </div>
        <div className="flip-card-back">
          <p>{text}</p>
        </div>
      </div>
    </div>
  );
};

const AboutUs = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
const currentImage = isAr ? whyAr : whyEn;
  useReveal("about-main-content");

  const introRaw = t("about.intro");

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

  return (
    <div className={`about-page-body ${isAr ? "rtl" : "ltr"}`}>
      <Navbar />
      <main className="about-main-content" id="about-main-content">
        <div className="about-container">

          {/* Title */}
          <h1 className="about-page-title reveal-text">{t("about.title")}</h1>

          {/* Intro */}
          <p className="about-intro-text reveal-text">
            {renderIntro(introRaw)}
          </p>

         {/* Hero Image */}
<div className="why-hero-image reveal-text">
  <img
    src={currentImage}
    alt="Why Choose Us"
    className="why-image"
  />
</div>
          {/* Flip Cards */}
          <div className="cards-container reveal-text">
            <FlipCard
              icon="fas fa-bullseye"
              title={t("about.missionTitle")}
              text={t("about.missionText")}
            />
            <FlipCard
              icon="fas fa-eye"
              title={t("about.visionTitle")}
              text={t("about.visionText")}
            />
          </div>

          {/* Accordion */}
          <div className="accordion-container reveal-text">
            <h2 className="section-subtitle">{t("about.offerTitle")}</h2>
            {accordionData(t).map((item, idx) => (
              <AccordionItem key={idx} title={item.title} text={item.text} />
            ))}
          </div>

          {/* Team Box 
          <div className="team-box reveal-text">
            <p>
              <strong>{t("about.supervisor")}:</strong>{" "}
              {t("about.supervisorName")}
            </p>
            <p>
              <strong>{t("about.preparedBy")}:</strong> {t("about.team")}
            </p>
          </div>*/}
        </div>

        <footer className="footer-simple">
          <p>&copy; {t("about.footer")}</p>
        </footer>
      </main>
    </div>
  );
};

export default AboutUs;