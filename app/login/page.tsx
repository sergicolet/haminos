'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Database, Lock, User, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                username,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Usuario o contraseña incorrectos');
            } else {
                router.push('/');
                router.refresh();
            }
        } catch (err) {
            setError('Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fafafa]  p-4">
            <div className="w-full max-w-[400px] space-y-8">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-black  rounded-2xl mb-4 shadow-xl">
                        <Database className="text-white  w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter">HAMINOS ADMIN</h1>
                    <p className="text-zinc-500 mt-2 text-sm">Introduce tus credenciales para acceder</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white  p-8 rounded-[2rem] border border-zinc-200  shadow-xl space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Usuario</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-50  border border-zinc-100  rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black :ring-white transition-all"
                                    placeholder="Tu usuario"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-50  border border-zinc-100  rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black :ring-white transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50  border border-red-100  rounded-xl">
                            <p className="text-red-600  text-xs font-bold text-center italic">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black  text-white  py-4 rounded-xl font-black text-sm tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ENTRAR AL PANEL'}
                    </button>
                </form>

                <p className="text-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                    Sistema de Seguridad Haminos AI © 2026
                </p>
            </div>
        </div>
    );
}
