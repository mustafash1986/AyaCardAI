
import React, { useState, useRef, useEffect, memo, useMemo } from 'react';
import { CardState, TextLayerState, ProcessingStatus } from './types';
import CardCanvas, { CardCanvasHandle } from './components/CardCanvas';
import { editImageWithGemini } from './services/geminiService';
import { getChapters, getVerses, getTafsir, getEditions, Chapter, Verse, Edition } from './services/quranService';
import { Wand2, Download, Image as ImageIcon, Type, Sparkles, AlertCircle, Share2, Loader2, Undo2, Layout, Settings, Palette, Type as TypeIcon, BookOpen, Smartphone, Monitor, Maximize, Globe, Sun, Moon, Grid } from 'lucide-react';
import N8nExport from './components/N8nExport';

// --- Localization Dictionary ---
const TRANSLATIONS = {
  en: {
    app_title: "AyatCard AI",
    reset_all: "Reset All",
    reset_confirm: "Are you sure you want to reset everything? All changes will be lost.",
    quran_tafseer: "Quran & Tafseer",
    select_surah: "Select Surah",
    choose_surah: "Choose Surah...",
    select_ayah: "Select Ayah",
    choose_ayah: "Choose Ayah...",
    select_source: "Select Tafseer / Translation",
    tafsirs: "Tafsirs (Arabic)",
    translations: "Translations",
    color_themes: "Color Themes",
    ai_magic: "AI Background Magic",
    generate_bg: "Generate Background",
    dreaming: "Dreaming...",
    describe_bg: "Describe a background (e.g., 'Islamic geometric pattern in gold and teal')",
    get_api: "Get API Code / n8n",
    global_settings: "Global Settings",
    upload_bg: "Upload Background Image",
    bg_color: "Bg Color",
    overlay_color: "Overlay Color",
    overlay_opacity: "Overlay Opacity",
    layout_frame: "Layout & Frame",
    top: "Top",
    bottom: "Bottom",
    left: "Left",
    right: "Right",
    internal_border: "Internal Border",
    style: "Style",
    width: "Width",
    radius: "Radius",
    opacity: "Opacity",
    primary_text: "Primary Text (Ayah)",
    primary_subtitle: "Primary Text Subtitle (Info)",
    secondary_text: "Secondary Text (Tafseer)",
    secondary_subtitle: "Secondary Text Subtitle",
    footer_branding: "Footer & Branding",
    enable_footer: "Enable Footer",
    add_socials: "Add Social Contacts",
    distance_bottom: "Distance from Bottom",
    size: "Size",
    download: "Download Card",
    live: "Live",
    processing: "Processing...",
    square: "Square",
    story: "Story",
    web: "Web",
    bold: "Bold",
    shadow: "Shadow",
    line_height: "Line Height",
    text_color: "Text Color",
    v_offset: "V-Offset",
    padding: "Padding",
    verse_prefix: "Verse",
    hijri: "Hijri",
    gregorian: "Gregorian",
    line: "Line",
    layout_guides: "Layout Guides",
    canvas_space: "Canvas Space",
    ayah_space: "Ayah Space",
    info_space: "Ayah Number & Surah Name",
    tafseer_space: "Tafseer Space",
    source_space: "Tafseer Name",
    footer_space: "Footer Space"
  },
  ar: {
    app_title: "بطاقات آيات",
    reset_all: "إعادة ضبط",
    reset_confirm: "هل أنت متأكد من إعادة الضبط؟ ستفقد جميع التغييرات.",
    quran_tafseer: "القرآن والتفسير",
    select_surah: "اختر السورة",
    choose_surah: "اختر سورة...",
    select_ayah: "اختر الآية",
    choose_ayah: "اختر آية...",
    select_source: "اختر التفسير / الترجمة",
    tafsirs: "التفاسير (عربي)",
    translations: "الترجمات",
    color_themes: "سمات الألوان",
    ai_magic: "الخلفيات بالذكاء الاصطناعي",
    generate_bg: "توليد خلفية",
    dreaming: "جارِ المعالجة...",
    describe_bg: "وصف الخلفية (مثال: زخرفة إسلامية ذهبية)",
    get_api: "احصل على كود API / n8n",
    global_settings: "الإعدادات العامة",
    upload_bg: "رفع صورة خلفية",
    bg_color: "لون الخلفية",
    overlay_color: "لون التراكب",
    overlay_opacity: "شفافية التراكب",
    layout_frame: "التخطيط والإطار",
    top: "أعلى",
    bottom: "أسفل",
    left: "يسار",
    right: "يمين",
    internal_border: "الإطار الداخلي",
    style: "النمط",
    width: "العرض",
    radius: "نصف القطر",
    opacity: "الشفافية",
    primary_text: "النص الرئيسي (الآية)",
    primary_subtitle: "العنوان الفرعي (معلومات السورة)",
    secondary_text: "النص الثانوي (التفسير)",
    secondary_subtitle: "العنوان الفرعي (اسم التفسير)",
    footer_branding: "التذييل والعلامة التجارية",
    enable_footer: "تفعيل التذييل",
    add_socials: "إضافة وسائل التواصل",
    distance_bottom: "البعد من الأسفل",
    size: "الحجم",
    download: "تحميل البطاقة",
    live: "مباشر",
    processing: "معالجة...",
    square: "مربع",
    story: "قصة",
    web: "ويب",
    bold: "عريض",
    shadow: "ظل",
    line_height: "ارتفاع السطر",
    text_color: "لون النص",
    v_offset: "الإزاحة العمودية",
    padding: "الهوامش",
    verse_prefix: "آية",
    hijri: "هجري",
    gregorian: "ميلادي",
    line: "خط فاصل",
    layout_guides: "دلائل التخطيط",
    canvas_space: "مساحة العمل",
    ayah_space: "مساحة الآية",
    info_space: "رقم الآية واسم السورة",
    tafseer_space: "مساحة التفسير",
    source_space: "اسم التفسير",
    footer_space: "مساحة التذييل"
  }
};

