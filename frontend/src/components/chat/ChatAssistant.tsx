import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { chatService } from '../../services/chatbotService';
import type { ChatMessage } from '../../services/chatbotService';
import { useAuth } from '../../hooks/useAuth';

export const ChatAssistant: FC = () => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: t('chat.welcome') }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await chatService.sendMessage(input, {
                churchId: user?.churchId || 1,
                currentPath: location.pathname
            });

            const assistantMsg: ChatMessage = {
                role: 'assistant',
                content: response.answer,
            };

            // If there's an action, we could attach it to the message or handle it immediately
            // For now, let's treat actions as buttons in the message
            if (response.actions && response.actions.length > 0) {
                // In a real implementation, we'd handle multiple actions. 
                // Let's just show the first one as a button for simplicity in this version.
                assistantMsg.action = response.actions[0];
            }

            setMessages(prev => [...prev, assistantMsg]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: t('chat.error')
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (action: NonNullable<ChatMessage['action']>) => {
        if (action.type === 'navigate') {
            navigate(action.payload);
            setIsOpen(false);
        } else if (action.type === 'link') {
            window.open(action.payload, '_blank');
        }
    };

    return (
        <>
            {/* FAB Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    bottom: '90px',
                    right: '24px',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-brand-blue)',
                    color: 'white',
                    border: 'none',
                    padding: 0,
                    margin: 0,
                    boxShadow: '0 4px 20px rgba(29, 78, 216, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 1000,
                    flexShrink: 0,
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    transform: isOpen ? 'rotate(90deg) scale(0.9)' : 'rotate(0) scale(1)',
                }}
            >
                <span className="material-symbols-outlined">
                    {isOpen ? 'close' : 'smart_toy'}
                </span>
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '160px',
                    right: '24px',
                    width: 'calc(100vw - 48px)',
                    maxWidth: '400px',
                    height: '500px',
                    maxHeight: '60vh',
                    backgroundColor: 'var(--color-card-bg)',
                    borderRadius: '24px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    zIndex: 1000,
                    border: '1px solid var(--color-border-subtle)',
                    backdropFilter: 'blur(10px)',
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    <style>{`
                        @keyframes slideIn {
                            from { opacity: 0; transform: translateY(20px) scale(0.95); }
                            to { opacity: 1; transform: translateY(0) scale(1); }
                        }
                    `}</style>

                    {/* Header */}
                    <div style={{
                        padding: '20px',
                        background: 'linear-gradient(135deg, var(--color-brand-blue), #3b82f6)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '20px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <span className="material-symbols-outlined">robot_2</span>
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Asistente MinistryHub</h3>
                            <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>{t('chat.online')}</p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div style={{
                        flex: 1,
                        padding: '20px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                            }}>
                                <div style={{
                                    padding: '12px 16px',
                                    borderRadius: msg.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                                    backgroundColor: msg.role === 'user' ? 'var(--color-brand-blue)' : 'var(--color-ui-surface)',
                                    color: msg.role === 'user' ? 'white' : 'var(--color-ui-text)',
                                    fontSize: '14px',
                                    lineHeight: '1.4',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                                }}>
                                    {msg.content}
                                </div>

                                {msg.action && (
                                    <button
                                        onClick={() => handleAction(msg.action!)}
                                        style={{
                                            marginTop: '8px',
                                            padding: '8px 16px',
                                            borderRadius: '12px',
                                            backgroundColor: 'var(--color-ui-surface)',
                                            color: 'var(--color-brand-blue)',
                                            border: '1px solid var(--color-brand-blue)',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--color-brand-blue)';
                                            e.currentTarget.style.color = 'white';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--color-ui-surface)';
                                            e.currentTarget.style.color = 'var(--color-brand-blue)';
                                        }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                                            {msg.action.type === 'navigate' ? 'near_me' : 'open_in_new'}
                                        </span>
                                        {msg.action.label}
                                    </button>
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '4px', padding: '12px' }}>
                                <div className="dot" style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: 'var(--color-border-subtle)', animation: 'pulse 1s infinite 0s' }}></div>
                                <div className="dot" style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: 'var(--color-border-subtle)', animation: 'pulse 1s infinite 0.2s' }}></div>
                                <div className="dot" style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: 'var(--color-border-subtle)', animation: 'pulse 1s infinite 0.4s' }}></div>
                            </div>
                        )}
                        <style>{`
                            @keyframes pulse {
                                0%, 100% { opacity: 0.3; transform: scale(1); }
                                50% { opacity: 1; transform: scale(1.2); }
                            }
                        `}</style>
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div style={{
                        padding: '16px',
                        borderTop: '1px solid var(--color-border-subtle)',
                        display: 'flex',
                        gap: '8px'
                    }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={t('chat.inputPlaceholder')}
                            style={{
                                flex: 1,
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: '1px solid var(--color-border-subtle)',
                                backgroundColor: 'var(--color-ui-bg)',
                                color: 'var(--color-ui-text)',
                                outline: 'none',
                                fontSize: '14px'
                            }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                backgroundColor: 'var(--color-brand-blue)',
                                color: 'white',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                opacity: !input.trim() || loading ? 0.6 : 1
                            }}
                        >
                            <span className="material-symbols-outlined">send</span>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
