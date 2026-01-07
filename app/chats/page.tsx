'use client';

import { useEffect, useState, useMemo } from 'react';
import {
    MessageSquare,
    Menu,
    RefreshCw,
    ChevronRight,
    Clock,
    X,
    ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/Sidebar';
import Link from 'next/link';

// --- UTILIDADES DE PARSEO (Reutilizadas para el visor del chat) ---
function esc(text: string) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function parseMarkdown(text: string) {
    if (!text) return "";
    let h = text;
    h = h.replace(/<br>\s*---\s*<br>/gi, "");
    h = h.replace(/\n---\n/g, "");
    h = h.replace(/^---$/gm, "");
    h = h.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="rounded-lg my-2 max-w-full h-auto">');
    h = h.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-white underline font-bold">$1</a>');
    h = h.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    h = h.replace(/\*(.*?)\*/g, "<em>$1</em>");
    h = h.replace(/\\n/g, "<br>");
    h = h.replace(/\n/g, "<br>");
    if (h.split("<br><br>").length > 1) {
        h = h.split("<br><br>").map(p => `<p class="mb-2 last:mb-0">${p}</p>`).join("");
    }
    return h;
}

function convertTrackingToButtons(html: string) {
    const trackingDomains = [
        'cttexpress.com', 'seur.com', 'dpd.com', 'dpd.es', 'gls-spain.es', 'gls-group.eu',
        'mrw.es', 'correosexpress.com', 'correos.es', 'nacex.es', 'sending.es', 'tipsa.com',
        'dhl.com', 'dhl.es', 'ups.com', 'fedex.com', 'envialia.com', 'colissimo', 'laposte.fr',
        '17track.net', 'aftership.com', 'trackingmore.com', 'parcelmonitor.com'
    ];
    const urlRegex = /(https?:\/\/[^\s<>"]+)/gi;
    return html.replace(urlRegex, (url) => {
        const isTracking = trackingDomains.some(d => url.toLowerCase().includes(d));
        if (isTracking) {
            return `<a href="${url}" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-xs font-bold my-2 hover:bg-zinc-800 transition-colors">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="white"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
        Ver Seguimiento
      </a>`;
        }
        return url;
    });
}

function convertProductsToCards(html: string) {
    const regex = /<img[^>]+src="([^"]+)"[^>]*>[\s\S]*?🛍️\s*([^\n💰]+)[\s\S]*?💰\s*Precio:\s*([^\n📦]+)[\s\S]*?📦\s*Stock:\s*([^\n📝]+)[\s\S]*?📝\s*([^\n👉🛒<]+)[\s\S]*?(?:👉\s*)?<a[^>]*href="([^"]*\/products\/[^"]*)"[^>]*>[^<]*<\/a>(?:[\s\S]*?🛒\s*<a[^>]*href="([^"]*)"[^>]*>[^<]*<\/a>)?/gi;
    let match, products = [], firstIdx = -1, lastEnd = 0;

    while ((match = regex.exec(html)) !== null) {
        if (firstIdx === -1) firstIdx = match.index;
        lastEnd = match.index + match[0].length;
        const clean = (t: string) => t ? t.replace(/<br\s*\/?>/gi, "").replace(/&lt;br&gt;/gi, "").replace(/\s+/g, " ").trim() : "";
        products.push({
            imgUrl: match[1],
            title: clean(match[2]),
            price: clean(match[3]),
            description: clean(match[5]),
            url: match[6]
        });
    }

    if (products.length === 0) return html;

    let cards = `<div class="my-4 overflow-x-auto pb-4 scrollbar-hide flex gap-3 snap-x">`;
    products.forEach(p => {
        cards += `
      <div class="bg-white rounded-xl shadow-sm border border-zinc-100 min-w-[200px] w-[200px] flex-shrink-0 overflow-hidden snap-start flex flex-col">
        <div class="h-32 bg-zinc-50 flex items-center justify-center p-2">
           <img src="${p.imgUrl}" alt="${p.title}" class="max-h-full max-w-full object-contain">
        </div>
        <div class="p-3 flex-1 flex flex-col">
           <h4 class="text-xs font-bold text-black line-clamp-2 leading-tight h-8 mb-1 uppercase">${p.title}</h4>
           <div class="text-xs font-bold text-[#c38692] mb-2">${p.price}</div>
           <p class="text-[10px] text-zinc-500 line-clamp-2 mb-3 flex-1">${p.description}</p>
           <a href="${p.url}" target="_blank" class="block w-full text-center py-2 bg-black text-white text-[10px] font-bold rounded-lg hover:bg-zinc-800 transition-colors uppercase">
              Ver Producto
           </a>
        </div>
      </div>`;
    });
    cards += `</div>`;

    let before = html.substring(0, firstIdx).replace(/(<br\s*\/?>)+$/gi, "");
    let after = html.substring(lastEnd).replace(/^(<br\s*\/?>)+/gi, "").replace(/🛒\s*<a[^>]*>[^<]*<\/a>/gi, "").replace(/<p>\s*<\/p>/gi, "");

    let result = "";
    if (before.trim()) result += before;
    result += cards;
    if (after.trim()) result += after;
    return result;
}

function parseChatContent(content: string) {
    let html = parseMarkdown(content);
    html = convertTrackingToButtons(html);
    html = convertProductsToCards(html);
    return html;
}

function splitBotMessage(content: string): string[] {
    const hasProducts = content.includes("🛍️");
    if (!hasProducts) return content.split(/\n\n+/).filter(s => s.trim());

    const parts: string[] = [];
    const productPattern = /!\[.*?\]\(.*?\)/;
    const firstProductMatch = content.match(productPattern);

    if (firstProductMatch) {
        const introEnd = content.indexOf(firstProductMatch[0]);
        const introText = content.substring(0, introEnd).trim();
        if (introText) parts.push(introText);

        const rest = content.substring(introEnd);
        const lastLinkMatch = rest.match(/[\s\S]*🛒\s*\[.*?\]\(.*?\)/);

        if (lastLinkMatch) {
            const productsEnd = lastLinkMatch[0].length;
            parts.push(rest.substring(0, productsEnd));
            const afterText = rest.substring(productsEnd).trim();
            if (afterText && afterText.replace(/\s+/g, "").length > 0) parts.push(afterText);
        } else {
            parts.push(rest);
        }
    } else {
        parts.push(content);
    }
    return parts;
}

// --- INTERFACES ---
interface Message {
    id: string | number;
    content: string;
    role: 'user' | 'assistant';
    timestamp: string;
    category?: string;
    metadata?: any;
}

interface Session {
    id: string;
    title: string;
    date: string;
    messages: Message[];
}

export default function ChatsPage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const logsRes = await fetch('/api/logs');
            const logsData = await logsRes.json();
            setSessions(Array.isArray(logsData) ? logsData : []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const selectedSession = useMemo(() => {
        return sessions.find(s => s.id === selectedSessionId) || null;
    }, [selectedSessionId, sessions]);

    return (
        <div className="flex min-h-screen bg-[#fafafa] text-zinc-900 font-sans overflow-hidden">
            <style>{`
        .chat-bubble-bot { background-color: #c38692 !important; color: white !important; }
        .chat-bubble-user { background-color: #000000 !important; color: white !important; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

            {/* Reusing shared Sidebar */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <header className="flex justify-between items-center p-6 lg:px-10 border-b border-zinc-100 bg-[#fafafa]/80 backdrop-blur-md sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 hover:bg-zinc-100 rounded-lg">
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl lg:text-2xl font-black tracking-tight text-zinc-950 uppercase">Historial de Chats</h1>
                    </div>
                    <button
                        onClick={fetchData}
                        className="group flex items-center gap-2 bg-white border border-zinc-200 px-4 py-2 rounded-xl text-xs font-bold hover:border-black transition-all shadow-sm"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                        <span className="hidden sm:inline">Refrescar</span>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 lg:p-10">
                    <div className="w-full space-y-4">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="h-24 bg-white border border-zinc-100 rounded-3xl animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            sessions.map((session) => (
                                <button
                                    key={session.id}
                                    onClick={() => setSelectedSessionId(session.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-6 bg-white border rounded-3xl transition-all text-left shadow-sm group",
                                        selectedSessionId === session.id ? "border-black ring-1 ring-black" : "border-zinc-200 hover:border-black"
                                    )}
                                >
                                    <div className="flex items-center gap-5 flex-1 min-w-0">
                                        <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-[#c38692] transition-colors">
                                            <MessageSquare className="w-5 h-5 group-hover:text-white" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 font-sans">Sesión: {session.id.substring(8, 16).toUpperCase()}</p>
                                            <p className="text-sm font-bold truncate text-zinc-900 leading-tight mb-2 uppercase tracking-tight">{session.title}</p>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {new Date(session.date).toLocaleDateString()}
                                                </span>
                                                <span className="bg-[#c38692]/10 text-[#c38692] px-2 py-0.5 rounded text-[9px] font-black uppercase">
                                                    {session.messages.length} Mensajes
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-zinc-200 group-hover:text-black" />
                                </button>
                            ))
                        )}

                        {(!loading && sessions.length === 0) && (
                            <div className="py-20 text-center bg-white border border-dashed border-zinc-200 rounded-[3rem]">
                                <MessageSquare className="w-10 h-10 text-zinc-200 mx-auto mb-4" />
                                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">No hay conversaciones registradas</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Visor de Chat (Estética Shopify) */}
            <aside className={cn(
                "fixed inset-y-0 right-0 w-full sm:w-[500px] lg:w-[600px] bg-white border-l border-zinc-200 shadow-2xl z-50 transform transition-transform duration-500 ease-in-out flex flex-col",
                selectedSessionId ? "translate-x-0" : "translate-x-full"
            )}>
                {selectedSession && (
                    <>
                        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-white sticky top-0 z-10 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center shrink-0">
                                    <span className="text-white font-bold text-xl">H</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-black uppercase tracking-widest leading-none mb-1">Haminos AI</h3>
                                    <p className="text-[9px] font-bold text-emerald-500 flex items-center gap-1 uppercase tracking-widest">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Réplica Shopify
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedSessionId(null)} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-400 hover:text-black">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white scrollbar-hide">
                            {selectedSession.messages.flatMap((msg, msgIdx) => {
                                if (msg.role === 'assistant') {
                                    const parts = splitBotMessage(msg.content);
                                    return parts.map((part, partIdx) => (
                                        <div key={`${msg.id}-${partIdx}`} className="flex flex-col gap-2 max-w-[90%] self-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="flex items-center gap-2 px-1">
                                                <span className="text-[8px] font-black text-zinc-300 uppercase tracking-[0.2em]">Haminos®</span>
                                            </div>
                                            <div
                                                className="chat-bubble-bot p-4 rounded-2xl rounded-bl-sm text-sm font-medium leading-[1.6] shadow-md shadow-[#c38692]/10"
                                                dangerouslySetInnerHTML={{ __html: parseChatContent(part) }}
                                            />
                                        </div>
                                    ));
                                }
                                return (
                                    <div key={msg.id} className="flex flex-col gap-2 max-w-[85%] self-end items-end ml-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex items-center gap-2 px-1">
                                            <span className="text-[8px] font-black text-zinc-300 uppercase tracking-[0.2em]">Cliente</span>
                                        </div>
                                        <div className="chat-bubble-user p-4 rounded-2xl rounded-br-sm text-sm font-medium leading-relaxed shadow-lg">
                                            {msg.content}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-center">
                            <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-300">Auditoría Haminos IA</span>
                        </div>
                    </>
                )}
            </aside>
        </div>
    );
}
