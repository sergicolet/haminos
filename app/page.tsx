'use client';

import { useEffect, useState, useMemo } from 'react';
import { signOut } from 'next-auth/react';
import {
  Users,
  MessageSquare,
  Target,
  Database,
  Calendar,
  PieChart as PieChartIcon,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Clock,
  RefreshCw,
  ExternalLink,
  ShoppingCart,
  Truck
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- UTILIDADES DE PARSEO (Basadas en Shopify Snippet) ---

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
  // h = h.replace(/</g, "&lt;").replace(/>/g, "&gt;"); // Ya escapado antes de entrar o manejado con cuidado
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
    const lastLinkMatch = rest.match(/.*🛒\s*\[.*?\]\(.*?\)/s);

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

// --- COMPONENTES ---

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

interface StatsData {
  daily: { date: string, count: number }[];
  categories: { name: string, value: number }[];
}

const COLORS = ['#000000', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<StatsData>({ daily: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        fetch('/api/logs'),
        fetch('/api/stats')
      ]);

      const logsData = await logsRes.json();
      const statsData = await statsRes.json();

      setSessions(Array.isArray(logsData) ? logsData : []);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const allMessages = useMemo(() => {
    return sessions.flatMap(s => s.messages).sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [sessions]);

  const headerStats = [
    { name: 'Chats Totales', value: sessions.length, icon: MessageSquare },
    { name: 'Usuarios / Sesiones', value: new Set(sessions.map(s => s.id)).size, icon: Users },
    { name: 'Eventos Tracking', value: (stats?.categories || []).reduce((acc, curr) => acc + Number(curr.value), 0), icon: Target },
  ];

  const selectedSession = useMemo(() => {
    return sessions.find(s => s.id === selectedSessionId) || null;
  }, [selectedSessionId, sessions]);

  return (
    <div className="flex min-h-screen bg-[#fafafa] text-zinc-900 font-sans overflow-hidden">
      <style>{`
        .chat-bubble-bot { background-color: #c38692 !important; color: white !important; font-family: 'Inter', sans-serif; }
        .chat-bubble-user { background-color: #000000 !important; color: white !important; font-family: 'Inter', sans-serif; }
        .chat-title { font-family: 'Cormorant Garamond', serif; letter-spacing: 0.1em; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 border-r border-zinc-200 bg-white flex flex-col z-50 transition-transform duration-300",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        "lg:static lg:block"
      )}>
        <div className="p-6 border-b border-zinc-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-serif text-xl font-bold">H</span>
              </div>
              <div>
                <span className="font-black text-base tracking-tight block text-zinc-900 leading-none">HAMINOS®</span>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Expert Panel</span>
              </div>
            </div>
            <button className="lg:hidden p-2 hover:bg-zinc-100 rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="mb-3">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-3 mb-2">General</p>
          </div>
          <button
            onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
              activeTab === 'overview' ? "bg-black text-white shadow-lg" : "text-zinc-600 hover:bg-zinc-100 hover:text-black"
            )}
          >
            <PieChartIcon className="w-4 h-4" />
            <span>Resumen</span>
          </button>
          <button
            onClick={() => { setActiveTab('conversations'); setIsMobileMenuOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
              activeTab === 'conversations' ? "bg-black text-white shadow-lg" : "text-zinc-600 hover:bg-zinc-100 hover:text-black"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Historial de Chats</span>
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
          <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all group">
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="flex justify-between items-center p-6 lg:px-10 border-b border-zinc-100 bg-[#fafafa]/80 backdrop-blur-md sticky top-0 z-30">
          <div>
            <div className="flex items-center gap-3 lg:hidden mb-2">
              <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 hover:bg-zinc-100 rounded-lg">
                <Menu className="w-6 h-6" />
              </button>
              <span className="font-serif font-black tracking-tight text-xl">HAMINOS</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-black tracking-tight hidden lg:block text-zinc-950 uppercase chat-title">Dashboard Operativo</h1>
          </div>
          <button
            onClick={fetchData}
            className="group flex items-center gap-2 bg-white border border-zinc-200 px-4 py-2 rounded-xl text-xs font-bold hover:border-black transition-all shadow-sm"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            <span className="hidden sm:inline">Sincronizar Datos</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          {activeTab === 'overview' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {headerStats.map((stat) => (
                  <div key={stat.name} className="bg-white p-6 rounded-[2rem] border border-zinc-200 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-transform">
                    <div className="relative z-10">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">{stat.name}</p>
                      <p className="text-3xl font-black text-zinc-900">{stat.value}</p>
                    </div>
                    <stat.icon className="absolute -bottom-2 -right-2 w-20 h-20 text-zinc-100 opacity-20" />
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
                  <h3 className="font-black text-xs uppercase tracking-widest text-zinc-400 mb-6 chat-title">Consultas por Categoría</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={(stats?.categories?.length ?? 0) > 0 ? stats.categories : [{ name: 'Sin Datos', value: 1 }]}
                          cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value"
                        >
                          {(stats?.categories || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                          {(!stats?.categories || stats.categories.length === 0) && <Cell fill="#f3f4f6" />}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Legend iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
                  <h3 className="font-black text-xs uppercase tracking-widest text-zinc-400 mb-6 chat-title">Volumen de Actividad</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={(stats?.daily?.length ?? 0) > 0 ? stats.daily : [{ date: 'Hoy', count: 0 }]}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#c38692" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#c38692" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#888' }} />
                        <YAxis hide />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                        <Area type="monotone" dataKey="count" stroke="#c38692" strokeWidth={3} fill="url(#colorCount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-[2.5rem] border border-zinc-200 overflow-hidden shadow-sm">
                <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between">
                  <h3 className="font-black text-xs uppercase tracking-widest text-zinc-400">Mensajes Recientes</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        <th className="px-8 py-4">Actor</th>
                        <th className="px-8 py-4">Categoría</th>
                        <th className="px-8 py-4">Mensaje</th>
                        <th className="px-8 py-4">Hora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {allMessages.slice(0, 8).map((msg, idx) => (
                        <tr key={msg.id || idx} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-8 py-5">
                            <span className={cn(
                              "px-2 py-1 rounded text-[9px] font-black tracking-tighter",
                              msg.role === 'user' ? "bg-zinc-100 text-zinc-600" : "bg-black text-white"
                            )}>
                              {msg.role === 'user' ? 'CLIENTE' : 'ASENSOR'}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            {msg.role === 'user' && msg.category ? (
                              <span className="text-[10px] font-bold text-zinc-900 border-b-2 border-[#c38692] uppercase">{msg.category}</span>
                            ) : <span className="text-zinc-200">-</span>}
                          </td>
                          <td className="px-8 py-5 text-xs font-semibold text-zinc-600 truncate max-w-[300px]">{msg.content}</td>
                          <td className="px-8 py-5 text-[10px] font-bold text-zinc-300">
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'conversations' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <h2 className="text-xl font-serif font-black mb-6 uppercase tracking-widest text-zinc-400 border-b pb-4">Sesiones de Consulta</h2>
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                  className="w-full flex items-center justify-between p-6 bg-white border border-zinc-200 rounded-3xl hover:border-black transition-all text-left shadow-sm group"
                >
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-[#c38692] transition-colors">
                      <MessageSquare className="w-5 h-5 group-hover:text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Sesión: {session.id.substring(8, 16).toUpperCase()}</p>
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
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Visor de Chat (Estética Shopify) */}
      <aside className={cn(
        "fixed inset-y-0 right-0 w-full sm:w-[450px] lg:w-[500px] bg-white border-l border-zinc-200 shadow-2xl z-50 transform transition-transform duration-500 ease-in-out flex flex-col",
        selectedSessionId ? "translate-x-0" : "translate-x-full"
      )}>
        {selectedSession && (
          <>
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-white sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white font-serif font-bold text-xl">H</span>
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-black uppercase tracking-widest leading-none mb-1">Haminos AI</h3>
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
              <span className="text-[10px] font-serif uppercase tracking-[0.3em] text-zinc-300">Auditoría Haminos IA</span>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
