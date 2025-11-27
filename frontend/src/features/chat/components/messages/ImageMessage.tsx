import { useState, useEffect } from 'react';
import type { ImageMessageContent } from '../../../../types/messages';
import { MessagesService } from '../../../../api/messages.service';

interface ImageMessageProps {
    content: ImageMessageContent;
}

export function ImageMessage({ content }: ImageMessageProps) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadImage();
    }, [content.id, content.url]);

    const loadImage = async () => {
        try {
            if (content.url) {
                setImageUrl(content.url);
                setLoading(false);
                return;
            }

            const blob = await MessagesService.downloadMedia(content.id);
            const url = URL.createObjectURL(blob);
            setImageUrl(url);
        } catch (error) {
            console.error('Failed to load image:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center w-64 h-64 bg-gray-700 rounded-lg">
                <span className="material-symbols-outlined animate-spin text-gray-500">
                    progress_activity
                </span>
            </div>
        );
    }

    return (
        <div className="max-w-xs">
            {imageUrl ? (
                <>
                    <img
                        src={imageUrl}
                        alt={content.caption || 'Image'}
                        className="rounded-lg mb-1 w-full h-auto object-cover"
                    />
                    {content.caption && (
                        <p className="text-sm whitespace-pre-wrap">{content.caption}</p>
                    )}
                </>
            ) : (
                <div className="flex items-center justify-center w-64 h-64 bg-gray-700 rounded-lg">
                    <span className="text-sm text-gray-500">Failed to load image</span>
                </div>
            )}
        </div>
    );
}
