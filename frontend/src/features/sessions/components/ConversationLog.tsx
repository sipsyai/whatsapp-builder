import { useEffect, useRef } from 'react';
import type { SessionMessage } from '../../../types/sessions';

interface ConversationLogProps {
  messages: SessionMessage[];
  isActive: boolean;
}

// Fallback: eğer isFromBot gelmezse content'e göre tahmin et
const determineIsFromBot = (message: SessionMessage): boolean => {
  const content = message.content;

  // Kullanıcı yanıt tipleri - kesinlikle kullanıcıdan
  if (content?.type === 'button_reply' ||
      content?.type === 'list_reply' ||
      content?.type === 'nfm_reply') {
    return false;
  }

  // Interactive message with action - bot'tan
  if (message.type === 'interactive' && content?.action) {
    return true;
  }

  // senderName 'Business' ise bot
  if (message.senderName === 'Business') {
    return true;
  }

  // senderPhone varsa ve Business değilse kullanıcı
  if (message.senderPhone && message.senderName !== 'Business') {
    return false;
  }

  // Default: bot varsay
  return true;
};

export const ConversationLog = ({ messages, isActive }: ConversationLogProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const renderMessageContent = (message: SessionMessage) => {
    const content = message.content;

    // Handle different message types
    switch (message.type) {
      case 'text':
        const textBody = typeof content === 'string' ? content : content?.body || content?.text || '';
        return <p className="text-sm whitespace-pre-wrap">{textBody}</p>;

      case 'interactive':
        // Check if this is a user response (button_reply or list_reply)
        if (content?.type === 'button_reply') {
          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">touch_app</span>
                <p className="text-sm font-medium">
                  {content.buttonTitle || content.button_reply?.title || 'Button'}
                </p>
              </div>
              {content.buttonId && (
                <p className="text-xs opacity-60">ID: {content.buttonId}</p>
              )}
              <p className="text-xs opacity-75">Button response</p>
            </div>
          );
        } else if (content?.type === 'list_reply') {
          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">list</span>
                <p className="text-sm font-medium">
                  {content.listTitle || content.list_reply?.title || 'List item'}
                </p>
              </div>
              {content.listDescription && (
                <p className="text-xs opacity-75">{content.listDescription}</p>
              )}
              {content.listId && (
                <p className="text-xs opacity-60">ID: {content.listId}</p>
              )}
              <p className="text-xs opacity-75">List response</p>
            </div>
          );
        } else if (content?.type === 'nfm_reply') {
          // WhatsApp Flow yanıtı
          // Backend sends responseData, but also check response_json for compatibility
          const flowData = content.responseData || content.response_json;
          const parsedData = typeof flowData === 'string' ? JSON.parse(flowData) : flowData;

          // Filter out internal fields like flow_token
          const displayData = parsedData ? Object.fromEntries(
            Object.entries(parsedData).filter(([key]) => !['flow_token', 'version'].includes(key))
          ) : null;

          return (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-green-600">check_circle</span>
                <p className="text-sm font-medium">Form Completed</p>
              </div>
              {content.body && (
                <p className="text-xs opacity-75">{content.body}</p>
              )}
              {displayData && Object.keys(displayData).length > 0 && (
                <details className="text-xs" open>
                  <summary className="cursor-pointer font-medium text-blue-600 hover:underline">
                    View form data ({Object.keys(displayData).length} fields)
                  </summary>
                  <div className="mt-2 space-y-1.5 bg-gray-900 p-2 rounded">
                    {Object.entries(displayData).map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-2">
                        <span className="text-gray-500 font-medium">{key}:</span>
                        <span className="text-gray-900 text-right">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          );
        }

        // Bot's interactive message
        return (
          <div className="flex flex-col gap-2">
            {content?.header && (
              <p className="text-sm font-bold">{content.header.text || content.header}</p>
            )}
            <p className="text-sm">{content?.body?.text || content?.body || 'Interactive message'}</p>
            {content?.footer && (
              <p className="text-xs opacity-75">{content.footer.text || content.footer}</p>
            )}
            {content?.action?.buttons && (
              <div className="flex flex-col gap-1 mt-1">
                {content.action.buttons.map((btn: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-black/10 px-3 py-1.5 rounded text-xs text-center"
                  >
                    {btn.reply?.title || btn.title || 'Button'}
                  </div>
                ))}
              </div>
            )}
            {content?.action?.sections && (
              <div className="bg-black/10 px-3 py-1.5 rounded text-xs text-center">
                {content.action.button || 'View List'}
              </div>
            )}
          </div>
        );

      case 'flow':
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">dynamic_form</span>
              <p className="text-sm font-medium">Form submitted</p>
            </div>
            {content?.data && (
              <pre className="text-xs opacity-75 bg-white/10 p-2 rounded mt-1 overflow-x-auto">
                {JSON.stringify(content.data, null, 2)}
              </pre>
            )}
          </div>
        );

      case 'image':
        return (
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">image</span>
            <span className="text-sm">Image</span>
            {content?.caption && <span className="text-xs opacity-75">- {content.caption}</span>}
          </div>
        );

      case 'video':
        return (
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">videocam</span>
            <span className="text-sm">Video</span>
            {content?.caption && <span className="text-xs opacity-75">- {content.caption}</span>}
          </div>
        );

      case 'document':
        return (
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">description</span>
            <span className="text-sm">{content?.filename || 'Document'}</span>
          </div>
        );

      case 'audio':
        return (
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">mic</span>
            <span className="text-sm">Voice message</span>
          </div>
        );

      default:
        return (
          <p className="text-sm">
            {typeof content === 'string' ? content : JSON.stringify(content)}
          </p>
        );
    }
  };

  const groupMessagesByDate = () => {
    const groups: { [key: string]: SessionMessage[] } = {};
    messages.forEach((message) => {
      const dateKey = formatDate(message.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined">chat</span>
            Conversation Log
          </h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-xs text-gray-500">
              {isActive ? 'Active' : 'Ended'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <span className="material-symbols-outlined text-4xl mb-2">chat_bubble_outline</span>
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          <>
            {Object.entries(messageGroups).map(([date, msgs]) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-bg-gray-800 px-3 py-1 rounded-full shadow-sm">
                    <span className="text-xs font-medium text-gray-600">
                      {date}
                    </span>
                  </div>
                </div>

                {/* Messages for this date */}
                <div className="space-y-2">
                  {msgs.map((message) => {
                    // Determine if message is from bot (left) or user (right)
                    // Adjust this logic based on your actual sender identification
                    const isFromBot = message.isFromBot ?? determineIsFromBot(message);

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isFromBot ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-lg px-3 py-2 shadow-sm ${
                            isFromBot
                              ? 'bg-bg-gray-800 text-gray-900 rounded-tl-none'
                              : 'bg-green-600 text-white rounded-tr-none'
                          }`}
                        >
                          {/* Sender name for bot messages */}
                          {isFromBot && message.senderName && (
                            <p className="text-xs font-semibold text-blue-600 mb-1">
                              {message.senderName}
                            </p>
                          )}

                          {/* Message content */}
                          <div className="mb-1">{renderMessageContent(message)}</div>

                          {/* Timestamp and status */}
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className={`text-[10px] ${isFromBot ? 'text-gray-500' : 'text-white/80'}`}>
                              {formatTime(message.timestamp)}
                            </span>
                            {!isFromBot && message.status && (
                              <span
                                className={`material-symbols-outlined text-[14px] ${
                                  message.status === 'read' ? 'text-blue-300' : 'text-white/60'
                                }`}
                              >
                                {message.status === 'read' ? 'done_all' : 'done'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  );
};
