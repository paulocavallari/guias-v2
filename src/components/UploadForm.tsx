'use client'

import { useActionState, useEffect, useState, useRef } from 'react'
import { processDocxUpload } from '@/actions/guias'
import { UploadCloud, Loader2, Sparkles, FileText, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

const MODELS = [
    'gemma-3-12b',
    'gemma-3-4b',
    'llama-3.3-70b',
    'qwen-2.5-coder',
    'qwen3-next-80b',
    'nemotron-mini',
    'phi-3-mini',
]

export default function UploadForm() {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(processDocxUpload, null)
    const [selectedFile, setSelectedFile] = useState<string | null>(null)

    // Estado de progresso simulado (server-side não pode enviar progresso em tempo real)
    const [currentModelIdx, setCurrentModelIdx] = useState(0)
    const [triedModels, setTriedModels] = useState<string[]>([])
    const [elapsedSeconds, setElapsedSeconds] = useState(0)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        if (isPending) {
            // Resetar progresso
            setCurrentModelIdx(0)
            setTriedModels([])
            setElapsedSeconds(0)

            // Contador de tempo geral
            const timer = setInterval(() => {
                setElapsedSeconds(s => s + 1)
            }, 1000)

            // Simula troca de modelo a cada ~40s (timeout da IA)
            const modelTimer = setInterval(() => {
                setCurrentModelIdx(prev => {
                    const next = prev + 1
                    if (next < MODELS.length) {
                        setTriedModels(t => [...t, MODELS[prev]])
                    }
                    return next < MODELS.length ? next : prev
                })
            }, 40000)

            intervalRef.current = timer
            return () => {
                clearInterval(timer)
                clearInterval(modelTimer)
            }
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [isPending])

    useEffect(() => {
        if (state?.success && state.guiaId) {
            router.push(`/dashboard/guias/${state.guiaId}`)
        }
    }, [state, router])

    return (
        <form action={formAction} className="mt-8 space-y-6">
            {/* Erro */}
            {!isPending && state?.error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold mb-1">Erro no Processamento</p>
                        <p>{state.error}</p>
                    </div>
                </div>
            )}

            {/* Estado de Processamento com feedback de modelo */}
            {isPending ? (
                <div className="bg-indigo-50/50 border border-indigo-100 p-8 rounded-2xl flex flex-col items-center text-center space-y-5">
                    <div className="relative">
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                        <Sparkles className="w-5 h-5 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
                    </div>

                    <div>
                        <p className="font-bold text-indigo-900 text-lg">Processando com IA...</p>
                        <p className="text-sm text-indigo-500 mt-1">{elapsedSeconds}s decorridos</p>
                    </div>

                    {/* Modelo atual */}
                    <div className="w-full max-w-sm">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                            <span>Modelo em uso:</span>
                            <span className="font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                                {MODELS[currentModelIdx]}
                            </span>
                        </div>

                        {/* Modelos já tentados (com falha) */}
                        {triedModels.length > 0 && (
                            <div className="mt-3 space-y-1">
                                <p className="text-xs text-amber-600 font-semibold text-left flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Modelos com timeout (trocados automaticamente):
                                </p>
                                {triedModels.map(m => (
                                    <div key={m} className="flex items-center gap-2 text-xs text-slate-400 line-through">
                                        <ChevronRight className="w-3 h-3 flex-shrink-0" />
                                        {m}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Barra de progresso por modelo */}
                        <div className="mt-4 flex gap-1">
                            {MODELS.map((m, i) => (
                                <div
                                    key={m}
                                    className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i < currentModelIdx ? 'bg-amber-300'
                                            : i === currentModelIdx ? 'bg-indigo-500 animate-pulse'
                                                : 'bg-slate-200'
                                        }`}
                                    title={m}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 text-left">
                            Modelo {currentModelIdx + 1} de {MODELS.length}
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Área de Upload */}
                    <label
                        htmlFor="guia_file"
                        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${selectedFile
                                ? 'border-indigo-400 bg-indigo-50'
                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300'
                            }`}
                    >
                        {selectedFile ? (
                            <>
                                <CheckCircle2 className="w-12 h-12 text-indigo-500 mb-3" />
                                <p className="font-bold text-indigo-800 text-base">Arquivo selecionado:</p>
                                <p className="text-sm text-indigo-600 mt-1 font-medium break-all">{selectedFile}</p>
                                <p className="text-xs text-slate-400 mt-2">Clique para trocar o arquivo</p>
                            </>
                        ) : (
                            <>
                                <FileText className="w-12 h-12 text-slate-400 mb-4" />
                                <p className="font-bold text-slate-800 text-lg">Selecione o Guia em formato .DOCX</p>
                                <p className="text-sm text-slate-500 mt-2 max-w-sm">
                                    Clique aqui para escolher o arquivo. A IA irá extrair e organizar todas as semanas automaticamente.
                                </p>
                            </>
                        )}
                    </label>
                    <input
                        type="file"
                        name="guia_file"
                        id="guia_file"
                        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        required
                        className="sr-only"
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            setSelectedFile(file ? file.name : null)
                        }}
                    />

                    {/* Botão Submit */}
                    <button
                        type="submit"
                        disabled={!selectedFile}
                        className={`w-full py-4 font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 text-white ${selectedFile
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl cursor-pointer'
                                : 'bg-slate-300 cursor-not-allowed shadow-none'
                            }`}
                    >
                        <UploadCloud className="w-5 h-5" />
                        {selectedFile ? 'Processar Guia com IA' : 'Selecione um arquivo primeiro'}
                    </button>
                </>
            )}
        </form>
    )
}