// --- Initial Constants ---

const INITIAL_TEXT_STYLE: TextLayerState = {
  content: "",
  fontFamily: "Amiri",
  fontSize: 40,
  lineHeight: 1.5,
  color: "#ffffff",
  align: "center",
  bold: false,
  italic: false,
  offsetY: 0,
  widthPercent: 90,
  shadow: true,
  shadowColor: "rgba(0,0,0,0.5)",
  bgEnabled: false,
  bgColor: "#000000",
  bgOpacity: 0.5,
  bgPadding: 10,
  bgRadius: 8
};

const getInitialState = (): CardState => ({
  width: 720,
  height: 820,
  backgroundColor: "#18181b",
  backgroundImage: null,
  overlayColor: "#000000",
  overlayOpacity: 0.3,
  
  padding: { top: 40, right: 40, bottom: 40, left: 40 },
  
  border: {
    enabled: true,
    style: "solid",
    color: "#ffffff",
    width: 2,
    opacity: 0.5,
    radius: { tl: 16, tr: 16, bl: 16, br: 16 }
  },

  text1: { // Ayah
    ...INITIAL_TEXT_STYLE,
    content: "﴿ بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ﴾",
    fontSize: 50,
    fontFamily: "Amiri Quran", // Default Uthmani
    bold: true,
  },
  
  text2: { // Tafseer Text
    ...INITIAL_TEXT_STYLE,
    content: "التفسير الميسر سيظهر هنا",
    fontSize: 24,
    fontFamily: "Tajawal",
    color: "#e4e4e7", 
    offsetY: 0
  },

  text3: { // Primary Subtitle (Surah info)
    ...INITIAL_TEXT_STYLE,
    content: "سورة الفاتحة | آية ١",
    fontSize: 18,
    fontFamily: "Tajawal",
    color: "#a1a1aa", 
    offsetY: 0,
    bold: true
  },

  text4: { // Secondary Subtitle (Tafseer Name)
    ...INITIAL_TEXT_STYLE,
    content: "التفسير الميسر",
    fontSize: 14,
    fontFamily: "Tajawal",
    color: "#71717a", 
    offsetY: 0,
    bold: false
  },
  
  footer: {
    enabled: true,
    socials: {
      telegram: "",
      twitter: "",
      instagram: "@AyatCard",
      facebook: "",
      whatsapp: "",
      linkedin: "",
      website: ""
    },
    showHijri: true,
    showGregorian: true,
    offsetY: 30,
    fontSize: 14,
    color: "#71717a",
    fontFamily: "Tajawal",
    divider: true
  }
});

const PRESETS = [
  { name: "Midnight", bg: "#0f172a", text: "#f8fafc", overlay: "#000000", border: "#334155" },
  { name: "Royal", bg: "#2e1065", text: "#faf5ff", overlay: "#000000", border: "#fbbf24" },
  { name: "Obsidian", bg: "#000000", text: "#e2e8f0", overlay: "#000000", border: "#27272a" },
  { name: "Sandstone", bg: "#78350f", text: "#fef3c7", overlay: "#000000", border: "#b45309" },
  { name: "Rose", bg: "#881337", text: "#fff1f2", overlay: "#000000", border: "#f43f5e" },
  { name: "Slate", bg: "#334155", text: "#f1f5f9", overlay: "#000000", border: "#94a3b8" },
  { name: "Violet", bg: "#4c1d95", text: "#f3e8ff", overlay: "#000000", border: "#a78bfa" },
  { name: "Ocean", bg: "#134e4a", text: "#ccfbf1", overlay: "#000000", border: "#2dd4bf" },
  { name: "Paper", bg: "#fefce8", text: "#1c1917", overlay: "#d97706", border: "#1c1917" },
  { name: "Luxury", bg: "#1c1917", text: "#fde047", overlay: "#000000", border: "#fde047" },
];

const FONTS = [
  { name: "Amiri Quran (Uthmani)", value: "Amiri Quran" },
  { name: "Amiri (Naskh)", value: "Amiri" },
  { name: "Cairo (Sans)", value: "Cairo" },
  { name: "Noto Sans Arabic", value: "Noto Sans Arabic" },
  { name: "Reem Kufi", value: "Reem Kufi" },
  { name: "Scheherazade New", value: "Scheherazade New" },
  { name: "Tajawal", value: "Tajawal" },
];

// --- Sub-components for controls ---

const Slider = memo(({ label, value, min, max, onChange, unit = "", step = 1, theme, lang }: any) => {
  const getFontSize = () => lang === 'ar' ? 'text-base' : 'text-sm';
  return (
    <div className="mb-4">
      <div className={`flex justify-between mb-1 ${getFontSize()} font-medium ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
        <span>{label}</span>
        <span className="ltr:ml-auto rtl:mr-auto" dir="ltr">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all ${theme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200'}`}
      />
    </div>
  );
});

