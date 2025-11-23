import type { Message } from "../mockData";

interface MessageBubbleProps {
    message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
    const isMe = message.sender === "me";

    const renderContent = () => {
        switch (message.type) {
            case "text":
                return <p className="text-sm whitespace-pre-wrap">{message.content}</p>;

            case "image":
                return (
                    <div className="max-w-xs">
                        <img src={message.content.url} alt="Shared" className="rounded-lg mb-1" />
                        {message.content.caption && <p className="text-sm">{message.content.caption}</p>}
                    </div>
                );

            case "document":
                return (
                    <div className="flex items-center gap-3 bg-black/5 p-2 rounded-lg min-w-[200px]">
                        <span className="material-symbols-outlined text-red-500 text-3xl">picture_as_pdf</span>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium truncate">{message.content.fileName}</span>
                            <span className="text-xs text-gray-500">{message.content.fileSize} • PDF</span>
                        </div>
                    </div>
                );

            case "interactive":
                // Basic rendering for interactive messages
                const { header, body, footer, action } = message.content;
                return (
                    <div className="flex flex-col gap-1 min-w-[200px]">
                        {header && <p className="text-sm font-bold">{header.text || header}</p>}
                        <p className="text-sm">{body.text || body}</p>
                        {footer && <p className="text-xs text-gray-500">{footer.text || footer}</p>}

                        <div className="mt-2 flex flex-col gap-2">
                            {action.buttons?.map((btn: any) => (
                                <button key={btn.id} className="bg-white text-[#00a884] py-2 px-4 rounded shadow-sm text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-200">
                                    {btn.title}
                                </button>
                            ))}
                            {action.sections && (
                                <button className="bg-white text-[#00a884] py-2 px-4 rounded shadow-sm text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-200">
                                    {action.button || "View List"}
                                </button>
                            )}
                        </div>
                    </div>
                );

            default:
                return <p className="text-sm text-red-500">Unsupported message type</p>;
        }
    };

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
                    <span>{message.timestamp}</span>
                    {isMe && (
                        <span className={`material-symbols-outlined text-[14px] ${message.status === 'read' ? 'text-[#53bdeb]' : 'text-gray-500'}`}>
                            done_all
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
