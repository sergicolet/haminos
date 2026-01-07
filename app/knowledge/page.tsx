'use client';

import { useEffect, useState, useRef } from 'react';
import {
    Database,
    Search,
    Edit3,
    RefreshCw,
    Save,
    X,
    AlertCircle,
    CheckCircle2,
    Info,
    Menu,
    Type,
    Bold as BoldIcon,
    List as ListIcon
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { cn } from '@/lib/utils';

interface KnowledgeItem {
    id: string;
    text: string;
    score?: number;
}

/**
 * CONVERSION UTILS - VERSION COMPACTA 1:1
 * Diseñada para que el editor se vea igual que el texto plano de Pinecone.
 */
const markdownToHtml = (md: string) => {
    if (!md) return "";
    let html = md;

    // Títulos H2 (##) - SIN ESPACIO ADICIONAL
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-black p-0 m-0 leading-tight text-black">$1</h2>');

    // Títulos H3 (###) - SIN ESPACIO ADICIONAL
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-black p-0 m-0 leading-tight text-black">$1</h3>');

    // Convertir saltos de línea a br
    html = html.replace(/\n/g, '<br>');

    return `<div>${html}</div>`;
};

const htmlToMarkdown = (html: string) => {
    if (!html) return "";

    let md = html;

    // Convertir Títulos
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gim, '## $1');
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gim, '### $1');

    // Convertir br a saltos de línea
    md = md.replace(/<br\s*\/?>/gi, '\n');

    // Limpiar etiquetas de bloque
    md = md.replace(/<div[^>]*>/gi, '\n').replace(/<\/div>/gi, '');
    md = md.replace(/<p[^>]*>/gi, '\n').replace(/<\/p>/gi, '');

    // Limpiar cualquier otra etiqueta
    md = md.replace(/<[^>]+>/g, '');

    // Limpieza final
    return md.split('\n').map(line => line.trimEnd()).join('\n').trim();
};

