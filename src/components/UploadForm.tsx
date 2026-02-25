'use client'

import { useActionState, useEffect } from 'react'
import { processDocxUpload } from '@/actions/guias'
import { UploadCloud, Loader2, Sparkles, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function UploadForm() {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(processDocxUpload, null)

    useEffect(() => {
        if (state?.success) {
            router.push(`/dashboard/guias/${state.guiaId}`)
        }
    }, [state, router])

    return (
        <form action={formAction} className="mt-8 space-y-6">
            {!isPending && state?.error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-3">
                    <span className="font-bold">❌ Erro Ocorrido:</span>
                    <span>{state.error}</span>
                </div>
            )}

            {isPending && (
                <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                    <div className="relative">
                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                        <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
                    </div>
                    <div>
                        <p className="font-bold text-indigo-900">Processando Inteligência Artificial Múltipla...</p>
                        <p className="text-sm text-indigo-600 mt-1 max-w-sm">Isso pode levar até 15 segundos dependendo do modelo de fallback disponível no OpenRouter.</p>
                    </div>
                </div>
            )}

            {!isPending && (
                <>
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center hover:bg-slate-100 hover:border-indigo-300 transition-colors group relative cursor-pointer">
                        <input
                            type="file"
                            name="guia_file"
                            id="guia_file"
                            accept=".docx"
                            required
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />

                        <div className="flex flex-col items-center justify-center pointer-events-none">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                <FileText className="w-8 h-8 text-indigo-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Selecione o Guia em formato .DOCX</h3>
                            <p className="text-sm text-slate-500 mt-2 max-w-sm">
                                O sistema irá extrair o texto, ler as formatações e nossa IA criará as divisões de semanas, apontamentos e competências automaticamente.
                            </p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                    >
                        <UploadCloud className="w-5 h-5" />
                        Processar Guia com IA
                    </button>
                </>
            )}
        </form>
    )
}
