'use client';

import { useEffect, useState } from 'react';
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
  PieChart as PieChartIcon
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

  return (
    <div className="flex min-h-screen bg-[#fafafa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
            <Database className="text-white dark:text-black w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">HAMINOS IA</span>
        </div>

        <nav className="flex flex-col gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
              activeTab === 'overview' ? "bg-black text-white dark:bg-white dark:text-black shadow-md" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            <PieChartIcon className="w-4 h-4" /> Resumen
          </button>
          <button
            onClick={() => setActiveTab('conversations')}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
              activeTab === 'conversations' ? "bg-black text-white dark:bg-white dark:text-black shadow-md" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            <MessageSquare className="w-4 h-4" /> Historial Chats
          </button>
        </nav>

      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Panel de Control</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Analiza el comportamiento de tus usuarios y la IA.</p>
          </div>
          <button
            onClick={fetchData}
            className="group flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2 rounded-xl text-sm font-semibold hover:border-black dark:hover:border-white transition-all shadow-sm"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 transition-transform group-hover:rotate-180", loading && "animate-spin")} />
            Sincronizar Datos
          </button>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {headerStats.map((stat) => (
                <div key={stat.name} className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800/50 shadow-sm relative overflow-hidden group">
                  <div className="flex flex-col gap-1 relative z-10">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{stat.name}</p>
                    <p className="text-3xl font-black tracking-tighter">{stat.value}</p>
                  </div>
                  <stat.icon className="absolute -bottom-2 -right-2 w-16 h-16 text-zinc-100 dark:text-zinc-800 opacity-50 group-hover:scale-110 transition-transform" />
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-black dark:text-white">
              {/* Pie Chart: Categorías */}
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold tracking-tight flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 opacity-50" /> Categorías de Consulta
                  </h3>
                  <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full opacity-70 uppercase tracking-tighter">Eventos Tracking</span>
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
                          border: 'none',
                          borderRadius: '16px',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Area Chart: Actividad por Días */}
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm text-black dark:text-white">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold tracking-tight flex items-center gap-2">
                    <Calendar className="w-5 h-5 opacity-50" /> Actividad por Días
                  </h3>
                  <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full opacity-70 uppercase tracking-tighter">Última Semana</span>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.daily || []}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#000000" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#000000" stopOpacity={0} />
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
                        cursor={{ stroke: '#000', strokeWidth: 1, strokeDasharray: '4 4' }}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: 'none',
                          borderRadius: '16px',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#000000"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorCount)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
              <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold">Chat Logs Recientes</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      <th className="px-8 py-4">Sesión</th>
                      <th className="px-8 py-4">Actor</th>
                      <th className="px-8 py-4">Contenido</th>
                      <th className="px-8 py-4">Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {loading ? (
                      [...Array(3)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={4} className="px-8 py-6"><div className="h-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg w-full" /></td>
                        </tr>
                      ))
                    ) : logs.slice(0, 10).map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all group">
                        <td className="px-8 py-5 text-[10px] font-mono opacity-40 group-hover:opacity-100 transition-opacity">
                          {log.session_id.substring(0, 6)}...
                        </td>
                        <td className="px-8 py-5">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black tracking-tighter",
                            log.sender === 'user' ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                          )}>
                            {log.sender.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-sm font-medium tracking-tight truncate max-w-sm">{log.message}</td>
                        <td className="px-8 py-5 text-[10px] font-bold opacity-30">
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
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Historial Completo</h2>
              <span className="text-xs font-bold opacity-50">{logs.length} mensajes registrados</span>
            </div>
            {logs.map((log) => (
              <div key={log.id} className={cn(
                "p-6 rounded-[2rem] border shadow-sm relative",
                log.sender === 'user'
                  ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 self-start w-[80%]"
                  : "bg-black text-white dark:bg-white dark:text-black self-end w-[80%] shadow-xl"
              )}>
                <div className="flex items-center gap-2 mb-3 opacity-40 text-[10px] font-bold uppercase tracking-widest">
                  <span>{log.sender}</span>
                  <span>•</span>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-sm font-medium leading-relaxed">{log.message}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
