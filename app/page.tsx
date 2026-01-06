'use client';

import { useEffect, useState, useMemo } from 'react';
import { signOut } from 'next-auth/react';
import {
  Users,
  MessageSquare,
  Target,
  Settings,
  ArrowUpRight,
  RefreshCw,
  Search,
  Database,
  Calendar,
  PieChart as PieChartIcon,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Clock
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

interface ChatLog {
  id: number;
  session_id: string;
  message: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

interface StatsData {
  daily: { date: string, count: number }[];
  categories: { name: string, value: number }[];
}

const COLORS = ['#000000', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [logs, setLogs] = useState<ChatLog[]>([]);
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

      setLogs(Array.isArray(logsData) ? logsData : []);
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

  const safeCategories = stats?.categories || [];

  const headerStats = [
    { name: 'Mensajes totales', value: logs.length, icon: MessageSquare, color: 'text-zinc-950 dark:text-white' },
    { name: 'Usuarios únicos', value: new Set(logs.map(l => l.session_id)).size, icon: Users, color: 'text-zinc-950 dark:text-white' },
    { name: 'Acciones Tracking', value: (stats?.categories || []).reduce((acc, curr) => acc + Number(curr.value), 0), icon: Target, color: 'text-zinc-950 dark:text-white' },
  ];

  const sessions = useMemo(() => {
    const sessionMap = new Map<string, { lastMessage: string, timestamp: string, count: number }>();

    logs.forEach(log => {
      if (!sessionMap.has(log.session_id)) {
        sessionMap.set(log.session_id, {
          lastMessage: log.message,
          timestamp: log.timestamp,
          count: 1
        });
      } else {
        const current = sessionMap.get(log.session_id)!;
        sessionMap.set(log.session_id, {
          ...current,
          count: current.count + 1
        });
      }
    });

    return Array.from(sessionMap.entries()).map(([id, data]) => ({
      id,
      ...data
    }));
  }, [logs]);

  const selectedSessionMessages = useMemo(() => {
    if (!selectedSessionId) return [];
    return logs
      .filter(l => l.session_id === selectedSessionId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [selectedSessionId, logs]);

  return (
    <div className="flex min-h-screen bg-[#fafafa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex flex-col z-50 transition-transform duration-300",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        "lg:static lg:block"
      )}>
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-black to-zinc-700 dark:from-white dark:to-zinc-300 rounded-xl flex items-center justify-center shadow-lg">
                <Database className="text-white dark:text-black w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-base tracking-tight block">HAMINOS IA</span>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Dashboard</span>
              </div>
            </div>
            <button className="lg:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="mb-3">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-3 mb-2">Navegación</p>
          </div>
          <button
            onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group",
              activeTab === 'overview'
                ? "bg-black text-white dark:bg-white dark:text-black shadow-lg scale-[1.02]"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white"
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
                ? "bg-black text-white dark:bg-white dark:text-black shadow-lg scale-[1.02]"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white"
            )}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>Historial Chats</span>
          </button>
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all group"
          >
            <LogOut className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="flex justify-between items-center p-6 lg:p-10 border-b border-zinc-100 dark:border-zinc-900 bg-[#fafafa]/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
          <div>
            <div className="flex items-center gap-3 lg:hidden mb-2">
              <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                <Menu className="w-6 h-6" />
              </button>
              <span className="font-black tracking-tighter text-xl">HAMINOS</span>
            </div>
            <h1 className="text-xl lg:text-3xl font-bold tracking-tight hidden lg:block">Panel de Control</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 hidden lg:block">Monitoriza y gestiona tu sistema de IA.</p>
          </div>
          <button
            onClick={fetchData}
            className="group flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 rounded-xl text-xs lg:text-sm font-bold hover:border-black dark:hover:border-white transition-all shadow-sm"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 transition-transform group-hover:rotate-180", loading && "animate-spin")} />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          {activeTab === 'overview' && (
            <div className="space-y-8 lg:space-y-12 max-w-7xl mx-auto">
              {/* Stats Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {headerStats.map((stat) => (
                  <div key={stat.name} className="bg-white dark:bg-zinc-900/50 p-6 lg:p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800/50 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-transform">
                    <div className="flex flex-col gap-1 relative z-10">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{stat.name}</p>
                      <p className="text-3xl lg:text-4xl font-black tracking-tighter">{stat.value}</p>
                    </div>
                    <stat.icon className="absolute -bottom-4 -right-4 w-24 h-24 text-zinc-100 dark:text-zinc-800 opacity-20 group-hover:scale-110 transition-transform" />
                  </div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pie Chart: Categorías */}
                <div className="bg-white dark:bg-zinc-900 p-6 lg:p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold tracking-tight flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5 text-blue-500" /> Consultas por Tipo
                    </h3>
                  </div>
                  <div className="h-[300px] w-full">
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
                          {safeCategories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            color: '#000',
                            fontSize: '11px',
                            fontWeight: '600',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: '600', color: '#374151' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Area Chart: Actividad */}
                <div className="bg-white dark:bg-zinc-900 p-6 lg:p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold tracking-tight flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-emerald-500" /> Actividad Temporal
                    </h3>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats?.daily || []}>
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
                            borderRadius: '12px',
                            color: '#000',
                            fontSize: '11px',
                            fontWeight: '600',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
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
              <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <h3 className="font-black text-xs uppercase tracking-widest text-zinc-400">Mensajes Recientes</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800/30 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                        <th className="px-8 py-4">Actor</th>
                        <th className="px-8 py-4">Mensaje</th>
                        <th className="px-8 py-4">Hora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {logs.slice(0, 5).map((log) => (
                        <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all group">
                          <td className="px-8 py-6">
                            <span className={cn(
                              "px-3 py-1.5 rounded-full text-[10px] font-black tracking-tighter",
                              log.sender === 'user' ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                            )}>
                              {log.sender.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-sm font-medium tracking-tight truncate max-w-[200px] sm:max-w-md">{log.message}</td>
                          <td className="px-8 py-6 text-[10px] font-bold opacity-30">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex items-center justify-between mb-8">
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
                    className="flex items-center justify-between p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-black dark:hover:border-white transition-all text-left group shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Sesión {session.id.substring(0, 8)}</p>
                        <p className="text-sm font-bold truncate pr-8">{session.lastMessage}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                            <Clock className="w-3 h-3" /> {new Date(session.timestamp).toLocaleString()}
                          </span>
                          <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[9px] font-black uppercase">
                            {session.count} Mensajes
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Chat Slider / Drawer */}
      <aside className={cn(
        "fixed inset-y-0 right-0 w-full sm:w-[450px] lg:w-[550px] bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 transform transition-transform duration-500 ease-in-out flex flex-col",
        selectedSessionId ? "translate-x-0" : "translate-x-full"
      )}>
        {selectedSessionId && (
          <>
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-950/80 backdrop-blur-md sticky top-0">
              <div>
                <h3 className="text-lg font-black tracking-tighter uppercase">Detalle del Chat</h3>
                <p className="text-[10px] font-black text-zinc-400 tracking-widest uppercase">ID: {selectedSessionId}</p>
              </div>
              <button
                onClick={() => setSelectedSessionId(null)}
                className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50 dark:bg-zinc-900/10">
              {selectedSessionMessages.map((msg, idx) => (
                <div key={msg.id} className={cn(
                  "flex flex-col gap-2 max-w-[85%]",
                  msg.sender === 'user' ? "self-end items-end ml-auto" : "self-start"
                )}>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                      {msg.sender === 'user' ? 'Cliente' : 'Haminos AI'}
                    </span>
                    <span className="text-[9px] text-zinc-300 font-bold italic">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={cn(
                    "p-5 rounded-[1.8rem] text-sm font-medium leading-relaxed shadow-sm",
                    msg.sender === 'user'
                      ? "bg-blue-600 dark:bg-blue-500 text-white rounded-tr-none shadow-lg"
                      : "bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-tl-none text-zinc-800 dark:text-zinc-200"
                  )}>
                    {msg.message}
                  </div>
                </div>
              ))}
              {selectedSessionMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                  <MessageSquare className="w-16 h-16 mb-4" />
                  <p className="font-bold uppercase tracking-widest text-xs">No hay mensajes en esta sesión</p>
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
