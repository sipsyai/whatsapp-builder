import type { ReactNode } from 'react';

/**
 * Props interface for PhoneFrame
 */
interface PhoneFrameProps {
  children: ReactNode;
  className?: string;
}

/**
 * PhoneFrame - iPhone 14 style mock frame for WhatsApp Flow preview
 *
 * Features:
 * - Rounded corners (40px radius)
 * - Dynamic Island notch
 * - Status bar with time, battery, wifi icons
 * - Safe area padding
 * - Responsive with max-height
 * - Dark mode support
 */
export function PhoneFrame({ children, className = '' }: PhoneFrameProps) {
  // Get current time for status bar
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className={`flex items-center justify-center p-6 ${className}`}>
      {/* Phone Device */}
      <div
        className="
          relative w-full max-w-[390px] aspect-[390/844]
          bg-white dark:bg-zinc-900
          rounded-[40px] shadow-2xl
          border-[8px] border-zinc-800 dark:border-zinc-700
          overflow-hidden
        "
        style={{ maxHeight: 'calc(100vh - 100px)' }}
      >
        {/* Dynamic Island / Notch */}
        <div
          className="
            absolute top-0 left-1/2 -translate-x-1/2 z-50
            w-[120px] h-[30px]
            bg-zinc-900 dark:bg-black
            rounded-b-[20px]
          "
        >
          {/* Camera */}
          <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[10px] h-[10px] bg-zinc-800 dark:bg-zinc-900 rounded-full" />
        </div>

        {/* Status Bar */}
        <div
          className="
            absolute top-0 left-0 right-0 z-40
            h-[54px] px-6
            flex items-center justify-between
            bg-gradient-to-b from-black/10 to-transparent dark:from-black/30
            text-zinc-900 dark:text-white
          "
        >
          {/* Time */}
          <div className="text-[15px] font-semibold pt-2">
            {currentTime}
          </div>

          {/* Status Icons */}
          <div className="flex items-center gap-1 pt-2">
            {/* Signal Strength */}
            <svg
              className="w-[17px] h-[12px] fill-current"
              viewBox="0 0 17 12"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="0" y="8" width="3" height="4" rx="1" />
              <rect x="5" y="6" width="3" height="6" rx="1" />
              <rect x="10" y="3" width="3" height="9" rx="1" />
              <rect x="15" y="0" width="2" height="12" rx="1" />
            </svg>

            {/* WiFi */}
            <svg
              className="w-[17px] h-[12px] fill-current"
              viewBox="0 0 17 12"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M8.5 12C9.328 12 10 11.328 10 10.5C10 9.672 9.328 9 8.5 9C7.672 9 7 9.672 7 10.5C7 11.328 7.672 12 8.5 12Z" />
              <path d="M8.5 6C10.433 6 12.231 6.758 13.571 8.071L12.5 9.142C11.543 8.185 10.271 7.5 8.5 7.5C6.729 7.5 5.457 8.185 4.5 9.142L3.429 8.071C4.769 6.758 6.567 6 8.5 6Z" />
              <path d="M8.5 2C11.538 2 14.316 3.231 16.364 5.279L15.293 6.35C13.628 4.685 11.194 3.5 8.5 3.5C5.806 3.5 3.372 4.685 1.707 6.35L0.636 5.279C2.684 3.231 5.462 2 8.5 2Z" />
            </svg>

            {/* Battery */}
            <svg
              className="w-[25px] h-[12px]"
              viewBox="0 0 25 12"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="0"
                y="0"
                width="22"
                height="12"
                rx="2.5"
                className="fill-none stroke-current stroke-[1.5]"
              />
              <rect x="2" y="2" width="18" height="8" rx="1" className="fill-current" />
              <rect x="23" y="4" width="2" height="4" rx="1" className="fill-current" />
            </svg>
          </div>
        </div>

        {/* Screen Content */}
        <div className="relative w-full h-full pt-[54px] bg-white dark:bg-zinc-900">
          {children}
        </div>
      </div>
    </div>
  );
}
