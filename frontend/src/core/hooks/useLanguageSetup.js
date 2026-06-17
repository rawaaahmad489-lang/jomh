import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const useLanguageSetup = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const isArabic = i18n.language === "ar";

    // 🌍 الاتجاه
    document.documentElement.dir = isArabic ? "rtl" : "ltr";

    // 🔤 اللغة
    document.documentElement.lang = isArabic ? "ar" : "en";

    // 🎨 الخط
    document.body.style.fontFamily = isArabic
      ? "'Cairo', sans-serif"
      : "'Poppins', sans-serif";

  }, [i18n.language]);
};

export default useLanguageSetup;
