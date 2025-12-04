/**
 * MessageBubble Component
 *
 * Renders a single message in WhatsApp-style bubble.
 * Supports text, interactive buttons, and interactive list messages.
 */

import { useCallback } from 'react';
import type {
  TestMessage,
  InteractiveContent,
  InteractiveButton,
  InteractiveListSection,
  FlowContent,
} from '../../types/tester.types';

interface MessageBubbleProps {
  message: TestMessage;
  /** Callback when user clicks an interactive button */
  onButtonClick?: (buttonId: string, buttonTitle: string) => void;
  /** Callback when user selects a list item */
  onListItemSelect?: (itemId: string, itemTitle: string) => void;
  /** Callback when user initiates a flow */
  onFlowStart?: (flowId: string) => void;
  /** Show node info badge */
  showNodeInfo?: boolean;
}

/**
 * Format timestamp to readable time
 */
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Get status icon for message
 */
function StatusIcon({ status }: { status?: TestMessage['status'] }) {
  if (!status) return null;

  const iconMap: Record<NonNullable<TestMessage['status']>, { icon: string; color: string }> = {
    sending: { icon: 'schedule', color: 'text-gray-500' },
    sent: { icon: 'done', color: 'text-gray-500' },
    delivered: { icon: 'done_all', color: 'text-gray-500' },
    read: { icon: 'done_all', color: 'text-[#53bdeb]' },
    failed: { icon: 'error', color: 'text-red-500' },
  };

  const { icon, color } = iconMap[status] || iconMap.sent;

  return (
    <span className={`material-symbols-outlined text-[14px] ${color}`}>
      {icon}
    </span>
  );
}

/**
 * Render text message content
 */
function TextContent({ content }: { content: string }) {
  return <p className="text-sm whitespace-pre-wrap break-words">{content}</p>;
}

/**
 * Render interactive buttons
 */
