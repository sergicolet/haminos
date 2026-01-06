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
  RefreshCw
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

  // Extraer todos los mensajes individuales para estadísticas y tabla rápida
  const allMessages = useMemo(() => {
    return sessions.flatMap(s => s.messages).sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [sessions]);

  const headerStats = [
    {
      name: 'Interacciones',
      value: sessions.length,
      icon: MessageSquare
    },
    {
      name: 'Usuarios (Sesiones)',
      value: new Set(sessions.map(s => s.id)).size,
      icon: Users
    },
    {
      name: 'Categorías Detectadas',
      value: (stats?.categories || []).length,
      icon: Target
    },
  ];

  const selectedSession = useMemo(() => {
    return sessions.find(s => s.id === selectedSessionId) || null;
  }, [selectedSessionId, sessions]);

  return (
    <div className="flex min-h-screen bg-[#fafafa] text-zinc-900 font-sans overflow-hidden">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
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
              <div className="w-10 h-10 bg-gradient-to-br from-black to-zinc-700 rounded-xl flex items-center justify-center shadow-lg">
                <Database className="text-white w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-base tracking-tight block text-zinc-900">HAMINOS IA</span>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Dashboard</span>
              </div>
            </div>
            <button className="lg:hidden p-2 hover:bg-zinc-100 rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="mb-3">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-3 mb-2">Navegación</p>
          </div>
          <button
            onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group",
              activeTab === 'overview'
                ? "bg-black text-white shadow-lg scale-[1.02]"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-black"
            )}
          >
            <PieChartIcon className="w-4 h-4 shrink-0" />
            <span>Resumen</span>
          </button>
          <button
            onClick={() => { setActiveTab('conversations'); setIsMobileMenuOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group",
              activeTab === 'conversations'
                ? "bg-black text-white shadow-lg scale-[1.02]"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-black"
            )}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>Historial Chats</span>
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all group"
          >
            <LogOut className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="flex justify-between items-center p-6 lg:p-10 border-b border-zinc-100 bg-[#fafafa]/80 backdrop-blur-md sticky top-0 z-30">
          <div>
            <div className="flex items-center gap-3 lg:hidden mb-2">
              <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 hover:bg-zinc-100 rounded-lg">
                <Menu className="w-6 h-6" />
              </button>
              <span className="font-black tracking-tighter text-xl">HAMINOS</span>
            </div>
            <h1 className="text-xl lg:text-3xl font-bold tracking-tight hidden lg:block text-zinc-950">Panel de Control</h1>
            <p className="text-sm text-zinc-500 hidden lg:block">Monitoriza las interacciones en tiempo real.</p>
          </div>
          <button
            onClick={fetchData}
            className="group flex items-center gap-2 bg-white border border-zinc-200 px-4 py-2.5 rounded-xl text-xs lg:text-sm font-bold hover:border-black transition-all shadow-sm"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 transition-transform group-hover:rotate-180", loading && "animate-spin")} />
            <span className="hidden sm:inline">{loading ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          {activeTab === 'overview' && (
            <div className="space-y-8 lg:space-y-12 max-w-7xl mx-auto">
              {/* Stats Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {headerStats.map((stat) => (
                  <div key={stat.name} className="bg-white p-6 lg:p-8 rounded-[2rem] border border-zinc-200 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-transform">
                    <div className="flex flex-col gap-1 relative z-10">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{stat.name}</p>
                      <p className="text-3xl lg:text-4xl font-black tracking-tighter text-zinc-900">{stat.value}</p>
                    </div>
                    <stat.icon className="absolute -bottom-4 -right-4 w-24 h-24 text-zinc-100 opacity-20 group-hover:scale-110 transition-transform" />
                  </div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pie Chart: Categorías */}
                <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold tracking-tight flex items-center gap-2 text-zinc-900">
                      <PieChartIcon className="w-5 h-5 text-blue-500" /> Consultas por Tipo
                    </h3>
                  </div>
                  <div className="h-[300px] w-full min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={(stats?.categories?.length ?? 0) > 0 ? stats.categories : [{ name: 'Sin Datos', value: 1 }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {(stats?.categories || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                          {(!stats?.categories || stats.categories.length === 0) && (
                            <Cell fill="#f3f4f6" />
                          )}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Legend verticalAlign="bottom" align="center" iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Area Chart: Actividad */}
                <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold tracking-tight flex items-center gap-2 text-zinc-900">
                      <Calendar className="w-5 h-5 text-emerald-500" /> Actividad Temporal
                    </h3>
                  </div>
                  <div className="h-[300px] w-full min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={(stats?.daily?.length ?? 0) > 0 ? stats.daily : [{ date: 'Hoy', count: 0 }]}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 'bold', fill: '#888' }}
                        />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#2563eb"
                          strokeWidth={4}
                          fillOpacity={1}
                          fill="url(#colorCount)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Table Overview */}
              <div className="bg-white rounded-[2.5rem] border border-zinc-200 overflow-hidden shadow-sm">
                <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between">
                  <h3 className="font-black text-xs uppercase tracking-widest text-zinc-400">Mensajes Recientes</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                        <th className="px-8 py-4">Actor</th>
                        <th className="px-8 py-4">Categoría</th>
                        <th className="px-8 py-4">Mensaje</th>
                        <th className="px-8 py-4">Hora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-zinc-900">
                      {allMessages.slice(0, 10).map((msg, idx) => (
                        <tr key={msg.id || idx} className="hover:bg-zinc-50 transition-all group">
                          <td className="px-8 py-6">
                            <span className={cn(
                              "px-3 py-1.5 rounded-full text-[10px] font-black tracking-tighter uppercase",
                              msg.role === 'user' ? "bg-blue-50 text-blue-600" : "bg-black text-white shadow-sm"
                            )}>
                              {msg.role ? (msg.role === 'user' ? 'CLIENTE' : 'BOT') : '---'}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            {msg.role === 'user' && msg.category ? (
                              <span className="text-[10px] font-bold bg-zinc-100 px-2 py-1 rounded text-zinc-600 uppercase">
                                {msg.category}
                              </span>
                            ) : (
                              <span className="text-[10px] text-zinc-300">---</span>
                            )}
                          </td>
                          <td className="px-8 py-6 text-sm font-medium tracking-tight truncate max-w-[200px] sm:max-w-md">
                            {msg.content}
                          </td>
                          <td className="px-8 py-6 text-[10px] font-bold opacity-30">
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </td>
                        </tr>
                      ))}
                      {allMessages.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-8 py-10 text-center text-zinc-400 font-bold text-xs uppercase tracking-widest">
                            No hay mensajes recientes
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'conversations' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex items-center justify-between mb-8 text-zinc-900">
                <div>
                  <h2 className="text-2xl font-black tracking-tighter">Historial de Conversaciones</h2>
                  <p className="text-sm text-zinc-500 uppercase tracking-widest font-bold text-[10px] mt-1">{sessions.length} Sesiones únicas</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                    className="flex items-center justify-between p-6 bg-white border border-zinc-200 rounded-3xl hover:border-black transition-all text-left group shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">
                          Sesión {session.id.substring(0, 8)}
                        </p>
                        <p className="text-sm font-bold truncate pr-8 text-zinc-900">
                          {session.title || 'Conversación'}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                            <Clock className="w-3 h-3" /> {new Date(session.date).toLocaleString()}
                          </span>
                          <span className="bg-zinc-100 px-2 py-0.5 rounded text-[9px] font-black uppercase text-zinc-600">
                            {session.messages.length} Mensajes
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-black transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Chat Slider / Drawer */}
      <aside className={cn(
        "fixed inset-y-0 right-0 w-full sm:w-[450px] lg:w-[550px] bg-white border-l border-zinc-200 shadow-2xl z-50 transform transition-transform duration-500 ease-in-out flex flex-col",
        selectedSessionId ? "translate-x-0" : "translate-x-full"
      )}>
        {selectedSession && (
          <>
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0">
              <div>
                <h3 className="text-lg font-black tracking-tighter uppercase text-zinc-900">Detalle del Chat</h3>
                <p className="text-[10px] font-black text-zinc-400 tracking-widest uppercase">ID: {selectedSessionId}</p>
              </div>
              <button
                onClick={() => setSelectedSessionId(null)}
                className="p-3 bg-zinc-100 rounded-2xl hover:bg-black hover:text-white transition-all text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50">
              {selectedSession.messages.map((msg, idx) => (
                <div key={msg.id || idx} className={cn(
                  "flex flex-col gap-2 max-w-[85%]",
                  msg.role === 'user' ? "self-end items-end ml-auto" : "self-start"
                )}>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                      {msg.role === 'user' ? 'Cliente' : 'Haminos AI'}
                    </span>
                    <span className="text-[9px] text-zinc-300 font-bold italic">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={cn(
                    "p-5 rounded-[1.8rem] text-sm font-medium leading-relaxed shadow-sm whitespace-pre-wrap",
                    msg.role === 'user'
                      ? "bg-blue-600 text-white rounded-tr-none shadow-lg"
                      : "bg-white border border-zinc-100 rounded-tl-none text-zinc-800"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
