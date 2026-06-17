import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// translations
const resources = {
  en: {
    translation: {
      nav: {
        home: "Home",
        about: "About Us",
        services: "Services",
        why: "Why Us",
        login: "Login",
        menu: "Menu",
         "register": "Register",
         "doctors": "Doctors"
      },
// داخل English (en)
whyPage: {
  title: "Why Choose Us?",
  intro: "What makes <0>Journey of Motherhood</0> unique? We combine medical expertise, empathetic community support, and cutting-edge AI technology to ensure no mother feels alone on her journey.",
  feature1: {
    title: "Holistic Approach",
    desc: "Unlike traditional platforms that focus solely on the child, we prioritize the mother's physical and mental recovery equally. We believe a healthy, happy mother is the foundation of a thriving child."
  },
  feature2: {
    title: "Verified Experts",
    desc: "All our content is medically reviewed, and our network consists of healthcare professionals, including gynecologists, pediatricians, and mental health specialists. With us, you get scientific answers you can fully trust."
  },
  feature3: {
    title: "AI Technology",
    desc: "We integrated a 24/7 smart assistant (Chatbot) to provide immediate, reliable reassurance for those late-night questions. It is safe, fast, and specifically designed to accompany you in maternal and infant care."
  },
  feature4: {
    title: "Empathetic Design",
    desc: "This platform was designed as a graduation project by a dedicated team, built on genuine empathy. We understand the challenges of the first year of motherhood, and we designed every feature to be accessible, calming, and supportive."
  }
},


auth: {
  registerTitle: "Start Your Journey with Us ✨",
  registerSubtitle: "Few simple steps to join an integrated support community dedicated to you and your baby.",
  motherName: "Mother's Full Name",
  email: "Email Address",
  babyName: "Baby's Name",
  babyAge: "Baby's Current Age",
  selectAge: "Select age group",
  password: "Password",
  registerBtn: "Create Account & Start Journey",
  haveAccount: "Already have an account?",
  login: "Login",

  loginTitle: "Welcome Back 🌸",
  loginSubtitle: "We're so happy to see you again. Let’s continue your beautiful journey.",
  forgotPassword: "Forgot password?",
  noAccount: "Don't have an account?",

  "placeholderMotherName": "e.g., Sarah Ahmed",
"instructionMotherName": "Please enter your full name to officially verify your account.",
"placeholderEmail": "example@mail.com",
"instructionEmail": "We will use this to send important updates about your baby's journey.",
"placeholderBabyName": "What should we call the little one?",
"instructionBabyName": "This helps us personalize growth tracking tools with your baby's name.",
"instructionBabyAge": "Knowing the age allows us to provide medical advice suited for this stage.",
"placeholderPassword": "Create a strong password",
"instructionPassword": "Must be at least 8 characters. Combine letters and numbers for better security.",
},




      hero: {
        title: "You are not alone in this journey.. We are with you step by step.",
        subtitle:
          "A comprehensive and smart platform accompanying you psychologically, physically, and cognitively during your first year of motherhood.",
        start: "Start Your Journey",
        doctor: "Doctor Login",
        watch: "Watch Video",
        "visitors":"visitors",
         "mothers": "Mothers Trust Us"
      },
      why: {
        title: "Why Are We Here?",
        left: "For challenges in postpartum depression, lack of sleep, nutrition, and attempts to seek proper support and guidance..",
        right: "Solutions for certified support, expert consultations, and AI to accompany you in easing motherhood anxiety.",
      },
      services: {
        title: "Core Services",
        nutrition: "Proper Nutrition",
        baby: "Baby Growth",
        experts: "Experts",
        recovery: "Recovery",
      },

ai: {
  title: "Smart Assistant",
  user: "My baby has been crying for an hour and won't sleep",
  ai: "Try checking hunger, temperature, and comfort. You're doing great 💛",
  typing: "Typing..."
},
trust: {
  text: "Certified and reviewed by doctors and specialists"
},
footer: {
  contact: "Contact",
  copyright: "© 2026 Journey of Motherhood. All Rights Reserved.",
  slogan: "Progressive Motherhood: Nourishing the Future."
},
doctor: {
  registerTitle: "Join Our Medical Team 🩺",
  registerSubtitle: "Contribute to supporting mothers with professional care.",
  fullName: "Full Name",
  specialty: "Medical Specialty",
  email: "Professional Email",
  license: "Medical License Number",


  "placeholderFullName": "e.g., Dr. Michael Smith",
"instructionFullName": "Please enter your name as registered in the medical syndicate.",
"instructionSpecialty": "This will be displayed to mothers in the consultation list.",
"placeholderEmail": "doctor@clinic.com",
"instructionEmail": "Used for account verification and receiving official alerts.",
"placeholderLicense": "Enter license ID",
"instructionLicense": "This information is confidential and used for identity verification only.",
"placeholderPassword": "Create a strong password",
"instructionPassword": "Use at least 8 characters, including letters and numbers.",
loginTitle: "Welcome Back, Doctor 🩺",
  loginSubtitle: "Please enter your credentials to access your dashboard.",
  loginBtn: "Login to System",
  badge: "Medical Staff Portal",
  noAccount: "Don't have a professional account?",
  applyNow: "Apply to join now",
},
vendor: {
  registerTitle: "Join as a Vendor 🛍️",
  registerSubtitle: "Set up your store and start reaching thousands of mothers.",
  storeName: "Store Name",
  placeholderStoreName: "e.g., Baby Bliss Shop",
  instructionStoreName: "This will be the public name displayed to customers.",
  placeholderEmail: "store@example.com",
  instructionEmail: "Used to manage your account and receive order notifications.",
  placeholderPassword: "Create a strong password",
  instructionPassword: "Must be at least 8 characters, including letters and numbers.",
  loginTitle: "Welcome Back 🛍️",
  loginSubtitle: "Login to manage your store and track your orders.",
  loginBtn: "Login to Store",
  badge: "Vendor Portal",
  noAccount: "Don't have a store account?",
  applyNow: "Register your store now",
},
"about": {
    "title": "About Us",
    "intro": "Welcome to the <highlight>Journey of Motherhood</highlight>. We are a supportive and reliable platform designed specifically to accompany new mothers during their first year postpartum. We aim to help mothers deal with the psychological, emotional, and educational aspects of motherhood safely and confidently.",
    "missionTitle": "Our Mission",
    "missionText": "Providing mothers with reliable medical knowledge, continuous emotional support, and easy access to top healthcare professionals throughout the motherhood journey. We focus on physical recovery, mental health, and child development.",
    "visionTitle": "Our Vision",
    "visionText": "Empowering every mother and creating a healthy, supportive, and educated environment where both mother and child thrive together, with a focus on raising awareness about postpartum mental health.",
    "offerTitle": "What Do We Offer?",
    "acc1Title": "Mother's Section",
    "acc1Text": "Focuses on physical and mental recovery, and monitoring early signs of postpartum depression. We provide guides on self-care and navigating emotional changes.",
    "acc2Title": "Baby's Section",
    "acc2Text": "Accurate infant growth information divided into 4 stages (0-12 months). Track motor development, proper nutrition, and sleep patterns safely and comfortably.",
    "acc3Title": "Supported by Experts",
    "acc3Text": "Access reliable scientific articles written by specialists in maternal, child, and mental health. Connect directly with a selection of certified doctors.",
    "acc4Title": "Smart Assistant",
    "acc4Text": "Get instant support and reassurance with reliable scientific answers to your questions and inquiries, available anytime you need it around the clock.",
    "supervisor": "Supervisor",
    "supervisorName": "Dr. Mohammed Hamarsheh",
    "preparedBy": "Prepared by",
    "team": "Israa Al-Khatib, Rawaa Mousa, Malak Abu Hantash.",
    "footer": "2026 Journey of Motherhood. All Rights Reserved."
  },
  "servicess": {
    "title": "Services We Offer",
    "intro": "At <highlight>Journey of Motherhood</highlight>, we empower mothers through specialized support, expert guidance, and intelligent technology.",
    "card1Title": "Physical & Mental Recovery",
    "card1Text": "Focuses on mental and physical recovery, and monitoring for initial signs of postpartum depression. We provide guides on self-care and navigating emotional changes.",
    "card1Btn": "Explore Section",
    "card2Title": "Child's Development",
    "card2Text": "Developmentally appropriate information for infants divided into 4 phases (0-12 months). Track milestones, nutrition, and sleep patterns safely.",
    "card2Btn": "Explore Section",
    "card3Title": "Expert Consultations",
    "card3Text": "Access peer-reviewed articles written by specialists in women's, children's, and mental health. Connect directly with our vetted healthcare providers.",
    "card3Btn": "Find a Doctor",
    "card4Title": "Smart Assistant (24/7)",
    "card4Text": "Get instant support and reassurance answering your questions based on trusted health information, available anytime you need it.",
    "card4Btn": "Chat Now",
    "footer": "2026 Journey of Motherhood. All Rights Reserved."
  },
  "whyy": {
    "title": "Why Choose Us?",
    "intro": "What makes <highlight>Journey of Motherhood</highlight> unique? We combine medical expertise, empathetic community support, and cutting-edge AI technology to ensure no mother feels alone on her journey.",
    "f1Title": "Holistic Approach",
    "f1Text": "Unlike traditional platforms that focus solely on the child, we prioritize the mother's physical and mental recovery equally. We believe a healthy, happy mother is the foundation of a thriving child.",
    "f2Title": "Verified Experts",
    "f2Text": "All our content is medically reviewed, and our network consists of healthcare professionals, including gynecologists, pediatricians, and mental health specialists. With us, you get scientific answers you can fully trust.",
    "f3Title": "AI Technology",
    "f3Text": "We integrated a 24/7 smart assistant (Chatbot) to provide immediate, reliable reassurance for those late-night questions. It is safe, fast, and specifically designed to accompany you in maternal and infant care.",
    "f4Title": "Empathetic Design",
    "f4Text": "This platform was designed as a graduation project by a dedicated team, built on genuine empathy. We understand the challenges of the first year of motherhood, and we designed every feature to be accessible, calming, and supportive.",
    "footer": "2026 Journey of Motherhood. All Rights Reserved."
  },



    },
  },

  ar: {
    translation: {
      nav: {
        home: "الرئيسية",
        about: "من نحن",
        services: "الخدمات",
        why: "لماذا نحن",
        login: "تسجيل الدخول",
        menu: "القائمة",
        "register": "إنشاء حساب",
        "doctors": "الأطباء"
      },

auth: {
  registerTitle: "ابدئي رحلة الأمومة معنا ✨",
  registerSubtitle: "خطوات بسيطة تفصلكِ عن مجتمع الدعم المتكامل المخصص لكِ ولطفلكِ.",
  motherName: "الاسم الكامل للأم",
  email: "البريد الإلكتروني",
  babyName: "اسم الطفل",
  babyAge: "عمر الطفل الحالي",
  selectAge: "يرجى اختيار الفئة العمرية",
  password: "كلمة المرور",
  registerBtn: "تسجيل الدخول وبدء الرحلة",
  haveAccount: "لديكِ حساب مسبق؟",
  login: "تسجيل الدخول",

  loginTitle: "مرحباً بكِ مجدداً 🌸",
  loginSubtitle: "يسعدنا عودتكِ لمتابعة رحلة طفلكِ الجميلة معنا.",
  forgotPassword: "نسيتِ كلمة المرور؟",
  noAccount: "ليس لديكِ حساب؟",

"placeholderMotherName": "مثال: سارة أحمد",
"instructionMotherName": "يرجى إدخال اسمكِ الثلاثي لاعتماد الحساب بشكل رسمي.",
"placeholderEmail": "example@mail.com",
"instructionEmail": "سنستخدم البريد لإرسال تحديثات هامة حول رحلة طفلكِ.",
"placeholderBabyName": "اسم طفلكِ الجميل",
"instructionBabyName": "يساعدنا ذلك في تخصيص أدوات تتبع النمو باسم الطفل.",
"instructionBabyAge": "تحديد العمر يتيح لنا تقديم نصائح طبية ملائمة لمرحلته الحالية.",
"placeholderPassword": "أدخلي كلمة مرور قوية",
"instructionPassword": "يجب أن تتكون من 8 خانات على الأقل، ويفضل دمج الحروف والأرقام.",



},





      hero: {
        title: "أنتِ لستِ وحدك في هذه الرحلة.. نحن معك خطوة بخطوة.",
        subtitle: "منصة متكاملة وذكية ترافقكِ نفسياً، جسدياً، ومعرفياً خلال العام الأول من الأمومة.",
        start: "ابدئي رحلتك",
        doctor: "دخول الأطباء",
        watch: "مشاهدة الفيديو",
        "visitors":"زائر",
        "mothers": "أم تثق بنا"
      },
      why: {
        title: "لماذا نحن هنا؟",
        left: "لتحديات في اكتئاب ما بعد الولادة، قلة النوم، التغذية، والمحاولات للبحث عن الدعم والتوجيه الصحيح.",
        right: "حلول للدعم المعتمد، استشارات المختصين، وذكاء اصطناعي يرافقك للتخفيف من قلق الأمومة.",
      },
      services: {
        title: "الخدمات الأساسية",
        nutrition: "التغذية السليمة",
        baby: "نمو الطفل",
        experts: "خبراء",
        recovery: "التعافي",
      },
ai: {
  title: "المساعد الذكي",
  user: "طفلي يبكي منذ ساعة ولا ينام",
  ai: "حاولي التحقق من الجوع، الحرارة، والراحة. أنتِ تقومين بعمل رائع 💛",
  typing: "يكتب..."
},
trust: {
  text: "معتمد ومراجع من أطباء ومتخصصين"
},
footer: {
  contact: "تواصل معنا",
  copyright: "© 2026 رحلة الأمومة. جميع الحقوق محفوظة.",
  slogan: "أمومة متطورة: نغذي المستقبل."
},
doctor: {
  registerTitle: "انضمام الكادر الطبي 🩺",
  registerSubtitle: "ساهم في دعم الأمهات برعاية مهنية.",
  fullName: "الاسم الكامل",
  specialty: "التخصص الطبي",
  email: "البريد الإلكتروني المهني",
  license: "رقم الترخيص",

"placeholderFullName": "مثال: د. ليلى أحمد",
"instructionFullName": "يرجى إدخال اسمكِ الثلاثي كما هو مسجل في السجلات الرسمية.",
"instructionSpecialty": "سيظهر هذا التخصص للأمهات لسهولة الوصول للاستشارات المناسبة.",
"placeholderEmail": "doctor@clinic.com",
"instructionEmail": "سنستخدم هذا البريد لتوثيق الحساب وإرسال الإشعارات الرسمية.",
"placeholderLicense": "أدخل الرقم النقابي",
"instructionLicense": "هذه المعلومة ستبقى سرية تماماً وتستخدم لغايات التحقق فقط.",
"placeholderPassword": "أدخل كلمة مرور قوية",
"instructionPassword": "يجب أن تتكون من 8 خانات على الأقل، تشمل حروفاً وأرقاماً.",
 loginTitle: "أهلاً بك يا دكتور 🩺",
  loginSubtitle: "يرجى إدخال بياناتك للوصول إلى لوحة المتابعة.",
  loginBtn: "دخول النظام",
  badge: "بوابة الكادر الطبي",
  noAccount: "ليس لديك حساب مهني؟",
  applyNow: "تقديم طلب انضمام الآن",


},
vendor: {
  registerTitle: "انضم كمتجر 🛍️",
  registerSubtitle: "أنشئ متجرك وابدأ بالوصول لآلاف الأمهات.",
  storeName: "اسم المتجر",
  placeholderStoreName: "مثال: متجر بيبي بليس",
  instructionStoreName: "هذا هو الاسم الذي سيظهر للعملاء في المنصة.",
  placeholderEmail: "store@example.com",
  instructionEmail: "يستخدم لإدارة حسابك وتلقي إشعارات الطلبات.",
  placeholderPassword: "أدخل كلمة مرور قوية",
  instructionPassword: "يجب أن تتكون من 8 خانات على الأقل، تشمل حروفاً وأرقاماً.",
   loginTitle: "أهلاً بك في متجرك 🛍️",
  loginSubtitle: "سجّل دخولك لإدارة متجرك ومتابعة طلباتك.",
  loginBtn: "دخول المتجر",
  badge: "بوابة المتاجر",
  noAccount: "ليس لديك حساب متجر؟",
  applyNow: "سجّل متجرك الآن",
},
whyPage: {
  title: "لماذا نحن؟",
  intro: "ما الذي يميز منصة <0>Journey of Motherhood</0>؟ نحن نجمع بين الخبرة الطبية، الدعم المجتمعي المتعاطف، والذكاء الاصطناعي المتقدم لضمان ألا تشعر أي أم بالوحدة خلال رحلتها.",
  feature1: {
    title: "نهج شامل",
    desc: "على عكس المنصات التقليدية التي تركز فقط على الطفل، نحن نعطي الأولوية لتعافي الأم النفسي والجسدي بنفس القدر. نؤمن بأن الأم التي تتمتع بصحة جيدة وراحة نفسية هي الأساس لطفل سعيد ومزدهر."
  },
  feature2: {
    title: "خبراء معتمدون",
    desc: "جميع محتوياتنا مراجعة طبياً، وتتكون شبكتنا من متخصصين في الرعاية الصحية، بما في ذلك أطباء النساء، أطباء الأطفال، وأخصائيو الصحة النفسية. معنا، ستحصلين على إجابات علمية يمكنكِ الوثوق بها تماماً."
  },
  feature3: {
    title: "تقنية الذكاء الاصطناعي",
    desc: "قمنا بدمج مساعد ذكي (Chatbot) يعمل على مدار الساعة لتقديم طمأنينة فورية وموثوقة لتلك الأسئلة المتأخرة ليلاً. إنه آمن، سريع، ومصمم خصيصاً ليرافقكِ في رعاية الأم والرضيع."
  },
  feature4: {
    title: "تصميم متعاطف",
    desc: "صُممت هذه المنصة كمشروع تخرج من قبل فريق متفانٍ، وبنيت على تعاطف حقيقي. نحن نتفهم تحديات العام الأول من الأمومة، وصممنا كل ميزة لتكون سهلة الوصول، مهدئة، وداعمة لكِ في كل خطوة."
  }
}
,

"about": {
    "title": "من نحن",
    "intro": "مرحباً بكِ في منصة <highlight>Journey of Motherhood</highlight>. نحن منصة داعمة وموثوقة صُممت خصيصاً لمرافقة الأمهات الجدد خلال عامهن الأول بعد الولادة. نهدف إلى مساعدة الأمهات في التعامل مع الجوانب النفسية، العاطفية، والتعليمية للأمومة بأمان وثقة.",
    "missionTitle": "مهمتنا",
    "missionText": "تزويد الأمهات بالمعرفة الطبية الموثوقة، الدعم العاطفي المستمر، وسهولة الوصول إلى أفضل المتخصصين في الرعاية الصحية طوال رحلة الأمومة. نحن نركز على التعافي الجسدي، الصحة النفسية، وتطور الطفل.",
    "visionTitle": "رؤيتنا",
    "visionText": "تمكين كل أم وخلق بيئة صحية، داعمة، ومثقفة يزدهر فيها كل من الأم والطفل معاً، مع التركيز على رفع مستوى الوعي حول الصحة النفسية بعد الولادة.",
    "offerTitle": "ماذا نقدم؟",
    "acc1Title": "قسم الأم",
    "acc1Text": "يركز على التعافي النفسي والجسدي، ومراقبة العلامات الأولية لاكتئاب ما بعد الولادة. نقدم أدلة حول العناية بالذات وتخطي التغيرات العاطفية.",
    "acc2Title": "قسم الطفل",
    "acc2Text": "معلومات دقيقة لنمو الرضع مقسمة إلى 4 مراحل (0-12 شهراً). تتبعي التطور الحركي، التغذية السليمة، وأنماط النوم بأمان وراحة.",
    "acc3Title": "بدعم من الخبراء",
    "acc3Text": "الوصول إلى مقالات علمية موثوقة كتبها متخصصون في صحة المرأة والطفل والصحة النفسية. تواصلي مباشرة مع نخبة من الأطباء المعتمدين.",
    "acc4Title": "المساعد الذكي",
    "acc4Text": "احصلي على دعم فوري وطمأنينة بإجابات علمية موثوقة لأسئلتك واستفساراتك، متاح في أي وقت تحتاجينه على مدار الساعة.",
    "supervisor": "المشرف",
    "supervisorName": "الدكتور محمد حمارشة",
    "preparedBy": "إعداد",
    "team": "إسراء الخطيب، روعة موسى، ملاك أبو هنتش.",
    "footer": "2026 Journey of Motherhood. جميع الحقوق محفوظة."
  },
  "servicess": {
    "title": "الخدمات التي نقدمها",
    "intro": "في منصة <highlight>Journey of Motherhood</highlight>، نمكّن الأمهات من خلال الدعم المتخصص، إرشادات الخبراء، والتقنيات الذكية.",
    "card1Title": "التعافي النفسي والجسدي",
    "card1Text": "يركز على التعافي النفسي والجسدي، ومراقبة العلامات الأولية لاكتئاب ما بعد الولادة. نقدم لكِ أدلة حول العناية بالذات وتخطي التغيرات العاطفية.",
    "card1Btn": "استكشاف القسم",
    "card2Title": "متابعة نمو الطفل",
    "card2Text": "معلومات دقيقة لنمو الرضع مقسمة إلى 4 مراحل (0-12 شهراً). تتبعي التطور الحركي، التغذية السليمة، وأنماط النوم بأمان وراحة.",
    "card2Btn": "استكشاف القسم",
    "card3Title": "استشارات الخبراء",
    "card3Text": "الوصول إلى مقالات علمية موثوقة كتبها متخصصون في صحة المرأة والطفل والصحة النفسية. تواصلي مباشرة مع نخبة من الأطباء المعتمدين.",
    "card3Btn": "ابحثي عن طبيب",
    "card4Title": "المساعد الذكي (24/7)",
    "card4Text": "احصلي على دعم فوري وطمأنينة بإجابات علمية موثوقة لأسئلتك واستفساراتك، متاح في أي وقت تحتاجينه على مدار الساعة.",
    "card4Btn": "تحدثي الآن",
    "footer": "2026 Journey of Motherhood. جميع الحقوق محفوظة."
  },
  "whyy": {
    "title": "لماذا نحن؟",
    "intro": "ما الذي يميز منصة <highlight>Journey of Motherhood</highlight>؟ نحن نجمع بين الخبرة الطبية، الدعم المجتمعي المتعاطف، والذكاء الاصطناعي المتقدم لضمان ألا تشعر أي أم بالوحدة خلال رحلتها.",
    "f1Title": "نهج شامل",
    "f1Text": "على عكس المنصات التقليدية التي تركز فقط على الطفل، نحن نعطي الأولوية لتعافي الأم النفسي والجسدي بنفس القدر. نؤمن بأن الأم التي تتمتع بصحة جيدة وراحة نفسية هي الأساس لطفل سعيد ومزدهر.",
    "f2Title": "خبراء معتمدون",
    "f2Text": "جميع محتوياتنا مراجعة طبياً، وتتكون شبكتنا من متخصصين في الرعاية الصحية، بما في ذلك أطباء النساء، أطباء الأطفال، وأخصائيو الصحة النفسية. معنا، ستحصلين على إجابات علمية يمكنكِ الوثوق بها تماماً.",
    "f3Title": "تقنية الذكاء الاصطناعي",
    "f3Text": "قمنا بدمج مساعد ذكي (Chatbot) يعمل على مدار الساعة لتقديم طمأنينة فورية وموثوقة لتلك الأسئلة المتأخرة ليلاً. إنه آمن، سريع، ومصمم خصيصاً ليرافقكِ في رعاية الأم والرضيع.",
    "f4Title": "تصميم متعاطف",
    "f4Text": "صُممت هذه المنصة كمشروع تخرج من قبل فريق متفانٍ، وبنيت على تعاطف حقيقي. نحن نتفهم تحديات العام الأول من الأمومة، وصممنا كل ميزة لتكون سهلة الوصول، مهدئة، وداعمة لكِ في كل خطوة.",
    "footer": "2026 Journey of Motherhood. جميع الحقوق محفوظة."
  },












    },
  },
};



i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;