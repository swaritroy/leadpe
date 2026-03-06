import { useEffect, useState } from "react";

const DASHBOARD_ROUTES = [
  "/client/dashboard",
  "/client/settings",
  "/dev/dashboard",
  "/admin",
];

const SIGNUP_ROUTES = ["/auth", "/select-role"];

export default function WhatsAppButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSignupPage, setIsSignupPage] = useState(false);

  useEffect(() => {
    // Check if on dashboard page
    const path = window.location.pathname;
    const isDashboard = DASHBOARD_ROUTES.some((route) =>
      path.startsWith(route)
    );

    if (isDashboard) return;

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Check if signup page (for mobile positioning)
    const isSignup = SIGNUP_ROUTES.some((route) => path.startsWith(route));
    setIsSignupPage(isSignup);

    // Slide in after 2.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const handleClick = () => {
    const message = encodeURIComponent(
      "Hi LeadPe! I want to know more about getting my business online."
    );
    window.open(
      `https://wa.me/919973383902?text=${message}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  if (!isVisible) return null;

  const isBottomLeft = isMobile && isSignupPage;

  return (
    <>
      {/* Tooltip for desktop */}
      {!isMobile && (
        <div
          className={`
            fixed z-[9999] pointer-events-none
            transition-opacity duration-200 ease-out
            ${isBottomLeft ? "left-20 bottom-8" : "right-20 bottom-8"}
          `}
          style={{
            opacity: 0,
            animation: "none",
          }}
          onMouseEnter={(e) => {
            const tooltip = e.currentTarget;
            tooltip.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            const tooltip = e.currentTarget;
            tooltip.style.opacity = "0";
          }}
          id="whatsapp-tooltip"
        >
          <div
            className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap"
            style={{
              opacity: 0,
              transition: "opacity 200ms ease-out",
            }}
          >
            Chat with us
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-0 h-0 
                border-t-[6px] border-t-transparent 
                border-b-[6px] border-b-transparent
                ${isBottomLeft ? "-left-[6px] border-r-[6px] border-r-gray-900" : "-right-[6px] border-l-[6px] border-l-gray-900"}`}
            />
          </div>
        </div>
      )}

      {/* WhatsApp Button */}
      <button
        onClick={handleClick}
        className={`
          fixed z-[9999] rounded-full flex items-center justify-center
          bg-[#25D366] hover:bg-[#22c55e]
          transition-all duration-400 ease-out
          animate-pulse-ring
          ${isBottomLeft ? "left-6 bottom-6" : "right-6 bottom-6"}
          ${isMobile ? "w-[50px] h-[50px]" : "w-[56px] h-[56px]"}
          ${isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}
        `}
        style={{
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
        aria-label="Chat on WhatsApp"
        onMouseEnter={() => {
          if (!isMobile) {
            const tooltip = document.getElementById("whatsapp-tooltip");
            if (tooltip) {
              const inner = tooltip.querySelector("div");
              if (inner) (inner as HTMLElement).style.opacity = "1";
            }
          }
        }}
        onMouseLeave={() => {
          if (!isMobile) {
            const tooltip = document.getElementById("whatsapp-tooltip");
            if (tooltip) {
              const inner = tooltip.querySelector("div");
              if (inner) (inner as HTMLElement).style.opacity = "0";
            }
          }
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="white"
          className={isMobile ? "w-6 h-6" : "w-7 h-7"}
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </button>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.4);
          }
          70% {
            box-shadow: 0 0 0 12px rgba(37, 211, 102, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(37, 211, 102, 0);
          }
        }
        .animate-pulse-ring {
          animation: pulse-ring 3s infinite;
        }
      `}</style>
    </>
  );
}
