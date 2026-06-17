// ═══════════════════════════════════════════════════════════════
// FILE: src/pages/mother/milestones/MilestonesPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../../../services/supabaseClient";
import { useMotherData } from "../../../core/hooks/useMotherData";

// ─── MILESTONE FULL DATA (EN + AR) ──────────────────────────────
const MILESTONE_DATA_EN = {
  1: {
    title: "Month 1", emoji: "🌱", color: "#f9a8d4",
    developments: ["Focuses on faces 20–30 cm away","Responds to loud sounds by startle reflex","Makes small cooing or gurgling sounds","Sleeps 14–17 hours a day"],
    warnings: ["Not responding to loud sounds at all","Eyes don't track moving objects","Difficulty feeding or sucking","Unusual stiffness or limpness in body"],
    nutrition: { title: "Nutrition", content: "Exclusive breastfeeding or formula. Feed every 2–3 hours (8–12 times/day). Each feeding ~10–20 min per breast. Formula: 45–90 ml per feeding." },
    sleep: { title: "Sleep", content: "14–17 hours total. Newborns sleep in short stretches (2–3 hrs). No day/night pattern yet. Place baby on back in safe crib." },
    activities: ["Skin-to-skin contact (kangaroo care)","Talk and sing softly to your baby","Gentle tummy time for 1–2 min when awake","Follow objects with a finger slowly"],
    exercises: ["Tummy time: 1–2 min, 2–3 times/day on a firm surface","Gentle leg cycling while changing diaper","Soft hand massage with warm lotion"],
  },
  2: {
    title: "Month 2", emoji: "🌸", color: "#f0abfc",
    developments: ["Social smiling — smiles in response to your face","Starts making 'ooh' and 'aah' sounds (cooing)","Can lift head briefly during tummy time","Eyes follow moving objects"],
    warnings: ["No social smiling by 2 months","Doesn't respond to your voice","Can't hold head up at all during tummy time","Doesn't follow moving objects with eyes"],
    nutrition: { title: "Nutrition", content: "Still exclusive breast milk or formula. Appetite increases — some babies go through growth spurts around 6 weeks. Formula: 90–120 ml per feeding." },
    sleep: { title: "Sleep", content: "14–16 hours/day. Starting to distinguish day from night. Naps 3–4 times a day. Nighttime stretches begin to get slightly longer." },
    activities: ["High-contrast black & white pictures to look at","Gentle rocking and singing","Copy baby's sounds back to them","Short supervised tummy time"],
    exercises: ["Tummy time: build up to 3–5 min sessions","Gentle stretching of arms overhead","Bicycle legs during diaper changes"],
  },
  3: {
    title: "Month 3", emoji: "🌼", color: "#fde68a",
    developments: ["Clear social smiling and laughing","Lifts head and chest during tummy time","Tracks objects 180° with eyes","Recognizes familiar faces and voices"],
    warnings: ["Doesn't smile at familiar faces","Doesn't react to bright lights","Unable to support head","No interest in faces or surroundings"],
    nutrition: { title: "Nutrition", content: "Exclusive breast milk or formula continues. Baby may feed less frequently but take larger amounts. Formula: 120–150 ml per feeding, 6–8 times/day." },
    sleep: { title: "Sleep", content: "14–15 hours/day. Longer night stretches (4–5 hours possible). 3 naps per day typical. Begin gentle sleep routine." },
    activities: ["Play mat with hanging toys","Mirror play — show baby their reflection","Read colorful board books","Sing nursery rhymes with facial expressions"],
    exercises: ["Tummy time: aim for 20–30 min total spread through day","Assisted sitting with support to build neck muscles","Gentle pull-to-sit: hold hands and slowly pull up"],
  },
  4: {
    title: "Month 4", emoji: "🎈", color: "#86efac",
    developments: ["Laughs out loud","Grasps and holds objects","Rolls from tummy to side","Babbles with expression"],
    warnings: ["Doesn't grasp objects placed in hand","No babbling sounds","Doesn't push down with legs when feet on hard surface","Vision doesn't seem to follow objects"],
    nutrition: { title: "Nutrition", content: "Still breast milk or formula only. Solids NOT recommended before 6 months. Formula: 120–180 ml per feeding. Growth spurt may increase hunger." },
    sleep: { title: "Sleep", content: "14–15 hours/day. 4-month sleep regression is common — more night wakings. Keep consistent bedtime routine. 2–3 naps per day." },
    activities: ["Rattles and soft toys to grasp","Blowing raspberries back and forth","Supervised floor time to roll","Singing with clapping hands"],
    exercises: ["Supported sitting practice (short bursts)","Rolling practice: gently guide from back to side","Reaching: hold toy slightly out of reach to encourage reaching"],
  },
  5: {
    title: "Month 5", emoji: "⭐", color: "#67e8f9",
    developments: ["Rolls from tummy to back","Recognizes mother's voice clearly","Sits with full support","Puts objects in mouth to explore"],
    warnings: ["Doesn't roll at all by 5 months","Doesn't reach for objects","Seems very limp or very stiff","Doesn't seem to recognize familiar people"],
    nutrition: { title: "Nutrition", content: "Breast milk or formula remains primary. Signs of readiness for solids may appear but introduce AFTER 6 months. Formula: 150–180 ml, 5–6 times/day." },
    sleep: { title: "Sleep", content: "12–15 hours/day. 2–3 naps. Some babies sleep 6–8 hours at night. Create consistent bedtime environment (dim lights, quiet)." },
    activities: ["Textured toys for mouthing and exploring","Peek-a-boo games","Bouncer or jumper seat supervised play","Copy sounds: ba-ba, ma-ma"],
    exercises: ["Assisted standing (briefly with full support)","Rolling practice both directions","Reaching across midline with toys"],
  },
  6: {
    title: "Month 6", emoji: "🍎", color: "#fca5a5",
    developments: ["Sits with minimal support","First solid foods introduced","Babbles consonant sounds (ba, da, ga)","Starts to understand object permanence"],
    warnings: ["Can't sit even with support","Doesn't seem interested in food","No babbling sounds whatsoever","Doesn't reach for objects"],
    nutrition: { title: "Nutrition", content: "Introduce single-ingredient purées: sweet potato, squash, peas, apple, pear. Start with 1–2 tsp, increase gradually. Continue breast milk/formula as main source." },
    sleep: { title: "Sleep", content: "11–14 hours. Usually 2 naps (morning + afternoon). Night sleep: 6–8 hours becoming common. Establish consistent bedtime around 7–8 PM." },
    activities: ["Highchair play and introduction to textures","Mirror exploration","Soft blocks for banging","Read books with simple pictures and names"],
    exercises: ["Supported sitting: encourage balance with hands","Supported standing: hold under arms for 30-second bursts","Rolling: both directions independently"],
  },
  7: {
    title: "Month 7", emoji: "🦋", color: "#a78bfa",
    developments: ["Sits without support for short periods","Passes objects from hand to hand","Responds to own name","Shows stranger anxiety"],
    warnings: ["Doesn't sit even with support","Not transferring objects hand to hand","Doesn't respond to name","Doesn't show interest in games like peek-a-boo"],
    nutrition: { title: "Nutrition", content: "2 solid meals/day. Expand textures: mashed, lumpy. Try: banana, avocado, cooked carrot, lentils. Introduce one new food every 3–4 days. Continue breast milk/formula." },
    sleep: { title: "Sleep", content: "12–14 hours. 2 naps. Bedtime routine is essential: bath, book, bed. May have night wakings — avoid creating sleep associations with feeding if possible." },
    activities: ["Banging objects on surfaces (sound exploration)","Cause-and-effect toys","Name body parts during play","Water play during bath"],
    exercises: ["Sitting: practice without support on soft surface","Pulling to sitting from lying down","Supported standing: weight bearing on legs"],
  },
  8: {
    title: "Month 8", emoji: "🐛", color: "#6ee7b7",
    developments: ["Crawling or army crawling begins","Object permanence clearly present","Imitates sounds and gestures","Picks up small objects with fingers"],
    warnings: ["Not bearing weight on legs when held standing","Not showing interest in crawling or movement","Doesn't search for partially hidden objects","Loses previously acquired skills"],
    nutrition: { title: "Nutrition", content: "3 solid meals/day. Introduce finger foods (soft): well-cooked pasta, soft fruit pieces. No honey, whole nuts, or cow's milk as main drink. Continue breast milk/formula." },
    sleep: { title: "Sleep", content: "12–14 hours. Transition to 2 naps solidifying. 8-month sleep regression possible. Stay consistent with routine." },
    activities: ["Crawling obstacle courses with pillows","Drop-in-container games (object permanence)","Clapping hands games","Pull-apart toys"],
    exercises: ["Crawling encouragement: place toys just out of reach","Standing supported: hold at hips only","Climbing: supervised low steps/platforms"],
  },
  9: {
    title: "Month 9", emoji: "🌟", color: "#fbbf24",
    developments: ["Pulls to standing using furniture","Waves bye-bye","Says 'mama/dada' without specific meaning","Pincer grasp developing"],
    warnings: ["Can't sit independently","No babbling at all","Doesn't reach for objects","Doesn't recognize familiar faces"],
    nutrition: { title: "Nutrition", content: "3 meals + 1–2 snacks. Soft finger foods: banana pieces, cooked peas, scrambled egg. Water in sippy cup with meals. Breast milk/formula 3–4 times/day." },
    sleep: { title: "Sleep", content: "11–14 hours. 2 naps (morning + afternoon). Many babies sleep through the night now. Consistent bedtime 7–8 PM is ideal." },
    activities: ["Pulling up on furniture practice","Waving, clapping, pointing games","Simple shape sorters","Look at books and name pictures"],
    exercises: ["Cruising: support along furniture to walk sideways","Climbing: supervised low-step practice","Standing balance: brief unsupported moments"],
  },
  10: {
    title: "Month 10", emoji: "🚀", color: "#60a5fa",
    developments: ["Cruises along furniture","Points at objects of interest","Understands the word 'no'","Claps hands and imitates actions"],
    warnings: ["Not pulling to stand","No pointing gesture","Not imitating any gestures","Loss of skills previously acquired"],
    nutrition: { title: "Nutrition", content: "3 meals + 2 snacks. Variety of textures and flavors. Soft table foods. Avoid added salt/sugar. Iron-rich foods important (meat, lentils, fortified cereals)." },
    sleep: { title: "Sleep", content: "11–14 hours. Often 2 naps beginning to consolidate. Night sleep usually 10–11 hours. Keep consistent bedtime." },
    activities: ["Stacking cups and blocks","Simple matching games","Dancing to music","Outdoor exploration in pram or arms"],
    exercises: ["Cruising: encourage along sofa/table","Squatting to pick up toys (strengthens legs)","Walking with push-toy support"],
  },
  11: {
    title: "Month 11", emoji: "🎯", color: "#f97316",
    developments: ["Stands momentarily without support","Says 1–2 words with meaning","Uses cup with help","Shows preferences for people and toys"],
    warnings: ["No words at all (not even mama/dada with meaning)","Doesn't point to things","Can't stand even with support","Doesn't play simple games"],
    nutrition: { title: "Nutrition", content: "3 meals + 2 snacks. Mostly table foods with varied textures. Introduce cup for water/diluted juice. Iron and calcium intake important." },
    sleep: { title: "Sleep", content: "11–14 hours. May transition to 1 nap (some still do 2). 11-month sleep regression possible. Maintain consistent routine." },
    activities: ["Shape sorters and simple puzzles","Pretend play (phone, spoon, cup)","Picture books: name and point","Outdoor play: grass, sandbox"],
    exercises: ["Standing without support: encourage by holding toys","First steps: hold 2 hands, then 1 hand","Climbing steps supervised"],
  },
  12: {
    title: "Month 12", emoji: "🎂", color: "#ec4899",
    developments: ["Walks with one hand held (some walk independently)","Uses 2+ words with meaning","Imitates activities (stirring, brushing)","Object permanence fully developed"],
    warnings: ["Not standing or trying to walk","No words at all","Not pointing or waving","Not imitating simple actions"],
    nutrition: { title: "Nutrition", content: "3 meals + 2 snacks. Transition away from bottle if using. Introduce whole cow's milk (up to 500 ml/day). Family foods with soft texture. No honey until after 12 months." },
    sleep: { title: "Sleep", content: "11–14 hours. Most babies: 1–2 naps. Night sleep 10–12 hours. Consistent bedtime routine essential for toddler transition." },
    activities: ["Push and pull toys for walking","Simple puzzles (2–3 pieces)","Water and sand play","Music and dancing"],
    exercises: ["First independent walking: encourage across short distances","Climbing: supervised furniture/low structures","Ball play: rolling back and forth"],
  },
};

