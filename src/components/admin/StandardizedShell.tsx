import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Paintbrush, Type, Eye, Monitor, Smartphone, Tablet,
  Phone, MapPin, Clock, Star, ChevronRight
} from "lucide-react";

const FONT_OPTIONS = [
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "DM Sans", value: "'DM Sans', sans-serif" },
  { label: "Space Grotesk", value: "'Space Grotesk', sans-serif" },
  { label: "System UI", value: "system-ui, sans-serif" },
];

const COLOR_PRESETS = [
  { label: "Indigo", primary: "#6366f1", secondary: "#06b6d4" },
  { label: "Emerald", primary: "#10b981", secondary: "#3b82f6" },
  { label: "Rose", primary: "#f43f5e", secondary: "#a855f7" },
  { label: "Amber", primary: "#f59e0b", secondary: "#ef4444" },
];

const StandardizedShell = () => {
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [secondaryColor, setSecondaryColor] = useState("#06b6d4");
  const [selectedFont, setSelectedFont] = useState("Inter, sans-serif");
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const viewportWidth = viewport === "desktop" ? "100%" : viewport === "tablet" ? "768px" : "375px";

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gi-text flex items-center gap-2">
            <Paintbrush size={18} className="text-gi-indigo" />
            Standardized Shell
          </h2>
          <p className="text-sm text-gi-text-muted mt-0.5">Global styling engine — changes reflect in real-time</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar Controls */}
        <div className="space-y-5">
          {/* Color Pickers */}
          <div className="rounded-xl border border-gi-border bg-gi-surface p-4 space-y-4">
            <h3 className="text-xs font-semibold text-gi-text-secondary uppercase tracking-widest">Colors</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gi-text-muted mb-1.5 block">Primary</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded-md border border-gi-border cursor-pointer bg-transparent"
                  />
                  <span className="text-xs font-mono text-gi-text-secondary">{primaryColor}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gi-text-muted mb-1.5 block">Secondary</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-8 h-8 rounded-md border border-gi-border cursor-pointer bg-transparent"
                  />
                  <span className="text-xs font-mono text-gi-text-secondary">{secondaryColor}</span>
                </div>
              </div>
            </div>

            {/* Presets */}
            <div>
              <label className="text-xs font-medium text-gi-text-muted mb-2 block">Presets</label>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => { setPrimaryColor(preset.primary); setSecondaryColor(preset.secondary); }}
                    className="flex items-center gap-2 p-2 rounded-lg border border-gi-border hover:border-gi-indigo/40 transition-colors text-left"
                  >
                    <div className="flex -space-x-1">
                      <div className="w-4 h-4 rounded-full border-2 border-gi-surface" style={{ backgroundColor: preset.primary }} />
                      <div className="w-4 h-4 rounded-full border-2 border-gi-surface" style={{ backgroundColor: preset.secondary }} />
                    </div>
                    <span className="text-xs text-gi-text-secondary">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Font Selector */}
          <div className="rounded-xl border border-gi-border bg-gi-surface p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gi-text-secondary uppercase tracking-widest flex items-center gap-1.5">
              <Type size={12} /> Typography
            </h3>
            <div className="space-y-1.5">
              {FONT_OPTIONS.map((font) => (
                <button
                  key={font.value}
                  onClick={() => setSelectedFont(font.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedFont === font.value
                      ? "bg-gi-indigo/20 text-gi-text border border-gi-indigo/30"
                      : "text-gi-text-secondary hover:bg-gi-surface-hover border border-transparent"
                  }`}
                  style={{ fontFamily: font.value }}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </div>

          {/* Viewport Toggle */}
          <div className="rounded-xl border border-gi-border bg-gi-surface p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gi-text-secondary uppercase tracking-widest flex items-center gap-1.5">
              <Eye size={12} /> Preview
            </h3>
            <div className="flex gap-1">
              {[
                { key: "desktop" as const, icon: Monitor },
                { key: "tablet" as const, icon: Tablet },
                { key: "mobile" as const, icon: Smartphone },
              ].map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setViewport(key)}
                  className={`flex-1 flex items-center justify-center py-2 rounded-lg text-xs transition-colors ${
                    viewport === key
                      ? "bg-gi-indigo/20 text-gi-text"
                      : "text-gi-text-muted hover:text-gi-text-secondary"
                  }`}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview Window */}
        <div className="rounded-xl border border-gi-border bg-gi-surface overflow-hidden">
          {/* Browser Chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gi-border">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(0 72% 51%)" }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(38 92% 50%)" }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(160 84% 39%)" }} />
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-gi-bg rounded-md px-3 py-1 text-xs text-gi-text-muted font-mono">
                bright-smile-dental.synapseshift.com
              </div>
            </div>
          </div>

          {/* Content Block — inherits CSS variables from sidebar */}
          <div className="flex justify-center p-6 bg-gi-bg min-h-[400px]">
            <div
              style={{
                fontFamily: selectedFont,
                maxWidth: viewportWidth,
                width: "100%",
                ["--preview-primary" as string]: primaryColor,
                ["--preview-secondary" as string]: secondaryColor,
              }}
              className="rounded-xl overflow-hidden border border-gi-border"
            >
              {/* Mockup Nav */}
              <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: primaryColor }}>
                <span className="text-sm font-bold" style={{ color: "#fff" }}>Bright Smile Dental</span>
                <div className="flex gap-4">
                  {["Services", "About", "Contact"].map((item) => (
                    <span key={item} className="text-xs" style={{ color: "rgba(255,255,255,0.8)" }}>{item}</span>
                  ))}
                </div>
              </div>

              {/* Hero */}
              <div className="px-6 py-10 text-center" style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}10)` }}>
                <h1 className="text-2xl font-bold mb-2" style={{ color: primaryColor }}>
                  Your Smile, Our Passion
                </h1>
                <p className="text-sm text-gi-text-muted mb-4">Top-rated dental care in Springfield</p>
                <button
                  className="px-5 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: primaryColor, color: "#fff" }}
                >
                  Book Appointment
                </button>
              </div>

              {/* Info Row */}
              <div className="grid grid-cols-3 gap-px" style={{ backgroundColor: "hsl(var(--gi-border))" }}>
                {[
                  { icon: Phone, label: "(555) 000-1111" },
                  { icon: MapPin, label: "123 Main St" },
                  { icon: Clock, label: "Mon-Fri 9-6" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="bg-gi-surface p-4 text-center">
                    <Icon size={16} className="mx-auto mb-1" style={{ color: secondaryColor }} />
                    <span className="text-xs text-gi-text-secondary">{label}</span>
                  </div>
                ))}
              </div>

              {/* Reviews teaser */}
              <div className="px-6 py-5 bg-gi-surface border-t border-gi-border">
                <div className="flex items-center gap-1 justify-center mb-1">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} size={14} fill={secondaryColor} style={{ color: secondaryColor }} />
                  ))}
                </div>
                <p className="text-xs text-center text-gi-text-muted">4.9 / 5 — 127 Google Reviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandardizedShell;