const ColorPicker = memo(({ label, value, onChange, theme, lang }: any) => {
  const getFontSize = () => lang === 'ar' ? 'text-base' : 'text-sm';
  return (
    <div className="mb-4">
      <label className={`block mb-1 ${getFontSize()} font-medium ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>{label}</label>
      <div className={`flex gap-2 items-center p-2 rounded-lg border ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-300'}`}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`bg-transparent text-sm focus:outline-none w-full font-mono uppercase ${theme === 'dark' ? 'text-zinc-200' : 'text-gray-700'}`}
          dir="ltr"
        />
      </div>
    </div>
  );
});

const AccordionItem = ({ title, icon, children, defaultOpen = false, theme, lang }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className={`border-b ${theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-5 transition-colors ${theme === 'dark' ? 'bg-zinc-900/50 hover:bg-zinc-800 text-zinc-200' : 'bg-white hover:bg-gray-50 text-gray-700'}`}
      >
        <div className={`flex items-center gap-3 font-bold ${lang === 'ar' ? 'text-lg' : 'text-base'}`}>
          {icon}
          <span>{title}</span>
        </div>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>▼</span>
      </button>
      {isOpen && (
        <div className={`p-5 animate-in slide-in-from-top-2 duration-200 ${theme === 'dark' ? 'bg-zinc-900/30' : 'bg-gray-50'}`}>
          {children}
        </div>
      )}
    </div>
  );
};

