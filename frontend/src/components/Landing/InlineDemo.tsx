import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Step = {
  img: string;
  duration?: number;
  cursor?: { x: number; y: number };
  click?: boolean;
  typeText?: string;
  bubble?: { text: string };
  loader?: boolean;
  chapter: "wardrobe" | "chatbot" | "tryon" | "ootd";
  focusRect?: { x: number; y: number; w: number; h: number };
};

// Build the 16 steps exactly as specified
const STEPS: Step[] = [
  // Chapter 1 – Wardrobe + AI Descriptions
  {
    img: "s1_wardrobe.png",
    cursor: { x: 92, y: 7 },
    click: true,
    duration: 1200,
    chapter: "wardrobe"
  },
  {
    img: "s1_add_item_empty.png",
    cursor: { x: 39, y: 74 },
    click: true,
    focusRect: { x: 22, y: 62, w: 42, h: 26 },
    chapter: "wardrobe"
  },
  {
    img: "s1_add_item_with_photo.png",
    cursor: { x: 84, y: 90 },
    click: true,
    bubble: { text: "Describe with AI" },
    chapter: "wardrobe"
  },
  {
    img: "s1_add_item_filled.png",
    cursor: { x: 84, y: 52 },
    typeText: "Writing description…",
    duration: 2400,
    chapter: "wardrobe"
  },

  // Chapter 2 – Fashion Chatbot
  {
    img: "s1_wardrobe.png",
    cursor: { x: 96, y: 89 },
    click: true,
    duration: 1200,
    chapter: "chatbot"
  },
  {
    img: "s2_chatbot_open.png",
    cursor: { x: 49, y: 90 },
    typeText: "What should I wear for a presentation today?",
    chapter: "chatbot"
  },
  {
    img: "s2_chatbot_thinking.png",
    cursor: { x: 11, y: 56 },
    loader: true,
    duration: 1800,
    chapter: "chatbot"
  },
  {
    img: "s2_chatbot_answer.png",
    cursor: { x: 86, y: 22 },
    duration: 2200,
    chapter: "chatbot"
  },

  // Chapter 3 – Virtual Try-On
  {
    img: "s3_preview_item.png",
    cursor: { x: 73, y: 88 },
    click: true,
    duration: 1200,
    chapter: "tryon"
  },
  {
    img: "s3_tryon_empty.png",
    cursor: { x: 30, y: 94 },
    click: true,
    duration: 1200,
    chapter: "tryon"
  },
  {
    img: "s3_tryon_generating.png",
    cursor: { x: 74, y: 23 },
    loader: true,
    duration: 1800,
    chapter: "tryon"
  },
  {
    img: "s3_tryon_result.png",
    cursor: { x: 76, y: 36 },
    duration: 2200,
    chapter: "tryon"
  },

  // Chapter 4 – Outfit of the Day + Style Tips
  {
    img: "s4_outfit_day.png",
    cursor: { x: 95, y: 12 },
    focusRect: { x: 83, y: 6, w: 13, h: 10 },
    duration: 1800,
    chapter: "ootd"
  },
  {
    img: "s4_suggestions_empty.png",
    cursor: { x: 19, y: 27 },
    click: true,
    duration: 900,
    chapter: "ootd"
  },
  {
    img: "s4_suggestions_selected.png",
    cursor: { x: 47, y: 92 },
    click: true,
    duration: 1200,
    chapter: "ootd"
  },
  {
    img: "s4_suggestions_result.png",
    cursor: { x: 83, y: 86 },
    duration: 2600,
    chapter: "ootd"
  }
];

const CHAPTER_META = {
  wardrobe: { title: "Wardrobe + AI Descriptions", subtitle: "Add items and let AI write clean, on-brand details." },
  chatbot: { title: "Fashion Chatbot", subtitle: "Ask anything. Get instant, wardrobe-aware answers." },
  tryon: { title: "Virtual Try-On", subtitle: "See how it could look—before you wear it." },
  ootd: { title: "Outfit of the Day + Style Tips", subtitle: "Weather-aware picks and occasion-ready ideas." },
};

const CHAPTERS: Step["chapter"][] = ["wardrobe", "chatbot", "tryon", "ootd"];