function InteractiveButtons({
  buttons,
  onButtonClick,
  disabled,
}: {
  buttons: InteractiveButton[];
  onButtonClick?: (buttonId: string, buttonTitle: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-2 flex flex-col gap-2">
      {buttons.map((button) => (
        <button
          key={button.id}
          onClick={() => onButtonClick?.(button.id, button.title)}
          disabled={disabled}
          className={`
            bg-gray-600 text-emerald-400 py-2 px-4 rounded shadow-sm
            text-sm font-medium transition-colors border border-gray-500
            ${disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-gray-500 cursor-pointer'
            }
          `}
        >
          {button.title}
        </button>
      ))}
    </div>
  );
}

/**
 * Render interactive list sections
 */
function InteractiveList({
  sections,
  buttonText,
  onListItemSelect,
  disabled,
}: {
  sections: InteractiveListSection[];
  buttonText?: string;
  onListItemSelect?: (itemId: string, itemTitle: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-2">
      {/* List button - in a real implementation this would open a modal */}
      <button
        disabled={disabled}
        className={`
          w-full bg-gray-600 text-emerald-400 py-2 px-4 rounded shadow-sm
          text-sm font-medium transition-colors border border-gray-500
          ${disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-gray-500 cursor-pointer'
          }
        `}
      >
        <span className="material-symbols-outlined text-base align-middle mr-1">
          list
        </span>
        {buttonText || 'View Options'}
      </button>

      {/* Show list items inline for tester visibility */}
      <div className="mt-2 space-y-1">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            <p className="text-xs text-gray-400 font-medium">{section.title}</p>
            {section.rows.map((row) => (
              <button
                key={row.id}
                onClick={() => onListItemSelect?.(row.id, row.title)}
                disabled={disabled}
                className={`
                  w-full text-left bg-gray-600/50 px-3 py-2 rounded text-sm
                  transition-colors border border-gray-600
                  ${disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-500/50 cursor-pointer'
                  }
                `}
              >
                <span className="text-gray-100">{row.title}</span>
                {row.description && (
                  <span className="block text-xs text-gray-400 mt-0.5">
                    {row.description}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Render interactive message content
 */
function InteractiveMessageContent({
  content,
  onButtonClick,
  onListItemSelect,
  disabled,
}: {
  content: InteractiveContent;
  onButtonClick?: (buttonId: string, buttonTitle: string) => void;
  onListItemSelect?: (itemId: string, itemTitle: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-[200px]">
      {/* Header */}
      {content.header && (
        <p className="text-sm font-bold text-gray-100">{content.header}</p>
      )}

      {/* Body */}
      <p className="text-sm whitespace-pre-wrap">{content.body}</p>

      {/* Footer */}
      {content.footer && (
        <p className="text-xs text-gray-400 mt-1">{content.footer}</p>
      )}

      {/* Buttons */}
      {content.type === 'buttons' && content.buttons && (
        <InteractiveButtons
          buttons={content.buttons}
          onButtonClick={onButtonClick}
          disabled={disabled}
        />
      )}

      {/* List */}
      {content.type === 'list' && content.sections && (
        <InteractiveList
          sections={content.sections}
          buttonText={content.listButtonText}
          onListItemSelect={onListItemSelect}
          disabled={disabled}
        />
      )}
    </div>
  );
}

/**
 * Render WhatsApp Flow content
 */
function FlowMessageContent({
  content,
  onFlowStart,
  disabled,
}: {
  content: FlowContent;
  onFlowStart?: (flowId: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-[200px]">
      {/* Header */}
      {content.headerText && (
        <p className="text-sm font-bold text-gray-100">{content.headerText}</p>
      )}

      {/* Body */}
      <p className="text-sm whitespace-pre-wrap">{content.bodyText}</p>

      {/* Footer */}
      {content.footerText && (
        <p className="text-xs text-gray-400 mt-1">{content.footerText}</p>
      )}

      {/* CTA Button */}
      <button
        onClick={() => onFlowStart?.(content.flowId)}
        disabled={disabled}
        className={`
          mt-2 w-full bg-emerald-600 text-white py-2 px-4 rounded shadow-sm
          text-sm font-medium transition-colors
          ${disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-emerald-500 cursor-pointer'
          }
        `}
      >
        <span className="material-symbols-outlined text-base align-middle mr-1">
          open_in_new
        </span>
        {content.ctaText}
      </button>

      {/* Flow info badge */}
      {content.flowName && (
        <div className="flex items-center gap-1 mt-1">
          <span className="material-symbols-outlined text-xs text-gray-500">
            account_tree
          </span>
          <span className="text-xs text-gray-500">
            {content.flowName}
            {content.mode && ` (${content.mode})`}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Node info badge component
 */
function NodeInfoBadge({ nodeId, nodeName }: { nodeId?: string; nodeName?: string }) {
  if (!nodeId && !nodeName) return null;

  return (
    <div className="flex items-center gap-1 mt-1 opacity-60">
      <span className="material-symbols-outlined text-xs">
        account_tree
      </span>
      <span className="text-xs truncate max-w-[150px]">
        {nodeName || nodeId}
      </span>
    </div>
  );
}

/**
 * MessageBubble - Main component
 */
export function MessageBubble({
  message,
  onButtonClick,
  onListItemSelect,
  onFlowStart,
  showNodeInfo = false,
}: MessageBubbleProps) {
  const { type, content, isFromBot, timestamp, status, nodeId, nodeName } = message;

  // Determine bubble position and styling
  const isBot = isFromBot;
  const bubblePosition = isBot ? 'justify-start' : 'justify-end';
  const bubbleStyle = isBot
    ? 'bg-gray-700 text-gray-100 rounded-tl-none'
    : 'bg-emerald-600 text-gray-100 rounded-tr-none';

  // Render content based on message type
  const renderContent = useCallback(() => {
    switch (type) {
      case 'text':
        return <TextContent content={content as string} />;

      case 'interactive':
        return (
          <InteractiveMessageContent
            content={content as InteractiveContent}
            onButtonClick={onButtonClick}
            onListItemSelect={onListItemSelect}
            disabled={!isBot} // Only bot messages have clickable buttons
          />
        );

      case 'flow':
        return (
          <FlowMessageContent
            content={content as FlowContent}
            onFlowStart={onFlowStart}
            disabled={!isBot}
          />
        );

      default:
        return (
          <p className="text-sm">
            {typeof content === 'string' ? content : JSON.stringify(content)}
          </p>
        );
    }
  }, [type, content, isBot, onButtonClick, onListItemSelect, onFlowStart]);

  return (
    <div className={`flex ${bubblePosition} mb-1`}>
      <div
        className={`max-w-[75%] rounded-lg px-3 py-2 shadow-sm ${bubbleStyle}`}
      >
        {/* Message content */}
        {renderContent()}

        {/* Node info (optional) */}
        {showNodeInfo && isBot && (
          <NodeInfoBadge nodeId={nodeId} nodeName={nodeName} />
        )}

        {/* Footer: timestamp and status */}
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] text-gray-400">{formatTime(timestamp)}</span>
          {!isBot && <StatusIcon status={status} />}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
