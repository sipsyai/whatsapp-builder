import React from 'react';
import type { ReactNode } from 'react';

interface PlatformPhoneFrameProps {
  platform: 'android' | 'ios';
  theme: 'light' | 'dark';
  children: ReactNode;
  className?: string;
}

export const PlatformPhoneFrame: React.FC<PlatformPhoneFrameProps> = ({
  platform,
  theme,
  children,
  className = '',
}) => {
  const isIOS = platform === 'ios';
  const isDark = theme === 'dark';

  // Theme classes
  const frameTheme = isDark
    ? 'bg-zinc-900 text-white'
    : 'bg-white text-zinc-900';

  const statusBarTheme = isDark
    ? 'text-white/90'
    : 'text-zinc-900/90';

  // Get current time for status bar
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div
      className={`relative mx-auto transition-all duration-300 ${className}`}
      style={{
        width: isIOS ? '375px' : '360px',
        maxWidth: '100%',
        aspectRatio: isIOS ? '375/812' : '360/780',
      }}
    >
      {/* Phone Frame Container */}
      <div
        className={`relative h-full ${frameTheme} shadow-2xl overflow-hidden transition-colors duration-300`}
        style={{
          borderRadius: isIOS ? '44px' : '24px',
          border: isDark ? '8px solid #18181b' : '8px solid #e4e4e7',
        }}
      >
        {/* iOS Components */}
        {isIOS && (
          <>
            {/* Dynamic Island */}
            <div
              className={`absolute top-0 left-1/2 -translate-x-1/2 z-20 ${
                isDark ? 'bg-black' : 'bg-zinc-900'
              }`}
              style={{
                width: '126px',
                height: '37px',
                borderRadius: '0 0 20px 20px',
              }}
            >
              {/* Camera and sensors */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
                <div
                  className="bg-zinc-800 rounded-full"
                  style={{ width: '8px', height: '8px' }}
                />
                <div
                  className="bg-zinc-700 rounded-full"
                  style={{ width: '10px', height: '10px' }}
                />
              </div>
            </div>

            {/* iOS Status Bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-12 flex items-end justify-between px-8 pb-1 z-10 ${statusBarTheme}`}
              style={{ fontSize: '14px', fontWeight: 600 }}
            >
              {/* Time - Left */}
              <div>{currentTime}</div>

              {/* Icons - Right */}
              <div className="flex items-center gap-1">
                {/* Cellular Signal */}
                <div className="flex items-end gap-0.5" style={{ height: '12px' }}>
                  <div className="w-0.5 h-1/4 bg-current rounded-sm" />
                  <div className="w-0.5 h-2/4 bg-current rounded-sm" />
                  <div className="w-0.5 h-3/4 bg-current rounded-sm" />
                  <div className="w-0.5 h-full bg-current rounded-sm" />
                </div>

                {/* WiFi */}
                <svg
                  className="w-4 h-4 ml-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 3.5c-3.59 0-6.89 1.47-9.27 3.85a.75.75 0 101.06 1.06A9.5 9.5 0 0110 5a9.5 9.5 0 018.21 3.41.75.75 0 001.06-1.06A11 11 0 0010 3.5zm0 3a8.5 8.5 0 00-5.66 2.15.75.75 0 001.02 1.1A7 7 0 0110 8a7 7 0 014.64 1.75.75.75 0 101.02-1.1A8.5 8.5 0 0010 6.5zm0 3a5.5 5.5 0 00-3.66 1.39.75.75 0 10.99 1.12A4 4 0 0110 11a4 4 0 012.67 1.01.75.75 0 10.99-1.12A5.5 5.5 0 0010 9.5zm0 3a2.5 2.5 0 00-1.67.63.75.75 0 101 1.12.5.5 0 01.67 0 .75.75 0 101-1.12A2.5 2.5 0 0010 12.5z" />
                </svg>

                {/* Battery */}
                <div className="ml-1 flex items-center">
                  <div
                    className="border-2 border-current rounded-sm flex items-center justify-end pr-0.5"
                    style={{ width: '24px', height: '11px' }}
                  >
                    <div
                      className="bg-current rounded-sm"
                      style={{ width: '80%', height: '7px' }}
                    />
                  </div>
                  <div
                    className="bg-current rounded-r-sm"
                    style={{ width: '2px', height: '5px', marginLeft: '1px' }}
                  />
                </div>

                {/* Battery percentage */}
                <span className="ml-1 text-xs">100%</span>
              </div>
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
              <div
                className={`${
                  isDark ? 'bg-white/30' : 'bg-zinc-900/30'
                } rounded-full`}
                style={{ width: '134px', height: '5px' }}
              />
            </div>
          </>
        )}

        {/* Android Components */}
        {!isIOS && (
          <>
            {/* Punch-hole Camera */}
            <div
              className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-black rounded-full"
              style={{ width: '12px', height: '12px' }}
            >
              <div
                className="absolute inset-0.5 bg-zinc-800 rounded-full"
                style={{ width: '11px', height: '11px' }}
              />
            </div>

            {/* Android Status Bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-10 flex items-center justify-between px-6 z-10 ${statusBarTheme}`}
              style={{ fontSize: '13px', fontWeight: 500 }}
            >
              {/* Icons - Left */}
              <div className="flex items-center gap-2">
                {/* Time */}
                <div>{currentTime}</div>

                {/* Notification icons */}
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
              </div>

              {/* System Icons - Right */}
              <div className="flex items-center gap-2">
                {/* WiFi */}
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 3.5c-3.59 0-6.89 1.47-9.27 3.85a.75.75 0 101.06 1.06A9.5 9.5 0 0110 5a9.5 9.5 0 018.21 3.41.75.75 0 001.06-1.06A11 11 0 0010 3.5z" />
                </svg>

                {/* Cellular Signal */}
                <div className="flex items-end gap-0.5" style={{ height: '11px' }}>
                  <div className="w-0.5 h-1/4 bg-current rounded-sm" />
                  <div className="w-0.5 h-2/4 bg-current rounded-sm" />
                  <div className="w-0.5 h-3/4 bg-current rounded-sm" />
                  <div className="w-0.5 h-full bg-current rounded-sm" />
                </div>

                {/* Battery */}
                <div className="flex items-center">
                  <div
                    className="border-2 border-current rounded-sm flex items-center justify-end pr-0.5"
                    style={{ width: '20px', height: '10px' }}
                  >
                    <div
                      className="bg-current rounded-sm"
                      style={{ width: '75%', height: '6px' }}
                    />
                  </div>
                  <div
                    className="bg-current rounded-r-sm"
                    style={{ width: '2px', height: '4px', marginLeft: '1px' }}
                  />
                </div>
              </div>
            </div>

            {/* Navigation Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-12 flex items-center justify-center gap-12 z-10">
              {/* Back Button */}
              <div className={`${isDark ? 'text-white/60' : 'text-zinc-900/60'}`}>
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </div>

              {/* Home Button */}
              <div className={`${isDark ? 'text-white/60' : 'text-zinc-900/60'}`}>
                <div
                  className="border-2 border-current rounded-full"
                  style={{ width: '24px', height: '24px' }}
                />
              </div>

              {/* Recent Apps Button */}
              <div className={`${isDark ? 'text-white/60' : 'text-zinc-900/60'}`}>
                <div
                  className="border-2 border-current rounded"
                  style={{ width: '20px', height: '20px' }}
                />
              </div>
            </div>
          </>
        )}

        {/* Content Area */}
        <div
          className="absolute inset-0 overflow-y-auto"
          style={{
            top: isIOS ? '48px' : '40px',
            bottom: isIOS ? '20px' : '48px',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
