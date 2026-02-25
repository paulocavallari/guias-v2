'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpenCheck, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    const handleMicrosoftLogin = async () => {
        setIsLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'azure',
            options: {
                scopes: 'email profile',
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
            },
        })

        if (error) {
            console.error('Erro no login:', error.message)
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

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleMicrosoftLogin}
                        disabled={isLoading}
                        className="w-full relative group overflow-hidden bg-white hover:bg-slate-50 text-slate-900 font-semibold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-slate-800" />
                        ) : (
                            <>
                                <svg width="21" height="21" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                                    <path fill="#f35325" d="M1 1h9v9H1z" />
                                    <path fill="#81bc06" d="M11 1h9v9h-9z" />
                                    <path fill="#05a6f0" d="M1 11h9v9H1z" />
                                    <path fill="#ffba08" d="M11 11h9v9h-9z" />
                                </svg>
                                <span>Entrar Institucional (SEDUC)</span>
                            </>
                        )}
                    </motion.button>

                    <div className="mt-8 text-center text-xs text-slate-500 flex flex-col gap-1">
                        <p>Faça login exclusivamente com seu e-mail institucional</p>
                        <p className="font-mono text-slate-600 bg-slate-900/50 py-1 px-2 rounded-md inline-block mx-auto">@educacao.sp.gov.br</p>
                    </div>
                </div>

                {/* Animated bottom bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            </motion.div>
        </div>
    )
}
