import { useMemo } from 'react';
import type { SessionMessage, ChatbotSessionDetail } from '../../../types/sessions';

interface TimelineEvent {
  id: string;
  type: 'message_user' | 'message_bot' | 'node_change' | 'status_change' | 'session_start' | 'session_end';
  timestamp: Date;
  title: string;
  description?: string;
  icon: string;
  iconColor: string;
  data?: any;
}

interface SessionTimelineProps {
  messages: SessionMessage[];
  session: ChatbotSessionDetail;
}

export const SessionTimeline = ({ messages, session }: SessionTimelineProps) => {
  // Build timeline events from messages and session data
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    // Add session start event
    events.push({
      id: 'session-start',
      type: 'session_start',
      timestamp: new Date(session.startedAt),
      title: 'Session Started',
      description: `Chatbot: ${session.chatbotName}`,
      icon: 'play_circle',
      iconColor: 'text-green-500',
    });

    // Add message events
    messages.forEach((msg) => {
      const isFromBot = msg.isFromBot ?? (msg.senderName === 'Business' || !msg.senderPhone);
      const messageType = msg.content?.type || msg.type;

      let title = isFromBot ? 'Bot Message' : 'User Message';
      let description = '';
      let icon = isFromBot ? 'smart_toy' : 'person';
      let iconColor = isFromBot ? 'text-blue-500' : 'text-green-500';

      // Determine message description based on type
      if (msg.type === 'text') {
        const textContent = typeof msg.content === 'string'
          ? msg.content
          : msg.content?.body || msg.content?.text || '';
        description = textContent.length > 50 ? textContent.substring(0, 50) + '...' : textContent;
      } else if (msg.type === 'interactive') {
        if (messageType === 'button_reply') {
          title = 'Button Selected';
          description = msg.content?.buttonTitle || msg.content?.button_reply?.title || 'Button';
          icon = 'touch_app';
          iconColor = 'text-purple-500';
        } else if (messageType === 'list_reply') {
          title = 'List Item Selected';
          description = msg.content?.listTitle || msg.content?.list_reply?.title || 'List item';
          icon = 'list';
          iconColor = 'text-purple-500';
        } else if (messageType === 'nfm_reply') {
          title = 'Flow Form Submitted';
          const flowData = msg.content?.responseData || msg.content?.response_json;
          const parsedData = typeof flowData === 'string' ? JSON.parse(flowData) : flowData;
          const fieldCount = parsedData
            ? Object.keys(parsedData).filter(k => !['flow_token', 'version'].includes(k)).length
            : 0;
          description = fieldCount > 0 ? `${fieldCount} fields submitted` : 'Form completed';
          icon = 'check_circle';
          iconColor = 'text-green-500';
        } else if (msg.content?.action?.buttons) {
          title = 'Interactive Buttons Sent';
          description = msg.content?.body?.text || 'Buttons';
          icon = 'buttons_alt';
          iconColor = 'text-blue-500';
        } else if (msg.content?.action?.sections) {
          title = 'Interactive List Sent';
          description = msg.content?.body?.text || 'List';
          icon = 'list_alt';
          iconColor = 'text-blue-500';
        }
      } else if (msg.type === 'image') {
        title = isFromBot ? 'Image Sent' : 'Image Received';
        description = msg.content?.caption || 'Image';
        icon = 'image';
        iconColor = 'text-amber-500';
      } else if (msg.type === 'document') {
        title = isFromBot ? 'Document Sent' : 'Document Received';
        description = msg.content?.filename || 'Document';
        icon = 'description';
        iconColor = 'text-amber-500';
      } else if (msg.type === 'audio') {
        title = isFromBot ? 'Audio Sent' : 'Voice Message';
        icon = 'mic';
        iconColor = 'text-amber-500';
      } else if (msg.type === 'flow') {
        title = 'Flow Sent';
        description = 'WhatsApp Flow';
        icon = 'dynamic_form';
        iconColor = 'text-indigo-500';
      }

      events.push({
        id: msg.id,
        type: isFromBot ? 'message_bot' : 'message_user',
        timestamp: new Date(msg.timestamp),
        title,
        description,
        icon,
        iconColor,
        data: msg,
      });
    });

    // Add session end event if completed
    if (session.completedAt) {
      let endTitle = 'Session Ended';
      let endIcon = 'stop_circle';
      let endColor = 'text-gray-500';

      if (session.status === 'completed') {
        endTitle = 'Session Completed';
        endIcon = 'check_circle';
        endColor = 'text-green-500';
      } else if (session.status === 'expired') {
        endTitle = 'Session Expired';
        endIcon = 'timer_off';
        endColor = 'text-orange-500';
      } else if (session.status === 'stopped') {
        endTitle = 'Session Stopped';
        endIcon = 'cancel';
        endColor = 'text-red-500';
      }

      events.push({
        id: 'session-end',
        type: 'session_end',
        timestamp: new Date(session.completedAt),
        title: endTitle,
        description: session.completionReason || undefined,
        icon: endIcon,
        iconColor: endColor,
      });
    }

    // Sort by timestamp
    return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [messages, session]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: { date: string; events: TimelineEvent[] }[] = [];
    let currentDate = '';

    timelineEvents.forEach((event) => {
      const eventDate = formatDate(event.timestamp);
      if (eventDate !== currentDate) {
        currentDate = eventDate;
        groups.push({ date: eventDate, events: [] });
      }
      groups[groups.length - 1].events.push(event);
    });

    return groups;
  }, [timelineEvents]);

  return (
    <div className="bg-gray-900 rounded-lg shadow-lg border border-gray-700/50 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-700/50 bg-gray-800/50">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-emerald-400 text-lg">
            timeline
          </span>
        </div>
        <h3 className="font-semibold text-gray-100">
          Session Timeline
        </h3>
        <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          {timelineEvents.length} events
        </span>
      </div>

      {/* Timeline content */}
      <div className="flex-1 overflow-y-auto p-4">
        {groupedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <span className="material-symbols-outlined text-4xl mb-2 text-gray-600">hourglass_empty</span>
            <p className="text-sm text-gray-400">No events yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedEvents.map((group) => (
              <div key={group.date}>
                {/* Date header */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                  <span className="text-xs font-medium text-gray-400 px-3 py-1 bg-gray-800 rounded-full border border-gray-700/50">
                    {group.date}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                </div>

                {/* Events */}
                <div className="space-y-3">
                  {group.events.map((event, index) => (
                    <div
                      key={event.id}
                      className="flex gap-3 group"
                    >
                      {/* Timeline line and icon */}
                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg ${
                          event.iconColor.includes('green') ? 'bg-emerald-500/20 ring-1 ring-emerald-500/30' :
                          event.iconColor.includes('blue') ? 'bg-blue-500/20 ring-1 ring-blue-500/30' :
                          event.iconColor.includes('purple') ? 'bg-purple-500/20 ring-1 ring-purple-500/30' :
                          event.iconColor.includes('amber') ? 'bg-amber-500/20 ring-1 ring-amber-500/30' :
                          event.iconColor.includes('orange') ? 'bg-orange-500/20 ring-1 ring-orange-500/30' :
                          event.iconColor.includes('red') ? 'bg-red-500/20 ring-1 ring-red-500/30' :
                          event.iconColor.includes('indigo') ? 'bg-indigo-500/20 ring-1 ring-indigo-500/30' :
                          'bg-gray-700/50 ring-1 ring-gray-600/30'
                        }`}>
                          <span className={`material-symbols-outlined text-lg ${
                            event.iconColor.includes('green') ? 'text-emerald-400' :
                            event.iconColor.includes('blue') ? 'text-blue-400' :
                            event.iconColor.includes('purple') ? 'text-purple-400' :
                            event.iconColor.includes('amber') ? 'text-amber-400' :
                            event.iconColor.includes('orange') ? 'text-orange-400' :
                            event.iconColor.includes('red') ? 'text-red-400' :
                            event.iconColor.includes('indigo') ? 'text-indigo-400' :
                            'text-gray-400'
                          }`}>
                            {event.icon}
                          </span>
                        </div>
                        {index < group.events.length - 1 && (
                          <div className="w-0.5 flex-1 bg-gradient-to-b from-gray-600 to-gray-700/30 mt-2"></div>
                        )}
                      </div>

                      {/* Event content */}
                      <div className="flex-1 pb-3">
                        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/30 hover:border-gray-600/50 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-gray-100">
                                {event.title}
                              </p>
                              {event.description && (
                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                  {event.description}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-emerald-400/80 whitespace-nowrap font-mono bg-gray-900/50 px-2 py-0.5 rounded">
                              {formatTime(event.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Current status */}
      {session.isActive && (
        <div className="border-t border-gray-700/50 p-3 bg-gray-800/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></div>
            <span className="text-xs text-gray-400">
              Session is active <span className="text-gray-600 mx-1">|</span> Current node: <span className="font-medium text-emerald-400">{session.currentNodeLabel}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
