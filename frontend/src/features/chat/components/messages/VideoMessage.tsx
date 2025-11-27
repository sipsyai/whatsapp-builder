import { useState, useEffect } from 'react';
import type { VideoMessageContent } from '../../../../types/messages';
import { MessagesService } from '../../../../api/messages.service';

interface VideoMessageProps {
    content: VideoMessageContent;
}

export function VideoMessage({ content }: VideoMessageProps) {
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadVideo();
    }, [content.id, content.url]);

    const loadVideo = async () => {
        try {
            if (content.url) {
                setVideoUrl(content.url);
                setLoading(false);
                return;
            }

            const blob = await MessagesService.downloadMedia(content.id);
            const url = URL.createObjectURL(blob);
            setVideoUrl(url);
        } catch (error) {
            console.error('Failed to load video:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center w-64 h-48 bg-gray-700 rounded-lg">
                <span className="material-symbols-outlined animate-spin text-gray-500">
                    progress_activity
                </span>
            </div>
        );
    }

    return (
        <div className="max-w-xs">
            {videoUrl ? (
                <>
                    <video controls className="w-full rounded-lg mb-1">
                        <source src={videoUrl} type={content.mimeType} />
                        Your browser does not support the video tag.
                    </video>
                    {content.caption && (
                        <p className="text-sm whitespace-pre-wrap">{content.caption}</p>
                    )}
                </>
            ) : (
                <div className="flex items-center justify-center w-64 h-48 bg-gray-700 rounded-lg">
                    <span className="text-sm text-gray-500">Failed to load video</span>
                </div>
            )}
        </div>
    );
}