export default function InlineDemo() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const step = STEPS[i];
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    const d = step.duration ?? 2600;
    timer.current = window.setTimeout(() => {
      setI((p) => (p + 1) % STEPS.length);
    }, d);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [i, playing, step.duration]);

  const chapter = useMemo(() => CHAPTER_META[step.chapter], [step.chapter]);

  const jumpToChapter = (c: Step["chapter"]) => {
    const idx = STEPS.findIndex(s => s.chapter === c);
    if (idx >= 0) {
      setI(idx);
      setPlaying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case " ":
        e.preventDefault();
        setPlaying(!playing);
        break;
      case "ArrowLeft":
        e.preventDefault();
        setI((p) => (p - 1 + STEPS.length) % STEPS.length);
        setPlaying(false);
        break;
      case "ArrowRight":
        e.preventDefault();
        setI((p) => (p + 1) % STEPS.length);
        setPlaying(false);
        break;
      case "r":
      case "R":
        e.preventDefault();
        setI(0);
        setPlaying(true);
        break;
    }
  };

  const restart = () => {
    setI(0);
    setPlaying(true);
  };

  const next = () => {
    setI((p) => (p + 1) % STEPS.length);
    setPlaying(false);
  };

  const prev = () => {
    setI((p) => (p - 1 + STEPS.length) % STEPS.length);
    setPlaying(false);
  };

  if (reduce) {
    // Simple 4-card carousel fallback
    const [currentChapter, setCurrentChapter] = useState(0);
    const chapterStep = STEPS.findIndex(s => s.chapter === CHAPTERS[currentChapter]);
    
    return (
      <section aria-label="See it in action" className="w-full flex justify-center">
        <div className="relative w-[min(1280px,95vw)] aspect-[16/9] rounded-xl bg-gradient-to-br from-white to-slate-50 shadow-md overflow-hidden p-6">
          {/* Chapter header */}
          <div className="absolute left-6 top-6 z-20">
            <h3 className="text-lg sm:text-xl md:text-2xl font-semibold">{CHAPTER_META[CHAPTERS[currentChapter]].title}</h3>
            <p className="text-slate-600">{CHAPTER_META[CHAPTERS[currentChapter]].subtitle}</p>
          </div>

          {/* Frame */}
          <img
            alt=""
            className="absolute inset-0 w-full h-full object-contain select-none"
            src={`/demo/${STEPS[chapterStep].img}`}
          />

          {/* Controls */}
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                aria-label="Previous chapter"
                className="p-2 bg-white/80 rounded-lg shadow-sm hover:bg-white transition-colors"
                onClick={() => setCurrentChapter((p) => (p - 1 + 4) % 4)}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                aria-label="Next chapter"
                className="p-2 bg-white/80 rounded-lg shadow-sm hover:bg-white transition-colors"
                onClick={() => setCurrentChapter((p) => (p + 1) % 4)}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Progress dots */}
            <div className="flex gap-2">
              {CHAPTERS.map((_, idx) => (
                <button
                  aria-label={`Go to chapter ${idx + 1}`}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    idx === currentChapter
                      ? "bg-purple-500"
                      : "bg-slate-300 hover:bg-slate-400"
                  }`}
                  key={idx}
                  onClick={() => setCurrentChapter(idx)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      aria-label="See it in action" 
      className="w-full flex justify-center"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="relative w-[min(1280px,95vw)] aspect-[16/9] rounded-xl bg-gradient-to-br from-white to-slate-50 shadow-md overflow-hidden p-6">
        {/* Chapter header */}
        <div className="absolute left-6 top-6 z-20">
          <AnimatePresence mode="wait">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              initial={{ opacity: 0, y: -10 }}
              key={step.chapter}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-lg sm:text-xl md:text-2xl font-semibold">{chapter.title}</h3>
              <p className="text-slate-600">{chapter.subtitle}</p>
            </motion.div>
          </AnimatePresence>
        </div>

                  {/* Frame */}
          <AnimatePresence mode="wait">
            <motion.img
              alt=""
              animate={{ opacity: 1 }}
              className="absolute inset-0 w-full h-full object-contain select-none"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key={step.img}
              src={`/demo/${step.img}`}
              transition={{ duration: 0.35 }}
            />
          </AnimatePresence>

        {/* Focus rect */}
        {step.focusRect && (
          <div
            className="absolute rounded-xl ring-4 ring-purple-300/40"
            style={{
              left: `${step.focusRect.x}%`,
              top: `${step.focusRect.y}%`,
              width: `${step.focusRect.w}%`,
              height: `${step.focusRect.h}%`,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.06)",
            }}
          />
        )}

        {/* Typing bubble / loader */}
        {step.typeText && (
          <TypeBubble anchor={step.cursor} text={step.typeText} />
        )}
        {step.loader && <Loader kind={step.chapter} />}

        {/* Cursor */}
        {step.cursor && (
          <Cursor click={step.click} x={step.cursor.x} y={step.cursor.y} />
        )}

        {/* Controls */}
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              aria-label={playing ? "Pause" : "Play"}
              className="p-2 bg-white/80 rounded-lg shadow-sm hover:bg-white transition-colors"
              onClick={() => setPlaying(!playing)}
            >
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button
              aria-label="Restart"
              className="p-2 bg-white/80 rounded-lg shadow-sm hover:bg-white transition-colors"
              onClick={restart}
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              aria-label="Previous step"
              className="p-2 bg-white/80 rounded-lg shadow-sm hover:bg-white transition-colors"
              onClick={prev}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              aria-label="Next step"
              className="p-2 bg-white/80 rounded-lg shadow-sm hover:bg-white transition-colors"
              onClick={next}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Progress dots */}
          <div className="flex gap-2">
            {CHAPTERS.map((chapterKey, idx) => {
              const chapterStart = STEPS.findIndex(s => s.chapter === chapterKey);
              const chapterEnd = STEPS.findIndex(s => s.chapter === chapterKey, chapterStart + 1);
              const isActive = i >= chapterStart && (chapterEnd === -1 || i < chapterEnd);
              const isCurrent = step.chapter === chapterKey;
              
              return (
                <button
                  aria-label={`Go to ${CHAPTER_META[chapterKey].title}`}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    isCurrent
                      ? "bg-purple-500"
                      : isActive
                      ? "bg-purple-300"
                      : "bg-slate-300 hover:bg-slate-400"
                  }`}
                  key={idx}
                  onClick={() => jumpToChapter(chapterKey)}
                />
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-3">
          <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
            Start Styling Free →
          </button>
          <button className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors text-sm">
            Watch Full Demo
          </button>
        </div>
      </div>
    </section>
  );
}