export default function KnowledgePage() {
    const [data, setData] = useState<KnowledgeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

    const editorRef = useRef<HTMLDivElement>(null);

    const fetchKnowledge = async () => {
        setLoading(true);
        setStatus({ type: null, message: '' });
        try {
            const res = await fetch('/api/knowledge');
            const json = await res.json();
            if (json.error) throw new Error(json.details || json.error);
            setData(json);
        } catch (err: any) {
            setStatus({ type: 'error', message: `Error al cargar datos: ${err.message}` });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKnowledge();
    }, []);

    const handleUpdate = async () => {
        if (!editingItem || !editorRef.current) return;
        setIsSaving(true);
        setStatus({ type: null, message: '' });

        const richText = editorRef.current.innerHTML;
        const markdown = htmlToMarkdown(richText);

        try {
            const res = await fetch('/api/knowledge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingItem.id, text: markdown })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(`${result.error}: ${result.details}`);

            setStatus({ type: 'success', message: '¡Base de conocimiento sincronizada!' });
            setEditingItem(null);
            fetchKnowledge();
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    const formatHeading = () => {
        document.execCommand('formatBlock', false, 'H3');
        const selection = window.getSelection();
        if (selection && selection.anchorNode) {
            let parent = selection.anchorNode.parentElement;
            while (parent && parent.tagName !== 'H3' && parent !== editorRef.current) {
                parent = parent.parentElement;
            }
            if (parent && parent.tagName === 'H3') {
                parent.className = "text-lg font-black m-0 tracking-tight text-black";
            }
        }
    };

    const filteredData = data.filter(item =>
        item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-[#fafafa] text-zinc-900 font-sans overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
                <header className="h-20 bg-white border-b border-zinc-200 z-30 px-6 lg:px-12 flex items-center justify-between shrink-0 font-sans">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 hover:bg-zinc-100 rounded-lg">
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl lg:text-2xl font-black tracking-tight text-zinc-950 uppercase">Base de Conocimiento</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block w-64 lg:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Buscar fragmento..."
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none focus:border-black transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={fetchKnowledge}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl text-xs font-black hover:bg-zinc-800 transition-all shadow-xl shadow-black/10 disabled:opacity-50 uppercase tracking-widest"
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                            <span className="hidden sm:inline">Sincronizar</span>
                        </button>
                    </div>
                </header>

                <main className="flex-1 flex flex-col p-6 lg:p-12 w-full bg-[#fdfdfd] overflow-hidden">
                    {status.type && (
                        <div className={cn(
                            "mb-6 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 z-20",
                            status.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
                        )}>
                            {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                            <div className="text-sm font-semibold">{status.message}</div>
                            <button onClick={() => setStatus({ type: null, message: '' })} className="ml-auto">
                                <X className="w-4 h-4 opacity-50 hover:opacity-100" />
                            </button>
                        </div>
                    )}

                    <div className="flex-1 flex flex-col min-h-0 w-full bg-white border border-zinc-200 rounded-[2.5rem] shadow-2xl shadow-zinc-200/50 overflow-hidden text-zinc-900">
                        <div className="h-10 bg-zinc-50/50 border-b border-zinc-100 flex items-center px-8 gap-2 shrink-0">
                            <div className="w-2 h-2 rounded-full bg-zinc-200" />
                            <div className="w-2 h-2 rounded-full bg-zinc-200" />
                            <div className="w-2 h-2 rounded-full bg-zinc-200" />
                            <span className="ml-4 text-[9px] font-black text-zinc-300 uppercase tracking-widest font-mono">live_database.md</span>
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 scrollbar-hide bg-white">
                            {loading ? (
                                <div className="p-12 space-y-8 bg-white">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="space-y-4">
                                            <div className="h-4 w-48 bg-zinc-100 rounded-full animate-pulse" />
                                            <div className="h-24 w-full bg-zinc-50 rounded-3xl animate-pulse" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    {filteredData.map((item, index) => (
                                        <div key={item.id} className="group p-8 lg:p-12 hover:bg-zinc-50/30 transition-colors relative bg-white">
                                            <div className="flex justify-between items-start mb-6">
                                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-100 px-3 py-1 rounded-full">
                                                    Fragmento #{String(index + 1).padStart(3, '0')}
                                                </span>
                                                <button
                                                    onClick={() => setEditingItem(item)}
                                                    className="opacity-0 group-hover:opacity-100 p-2.5 bg-black text-white rounded-xl transition-all shadow-xl shadow-black/20 transform hover:scale-105 active:scale-95 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 font-sans"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                    Editar Dato
                                                </button>
                                            </div>
                                            <div className="prose prose-zinc max-w-none">
                                                <div className="text-zinc-700 text-lg leading-relaxed font-medium whitespace-pre-wrap">{item.text}</div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Modal de Edición Visual - Versión Compacta 1:1 */}
            {editingItem && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col border border-zinc-200">

                        <div className="p-6 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-zinc-50/50">
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight text-zinc-950 font-sans">Editor de Texto</h2>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5 font-sans">Alineación compacta 1:1 con Pinecone</p>
                            </div>
                            <button onClick={() => setEditingItem(null)} className="p-2 bg-white border border-zinc-200 hover:bg-black hover:text-white rounded-full transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Barra de Herramientas Compacta */}
                        <div className="px-8 py-3 border-b border-zinc-100 flex gap-4 shrink-0 bg-white">
                            <button
                                onClick={formatHeading}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-[10px] font-black uppercase hover:bg-black transition-all"
                            >
                                <Type className="w-3 h-3 text-emerald-400" /> Título
                            </button>
                        </div>

                        {/* Área de Edición Directa - PADDINGS REDUCIDOS */}
                        <div className="flex-1 bg-zinc-50/30 overflow-hidden flex flex-col p-4">
                            <div className="flex-1 w-full bg-white border border-zinc-200 rounded-2xl p-6 shadow-inner overflow-hidden flex flex-col">
                                <div
                                    ref={editorRef}
                                    contentEditable
                                    className="flex-1 w-full text-zinc-800 text-lg font-medium leading-normal focus:outline-none overflow-y-auto prose prose-zinc prose-headings:m-0 max-w-none scrollbar-hide"
                                    dangerouslySetInnerHTML={{ __html: markdownToHtml(editingItem.text) }}
                                    style={{ outline: 'none' }}
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex gap-4 shrink-0 font-sans">
                            <button
                                onClick={() => setEditingItem(null)}
                                className="px-8 py-3 bg-white border border-zinc-200 text-zinc-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-black hover:text-black transition-all"
                            >
                                Descartar
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={isSaving}
                                className="flex-1 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