const MILESTONE_DATA_AR = {
  1: {
    title: "الشهر الأول", emoji: "🌱", color: "#f9a8d4",
    developments: ["يركز نظره على الوجوه على بُعد 20-30 سم","يستجيب للأصوات العالية بانعكاس الفزع","يصدر أصوات همهمة وأصوات صغيرة","ينام 14-17 ساعة في اليوم"],
    warnings: ["عدم الاستجابة للأصوات العالية نهائياً","العيون لا تتبع الأشياء المتحركة","صعوبة في الرضاعة أو المص","تصلب أو ارتخاء غير طبيعي في الجسم"],
    nutrition: { title: "التغذية", content: "الرضاعة الطبيعية الحصرية أو الحليب الصناعي. أرضعي كل 2-3 ساعات (8-12 مرة/يوم). كل رضعة 10-20 دقيقة لكل ثدي. الحليب الصناعي: 45-90 مل في الرضعة." },
    sleep: { title: "النوم", content: "14-17 ساعة يومياً. ينام الأطفال الجدد في فترات قصيرة 2-3 ساعات. لا يوجد نمط ليل/نهار بعد. ضعي الطفل على ظهره في سريره الآمن." },
    activities: ["التلامس جلد لجلد (رعاية الكنغر)","تحدثي وغنّي بصوت هادئ لطفلكِ","وقت الاستلقاء على البطن لمدة 1-2 دقيقة أثناء الاستيقاظ","تابعي الأشياء بإصبعك ببطء"],
    exercises: ["وقت البطن: 1-2 دقيقة، 2-3 مرات/يوم على سطح صلب","تدوير الأرجل برفق أثناء تغيير الحفاضة","تدليك اليدين بلطف بلوشن دافئ"],
  },
  2: {
    title: "الشهر الثاني", emoji: "🌸", color: "#f0abfc",
    developments: ["الابتسامة الاجتماعية - يبتسم استجابةً لوجهكِ","يبدأ في إصدار أصوات 'أوه' و'آه'","يستطيع رفع رأسه قليلاً أثناء الاستلقاء على البطن","العيون تتبع الأشياء المتحركة"],
    warnings: ["لا توجد ابتسامة اجتماعية بحلول شهرين","لا يستجيب لصوتكِ","لا يستطيع رفع رأسه أبداً","لا تتبع العينان الأشياء المتحركة"],
    nutrition: { title: "التغذية", content: "لا يزال حليب الثدي أو الحليب الصناعي حصرياً. الشهية تزداد - قد يمر بعض الأطفال بطفرات نمو حوالي 6 أسابيع. الحليب الصناعي: 90-120 مل في الرضعة." },
    sleep: { title: "النوم", content: "14-16 ساعة/يوم. يبدأ بالتمييز بين الليل والنهار. قيلولة 3-4 مرات يومياً. تبدأ فترات الليل تصبح أطول قليلاً." },
    activities: ["صور عالية التباين بالأبيض والأسود للنظر إليها","الهز الخفيف والغناء","اعكسي أصوات الطفل له","وقت البطن المراقب قصير المدة"],
    exercises: ["وقت البطن: زيادة تدريجية حتى 3-5 دقائق","تمديد الذراعين برفق فوق الرأس","أرجل الدراجة أثناء تغيير الحفاضة"],
  },
  3: {
    title: "الشهر الثالث", emoji: "🌼", color: "#fde68a",
    developments: ["ابتسامة اجتماعية وضحك واضحان","يرفع الرأس والصدر أثناء الاستلقاء على البطن","يتبع الأشياء بالعينين 180 درجة","يتعرف على الوجوه والأصوات المألوفة"],
    warnings: ["لا يبتسم للوجوه المألوفة","لا يتفاعل مع الأضواء الساطعة","غير قادر على دعم رأسه","لا يهتم بالوجوه أو المحيط"],
    nutrition: { title: "التغذية", content: "يستمر حليب الثدي أو الصناعي. قد يرضع الطفل بتكرار أقل لكن بكميات أكبر. الحليب الصناعي: 120-150 مل في الرضعة، 6-8 مرات/يوم." },
    sleep: { title: "النوم", content: "14-15 ساعة/يوم. فترات ليلية أطول (ممكن 4-5 ساعات). 3 قيلولات يومياً نموذجياً. ابدئي روتين نوم خفيف." },
    activities: ["حصيرة اللعب مع الألعاب المعلقة","لعب المرآة - اعرضي على الطفل انعكاسه","اقرئي كتباً ملونة ذات صفحات صلبة","غنّي أغاني الأطفال مع تعابير وجه"],
    exercises: ["وقت البطن: اهدفي لـ 20-30 دقيقة إجمالاً موزعة على اليوم","الجلوس المساعد بدعم لتقوية عضلات الرقبة","الشد للجلوس: امسكي اليدين واسحبي ببطء للأعلى"],
  },
  4: {
    title: "الشهر الرابع", emoji: "🎈", color: "#86efac",
    developments: ["يضحك بصوت عالٍ","يمسك الأشياء ويحتفظ بها","يتدحرج من البطن إلى الجانب","يثرثر بتعبير"],
    warnings: ["لا يمسك الأشياء الموضوعة في يده","لا توجد أصوات ثرثرة","لا يضغط بالأرجل عند وضعها على سطح صلب","الرؤية لا تتبع الأشياء"],
    nutrition: { title: "التغذية", content: "لا يزال حليب الثدي أو الصناعي فقط. الأطعمة الصلبة غير موصى بها قبل 6 أشهر. الحليب الصناعي: 120-180 مل في الرضعة. طفرة النمو قد تزيد الجوع." },
    sleep: { title: "النوم", content: "14-15 ساعة/يوم. الانحدار النومي في الشهر الرابع شائع - استيقاظات ليلية أكثر. حافظي على روتين وقت النوم. 2-3 قيلولات يومياً." },
    activities: ["الخشخيشات والألعاب الناعمة للإمساك","صنع الأصوات بالشفتين والرد","وقت الأرضية المراقب للتدحرج","الغناء مع التصفيق"],
    exercises: ["ممارسة الجلوس المدعوم (فترات قصيرة)","ممارسة التدحرج: توجيه برفق من الظهر إلى الجانب","الإمساك: امسكي الألعاب قريبة لتشجيع الوصول"],
  },
  5: {
    title: "الشهر الخامس", emoji: "⭐", color: "#67e8f9",
    developments: ["يتدحرج من البطن إلى الظهر","يتعرف على صوت الأم بوضوح","يجلس بدعم كامل","يضع الأشياء في فمه للاستكشاف"],
    warnings: ["لا يتدحرج أبداً بحلول 5 أشهر","لا يمد يده للأشياء","يبدو مرتخياً جداً أو متصلباً جداً","لا يبدو أنه يتعرف على الأشخاص المألوفين"],
    nutrition: { title: "التغذية", content: "حليب الثدي أو الصناعي يبقى أساسياً. قد تظهر علامات الاستعداد للطعام الصلب لكن أدخليه بعد 6 أشهر. الحليب الصناعي: 150-180 مل، 5-6 مرات/يوم." },
    sleep: { title: "النوم", content: "12-15 ساعة/يوم. 2-3 قيلولات. بعض الأطفال ينامون 6-8 ساعات ليلاً. أنشئي بيئة وقت نوم ثابتة (إضاءة خافتة وهادئة)." },
    activities: ["ألعاب ذات نسيج للفحص بالفم","ألعاب الاختباء ورا يدي","كرسي هزاز أو مقعد قافز مراقَب","تقليد الأصوات: با-با، ما-ما"],
    exercises: ["الوقوف المساعد (لفترة وجيزة مع دعم كامل)","ممارسة التدحرج في الاتجاهين","الوصول عبر خط المنتصف بالألعاب"],
  },
  6: {
    title: "الشهر السادس", emoji: "🍎", color: "#fca5a5",
    developments: ["يجلس بدعم بسيط","إدخال الأطعمة الصلبة الأولى","يثرثر بأصوات الحروف الساكنة (با، دا، غا)","يبدأ في فهم ثبات الأشياء"],
    warnings: ["لا يستطيع الجلوس حتى مع الدعم","لا يبدو مهتماً بالطعام","لا توجد أصوات ثرثرة على الإطلاق","لا يمد يده للأشياء"],
    nutrition: { title: "التغذية", content: "قدمي هرساً بمكون واحد: بطاطا حلوة، قرع، بازلاء، تفاح، كمثرى. ابدئي بـ 1-2 ملعقة صغيرة، زيدي تدريجياً. استمري في حليب الثدي/الصناعي كمصدر رئيسي." },
    sleep: { title: "النوم", content: "11-14 ساعة. عادةً قيلولتان (صباح + بعد الظهر). نوم الليل: 6-8 ساعات يصبح شائعاً. حددي وقت نوم ثابتاً حوالي 7-8 مساءً." },
    activities: ["اللعب في الكرسي العالي والتعرف على الملمس","استكشاف المرآة","مكعبات ناعمة للدق","اقرئي كتباً بصور بسيطة وأسماء"],
    exercises: ["ممارسة الجلوس المدعوم: شجعي التوازن بالأيدي","الوقوف المدعوم: امسكي من تحت الذراعين لـ 30 ثانية","التدحرج: في كلا الاتجاهين بشكل مستقل"],
  },
  7: {
    title: "الشهر السابع", emoji: "🦋", color: "#a78bfa",
    developments: ["يجلس بدون دعم لفترات قصيرة","ينقل الأشياء من يد لأخرى","يستجيب لاسمه الخاص","يُظهر قلق الغرباء"],
    warnings: ["لا يجلس حتى مع الدعم","لا ينقل الأشياء بين اليدين","لا يستجيب للاسم","لا يهتم بألعاب مثل الاختباء"],
    nutrition: { title: "التغذية", content: "وجبتان صلبتان يومياً. وسّعي الملمس: مهروس، متكتل. جربي: موز، أفوكادو، جزر مطبوخ، عدس. قدمي طعاماً جديداً كل 3-4 أيام. استمري بحليب الثدي/الصناعي." },
    sleep: { title: "النوم", content: "12-14 ساعة. قيلولتان. روتين وقت النوم أساسي: حمام، كتاب، نوم. قد تكون هناك استيقاظات ليلية - تجنبي إنشاء ارتباطات نوم بالرضاعة إن أمكن." },
    activities: ["دق الأشياء على الأسطح (استكشاف الصوت)","ألعاب السبب والنتيجة","تسمية أجزاء الجسم أثناء اللعب","اللعب بالماء أثناء الاستحمام"],
    exercises: ["الجلوس: تدرب بدون دعم على سطح ناعم","الشد للجلوس من وضعية الاستلقاء","الوقوف المدعوم: تحمل الوزن على الأرجل"],
  },
  8: {
    title: "الشهر الثامن", emoji: "🐛", color: "#6ee7b7",
    developments: ["يبدأ الزحف أو الزحف العسكري","ثبات الأشياء حاضر بوضوح","يقلد الأصوات والإيماءات","يلتقط الأشياء الصغيرة بالأصابع"],
    warnings: ["لا يتحمل وزنه على الأرجل عند الوقوف","لا يُظهر اهتماماً بالزحف أو الحركة","لا يبحث عن الأشياء المخفية جزئياً","يفقد مهارات اكتسبها مسبقاً"],
    nutrition: { title: "التغذية", content: "3 وجبات صلبة يومياً. قدمي أصابع الطعام (ناعمة): معكرونة مطبوخة جيداً، قطع فاكهة طرية. لا عسل، لا مكسرات كاملة، لا حليب البقر كمشروب رئيسي. استمري بحليب الثدي/الصناعي." },
    sleep: { title: "النوم", content: "12-14 ساعة. انتقال إلى قيلولتين يترسخ. انحدار نومي في الشهر 8 ممكن. حافظي على الروتين الثابت." },
    activities: ["مسارات عقبات زحف بالوسائد","ألعاب الإسقاط في الحاوية","ألعاب التصفيق","ألعاب قابلة للفصل"],
    exercises: ["تشجيع الزحف: ضعي الألعاب خارج متناول اليد","الوقوف المدعوم: امسكي عند الوركين فقط","التسلق: درجات/منصات منخفضة تحت الإشراف"],
  },
  9: {
    title: "الشهر التاسع", emoji: "🌟", color: "#fbbf24",
    developments: ["يشد نفسه للوقوف باستخدام الأثاث","يُلوّح وداعاً","يقول 'ماما/بابا' بدون معنى محدد","الإمساك بالإبهام والسبابة يتطور"],
    warnings: ["لا يستطيع الجلوس بشكل مستقل","لا ثرثرة على الإطلاق","لا يمد يده للأشياء","لا يتعرف على الوجوه المألوفة"],
    nutrition: { title: "التغذية", content: "3 وجبات + 1-2 وجبات خفيفة. أصابع طعام ناعمة: قطع موز، بازلاء مطبوخة، بيض مخفوق. الماء في كوب للرضع مع الوجبات. حليب الثدي/الصناعي 3-4 مرات/يوم." },
    sleep: { title: "النوم", content: "11-14 ساعة. قيلولتان (صباح + بعد الظهر). كثير من الأطفال ينامون الآن طوال الليل. وقت النوم الثابت 7-8 مساءً مثالي." },
    activities: ["ممارسة الشد للوقوف على الأثاث","ألعاب التلويح والتصفيق والإشارة","فارزات أشكال بسيطة","النظر في الكتب وتسمية الصور"],
    exercises: ["التنقل على الأثاث: الدعم على طول الأثاث للمشي جانباً","التسلق: ممارسة درجة منخفضة تحت الإشراف","توازن الوقوف: لحظات قصيرة بدون دعم"],
  },
  10: {
    title: "الشهر العاشر", emoji: "🚀", color: "#60a5fa",
    developments: ["يتنقل على الأثاث","يشير إلى الأشياء التي يهتم بها","يفهم كلمة 'لا'","يصفق ويقلد الأفعال"],
    warnings: ["لا يشد نفسه للوقوف","لا إيماءة إشارة","لا يقلد أي إيماءات","فقدان مهارات اكتسبها مسبقاً"],
    nutrition: { title: "التغذية", content: "3 وجبات + 2 وجبات خفيفة. تنوع في الملمس والنكهات. أطعمة طرية من مائدة العائلة. تجنبي الملح/السكر المضاف. الأطعمة الغنية بالحديد مهمة (لحم، عدس، حبوب مدعمة)." },
    sleep: { title: "النوم", content: "11-14 ساعة. كثيراً ما تبدأ قيلولتان بالتوحد. نوم الليل عادةً 10-11 ساعة. حافظي على وقت نوم ثابت." },
    activities: ["تكديس الأكواب والمكعبات","ألعاب مطابقة بسيطة","الرقص على الموسيقى","استكشاف خارجي في العربة أو الأحضان"],
    exercises: ["التنقل: شجعي على طول الأريكة/الطاولة","القرفصاء لالتقاط الألعاب (يقوي الأرجل)","المشي بدعم ألعاب الدفع"],
  },
  11: {
    title: "الشهر الحادي عشر", emoji: "🎯", color: "#f97316",
    developments: ["يقف لحظياً بدون دعم","يقول 1-2 كلمة بمعنى","يستخدم الكوب بمساعدة","يُظهر تفضيلات للأشخاص والألعاب"],
    warnings: ["لا كلمات على الإطلاق (حتى ماما/بابا بمعنى)","لا يشير إلى الأشياء","لا يستطيع الوقوف حتى مع الدعم","لا يلعب ألعاباً بسيطة"],
    nutrition: { title: "التغذية", content: "3 وجبات + 2 وجبات خفيفة. معظمها أطعمة من المائدة بملمس متنوع. قدمي الكوب للماء/العصير المخفف. تناول الحديد والكالسيوم مهم." },
    sleep: { title: "النوم", content: "11-14 ساعة. قد ينتقل إلى قيلولة واحدة (بعضهم لا يزال يأخذ اثنتين). انحدار نومي في الشهر 11 ممكن. حافظي على روتين ثابت." },
    activities: ["فارزات أشكال وألغاز بسيطة","اللعب التخيلي (هاتف، ملعقة، كوب)","كتب الصور: اذكري الأشياء وأشيري","اللعب الخارجي: عشب، رمل"],
    exercises: ["الوقوف بدون دعم: شجعي بحمل الألعاب","الخطوات الأولى: امسكي يدين ثم يداً واحدة","تسلق الدرجات تحت الإشراف"],
  },
  12: {
    title: "الشهر الثاني عشر", emoji: "🎂", color: "#ec4899",
    developments: ["يمشي بمساعدة يد واحدة (بعضهم يمشي باستقلالية)","يستخدم 2+ كلمة بمعنى","يقلد الأنشطة (التقليب، التمشيط)","ثبات الأشياء متطور تماماً"],
    warnings: ["لا يقف ولا يحاول المشي","لا كلمات على الإطلاق","لا يشير ولا يلوّح","لا يقلد الأفعال البسيطة"],
    nutrition: { title: "التغذية", content: "3 وجبات + 2 وجبات خفيفة. انتقلي بعيداً عن الزجاجة إذا كنت تستخدمينها. قدمي حليب البقر كامل الدسم (حتى 500 مل/يوم). أطعمة العائلة بملمس ناعم. لا عسل حتى بعد 12 شهراً." },
    sleep: { title: "النوم", content: "11-14 ساعة. معظم الأطفال: 1-2 قيلولة. نوم الليل 10-12 ساعة. روتين وقت النوم الثابت أساسي للانتقال لمرحلة الطفل الصغير." },
    activities: ["ألعاب الدفع والسحب للمشي","ألغاز بسيطة (2-3 قطع)","اللعب بالماء والرمل","الموسيقى والرقص"],
    exercises: ["المشي المستقل الأول: شجعي عبر مسافات قصيرة","التسلق: هياكل/أثاث منخفض تحت الإشراف","اللعب بالكرة: التدحرج ذهاباً وإياباً"],
  },
};

