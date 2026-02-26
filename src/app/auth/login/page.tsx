'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpenCheck, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    const handleGoogleLogin = async () => {
        setIsLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                queryParams: {
                    // Força a seleção de conta Google a cada login
                    prompt: 'select_account',
                },
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
            },
        })

        if (error) {
            console.error('Erro no login:', error.message)
            setError('Não foi possível iniciar o login. Tente novamente.')
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 overflow-hidden relative">

            {/* Background Blurs animados */}
            <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[30rem] h-[30rem] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative z-10"
            >
                <div className="p-8 sm:p-10">
                    <div className="flex justify-center mb-8">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-blue-500/30">
                            <BookOpenCheck className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    <div className="text-center mb-10">
                        <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 mb-2 tracking-tight">
                            Acesso Restrito
                        </h1>
                        <p className="text-slate-400 text-sm xl:text-base font-medium">
                            Gestão de Guias de Aprendizagem (PEI)
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center py-2.5 px-4 rounded-xl">
                            {error}
                        </div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full relative group overflow-hidden bg-white hover:bg-slate-50 text-slate-900 font-semibold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-slate-800" />
                        ) : (
                            <>
                                {/* Google Icon */}
                                <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                                    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                                </svg>
                                <span>Entrar com Google (SEDUC)</span>
                            </>
                        )}
                    </motion.button>

                    <div className="mt-8 text-center text-xs text-slate-500 flex flex-col gap-2">
                        <p>Faça login com seu e-mail institucional</p>
                        <div className="flex justify-center gap-3 flex-wrap">
                            <span className="font-mono text-slate-400 bg-slate-900/50 py-1 px-2 rounded-md">
                                @prof.educacao.sp.gov.br
                            </span>
                            <span className="font-mono text-slate-400 bg-slate-900/50 py-1 px-2 rounded-md">
                                @al.educacao.sp.gov.br
                            </span>
                        </div>
                    </div>
                </div>

                {/* Animated bottom bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            </motion.div>
        </div>
    )
}
