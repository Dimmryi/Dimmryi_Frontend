import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { Icons } from '../components/Icons';
import { useAppSelector } from '../app/hooks';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ChatMessage {
    senderId: string;
    senderName: string;
    text: string;
    timestamp: number;
    read: boolean;
}

interface ChatData {
    _id: string;
    listingId: string;
    buyerId: string;
    buyerName: string;
    sellerId: string;
    messages: ChatMessage[];
    updatedAt?: string;
}

interface ChatListing {
    _id?: string;
    ownerId?: string;
    owner?: string;
    apartmentDetails?: string;
    description?: string;
    location?: string;
    image?: string[];
}

const requestJson = async <T,>(url: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(url, {
        credentials: 'include',
        ...init,
        headers: {
            'content-type': 'application/json',
            ...(init?.headers || {}),
        },
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(data?.message || data?.error || `Request failed: ${response.status}`);
    }

    return data as T;
};

const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
};

const getListingTitle = (listing: ChatListing | null) =>
    listing?.apartmentDetails || listing?.description?.slice(0, 84) || 'Оголошення';

export default function ChatPage() {
    const { listingId } = useParams<{ listingId: string }>();
    const [searchParams] = useSearchParams();
    const chatIdFromUrl = searchParams.get('chatId');
    const navigate = useNavigate();
    const { userId, userName, isRegistered } = useAppSelector((state) => state.registration);
    const isLogin = useAppSelector((state) => state.auth.isLogin);

    const [listing, setListing] = useState<ChatListing | null>(null);
    const [chatId, setChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sellerChats, setSellerChats] = useState<ChatData[]>([]);
    const [isSeller, setIsSeller] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [inputText, setInputText] = useState('');

    const socketRef = useRef<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const canUseChat = isLogin && isRegistered && userId;
    const listingTitle = useMemo(() => getListingTitle(listing), [listing]);

    useEffect(() => {
        if (!canUseChat) {
            navigate('/login', {
                replace: true,
                state: {
                    notice: 'Увійдіть, щоб написати власнику оголошення.',
                    from: listingId ? `/chat/${listingId}` : '/',
                },
            });
        }
    }, [canUseChat, listingId, navigate]);

    useEffect(() => {
        if (!listingId || !userId || !canUseChat) return;

        let cancelled = false;

        const loadChat = async () => {
            try {
                setLoading(true);
                setError('');

                const currentListing = await requestJson<ChatListing>(`${API_URL}/listing/${encodeURIComponent(listingId)}`);
                if (cancelled) return;

                setListing(currentListing);

                const ownerId = currentListing.ownerId;
                if (!ownerId) {
                    setError('У цього оголошення не вказаний власник, тому чат недоступний.');
                    return;
                }

                const ownerMode = userId === ownerId;
                setIsSeller(ownerMode);

                if (ownerMode) {
                    if (chatIdFromUrl) {
                        const chat = await requestJson<ChatData>(`${API_URL}/api/chat/${encodeURIComponent(chatIdFromUrl)}`);
                        if (cancelled) return;
                        setMessages(chat.messages || []);
                        setChatId(chat._id);
                    } else {
                        const chats = await requestJson<ChatData[]>(`${API_URL}/api/chat/listing/${encodeURIComponent(listingId)}`);
                        if (cancelled) return;
                        setSellerChats(chats);
                        setChatId(null);
                        setMessages([]);
                    }
                    return;
                }

                const chat = await requestJson<ChatData>(`${API_URL}/api/chat/init`, {
                    method: 'POST',
                    body: JSON.stringify({
                        listingId,
                        buyerId: userId,
                        buyerName: userName || 'Користувач',
                        sellerId: ownerId,
                    }),
                });

                if (cancelled) return;
                setMessages(chat.messages || []);
                setChatId(chat._id);
            } catch (caughtError) {
                if (!cancelled) {
                    setError(caughtError instanceof Error ? caughtError.message : 'Не вдалося завантажити чат.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void loadChat();

        return () => {
            cancelled = true;
        };
    }, [canUseChat, chatIdFromUrl, listingId, userId, userName]);

    useEffect(() => {
        if (!chatId || !userId) return;

        const socket = io(API_URL, { withCredentials: true });
        socketRef.current = socket;
        socket.emit('join_chat', chatId);
        if (isSeller) socket.emit('messages_read', chatId);

        socket.on('new_message', (message: ChatMessage) => {
            setMessages((current) => [...current, message]);
        });
        socket.on('messages_read', () => {
            setMessages((current) => current.map((message) => ({ ...message, read: true })));
        });
        socket.on('chat_error', (message: string) => setError(message));
        socket.on('connect_error', () => setError('Не вдалося підключитися до realtime-чату.'));

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [chatId, isSeller, userId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const openChat = async (nextChatId: string) => {
        try {
            setError('');
            const chat = await requestJson<ChatData>(`${API_URL}/api/chat/${encodeURIComponent(nextChatId)}`);
            setMessages(chat.messages || []);
            setChatId(chat._id);
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Не вдалося відкрити чат.');
        }
    };

    const handleSend = (event?: FormEvent) => {
        event?.preventDefault();
        const text = inputText.trim();
        if (!text || !chatId || !socketRef.current || !userId) return;

        socketRef.current.emit('send_message', {
            chatId,
            text,
            senderId: userId,
            senderName: userName || 'Користувач',
        });
        setInputText('');
    };

    if (loading) {
        return (
            <main className="dm-page dm-chat-page">
                <section className="dm-chat-shell">
                    <div className="dm-route-fallback" aria-live="polite" aria-busy="true"><span /></div>
                </section>
            </main>
        );
    }

    if (isSeller && !chatId) {
        return (
            <main className="dm-page dm-chat-page">
                <section className="dm-chat-shell">
                    <header className="dm-chat-header">
                        <Link className="dm-chat-back" to={`/details/${listingId}`}>{Icons.arrow()} Назад</Link>
                        <div>
                            <span>Повідомлення щодо обʼєкта</span>
                            <h1>{listingTitle}</h1>
                        </div>
                    </header>
                    {error ? <div className="dm-form-message is-error">{error}</div> : null}
                    {sellerChats.length ? (
                        <div className="dm-chat-list">
                            {sellerChats.map((chat) => {
                                const lastMessage = chat.messages?.[0];
                                return (
                                    <button key={chat._id} type="button" className="dm-chat-preview" onClick={() => void openChat(chat._id)}>
                                        <span className="dm-chat-avatar">{(chat.buyerName || 'К').charAt(0).toUpperCase()}</span>
                                        <span>
                                            <strong>@{chat.buyerName || 'Користувач'}</strong>
                                            <em>{lastMessage?.text || 'Поки немає повідомлень'}</em>
                                        </span>
                                        <time>{formatTime(lastMessage?.timestamp)}</time>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="dm-chat-empty">
                            <strong>Поки немає розмов</strong>
                            <p>Коли покупець або орендар напише щодо цього оголошення, діалог зʼявиться тут.</p>
                        </div>
                    )}
                </section>
            </main>
        );
    }

    return (
        <main className="dm-page dm-chat-page">
            <section className="dm-chat-shell dm-chat-shell--dialog">
                <header className="dm-chat-header">
                    <Link className="dm-chat-back" to={isSeller ? `/chat/${listingId}` : `/details/${listingId}`}>{Icons.arrow()} Назад</Link>
                    <div>
                        <span>{isSeller ? 'Діалог з користувачем' : 'Чат з власником'}</span>
                        <h1>{listingTitle}</h1>
                    </div>
                </header>
                {error ? <div className="dm-form-message is-error">{error}</div> : null}
                <div className="dm-chat-messages">
                    {messages.length ? messages.map((message, index) => {
                        const isOwn = message.senderId === userId;
                        return (
                            <article key={`${message.timestamp}-${index}`} className={isOwn ? 'is-own' : ''}>
                                <span>@{message.senderName}</span>
                                <p>{message.text}</p>
                                <footer>
                                    <time>{formatTime(message.timestamp)}</time>
                                    {isOwn ? <em>{message.read ? 'прочитано' : 'надіслано'}</em> : null}
                                </footer>
                            </article>
                        );
                    }) : (
                        <div className="dm-chat-empty">
                            <strong>Напишіть перше повідомлення</strong>
                            <p>Уточніть деталі, домовтеся про перегляд або поставте питання власнику.</p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <form className="dm-chat-compose" onSubmit={handleSend}>
                    <textarea
                        value={inputText}
                        onChange={(event) => setInputText(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' && !event.shiftKey) {
                                handleSend(event);
                            }
                        }}
                        rows={1}
                        placeholder="Напишіть повідомлення..."
                    />
                    <button className="dm-btn dm-btn--accent" type="submit" disabled={!inputText.trim() || !chatId}>
                        Надіслати
                    </button>
                </form>
            </section>
        </main>
    );
}
