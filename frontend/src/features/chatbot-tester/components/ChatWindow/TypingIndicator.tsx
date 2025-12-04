/**
 * TypingIndicator Component
 *
 * Displays a WhatsApp-style typing indicator with animated dots
 * and "Bot is typing..." text.
 */

interface TypingIndicatorProps {
  /** Optional custom text instead of default */
  text?: string;
}

export function TypingIndicator({ text = 'Bot is typing' }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start mb-1">
      <div className="bg-gray-700 text-gray-100 rounded-lg rounded-tl-none px-3 py-2 shadow-sm max-w-[65%]">
        <div className="flex items-center gap-2">
          {/* Animated dots */}
          <div className="flex items-center gap-1">
            <span
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '0ms', animationDuration: '600ms' }}
            />
            <span
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '150ms', animationDuration: '600ms' }}
            />
            <span
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '300ms', animationDuration: '600ms' }}
            />
          </div>
          {/* Text */}
          <span className="text-xs text-gray-400 ml-1">{text}...</span>
        </div>
      </div>
    </div>
  );
}

export default TypingIndicator;
