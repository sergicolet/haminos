'use client';

import {
    LayoutDashboard,
    MessageSquare,
    Database,
    LogOut,
    X,
    ChevronLeft,
    ChevronRight,
    User
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const menuItems = [
    { name: 'Resumen', icon: LayoutDashboard, href: '/' },
    { name: 'Historial de Chats', icon: MessageSquare, href: '/chats' },
    { name: 'Base de Conocimiento', icon: Database, href: '/knowledge' },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Content */}
            <aside className={cn(
                "fixed inset-y-0 left-0 bg-white border-r border-zinc-200 flex flex-col z-50 transition-all duration-300 ease-in-out overflow-x-hidden",
                isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                isCollapsed ? "lg:w-20" : "lg:w-72",
                "w-72"
            )}>
                {/* Header Section */}
                <div className={cn(
                    "p-6 flex items-center border-b border-zinc-50 shrink-0",
                    isCollapsed ? "lg:justify-center" : "justify-between"
                )}>
                    <div className={cn("flex items-center gap-3 overflow-hidden", isCollapsed && "lg:hidden")}>
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shrink-0">
                            <span className="text-white font-black text-sm">H</span>
                        </div>
                        <span className="font-black tracking-tighter text-xl uppercase whitespace-nowrap">Haminos IA</span>
                    </div>

                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 hover:bg-zinc-100 rounded-xl"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Collapse Toggle for Desktop */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={cn(
                            "hidden lg:flex p-2 hover:bg-zinc-100 rounded-xl text-zinc-400 hover:text-black transition-colors shrink-0",
                            isCollapsed && "mx-auto"
                        )}
                    >
                        {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => {
                                    if (window.innerWidth < 1024) onClose();
                                }}
                                className={cn(
                                    "flex items-center rounded-2xl transition-all duration-200 group relative",
                                    isCollapsed ? "lg:justify-center lg:px-0 lg:h-12 lg:w-12 lg:mx-auto" : "gap-3 px-4 py-3",
                                    isActive
                                        ? "bg-black text-white shadow-lg shadow-black/10"
                                        : "text-zinc-500 hover:bg-zinc-50 hover:text-black"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5 shrink-0 transition-transform", isActive ? "text-white" : "group-hover:scale-110")} />
                                {!isCollapsed && (
                                    <span className="font-bold text-sm whitespace-nowrap overflow-hidden">
                                        {item.name}
                                    </span>
                                )}

                                {/* Tooltip for collapsed state */}
                                {isCollapsed && (
                                    <div className="hidden lg:group-hover:block absolute left-full ml-4 px-3 py-2 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg whitespace-nowrap z-[100] shadow-xl">
                                        {item.name}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Section - Profile and Logout AT BOTTOM */}
                <div className="mt-auto border-t border-zinc-100 p-4 space-y-4 bg-zinc-50/50">
                    {/* User Profile */}
                    <div className={cn("flex items-center overflow-hidden", isCollapsed ? "lg:justify-center" : "gap-3 px-2")}>
                        <div className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-zinc-400" />
                        </div>
                        {!isCollapsed && (
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-black uppercase tracking-tight truncate leading-none mb-1">Admin Haminos</p>
                                <p className="text-[10px] font-bold text-zinc-400 truncate">Soporte Vital</p>
                            </div>
                        )}
                    </div>

                    {/* Logout Button */}
                    <button className={cn(
                        "w-full flex items-center text-red-500 bg-red-50/50 hover:bg-red-50 rounded-2xl transition-all group overflow-hidden",
                        isCollapsed ? "lg:justify-center lg:h-12 lg:w-12 lg:mx-auto" : "gap-3 px-4 py-3"
                    )}>
                        <LogOut className={cn("w-5 h-5 shrink-0 transition-transform group-hover:-translate-x-0.5")} />
                        {!isCollapsed && (
                            <span className="font-bold text-sm whitespace-nowrap">
                                Cerrar Sesión
                            </span>
                        )}

                        {/* Tooltip for collapsed state */}
                        {isCollapsed && (
                            <div className="hidden lg:group-hover:block absolute left-full ml-4 px-3 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg whitespace-nowrap z-[100] shadow-xl">
                                Desconectar
                            </div>
                        )}
                    </button>
                </div>
            </aside>

            {/* Adjust Main Content with a Spacer in Desktop */}
            <div className={cn(
                "hidden lg:block transition-all duration-300 shrink-0",
                isCollapsed ? "w-20" : "w-72"
            )} />
        </>
    );
}
