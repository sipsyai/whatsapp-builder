import { MessageType, type Message } from '../../../types/messages';
import { ImageMessage } from './messages/ImageMessage';
import { VideoMessage } from './messages/VideoMessage';
import { ReactionMessage } from './messages/ReactionMessage';

interface MessageBubbleProps {
    message: Message;
    businessUserId?: string;
}

export const MessageBubble = ({ message, businessUserId }: MessageBubbleProps) => {
    // Determine if message is from me (the business/bot)
    // Messages from business should appear on the right (as "us")
    // Messages from customers should appear on the left (as "them")
    const isMe = businessUserId ? message.senderId === businessUserId : false;

    const formatTime = (date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderContent = () => {
        switch (message.type) {
            case MessageType.TEXT:
                const textContent = typeof message.content === 'string'
                    ? { body: message.content }
                    : message.content as any;
                return <p className="text-sm whitespace-pre-wrap">{textContent.body || textContent}</p>;

            case MessageType.IMAGE:
                return <ImageMessage content={message.content as any} />;

            case MessageType.VIDEO:
                return <VideoMessage content={message.content as any} />;

            case MessageType.REACTION:
                return <ReactionMessage content={message.content as any} />;

            case MessageType.DOCUMENT:
                const docContent = message.content as any;
                return (
                    <div className="flex items-center gap-3 bg-black/5 p-2 rounded-lg min-w-[200px]">
                        <span className="material-symbols-outlined text-red-500 text-3xl">picture_as_pdf</span>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium truncate">{docContent.filename || 'Document'}</span>
                            <span className="text-xs text-gray-500">PDF</span>
                        </div>
                    </div>
                );

            case MessageType.INTERACTIVE:
                const interactiveContent = message.content as any;
                const { header, body, footer, action, type, buttonTitle, listTitle } = interactiveContent;

                // Check if this is a user response (button_reply or list_reply)
                const isUserResponse = type === 'button_reply' || type === 'list_reply';

                if (isUserResponse) {
                    // Render user's response (button click or list selection)
                    return (
                        <div className="flex flex-col gap-1 min-w-[200px]">
                            <p className="text-sm font-medium">
                                {type === 'button_reply' ? buttonTitle : listTitle}
                            </p>
                            <p className="text-xs text-gray-500">
                                {type === 'button_reply' ? 'Button selected' : 'List item selected'}
                            </p>
                        </div>
                    );
                }

                // Render bot's interactive message (buttons or list)
                return (
                    <div className="flex flex-col gap-1 min-w-[200px]">
                        {header && <p className="text-sm font-bold">{header.text || header}</p>}
                        <p className="text-sm">{body?.text || body || 'Interactive message'}</p>
                        {footer && <p className="text-xs text-gray-500">{footer.text || footer}</p>}

                        <div className="mt-2 flex flex-col gap-2">
                            {action?.buttons?.map((btn: any, index: number) => {
                                // Handle both formats: btn.reply.title (outgoing) and btn.title (legacy)
                                const buttonId = btn.reply?.id || btn.id || `btn-${index}`;
                                const buttonTitle = btn.reply?.title || btn.title || 'Button';
                                return (
                                    <button
                                        key={buttonId}
                                        className="bg-white text-[#00a884] py-2 px-4 rounded shadow-sm text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-200"
                                    >
                                        {buttonTitle}
                                    </button>
                                );
                            })}
                            {action?.sections && (
                                <button className="bg-white text-[#00a884] py-2 px-4 rounded shadow-sm text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-200">
                                    {action.button || "View List"}
                                </button>
                            )}
                        </div>
                    </div>
                );

            default:
                return <p className="text-sm">{typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}</p>;
        }
    };

    const timestamp = formatTime(message.timestamp || message.createdAt);
    const status = message.status || 'sent';

    return (
        <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}>
            <div
                className={`max-w-[65%] rounded-lg px-2 py-1.5 relative shadow-sm ${isMe
                    ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-gray-900 dark:text-gray-100 rounded-tr-none"
                    : "bg-white dark:bg-[#202c33] text-gray-900 dark:text-gray-100 rounded-tl-none"
                    }`}
            >
                {renderContent()}
                <div className={`text-[10px] text-gray-500 dark:text-gray-400 text-right mt-1 flex items-center justify-end gap-1`}>
                    <span>{timestamp}</span>
                    {isMe && (
                        <span className={`material-symbols-outlined text-[14px] ${status === 'read' ? 'text-[#53bdeb]' : 'text-gray-500'}`}>
                            done_all
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

