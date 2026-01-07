'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Users,
  Target,
  Menu,
  RefreshCw,
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
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/Sidebar';

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

interface StatsData {
  daily: { date: string, count: number }[];
  categories: { name: string, value: number }[];
}

const COLORS = ['#000000', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<StatsData>({ daily: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  return (
    <div className="flex min-h-screen bg-[#fafafa] text-zinc-900 font-sans overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="flex justify-between items-center p-6 lg:px-10 border-b border-zinc-100 bg-[#fafafa]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 hover:bg-zinc-100 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl lg:text-2xl font-black tracking-tight text-zinc-950 uppercase">Dashboard Operativo</h1>
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
          <div className="space-y-8 w-full">
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
                <h3 className="font-black text-xs uppercase tracking-widest text-zinc-400 mb-6">Consultas por Categoría</h3>
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
                <h3 className="font-black text-xs uppercase tracking-widest text-zinc-400 mb-6">Volumen de Actividad</h3>
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
                <Link href="/chats" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors">
                  Ver Todo
                </Link>
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
        </div>
      </main>
    </div>
  );
}
