export interface Message {
    id: string;
    sender: "me" | "them";
    type: "text" | "image" | "video" | "document" | "audio" | "sticker" | "interactive";
    content: any;
    timestamp: string;
    status: "sent" | "delivered" | "read";
}

export interface Conversation {
    id: string;
    name: string;
    avatar: string;
    lastMessage: string;
    unreadCount: number;
    timestamp: string;
    messages: Message[];
}

export const mockConversations: Conversation[] = [
    {
        id: "1",
        name: "John Doe",
        avatar: "https://ui-avatars.com/api/?name=John+Doe&background=random",
        lastMessage: "Hey, how are you?",
        unreadCount: 2,
        timestamp: "10:30 AM",
        messages: [
            {
                id: "m1",
                sender: "them",
                type: "text",
                content: "Hello!",
                timestamp: "10:00 AM",
                status: "read",
            },
            {
                id: "m2",
                sender: "me",
                type: "text",
                content: "Hi John! Long time no see.",
                timestamp: "10:05 AM",
                status: "read",
            },
            {
                id: "m3",
                sender: "them",
                type: "text",
                content: "Yeah, I was busy with the new project.",
                timestamp: "10:15 AM",
                status: "read",
            },
            {
                id: "m4",
                sender: "them",
                type: "image",
                content: {
                    url: "https://picsum.photos/300/200",
                    caption: "Check this out!"
                },
                timestamp: "10:30 AM",
                status: "read",
            }
        ],
    },
    {
        id: "2",
        name: "Alice Smith",
        avatar: "https://ui-avatars.com/api/?name=Alice+Smith&background=random",
        lastMessage: "Can you send me the report?",
        unreadCount: 0,
        timestamp: "Yesterday",
        messages: [
            {
                id: "m1",
                sender: "me",
                type: "text",
                content: "Sure, here it is.",
                timestamp: "Yesterday",
                status: "read",
            },
            {
                id: "m2",
                sender: "me",
                type: "document",
                content: {
                    fileName: "Q3_Report.pdf",
                    fileSize: "2.4 MB"
                },
                timestamp: "Yesterday",
                status: "read",
            }
        ],
    },
    {
        id: "3",
        name: "Bot Test",
        avatar: "https://ui-avatars.com/api/?name=Bot+Test&background=random",
        lastMessage: "Please select an option",
        unreadCount: 1,
        timestamp: "11:00 AM",
        messages: [
            {
                id: "m1",
                sender: "me",
                type: "text",
                content: "Start",
                timestamp: "11:00 AM",
                status: "read"
            },
            {
                id: "m2",
                sender: "them",
                type: "interactive",
                content: {
                    header: "Welcome",
                    body: "Please choose a service:",
                    footer: "Bot Services",
                    action: {
                        buttons: [
                            { id: "sales", title: "Sales" },
                            { id: "support", title: "Support" }
                        ]
                    }
                },
                timestamp: "11:00 AM",
                status: "read"
            }
        ]
    }
];