function Cursor({ x, y, click }: { x: number; y: number; click?: boolean }) {
  return (
    <motion.div
      animate={{ scale: click ? 0.92 : 1 }}
      className="z-30 absolute w-5 h-5 rounded-full bg-white border border-slate-300 shadow-sm"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)"
      }}
      transition={{ type: "spring", stiffness: 180, damping: 25 }}
    >
      {click && (
        <motion.span
          animate={{ scale: 2, opacity: 0 }}
          className="absolute inset-0 rounded-full ring-2 ring-purple-400/60"
          initial={{ scale: 1, opacity: 0.8 }}
          transition={{ duration: 0.6 }}
        />
      )}
    </motion.div>
  );
}

function TypeBubble({ text, anchor }: { text: string; anchor?: { x: number; y: number } }) {
  const [displayText, setDisplayText] = useState("");
  
  useEffect(() => {
    setDisplayText("");
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 35);
    
    return () => clearInterval(interval);
  }, [text]);

  if (!anchor) return null;

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className="absolute z-20 bg-slate-800 text-white px-3 py-2 rounded-lg text-sm shadow-sm"
      initial={{ opacity: 0, scale: 0.8 }}
      style={{
        left: `${anchor.x}%`,
        top: `${anchor.y}%`,
        transform: "translate(-50%, -120%)"
      }}
      transition={{ duration: 0.2 }}
    >
      {displayText}
      <span className="animate-pulse">|</span>
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800" />
    </motion.div>
  );
}

function Loader({ kind }: { kind: "chatbot" | "tryon" | "wardrobe" | "ootd" }) {
  if (kind === "chatbot") {
    return (
      <div className="absolute bottom-6 left-6 z-20">
        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  if (kind === "tryon") {
    return (
      <div className="absolute top-1/2 right-1/3 transform -translate-y-1/2 z-20">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return null;
}
