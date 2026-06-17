

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const { t, i18n } = useTranslation();

  const [menuOpen, setMenuOpen] =
    useState(false);

  const location = useLocation();

  const isArabic =
    i18n.language === "ar";

  const changeLang = (lng) => {
    i18n.changeLanguage(lng);
  };

  const closeMenu = () =>
    setMenuOpen(false);

  const isActive = (path) =>
    location.pathname === path;

  return (
    <>
      {/* NAVBAR */}
      <nav
        className={`navbar ${
          isArabic ? "rtl" : "ltr"
        }`}
      >
        {/* LOGO */}
        <Link
          to="/"
          className="logo nav-reset"
        >
          Journey of Motherhood
        </Link>

        {/* DESKTOP NAV */}
        <div className="desktop-nav">

          <Link
            to="/"
            className={`nav-reset ${
              isActive("/")
                ? "active-link"
                : ""
            }`}
          >
            {t("nav.home")}
          </Link>

          <Link
            to="/about"
            className={`nav-reset ${
              isActive("/about")
                ? "active-link"
                : ""
            }`}
          >
            {t("nav.about")}
          </Link>

          <Link
            to="/services"
            className={`nav-reset ${
              isActive("/services")
                ? "active-link"
                : ""
            }`}
          >
            {t("nav.services")}
          </Link>

          <Link
            to="/why-us"
            className={`nav-reset ${
              isActive("/why-us")
                ? "active-link"
                : ""
            }`}
          >
            {t("nav.why")}
          </Link>
<Link
  to="/doctors"
  className={`nav-reset ${
    isActive("/doctors")
      ? "active-link"
      : ""
  }`}
>
  {t("nav.doctors")}
</Link>
          {/* LANGUAGE */}
          <div className="lang-menu">

            <button
              type="button"
              className="lang-btn"
            >
              {isArabic
                ? "العربية"
                : "English"}

              <i className="fas fa-chevron-down" />
            </button>

            <div className="lang-content">

              <button
                type="button"
                onClick={() =>
                  changeLang("en")
                }
                className={`lang-item ${
                  i18n.language ===
                  "en"
                    ? "active-lang"
                    : ""
                }`}
              >
                English
              </button>

              <button
                type="button"
                onClick={() =>
                  changeLang("ar")
                }
                className={`lang-item ${
                  i18n.language ===
                  "ar"
                    ? "active-lang"
                    : ""
                }`}
              >
                العربية
              </button>

            </div>

          </div>

       <Link
  to="/login"
  state={{ role: "mother" }}
  className="login-nav-btn nav-reset"
>
  {t("nav.login")}
</Link>

          <Link
            to="/select-role"
            className="register-nav-btn nav-reset"
          >
            {t("nav.register")}
          </Link>

        </div>

        {/* MOBILE BUTTON */}
        <button
          className="mobile-menu-btn"
          onClick={() =>
            setMenuOpen(true)
          }
        >
          <i className="fas fa-bars" />
        </button>

      </nav>

      {/* OVERLAY */}
      {menuOpen && (
        <div
          id="overlay"
          onClick={closeMenu}
        />
      )}

      {/* SIDE MENU */}
      <div
        id="sideMenu"
        className={
          menuOpen
            ? "open"
            : ""
        }
      >

        <h3>
          <span>
            {t("nav.menu")}
          </span>

          <i
            className="fas fa-times"
            onClick={closeMenu}
          />
        </h3>

        {/* MOBILE LANG */}
        <div className="mobile-lang-switch">

          <button
            type="button"
            onClick={() =>
              changeLang("en")
            }
            className={`lang-item ${
              i18n.language ===
              "en"
                ? "active-lang"
                : ""
            }`}
          >
            English
          </button>

          <button
            type="button"
            onClick={() =>
              changeLang("ar")
            }
            className={`lang-item ${
              i18n.language ===
              "ar"
                ? "active-lang"
                : ""
            }`}
          >
            عربي
          </button>

        </div>

        <Link
          to="/"
          className="nav-reset"
          onClick={closeMenu}
        >
          {t("nav.home")}
        </Link>

        <Link
          to="/about"
          className="nav-reset"
          onClick={closeMenu}
        >
          {t("nav.about")}
        </Link>

        <Link
          to="/services"
          className="nav-reset"
          onClick={closeMenu}
        >
          {t("nav.services")}
        </Link>

        <Link
          to="/why-us"
          className="nav-reset"
          onClick={closeMenu}
        >
          {t("nav.why")}
        </Link>

     <Link
  to="/login"
  state={{ role: "mother" }}
  className="nav-reset"
  onClick={closeMenu}
>
  {t("nav.login")}
</Link>
<Link
  to="/doctors"
  className="nav-reset"
  onClick={closeMenu}
>
  {t("nav.doctors")}
</Link>
      </div>
    </>
  );
};

export default Navbar;