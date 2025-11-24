import type { ReactionMessageContent } from '../../../../types/messages';

interface ReactionMessageProps {
    content: ReactionMessageContent;
}

export function ReactionMessage({ content }: ReactionMessageProps) {
    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-full">
            <span className="text-lg">{content.emoji}</span>
            <span className="text-sm text-gray-600 dark:text-gray-300">
                Reacted to a message
            </span>
        </div>
    );
}