const TextControls = memo(({ title, state, onChange, t, theme, lang }: { title: string, state: TextLayerState, onChange: (s: TextLayerState) => void, t: any, theme: 'dark' | 'light', lang: 'ar' | 'en' }) => {
  const getFontSize = () => lang === 'ar' ? 'text-base' : 'text-sm';
  return (
    <AccordionItem title={title} icon={<Type size={18} className="text-emerald-500" />} theme={theme} lang={lang}>
      <div className="mb-4">
        <textarea
          value={state.content}
          onChange={(e) => onChange({ ...state, content: e.target.value })}
          className={`w-full border rounded-lg p-3 ${getFontSize()} focus:ring-2 focus:ring-emerald-500 focus:outline-none h-24 text-right ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          dir="rtl"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <select
          value={state.fontFamily}
          onChange={(e) => onChange({ ...state, fontFamily: e.target.value })}
          className={`border rounded-lg px-2 py-2 text-sm ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
        >
          {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
        </select>
        <div className={`flex rounded-lg border overflow-hidden ${theme === 'dark' ? 'border-zinc-700' : 'border-gray-300'}`}>
          {['left', 'center', 'right'].map((align) => (
            <button
              key={align}
              onClick={() => onChange({ ...state, align: align as any })}
              className={`flex-1 flex items-center justify-center p-2 hover:opacity-80 transition-colors ${
                state.align === align 
                  ? (theme === 'dark' ? 'bg-zinc-700 text-white' : 'bg-gray-300 text-gray-900') 
                  : (theme === 'dark' ? 'bg-zinc-800 text-zinc-400' : 'bg-white text-gray-500')
              }`}
            >
              {align === 'left' ? 'L' : align === 'center' ? 'C' : 'R'}
            </button>
          ))}
        </div>
      </div>

      <Slider label={t.size} value={state.fontSize} min={10} max={150} onChange={(v: number) => onChange({ ...state, fontSize: v })} unit="px" theme={theme} lang={lang} />
      <Slider label={t.line_height} value={state.lineHeight} min={0.5} max={3} step={0.1} onChange={(v: number) => onChange({ ...state, lineHeight: v })} theme={theme} lang={lang} />
      <ColorPicker label={t.text_color} value={state.color} onChange={(v: string) => onChange({ ...state, color: v })} theme={theme} lang={lang} />
      
      <div className="grid grid-cols-2 gap-4">
        <Slider label={t.width} value={state.widthPercent} min={20} max={100} onChange={(v: number) => onChange({ ...state, widthPercent: v })} unit="%" theme={theme} lang={lang} />
        <Slider label={t.v_offset} value={state.offsetY} min={-200} max={200} step={1} onChange={(v: number) => onChange({ ...state, offsetY: v })} theme={theme} lang={lang} />
      </div>

      <div className="flex gap-4 mt-4">
        <label className={`flex items-center gap-2 ${getFontSize()} cursor-pointer ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
          <input type="checkbox" checked={state.bold} onChange={(e) => onChange({ ...state, bold: e.target.checked })} className={`rounded border accent-emerald-500 ${theme === 'dark' ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'}`} />
          {t.bold}
        </label>
        <label className={`flex items-center gap-2 ${getFontSize()} cursor-pointer ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
          <input type="checkbox" checked={state.shadow} onChange={(e) => onChange({ ...state, shadow: e.target.checked })} className={`rounded border accent-emerald-500 ${theme === 'dark' ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'}`} />
          {t.shadow}
        </label>
        <label className={`flex items-center gap-2 ${getFontSize()} cursor-pointer ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
          <input type="checkbox" checked={state.bgEnabled} onChange={(e) => onChange({ ...state, bgEnabled: e.target.checked })} className={`rounded border accent-emerald-500 ${theme === 'dark' ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'}`} />
          Bg
        </label>
      </div>

      {state.bgEnabled && (
        <div className={`mt-4 p-4 rounded-lg border ${theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700/50' : 'bg-gray-100 border-gray-200'}`}>
          <ColorPicker label={t.bg_color} value={state.bgColor} onChange={(v: string) => onChange({ ...state, bgColor: v })} theme={theme} lang={lang} />
          <Slider label="Bg Opacity" value={state.bgOpacity} min={0} max={1} step={0.01} onChange={(v: number) => onChange({ ...state, bgOpacity: v })} theme={theme} lang={lang} />
          <Slider label={t.padding} value={state.bgPadding} min={0} max={50} onChange={(v: number) => onChange({ ...state, bgPadding: v })} unit="px" theme={theme} lang={lang} />
          <Slider label={t.radius} value={state.bgRadius} min={0} max={50} onChange={(v: number) => onChange({ ...state, bgRadius: v })} unit="px" theme={theme} lang={lang} />
        </div>
      )}
    </AccordionItem>
  );
});

// --- Main App Component ---

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [uiLanguage, setUiLanguage] = useState<'en' | 'ar'>('en'); 
  const [cardState, setCardState] = useState<CardState>(getInitialState());
  const [resetKey, setResetKey] = useState(0); 
  const [history, setHistory] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGuides, setShowGuides] = useState(false); // New state for Layout Guides
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const canvasRef = useRef<CardCanvasHandle>(null);
  
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [editions, setEditions] = useState<Edition[]>([]);
  
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVerseKey, setSelectedVerseKey] = useState<string | null>(null);
  const [selectedEditionSlug, setSelectedEditionSlug] = useState<string>('ar.muyassar');
  
  const [isN8nOpen, setIsN8nOpen] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const t = TRANSLATIONS[uiLanguage];

  const getFontSize = () => uiLanguage === 'ar' ? 'text-base' : 'text-sm';

  // Load data on mount
  useEffect(() => {
    getChapters().then(setChapters);
    getEditions().then(setEditions);
  }, []);

  const handleReset = () => {
    if (confirm(t.reset_confirm)) {
      setCardState(getInitialState());
      setUploadedFileName(null);
      setPrompt("");
      setError(null);
      setStatus(ProcessingStatus.IDLE);
      setSelectedChapter(null);
      setSelectedVerseKey(null);
      setSelectedEditionSlug('ar.muyassar');
      setVerses([]);
      setResetKey(prev => prev + 1);
    }
  };

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setCardState(prev => ({
      ...prev,
      backgroundColor: preset.bg,
      overlayColor: preset.overlay,
      border: {
        ...prev.border,
        color: preset.border
      },
      text1: { ...prev.text1, color: preset.text },
      text2: { ...prev.text2, color: preset.text },
      text3: { ...prev.text3, color: preset.text }, 
      text4: { ...prev.text4, color: preset.text },
      footer: { ...prev.footer, color: preset.text }
    }));
  };

  const handleChapterChange = async (chapterId: number) => {
    setSelectedChapter(chapterId);
    setSelectedVerseKey(null); 
    const v = await getVerses(chapterId);
    setVerses(v);
  };

  const handleAyahSelect = async (verseKey: string, textUthmani: string, verseNumber: number) => {
    setSelectedVerseKey(verseKey);
    let processedText = textUthmani;
    if (processedText.trim().startsWith('۞')) {
        processedText = processedText.replace('۞', '').trim() + ' ۞';
    }
    processedText = `﴿ ${processedText} ﴾`;

    setCardState(prev => ({
      ...prev,
      text1: { ...prev.text1, content: processedText, fontFamily: "Amiri Quran" } 
    }));

    const chapter = chapters.find(c => c.id === selectedChapter);
    const surahName = uiLanguage === 'ar' ? chapter?.name_arabic : chapter?.name_simple;
    const verseLabel = uiLanguage === 'ar' ? 'آية' : 'Verse';
    const verseNumLocal = uiLanguage === 'ar' ? verseNumber.toLocaleString('ar-EG') : verseNumber;
    
    const infoText = chapter ? `${surahName} | ${verseLabel} ${verseNumLocal}` : "";
    
    setCardState(prev => ({
      ...prev,
      text3: { ...prev.text3, content: infoText }
    }));

    await fetchAndSetTafseer(verseKey, selectedEditionSlug);
  };

  const handleEditionChange = async (slug: string) => {
    setSelectedEditionSlug(slug);
    if (selectedVerseKey) {
        await fetchAndSetTafseer(selectedVerseKey, slug);
    }
  };

  const fetchAndSetTafseer = async (verseKey: string, editionSlug: string) => {
      setStatus(ProcessingStatus.PROCESSING);
      const text = await getTafsir(verseKey, editionSlug);
      
      const edition = editions.find(e => e.identifier === editionSlug);
      let editionName = "Tafseer";
      if (edition) {
         editionName = uiLanguage === 'ar' ? edition.name : edition.englishName;
      }

      setCardState(prev => ({
        ...prev,
        text2: { ...prev.text2, content: text, direction: edition?.language === 'ar' ? 'rtl' : 'ltr', align: 'center' },
        text4: { ...prev.text4, content: editionName }
      }));
      setStatus(ProcessingStatus.IDLE);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCardState(prev => ({ ...prev, backgroundImage: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !canvasRef.current) return;
    setIsGenerating(true);
    setError(null);
    setStatus(ProcessingStatus.PROCESSING);
    try {
      const currentCanvasData = await canvasRef.current.getDataUrl();
      if (!currentCanvasData) throw new Error("Failed to capture canvas");
      
      const generatedImageBase64 = await editImageWithGemini(
        currentCanvasData, 
        prompt, 
        cardState.width, 
        cardState.height
      );
      
      setCardState(prev => ({ ...prev, backgroundImage: generatedImageBase64 }));
      setHistory(prev => [{ id: Date.now().toString(), timestamp: Date.now(), originalImage: currentCanvasData, generatedImage: generatedImageBase64, prompt }, ...prev]);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate image. Please try a different prompt.");
      setStatus(ProcessingStatus.ERROR);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (canvasRef.current) {
      const dataUrl = await canvasRef.current.getDataUrl();
      const link = document.createElement('a');
      link.download = `ayat-card-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const { tafsirs, translations } = useMemo(() => {
    return {
      tafsirs: editions.filter(e => e.type === 'tafsir'),
      translations: editions.filter(e => e.type === 'translation')
    };
  }, [editions]);

  const updateSocial = (key: keyof CardState['footer']['socials'], value: string) => {
    setCardState(prev => ({
      ...prev,
      footer: {
        ...prev.footer,
        socials: {
          ...prev.footer.socials,
          [key]: value
        }
      }
    }));
  };

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden ${theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-gray-100 text-gray-900'} ${uiLanguage === 'ar' ? 'font-cairo' : 'font-sans'}`} dir={uiLanguage === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* --- Sidebar (Control Panel) --- */}
      <div key={resetKey} className={`w-full md:w-[420px] flex flex-col border-r h-full shadow-xl z-20 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-200'}`}>
        
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <Sparkles className="text-emerald-500" size={24} />
            <h1 className={`font-bold text-xl ${uiLanguage === 'ar' ? 'font-amiri' : ''}`}>{t.app_title}</h1>
          </div>
          
          <div className="flex items-center gap-2">
             {/* Theme Switcher */}
             <button onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-200 text-gray-600'}`}>
               {theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}
             </button>

             {/* Language Switcher */}
             <button 
               onClick={() => setUiLanguage(prev => prev === 'en' ? 'ar' : 'en')}
               className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border hover:opacity-80 transition-colors font-medium ${theme === 'dark' ? 'border-zinc-700 text-zinc-300' : 'border-gray-300 text-gray-700'}`}
             >
               <Globe size={14} />
               {uiLanguage === 'en' ? 'العربية' : 'English'}
             </button>

             <button onClick={handleReset} className="text-sm px-2 text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 font-semibold">
                <Undo2 size={16}/> {t.reset_all}
             </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          
          {/* Quran & Tafseer Section */}
          <AccordionItem title={t.quran_tafseer} icon={<BookOpen size={20} className="text-emerald-500"/>} defaultOpen={true} theme={theme} lang={uiLanguage}>
            <div className="space-y-5">
               <div>
                 <label className={`block font-medium opacity-80 mb-2 ${getFontSize()} ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>{t.select_surah}</label>
                 <select 
                   className={`w-full border rounded-lg p-3 ${uiLanguage === 'ar' ? 'text-lg' : 'text-base'} ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                   onChange={(e) => handleChapterChange(Number(e.target.value))}
                   value={selectedChapter || ""}
                   dir="rtl"
                 >
                   <option value="">{t.choose_surah}</option>
                   {chapters.map(c => (
                     <option key={c.id} value={c.id}>
                       {c.id}. {uiLanguage === 'ar' ? c.name_arabic : c.name_simple}
                     </option>
                   ))}
                 </select>
               </div>

               {selectedChapter && (
                 <div>
                   <label className={`block font-medium opacity-80 mb-2 ${getFontSize()} ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>{t.select_ayah}</label>
                   <select 
                     className={`w-full border rounded-lg p-3 ${uiLanguage === 'ar' ? 'text-lg' : 'text-base'} ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                     onChange={(e) => {
                       const verse = verses.find(v => v.id === Number(e.target.value));
                       if(verse) handleAyahSelect(verse.verse_key, verse.text_uthmani, Number(verse.verse_key.split(':')[1]));
                     }}
                     value={selectedVerseKey ? verses.find(v => v.verse_key === selectedVerseKey)?.id || "" : ""}
                     dir="rtl"
                   >
                     <option value="">{t.choose_ayah}</option>
                     {verses.map(v => {
                       const verseNum = v.verse_key.split(':')[1];
                       const label = uiLanguage === 'ar' ? `(${t.verse_prefix} ${Number(verseNum).toLocaleString('ar-EG')})` : `(Verse ${verseNum})`;
                       return (
                        <option key={v.id} value={v.id}>{v.verse_key} {label}</option>
                       );
                     })}
                   </select>
                 </div>
               )}

               <div>
                 <label className={`block font-medium opacity-80 mb-2 ${getFontSize()} ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>{t.select_source}</label>
                 <select 
                   className={`w-full border rounded-lg p-3 ${uiLanguage === 'ar' ? 'text-lg' : 'text-base'} ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                   value={selectedEditionSlug}
                   onChange={(e) => handleEditionChange(e.target.value)}
                 >
                   <optgroup label={t.tafsirs} className="font-bold">
                      {tafsirs.map(e => <option key={e.identifier} value={e.identifier}>{uiLanguage === 'ar' ? e.name : e.englishName}</option>)}
                   </optgroup>
                   <optgroup label={t.translations} className="font-bold">
                      {translations.map(e => <option key={e.identifier} value={e.identifier}>{e.englishName} ({e.language.toUpperCase()})</option>)}
                   </optgroup>
                 </select>
               </div>
            </div>
          </AccordionItem>

           {/* Color Presets */}
           <AccordionItem title={t.color_themes} icon={<Palette size={20} className="text-emerald-500"/>} theme={theme} lang={uiLanguage}>
             <div className="grid grid-cols-2 gap-3">
               {PRESETS.map(preset => (
                 <button 
                   key={preset.name}
                   onClick={() => handleApplyPreset(preset)}
                   className={`flex items-center gap-3 p-3 rounded-lg transition-all font-medium text-left border ${getFontSize()} ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-sm'}`}
                 >
                   <div className="w-5 h-5 rounded-full border border-gray-500/50 shadow-sm" style={{backgroundColor: preset.bg}}></div>
                   <span className="opacity-90">{preset.name}</span>
                 </button>
               ))}
             </div>
           </AccordionItem>

          {/* AI Background Gen */}
          <AccordionItem title={t.ai_magic} icon={<Wand2 size={20} className="text-purple-500"/>} theme={theme} lang={uiLanguage}>
            <div className="space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t.describe_bg}
                className={`w-full h-28 border rounded-lg p-3 text-base placeholder-opacity-50 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-purple-500/20"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                {isGenerating ? t.dreaming : t.generate_bg}
              </button>
              
              <button 
                onClick={() => setIsN8nOpen(true)}
                className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 border ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300' : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700'}`}
              >
                 <Share2 size={14} /> {t.get_api}
              </button>

              {error && (
                <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-lg flex items-start gap-3 text-red-400 text-sm">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </AccordionItem>
          
          {/* Global Settings */}
          <AccordionItem title={t.global_settings} icon={<Settings size={20} className="text-emerald-500"/>} theme={theme} lang={uiLanguage}>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button onClick={() => setCardState(s => ({ ...s, width: 1080, height: 1080 }))} className={`p-3 rounded-lg text-xs opacity-80 flex flex-col items-center gap-1.5 transition-colors border ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'}`}>
                <Layout size={16} /> {t.square}
              </button>
              <button onClick={() => setCardState(s => ({ ...s, width: 1080, height: 1920 }))} className={`p-3 rounded-lg text-xs opacity-80 flex flex-col items-center gap-1.5 transition-colors border ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'}`}>
                <Smartphone size={16} /> {t.story}
              </button>
              <button onClick={() => setCardState(s => ({ ...s, width: 1200, height: 675 }))} className={`p-3 rounded-lg text-xs opacity-80 flex flex-col items-center gap-1.5 transition-colors border ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'}`}>
                <Monitor size={16} /> {t.web}
              </button>
            </div>
            
             <div className="flex gap-2 mb-4">
                 <input type="number" value={cardState.width} onChange={(e) => setCardState(s => ({ ...s, width: Number(e.target.value) }))} className={`w-1/2 text-sm p-2 rounded-lg text-center border ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                 <input type="number" value={cardState.height} onChange={(e) => setCardState(s => ({ ...s, height: Number(e.target.value) }))} className={`w-1/2 text-sm p-2 rounded-lg text-center border ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>

            <div className="mb-5">
              <label className={`block w-full cursor-pointer border-2 border-dashed rounded-lg p-6 text-center transition-all ${theme === 'dark' ? 'bg-zinc-900/50 hover:bg-zinc-800 border-zinc-700 hover:border-zinc-500' : 'bg-gray-50 hover:bg-gray-100 border-gray-300 hover:border-gray-400'}`}>
                <span className={`font-medium opacity-70 block mb-2 ${getFontSize()} ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
                   {uploadedFileName ? uploadedFileName : t.upload_bg}
                </span>
                <ImageIcon className="mx-auto opacity-50 mb-1" size={24} />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>

            <ColorPicker label={t.bg_color} value={cardState.backgroundColor} onChange={(v: string) => setCardState(s => ({ ...s, backgroundColor: v }))} theme={theme} lang={uiLanguage} />
            <ColorPicker label={t.overlay_color} value={cardState.overlayColor} onChange={(v: string) => setCardState(s => ({ ...s, overlayColor: v }))} theme={theme} lang={uiLanguage} />
            <Slider label={t.overlay_opacity} value={cardState.overlayOpacity} min={0} max={1} step={0.05} onChange={(v: number) => setCardState(s => ({ ...s, overlayOpacity: v }))} theme={theme} lang={uiLanguage} />
          </AccordionItem>

          {/* Layout & Frame */}
          <AccordionItem title={t.layout_frame} icon={<Layout size={20} className="text-emerald-500"/>} theme={theme} lang={uiLanguage}>
             <div className="grid grid-cols-2 gap-4 mb-4">
                <Slider label={t.top} value={cardState.padding.top} min={0} max={200} onChange={(v: number) => setCardState(s => ({ ...s, padding: { ...s.padding, top: v } }))} theme={theme} lang={uiLanguage} />
                <Slider label={t.bottom} value={cardState.padding.bottom} min={0} max={200} onChange={(v: number) => setCardState(s => ({ ...s, padding: { ...s.padding, bottom: v } }))} theme={theme} lang={uiLanguage} />
                <Slider label={t.left} value={cardState.padding.left} min={0} max={200} onChange={(v: number) => setCardState(s => ({ ...s, padding: { ...s.padding, left: v } }))} theme={theme} lang={uiLanguage} />
                <Slider label={t.right} value={cardState.padding.right} min={0} max={200} onChange={(v: number) => setCardState(s => ({ ...s, padding: { ...s.padding, right: v } }))} theme={theme} lang={uiLanguage} />
             </div>
             
             <div className="flex items-center justify-between mb-4 p-2 rounded-lg hover:bg-gray-100/5 transition-colors">
               <label className={`font-medium opacity-90 ${getFontSize()} ${theme === 'dark' ? 'text-zinc-200' : 'text-gray-800'}`}>{t.internal_border}</label>
               <input type="checkbox" checked={cardState.border.enabled} onChange={(e) => setCardState(s => ({ ...s, border: { ...s.border, enabled: e.target.checked } }))} className={`w-5 h-5 accent-emerald-500 rounded border ${theme === 'dark' ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'}`} />
             </div>

             {cardState.border.enabled && (
               <div className={`pl-4 border-l-2 ${theme === 'dark' ? 'border-zinc-700' : 'border-gray-300'}`}>
                  <div className="mb-4">
                    <label className={`block mb-1 opacity-70 ${getFontSize()} ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>{t.style}</label>
                    <select value={cardState.border.style} onChange={(e) => setCardState(s => ({ ...s, border: { ...s.border, style: e.target.value as any } }))} className={`w-full border rounded-lg text-sm p-2 ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                       {['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'].map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>
                  <ColorPicker label={t.text_color} value={cardState.border.color} onChange={(v: string) => setCardState(s => ({ ...s, border: { ...s.border, color: v } }))} theme={theme} lang={uiLanguage} />
                  <Slider label={t.width} value={cardState.border.width} min={1} max={50} onChange={(v: number) => setCardState(s => ({ ...s, border: { ...s.border, width: v } }))} unit="px" theme={theme} lang={uiLanguage} />
                  <Slider label={t.radius} value={cardState.border.radius.tl} min={0} max={100} onChange={(v: number) => setCardState(s => ({ ...s, border: { ...s.border, radius: { tl: v, tr: v, bl: v, br: v } } }))} unit="px" theme={theme} lang={uiLanguage} />
                  <Slider label={t.opacity} value={cardState.border.opacity} min={0} max={1} step={0.05} onChange={(v: number) => setCardState(s => ({ ...s, border: { ...s.border, opacity: v } }))} theme={theme} lang={uiLanguage} />
               </div>
             )}
          </AccordionItem>

          {/* Text Layers */}
          <TextControls title={t.primary_text} state={cardState.text1} onChange={(t) => setCardState(s => ({ ...s, text1: t }))} t={t} theme={theme} lang={uiLanguage} />
          <TextControls title={t.primary_subtitle} state={cardState.text3} onChange={(t) => setCardState(s => ({ ...s, text3: t }))} t={t} theme={theme} lang={uiLanguage} />
          <TextControls title={t.secondary_text} state={cardState.text2} onChange={(t) => setCardState(s => ({ ...s, text2: t }))} t={t} theme={theme} lang={uiLanguage} />
          <TextControls title={t.secondary_subtitle} state={cardState.text4} onChange={(t) => setCardState(s => ({ ...s, text4: t }))} t={t} theme={theme} lang={uiLanguage} />

          {/* Footer */}
          <AccordionItem title={t.footer_branding} icon={<TypeIcon size={20} className="text-emerald-500"/>} theme={theme} lang={uiLanguage}>
             <div className="flex items-center gap-3 mb-5 p-2 rounded-lg hover:bg-gray-100/5">
                <input type="checkbox" checked={cardState.footer.enabled} onChange={(e) => setCardState(s => ({ ...s, footer: { ...s.footer, enabled: e.target.checked } }))} className={`w-5 h-5 accent-emerald-500 rounded border ${theme === 'dark' ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'}`} />
                <span className={`font-medium opacity-90 ${getFontSize()} ${theme === 'dark' ? 'text-zinc-200' : 'text-gray-800'}`}>{t.enable_footer}</span>
             </div>
             {cardState.footer.enabled && (
               <div className="space-y-5">
                 
                 {/* Social Inputs - Multi */}
                 <div className={`space-y-3 p-4 rounded-xl border ${theme === 'dark' ? 'bg-black/30 border-zinc-800' : 'bg-gray-50 border-gray-200'}`}>
                    <span className={`text-xs font-bold uppercase tracking-wider opacity-60 block mb-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>{t.add_socials}</span>
                    
                    {[
                      { key: 'telegram', placeholder: 'Telegram' },
                      { key: 'twitter', placeholder: 'Twitter (X)' },
                      { key: 'instagram', placeholder: 'Instagram' },
                      { key: 'facebook', placeholder: 'Facebook' },
                      { key: 'whatsapp', placeholder: 'WhatsApp' },
                      { key: 'linkedin', placeholder: 'LinkedIn' },
                      { key: 'website', placeholder: 'Website' }
                    ].map((item) => (
                      <input 
                        key={item.key}
                        type="text" 
                        placeholder={item.placeholder}
                        value={(cardState.footer.socials as any)[item.key]}
                        onChange={e => updateSocial(item.key as any, e.target.value)}
                        className={`w-full text-sm p-2.5 rounded-lg border focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-shadow ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                      />
                    ))}
                 </div>

                 <div className={`flex flex-wrap gap-4 ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                    <label className="flex items-center gap-2 text-sm font-medium opacity-80 cursor-pointer">
                      <input type="checkbox" checked={cardState.footer.showHijri} onChange={(e) => setCardState(s => ({ ...s, footer: { ...s.footer, showHijri: e.target.checked } }))} className={`accent-emerald-500 rounded border ${theme === 'dark' ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'}`} /> {t.hijri}
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium opacity-80 cursor-pointer">
                      <input type="checkbox" checked={cardState.footer.showGregorian} onChange={(e) => setCardState(s => ({ ...s, footer: { ...s.footer, showGregorian: e.target.checked } }))} className={`accent-emerald-500 rounded border ${theme === 'dark' ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'}`} /> {t.gregorian}
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium opacity-80 cursor-pointer">
                      <input type="checkbox" checked={cardState.footer.divider} onChange={(e) => setCardState(s => ({ ...s, footer: { ...s.footer, divider: e.target.checked } }))} className={`accent-emerald-500 rounded border ${theme === 'dark' ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'}`} /> {t.line}
                    </label>
                 </div>
                 <Slider label={t.distance_bottom} value={cardState.footer.offsetY} min={0} max={200} onChange={(v: number) => setCardState(s => ({ ...s, footer: { ...s.footer, offsetY: v } }))} unit="px" theme={theme} lang={uiLanguage} />
                 <ColorPicker label={t.text_color} value={cardState.footer.color} onChange={(v: string) => setCardState(s => ({ ...s, footer: { ...s.footer, color: v } }))} theme={theme} lang={uiLanguage} />
                 <Slider label={t.size} value={cardState.footer.fontSize} min={8} max={40} onChange={(v: number) => setCardState(s => ({ ...s, footer: { ...s.footer, fontSize: v } }))} unit="px" theme={theme} lang={uiLanguage} />
               </div>
             )}
          </AccordionItem>
          
          <div className="h-24"></div> {/* Spacer */}
        </div>
        
        {/* Generate Button (Sticky) */}
        <div className={`p-5 border-t z-30 shadow-lg ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
          <button 
            onClick={handleDownload}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-3 shadow-emerald-500/20 shadow-xl transition-all hover:scale-[1.02]"
          >
            <Download size={22} /> {t.download}
          </button>
        </div>

      </div>

      {/* --- Preview Area (Right) --- */}
      <div key={resetKey + 1} className={`flex-1 flex flex-col h-full relative overflow-hidden ${theme === 'dark' ? 'bg-zinc-950' : 'bg-gray-100'}`}>
         {/* Top Bar Info */}
         <div className={`absolute top-4 left-4 z-10 flex items-center gap-2`}>
            <div className={`px-3 py-1.5 rounded-md text-xs font-mono backdrop-blur border shadow-sm ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800 text-zinc-400' : 'bg-white/80 border-gray-300 text-gray-600'}`}>
              Canvas {cardState.width}x{cardState.height}
            </div>
         </div>
         
         {/* Top Right Controls */}
         <div className={`absolute top-4 right-4 z-10 flex items-center gap-3`}>
            {/* Guide Toggle */}
            <button 
               onClick={() => setShowGuides(!showGuides)} 
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur shadow-sm transition-colors text-xs font-semibold ${showGuides ? 'bg-blue-600/90 text-white border-blue-500' : (theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'bg-white/80 border-gray-300 text-gray-700 hover:bg-white')}`}
               title={t.layout_guides}
            >
               <Grid size={14} />
               <span className="hidden sm:inline">{t.layout_guides}</span>
            </button>

            {/* Live Indicator */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur shadow-sm ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/80 border-gray-300'}`}>
               <div className={`w-2.5 h-2.5 rounded-full ${status === ProcessingStatus.PROCESSING ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
               <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                 {status === ProcessingStatus.PROCESSING ? t.processing : t.live}
               </span>
            </div>
         </div>

         {/* Canvas Container with Auto-Scale */}
         <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
            <div style={{ 
               transform: `scale(${Math.min(1, (window.innerWidth - 450) / cardState.width, (window.innerHeight - 100) / cardState.height)})`,
               transformOrigin: 'center',
               transition: 'transform 0.2s ease-out'
            }}>
               <CardCanvas 
                 ref={canvasRef} 
                 cardState={cardState} 
                 hideText={isGenerating} 
                 showGuides={showGuides}
                 labels={{
                   canvas: t.canvas_space,
                   ayah: t.ayah_space,
                   info: t.info_space,
                   tafseer: t.tafseer_space,
                   source: t.source_space,
                   footer: t.footer_space
                 }}
               />
            </div>
         </div>
      </div>

      <N8nExport prompt={prompt} isOpen={isN8nOpen} onClose={() => setIsN8nOpen(false)} />

    </div>
  );
}

export default App;
