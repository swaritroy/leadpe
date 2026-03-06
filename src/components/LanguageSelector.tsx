import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Language, languageLabels } from "@/lib/trialSequence";

interface LanguageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (language: Language) => void;
  currentLanguage?: Language;
  title?: string;
  subtitle?: string;
}

export function LanguageSelector({
  isOpen,
  onClose,
  onSelect,
  currentLanguage = "hinglish",
  title = "Choose your preferred language",
  subtitle = "Apni pasandeeda bhasha chunein",
}: LanguageSelectorProps) {
  const languages: Language[] = ["english", "hindi", "hinglish"];

  const handleSelect = (lang: Language) => {
    onSelect(lang);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-sm rounded-2xl border-2 p-6"
            style={{ 
              backgroundColor: "#101810", 
              borderColor: "#00E676",
              boxShadow: "0 0 40px rgba(0, 230, 118, 0.2)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🌐</div>
              <h2 className="text-xl font-bold font-display mb-1">{title}</h2>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>

            {/* Language Buttons */}
            <div className="space-y-3">
              {languages.map((lang) => {
                const { flag, label, native } = languageLabels[lang];
                const isSelected = currentLanguage === lang;

                return (
                  <button
                    key={lang}
                    onClick={() => handleSelect(lang)}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                      isSelected
                        ? "border-[#00E676]"
                        : "border-border hover:border-[#00E676]/50"
                    }`}
                    style={{ 
                      backgroundColor: isSelected ? "rgba(0, 230, 118, 0.1)" : "#080C09"
                    }}
                  >
                    <span className="text-2xl">{flag}</span>
                    <div className="text-left flex-1">
                      <div className={`font-medium ${isSelected ? "text-[#00E676]" : ""}`}>
                        {label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {native}
                      </div>
                    </div>
                    {isSelected && (
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "#00E676" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Close Button */}
            <Button
              onClick={onClose}
              className="w-full mt-6 h-12 rounded-xl text-black font-semibold"
              style={{ backgroundColor: "#00E676" }}
            >
              Done / हो गया
            </Button>

            {/* Footer Note */}
            <p className="text-xs text-center text-muted-foreground mt-4">
              You can change this anytime from settings<br />
              आप इसे कभी भी सेटिंग्स से बदल सकते हैं
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
