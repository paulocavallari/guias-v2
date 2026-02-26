'use client'

import { useActionState, useEffect, useState } from 'react'
import { processDocxUpload } from '@/actions/guias'
import { UploadCloud, Loader2, Sparkles, FileText, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function UploadForm() {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(processDocxUpload, null)
    const [selectedFile, setSelectedFile] = useState<string | null>(null)

    useEffect(() => {
        if (state?.success && state.guiaId) {
            router.push(`/dashboard/guias/${state.guiaId}`)
        }
    }, [state, router])

    return (
        <form action={formAction} className="mt-8 space-y-6" encType="multipart/form-data">
            {/* Erro */}
            {!isPending && state?.error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-3">
                    <span className="font-bold flex-shrink-0">❌ Erro:</span>
                    <span>{state.error}</span>
                </div>
            )}

            {/* Estado de Processamento */}
            {isPending ? (
                <div className="bg-indigo-50/50 border border-indigo-100 p-10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                    <div className="relative">
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                        <Sparkles className="w-5 h-5 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
                    </div>
                    <div>
                        <p className="font-bold text-indigo-900 text-lg">Processando com Inteligência Artificial...</p>
                        <p className="text-sm text-indigo-600 mt-1 max-w-sm">
                            A IA está lendo e estruturando seu guia. Isso pode levar até 30 segundos.
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Área de Upload */}
                    <div className="relative">
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
                    </div>

                    {/* Botão de Submit */}
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
