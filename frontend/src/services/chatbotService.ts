export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    action?: {
        type: 'navigate' | 'link';
        payload: string;
        label: string;
    };
}

export interface ChatResponse {
    answer: string;
    actions?: {
        type: 'navigate' | 'link';
        payload: string;
        label: string;
    }[];
}

class ChatService {
    async sendMessage(message: string, context: { churchId: number, currentPath: string }): Promise<ChatResponse> {
        const response = await fetch('/api/chatbot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                ...context
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to send message');
        }

        return response.json();
    }
}

export const chatService = new ChatService();