// ─── HELPER ──────────────────────────────────────────────────────
function ageInMonths(birthDate) {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const now = new Date();
  return Math.max(1, (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth()));
}


// ═══════════════════════════════════════════════════════════════
// GALLERY OVERLAY
// ═══════════════════════════════════════════════════════════════
const GalleryOverlay = ({ gallery, setGallery, isAr, DATA }) => {
  const { open, photos, index } = gallery;
  const timerRef = useRef(null);

  const goNext = () => setGallery(g => ({ ...g, index: (g.index + 1) % g.photos.length }));
  const goPrev = () => setGallery(g => ({ ...g, index: (g.index - 1 + g.photos.length) % g.photos.length }));

  useEffect(() => {
    if (!open || photos.length <= 1) return;
    timerRef.current = setInterval(goNext, 3500);
    return () => clearInterval(timerRef.current);
  }, [open, photos.length, index]);

  if (!open || photos.length === 0) return null;

  const current = photos[index];
  const monthData = DATA[current.month];

  return (
    <div className="gl-overlay" onClick={() => setGallery(g => ({ ...g, open: false }))}>
      <div className="gl-box" onClick={e => e.stopPropagation()}>
        <div className="gl-header">
          <span>{monthData?.emoji} {monthData?.title}</span>
          <button className="gl-close" onClick={() => setGallery(g => ({ ...g, open: false }))}>✕</button>
        </div>
        <div className="gl-img-wrap">
          {photos.length > 1 && (
            <button className="gl-arrow gl-prev" onClick={(e) => { e.stopPropagation(); clearInterval(timerRef.current); goPrev(); }}>
              <i className="fas fa-chevron-left" />
            </button>
          )}
          <img src={current.url} alt="" className="gl-img" key={current.url} />
          {photos.length > 1 && (
            <button className="gl-arrow gl-next" onClick={(e) => { e.stopPropagation(); clearInterval(timerRef.current); goNext(); }}>
              <i className="fas fa-chevron-right" />
            </button>
          )}
        </div>
        {photos.length > 1 && (
          <div className="gl-dots">
            {photos.map((p, i) => (
              <button
                key={p.month}
                className={`gl-dot ${i === index ? "active" : ""}`}
                onClick={() => { clearInterval(timerRef.current); setGallery(g => ({ ...g, index: i })); }}
                title={DATA[p.month]?.title}
              />
            ))}
          </div>
        )}
        <div className="gl-counter">
          {isAr ? `${index + 1} من ${photos.length}` : `${index + 1} of ${photos.length}`}
        </div>
      </div>
    </div>
  );
};


// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
const MilestonesPage = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { childId } = useParams();
  const isAr = i18n.language === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const { user, children, loading } = useMotherData();

  const [selectedChildId, setSelectedChildId] = useState(null);
  const [activeMonth, setActiveMonth] = useState(1);
  const [photos, setPhotos] = useState({});
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("developments");
  const [uploadingMonth, setUploadingMonth] = useState(null);

const [gallery, setGallery] = useState({ open: false, photos: [], index: 0 });

const openGallery = (clickedMonth) => {
  const allPhotos = Object.entries(childPhotos)
    .filter(([, url]) => url)
    .map(([m, url]) => ({ month: parseInt(m), url }))
    .sort((a, b) => a.month - b.month);
  const idx = allPhotos.findIndex(p => p.month === clickedMonth);
  setGallery({ open: true, photos: allPhotos, index: Math.max(0, idx) });
};
  const DATA = isAr ? MILESTONE_DATA_AR : MILESTONE_DATA_EN;

  useEffect(() => {
    if (children.length > 0) {
      const cid = childId || children[0].child_id;
      setSelectedChildId(cid);
      const months = ageInMonths(children.find(c => c.child_id === cid)?.birth_date);
      setActiveMonth(Math.min(12, Math.max(1, months)));
    }
  }, [children, childId]);

  useEffect(() => {
    if (!selectedChildId) return;
    loadPhotos(selectedChildId);
  }, [selectedChildId]);

  const loadPhotos = async (cid) => {
    const { data } = await supabase
      .from("child_milestone_photos")
      .select("month_number, photo_url")
      .eq("child_id", cid);
    if (data) {
      const map = {};
      data.forEach(r => { map[r.month_number] = r.photo_url; });
      setPhotos(prev => ({ ...prev, [cid]: map }));
    }
  };

  const handlePhotoUpload = async (month, file) => {
    if (!file || !selectedChildId || !user) return;
    setUploading(true);
    setUploadingMonth(month);
    try {
      const ext = file.name.split(".").pop();
      const path = `${selectedChildId}/month_${month}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("child-milestone-photos")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage
        .from("child-milestone-photos")
        .getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      await supabase
        .from("child_milestone_photos")
        .upsert(
          { child_id: selectedChildId, month_number: month, photo_url: publicUrl },
          { onConflict: "child_id,month_number" }
        );
      setPhotos(prev => ({
        ...prev,
        [selectedChildId]: { ...(prev[selectedChildId] || {}), [month]: publicUrl },
      }));
    } catch (err) {
      console.error(err);
      alert(isAr ? "حدث خطأ أثناء رفع الصورة" : "Error uploading photo");
    } finally {
      setUploading(false);
      setUploadingMonth(null);
    }
  };

  const selectedChild = children.find(c => c.child_id === selectedChildId);
  const clampedAge = selectedChild ? Math.min(12, Math.max(1, ageInMonths(selectedChild.birth_date))) : 0;
  const childPhotos = photos[selectedChildId] || {};
  const milestoneData = DATA[activeMonth] || DATA[1];

  // ── Navigation helpers ──
  const goToPrevMonth = () => setActiveMonth(m => Math.max(1, m - 1));
  const goToNextMonth = () => setActiveMonth(m => Math.min(12, m + 1));

  if (loading) return (
    <div className="ms-loading">
      <div className="ms-spinner" />
      <p>{isAr ? "جارٍ التحميل..." : "Loading..."}</p>
    </div>
  );

  const TABS = [
    { key: "developments", label: isAr ? "🌱 التطورات" : "🌱 Developments" },
    { key: "warnings",     label: isAr ? "⚠️ التحذيرات" : "⚠️ Warnings" },
    { key: "nutrition",    label: isAr ? "🍎 التغذية"   : "🍎 Nutrition" },
    { key: "sleep",        label: isAr ? "😴 النوم"     : "😴 Sleep" },
    { key: "activities",   label: isAr ? "🎯 الأنشطة"  : "🎯 Activities" },
    { key: "exercises",    label: isAr ? "💪 التمارين" : "💪 Exercises" },
  ];

  return (
    <div className="ms-root" dir={dir}>
      <style>{MILESTONES_CSS}</style>

      {/* ── HEADER ── */}
      <header className="ms-header">
        <button className="ms-back-btn" onClick={() => navigate("/mother/dashboard")}>
          <i className={`fas fa-chevron-${isAr ? "right" : "left"}`} />
          <span>{isAr ? "العودة" : "Back"}</span>
        </button>
        <h1 className="ms-header-title">
          {isAr ? "رحلة نمو طفلي" : "My Baby's Growth Journey"}
        </h1>
        {children.length > 1 && (
          <div className="ms-child-switcher">
            {children.map(c => (
              <button
                key={c.child_id}
                className={`ms-child-btn ${c.child_id === selectedChildId ? "active" : ""}`}
                onClick={() => setSelectedChildId(c.child_id)}
              >
                {c.gender === "female" ? "👧" : "👦"} {c.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── JOURNEY MAP ── */}
      <section className="ms-journey-section">
        <h2 className="ms-section-title">
          <i className="fas fa-map-marked-alt" />
          {isAr ? "خريطة الرحلة" : "Journey Map"}
        </h2>
        <div className="ms-journey-map">
      <JourneyMap
  activeMonth={activeMonth}
  clampedAge={clampedAge}
  photos={childPhotos}
  isAr={isAr}
  onMonthClick={(m) => setActiveMonth(m)}
  onPhotoClick={(m) => openGallery(m)}
  DATA={DATA}
/>
        </div>
      </section>

      {/* ── MONTH DETAIL ── */}
      <section className="ms-detail-section">

        {/* ── Month Navigation Bar ── */}
        <div className="ms-month-nav">
          {/* Prev Arrow */}
          <button
            className="ms-nav-arrow ms-nav-prev"
            onClick={isAr ? goToNextMonth : goToPrevMonth}
            disabled={isAr ? activeMonth === 12 : activeMonth === 1}
            aria-label={isAr ? "الشهر السابق" : "Previous month"}
          >
            <i className="fas fa-chevron-left" />
          </button>

          {/* Month pills */}
          <div className="ms-month-pills">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <button
                key={m}
                className={`ms-month-pill ${activeMonth === m ? "active" : ""} ${m === clampedAge ? "current-age" : ""}`}
                style={activeMonth === m ? { "--pill-color": DATA[m]?.color } : {}}
                onClick={() => setActiveMonth(m)}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Next Arrow */}
          <button
            className="ms-nav-arrow ms-nav-next"
            onClick={isAr ? goToPrevMonth : goToNextMonth}
            disabled={isAr ? activeMonth === 1 : activeMonth === 12}
            aria-label={isAr ? "الشهر التالي" : "Next month"}
          >
            <i className="fas fa-chevron-right" />
          </button>
        </div>

        {/* Detail Card */}
        <div className="ms-detail-header" style={{ "--month-color": milestoneData.color }}>
          <div className="ms-detail-emoji">{milestoneData.emoji}</div>
          <div className="ms-detail-title-wrap">
            <h2 className="ms-detail-title">{milestoneData.title}</h2>
            {activeMonth === clampedAge && selectedChild && (
              <span className="ms-current-badge">
                {isAr ? "🌟 عمر طفلكِ الآن" : "🌟 Your baby's age now"}
              </span>
            )}
          </div>
          {/* Photo upload — only here in the detail view */}
          <div className="ms-detail-photo-area">
            {childPhotos[activeMonth] ? (
              <div className="ms-detail-photo-wrap">
                <img src={childPhotos[activeMonth]} alt="" className="ms-detail-photo" />
                <label className="ms-detail-photo-edit">
                  <i className="fas fa-camera" />
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={e => e.target.files[0] && handlePhotoUpload(activeMonth, e.target.files[0])}
                  />
                </label>
              </div>
            ) : (
              <label className="ms-add-photo-btn">
                {uploading && uploadingMonth === activeMonth
                  ? <i className="fas fa-spinner fa-spin" />
                  : <><i className="fas fa-camera" /><span>{isAr ? "أضيفي صورة" : "Add Photo"}</span></>
                }
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={e => e.target.files[0] && handlePhotoUpload(activeMonth, e.target.files[0])}
                />
              </label>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="ms-tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`ms-tab ${activeTab === t.key ? "active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="ms-tab-content">
          {activeTab === "developments" && (
            <ul className="ms-list ms-list-green">
              {milestoneData.developments.map((d, i) => (
                <li key={i}><i className="fas fa-check-circle" /><span>{d}</span></li>
              ))}
            </ul>
          )}
          {activeTab === "warnings" && (
            <div className="ms-warnings-box">
              <div className="ms-warning-intro">
                <i className="fas fa-exclamation-triangle" />
                <p>{isAr ? "إذا لم تلاحظي هذه الأشياء في طفلكِ، استشيري طبيب الأطفال:" : "If you don't notice these in your baby, consult your pediatrician:"}</p>
              </div>
              <ul className="ms-list ms-list-red">
                {milestoneData.warnings.map((w, i) => (
                  <li key={i}><i className="fas fa-times-circle" /><span>{w}</span></li>
                ))}
              </ul>
            </div>
          )}
          {activeTab === "nutrition" && (
            <div className="ms-info-card ms-card-green">
              <h3><i className="fas fa-apple-alt" /> {milestoneData.nutrition.title}</h3>
              <p>{milestoneData.nutrition.content}</p>
            </div>
          )}
          {activeTab === "sleep" && (
            <div className="ms-info-card ms-card-blue">
              <h3><i className="fas fa-moon" /> {milestoneData.sleep.title}</h3>
              <p>{milestoneData.sleep.content}</p>
            </div>
          )}
          {activeTab === "activities" && (
            <ul className="ms-list ms-list-purple">
              {milestoneData.activities.map((a, i) => (
                <li key={i}><i className="fas fa-play-circle" /><span>{a}</span></li>
              ))}
            </ul>
          )}
          {activeTab === "exercises" && (
            <ul className="ms-list ms-list-orange">
              {milestoneData.exercises.map((e, i) => (
                <li key={i}><i className="fas fa-dumbbell" /><span>{e}</span></li>
              ))}
            </ul>
          )}
        </div>


      </section>

      {gallery.open && (
        <GalleryOverlay
          gallery={gallery}
          setGallery={setGallery}
          isAr={isAr}
          DATA={DATA}
        />
      )}
    </div>

    
  );
};

// ═══════════════════════════════════════════════════════════════
// JOURNEY MAP — straight lines, 3 rows of 4, no upload overlay
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
/// 
//═══════════════════════════════════════════════════════════════
// JOURNEY MAP — CLEAN HORIZONTAL TIMELINE
// ═══════════════════════════════════════════════════════════════
const JourneyMap = ({
  activeMonth,
  clampedAge,
  photos,
  isAr,
  onMonthClick,
  onPhotoClick,
  DATA
}) => {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="jm-track-outer">
      <div className="jm-track">
        {months.map((m, i) => {
          const data = DATA[m];

          const isDone = m < clampedAge;
          const isCurrent = m === clampedAge;
          const isActive = m === activeMonth;

          return (
            <div key={m} className="jm-segment">

              {/* NODE */}
              <div
                className="jm-node-wrap"
                onClick={() => onMonthClick(m)}
              >
                <button
                  className={`
                    jm-node
                    ${isDone ? "done" : ""}
                    ${isCurrent ? "current" : ""}
                    ${isActive ? "active" : ""}
                  `}
                  style={{
                    "--node-color": data.color,
                  }}
                >

                  {/* PHOTO OR ICON */}
                 {photos[m] ? (
  <img
    src={photos[m]}
    alt=""
    className="jm-photo"
    onClick={(e) => { e.stopPropagation(); onPhotoClick && onPhotoClick(m); }}
  />
                  ) : isDone ? (
                    <div className="jm-check">
                      <i className="fas fa-check"></i>
                    </div>
                  ) : (
                    <div className="jm-inner-dot"></div>
                  )}

                  {/* EMOJI BADGE */}
                  <div className="jm-emoji-badge">
                    {data.emoji}
                  </div>

                  {/* CURRENT RING */}
                  {isCurrent && (
                    <span className="jm-pulse-ring"></span>
                  )}
                </button>
              </div>

              {/* CONNECTOR LINE */}
              {i < months.length - 1 && (
                <div
                  className={`jm-line ${
                    isDone ? "done" : ""
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>




  );
};
// ═══════════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════════
const MILESTONES_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&family=Cairo:wght@400;600;700;800;900&display=swap');

:root {
  --primary: #d68b9d;
  --primary-light: #fdf2f5;
  --secondary: #eab8c6;
  --bg: #FBF9F8;
  --text: #333;
  --gray: #777;
  --white: #fff;
  --shadow: 0 5px 20px rgba(0,0,0,.06);
  --radius: 20px;
}
* { margin:0; padding:0; box-sizing:border-box; font-family:'Cairo','Poppins',sans-serif; }
html { overflow-x: hidden; }

@keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
@keyframes spin    { to{transform:rotate(360deg)} }
@keyframes pulse-ring {
  0%   { box-shadow: 0 0 0 0   rgba(214,139,157,.65); }
  70%  { box-shadow: 0 0 0 14px rgba(214,139,157,0); }
  100% { box-shadow: 0 0 0 0   rgba(214,139,157,0); }
}

/* ─── ROOT ─── */
.ms-root { background: var(--bg); min-height: 100vh; color: var(--text); }
.ms-loading { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.ms-spinner { width:36px;height:36px;border-radius:50%;border:4px solid #fdf2f5;border-top-color:var(--primary);animation:spin .8s linear infinite;margin-bottom:12px; }

/* ─── HEADER ─── */
.ms-header {
  background: var(--white);
  box-shadow: var(--shadow);
  padding: 16px 28px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  position: sticky;
  top: 0;
  z-index: 100;
}
.ms-back-btn {
  background: var(--primary-light); color: var(--primary);
  border: none; padding: 9px 16px; border-radius: 12px;
  font-weight: 800; cursor: pointer;
  display: flex; align-items: center; gap: 7px;
  font-family: inherit; font-size: .85rem; transition: .3s;
}
.ms-back-btn:hover { background: var(--primary); color: white; }
.ms-header-title { font-size: 1.3rem; font-weight: 900; flex: 1; text-align: center; }
.ms-child-switcher { display:flex; gap:8px; flex-wrap:wrap; }
.ms-child-btn {
  background: #f4f4f4; border: none; padding: 7px 14px;
  border-radius: 20px; font-family: inherit; font-weight: 800;
  font-size: .8rem; cursor: pointer; transition: .3s; color: var(--gray);
}
.ms-child-btn.active { background: var(--primary); color: white; }

/* ─── SECTIONS ─── */
.ms-journey-section, .ms-detail-section {
  max-width: 900px; margin: 0 auto; padding: 30px 20px;
  animation: fadeUp .6s ease forwards;
}
.ms-section-title {
  font-size: 1.15rem; font-weight: 900; margin-bottom: 24px;
  display: flex; align-items: center; gap: 10px;
}
.ms-section-title i { color: var(--primary); }

/* /* /* ════════════════════════════════════
   JOURNEY MAP
════════════════════════════════════ */

.jm-track-outer{
  width:100%;
  overflow-x:auto;
  padding:18px 0 10px;
}

.jm-track{
  display:flex;
  align-items:center;
  min-width:max-content;
  padding:20px 10px;
}

.jm-segment{
  display:flex;
  align-items:center;
}

.jm-node-wrap{
  display:flex;
  flex-direction:column;
  align-items:center;
  position:relative;
  cursor:pointer;
}

/* NODE */

.jm-node{
  width:78px;
  height:78px;
  border-radius:50%;
  border:none;
  position:relative;

  display:flex;
  align-items:center;
  justify-content:center;

  background:white;

  box-shadow:
    0 8px 24px rgba(0,0,0,.08),
    inset 0 0 0 4px var(--node-color);

  transition:.25s ease;
}

.jm-node:hover{
  transform:translateY(-3px) scale(1.03);
}

/* ACTIVE */

.jm-node.active{
  transform:scale(1.08);
  box-shadow:
    0 10px 30px rgba(0,0,0,.12),
    0 0 0 6px rgba(255,255,255,.9),
    0 0 0 10px var(--node-color);
}

/* CURRENT */

.jm-node.current{
  animation:jmFloat 2.4s ease-in-out infinite;
}

@keyframes jmFloat{
  0%,100%{
    transform:translateY(0);
  }
  50%{
    transform:translateY(-5px);
  }
}

/* INNER DOT */

.jm-inner-dot{
  width:16px;
  height:16px;
  border-radius:50%;
  background:var(--node-color);
  opacity:.7;
}

/* CHECK */

.jm-check{
  width:42px;
  height:42px;
  border-radius:50%;
  background:rgba(255,255,255,.95);

  display:flex;
  align-items:center;
  justify-content:center;

  color:var(--node-color);
  font-size:18px;
  font-weight:700;
}

/* PHOTO */

.jm-photo{
  width:62px;
  height:62px;
  border-radius:50%;
  object-fit:cover;
}

/* EMOJI BADGE */

.jm-emoji-badge{
  position:absolute;
  top:-8px;
  right:-6px;

  width:28px;
  height:28px;
  border-radius:50%;

  background:white;

  display:flex;
  align-items:center;
  justify-content:center;

  font-size:14px;

  box-shadow:0 4px 10px rgba(0,0,0,.12);
}

/* PULSE */

.jm-pulse-ring{
  position:absolute;
  inset:-8px;
  border-radius:50%;
  border:3px solid var(--node-color);

  animation:jmPulse 1.8s infinite;
}

@keyframes jmPulse{
  0%{
    transform:scale(.95);
    opacity:.9;
  }

  100%{
    transform:scale(1.25);
    opacity:0;
  }
}

/* LINE */

.jm-line{
  width:85px;
  height:4px;
  margin:0 6px;

  border-radius:999px;

  background:#e7e7e7;
  position:relative;
  overflow:hidden;
}

.jm-line.done{
  background:linear-gradient(
    90deg,
    #f5a3bb,
    #e98fb0
  );
}

/* REMOVE LABELS COMPLETELY */

.jm-label{
  display:none !important;
}

/* SCROLLBAR */

.jm-track-outer::-webkit-scrollbar{
  height:6px;
}

.jm-track-outer::-webkit-scrollbar-thumb{
  background:#d8d8d8;
  border-radius:999px;
}

/* ═══════════════════════════════════════════════
   MONTH NAVIGATION BAR
═══════════════════════════════════════════════ */
.ms-month-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  background: white;
  border-radius: 20px;
  padding: 10px 14px;
  box-shadow: var(--shadow);
}

.ms-nav-arrow {
  flex-shrink: 0;
  width: 40px; height: 40px;
  border-radius: 50%;
  border: 2px solid var(--secondary);
  background: var(--primary-light);
  color: var(--primary);
  font-size: 1rem;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: .25s;
  font-family: inherit;
}
.ms-nav-arrow:hover:not(:disabled) {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
  transform: scale(1.08);
}
.ms-nav-arrow:disabled { opacity: .35; cursor: default; }

.ms-month-pills {
  display: flex;
  gap: 5px;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 2px 0;
  justify-content: center;
  flex-wrap: wrap;
}
.ms-month-pills::-webkit-scrollbar { display: none; }

.ms-month-pill {
  width: 34px; height: 34px;
  border-radius: 50%;
  border: 2px solid #e5e7eb;
  background: #f5f5f5;
  color: var(--gray);
  font-size: .8rem;
  font-weight: 800;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: .2s;
  font-family: inherit;
  flex-shrink: 0;
  position: relative;
}
.ms-month-pill:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
.ms-month-pill.active {
  background: var(--pill-color, var(--primary));
  border-color: var(--pill-color, var(--primary));
  color: white;
  transform: scale(1.15);
  box-shadow: 0 3px 10px rgba(0,0,0,.15);
}
.ms-month-pill.current-age::after {
  content: '';
  position: absolute;
  bottom: -5px; left: 50%;
  transform: translateX(-50%);
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--primary);
}

/* ─── DETAIL HEADER ─── */
.ms-detail-section { animation-delay: .1s; }
.ms-detail-header {
  background: linear-gradient(135deg, #fff, color-mix(in srgb, var(--month-color, var(--primary-light)) 20%, white));
  border: 2px solid color-mix(in srgb, var(--month-color, var(--secondary)) 30%, white);
  border-radius: var(--radius);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.ms-detail-emoji { font-size: 3rem; }
.ms-detail-title-wrap { flex: 1; }
.ms-detail-title { font-size: 1.5rem; font-weight: 900; }
.ms-current-badge {
  display: inline-block; background: var(--primary); color: white;
  padding: 4px 12px; border-radius: 20px;
  font-size: .78rem; font-weight: 800; margin-top: 6px;
}
.ms-detail-photo-area { margin-inline-start: auto; }
.ms-detail-photo-wrap { position: relative; width: 80px; height: 80px; }
.ms-detail-photo { width:80px; height:80px; border-radius:50%; object-fit:cover; border:3px solid var(--secondary); }
.ms-detail-photo-edit {
  position:absolute; inset:0; border-radius:50%;
  background:rgba(0,0,0,.4);
  display:flex; align-items:center; justify-content:center;
  color:white; font-size:1rem; opacity:0; transition:.2s; cursor:pointer;
}
.ms-detail-photo-wrap:hover .ms-detail-photo-edit { opacity:1; }
.ms-add-photo-btn {
  display:flex; flex-direction:column; align-items:center; gap:5px;
  background:var(--primary-light); color:var(--primary);
  border:2px dashed var(--secondary); border-radius:16px;
  padding:12px 18px; cursor:pointer; font-family:inherit;
  font-weight:800; font-size:.8rem; transition:.3s;
}
.ms-add-photo-btn:hover { background:var(--primary); color:white; border-color:var(--primary); }
.ms-add-photo-btn i { font-size:1.2rem; }

/* ─── TABS ─── */
.ms-tabs {
  display:flex; gap:8px; flex-wrap:wrap;
  margin-bottom:20px; overflow-x:auto; padding-bottom:4px;
}
.ms-tab {
  background:#f4f4f4; border:none; padding:9px 16px;
  border-radius:25px; font-family:inherit; font-weight:800;
  font-size:.8rem; cursor:pointer; transition:.3s;
  color:var(--gray); white-space:nowrap;
}
.ms-tab:hover { background:var(--primary-light); color:var(--primary); }
.ms-tab.active { background:var(--primary); color:white; }

/* ─── TAB CONTENT ─── */
.ms-tab-content { animation: fadeUp .35s ease; }
.ms-list { list-style:none; display:flex; flex-direction:column; gap:10px; }
.ms-list li {
  display:flex; align-items:flex-start; gap:12px;
  padding:12px 16px; border-radius:14px;
  font-size:.88rem; font-weight:700; line-height:1.5;
}
.ms-list li i { font-size:1rem; margin-top:2px; flex-shrink:0; }
.ms-list-green li { background:#f0faf4; }
.ms-list-green li i { color:#2ecc71; }
.ms-list-red   li { background:#fff5f5; }
.ms-list-red   li i { color:#e74c3c; }
.ms-list-purple li { background:#f5f0ff; }
.ms-list-purple li i { color:#9b59b6; }
.ms-list-orange li { background:#fff8f0; }
.ms-list-orange li i { color:#f39c12; }

.ms-warnings-box { display:flex; flex-direction:column; gap:14px; }
.ms-warning-intro {
  background:#fff9e6; border:2px solid #fcd34d; border-radius:14px;
  padding:14px 16px; display:flex; align-items:flex-start; gap:12px;
  font-size:.88rem; font-weight:700; line-height:1.5;
}
.ms-warning-intro i { color:#f59e0b; font-size:1.1rem; margin-top:2px; flex-shrink:0; }

.ms-info-card { border-radius:16px; padding:20px; }
.ms-info-card h3 { font-size:1rem; font-weight:800; margin-bottom:10px; display:flex; align-items:center; gap:9px; }
.ms-info-card p  { font-size:.88rem; line-height:1.7; font-weight:700; color:#444; }
.ms-card-green { background:#f0faf4; }
.ms-card-green h3 i { color:#2ecc71; }
.ms-card-blue  { background:#eff6ff; }
.ms-card-blue  h3 i { color:#3b82f6; }

/* ─── RESPONSIVE ─── */
@media (max-width: 640px) {
  .ms-header { padding:12px 16px; }
  .ms-header-title { font-size:1rem; }
  .ms-journey-section, .ms-detail-section { padding:20px 12px; }
  .jm-node { width:54px; height:54px; }
  .jm-num  { font-size:.85rem; }
  .jm-emoji { font-size:1.2rem; }
  .ms-month-pill { width:30px; height:30px; font-size:.72rem; }
  .ms-tabs { gap:6px; }
  .ms-tab  { font-size:.75rem; padding:7px 12px; }
  .ms-detail-header { gap:12px; }
  .ms-detail-emoji  { font-size:2rem; }
  .ms-detail-title  { font-size:1.2rem; }
  .ms-nav-arrow { width:34px; height:34px; font-size:.85rem; }
}
@media (max-width: 400px) {
  .jm-node { width:46px; height:46px; border-width:3px; }
  .ms-month-pill { width:26px; height:26px; font-size:.65rem; }
  .ms-tabs { gap:4px; }
  .ms-tab  { font-size:.7rem; padding:6px 10px; }
}

/* ─── GALLERY OVERLAY ─── */
.gl-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.85);
  backdrop-filter: blur(12px); z-index: 9999;
  display: flex; align-items: center; justify-content: center;
}
.gl-box {
  background: white; border-radius: 24px; overflow: hidden;
  max-width: 500px; width: 94%; box-shadow: 0 30px 80px rgba(0,0,0,.5);
  display: flex; flex-direction: column;
}
.gl-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; font-weight: 800; font-size: 1rem;
  border-bottom: 1px solid #f0f0f0;
}
.gl-close {
  background: #f4f4f4; border: none; border-radius: 50%;
  width: 34px; height: 34px; cursor: pointer; font-size: 1rem;
  display: flex; align-items: center; justify-content: center; transition: .2s;
}
.gl-close:hover { background: #e74c3c; color: white; transform: rotate(90deg); }
.gl-img-wrap {
  position: relative; display: flex; align-items: center;
  justify-content: center; background: #111; min-height: 300px;
}
.gl-img {
  max-width: 100%; max-height: 58vh; object-fit: contain; display: block;
  animation: glZoom .3s ease;
}
.gl-arrow {
  position: absolute; top: 50%; transform: translateY(-50%);
  background: rgba(255,255,255,.92); border: none; border-radius: 50%;
  width: 44px; height: 44px; cursor: pointer; font-size: 1rem;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,.25); transition: .2s; z-index: 2;
}
.gl-arrow:hover { background: var(--primary); color: white; transform: translateY(-50%) scale(1.08); }
.gl-prev { left: 14px; } .gl-next { right: 14px; }
.gl-dots { display: flex; justify-content: center; gap: 7px; padding: 14px; }
.gl-dot {
  width: 10px; height: 10px; border-radius: 50%; border: none;
  background: #ddd; cursor: pointer; transition: .25s; padding: 0;
}
.gl-dot.active { background: var(--primary); transform: scale(1.3); }
.gl-counter { text-align: center; padding: 0 20px 16px; font-size: .82rem; color: #aaa; font-weight: 700; }
@keyframes glZoom { from { transform: scale(.88); opacity: 0; } to { transform: scale(1); opacity: 1; } }


`;

export default MilestonesPage;