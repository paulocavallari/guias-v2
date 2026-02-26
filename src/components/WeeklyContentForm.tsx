'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Plus, Loader2, Save } from 'lucide-react'
import { addWeeklyContent } from '@/actions/semanas'
import { useRouter } from 'next/navigation'

export default function WeeklyContentForm({ guiaId, novaSemanaNumero }: { guiaId: string, novaSemanaNumero: number }) {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(addWeeklyContent, null)
    const formRef = useRef<HTMLFormElement>(null)

    useEffect(() => {
        if (state?.success) {
            formRef.current?.reset()
            router.refresh()
        }
    }, [state, router])

    return (
        <div className="bg-white rounded-3xl border border-indigo-100 shadow-sm overflow-hidden mb-8">
            <div className="bg-indigo-50/50 p-5 border-b border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="bg-indigo-600 text-white text-xs font-extrabold px-3 py-1.5 rounded-lg tracking-wider shadow-sm">
                        NOVA SEMANA ({novaSemanaNumero})
                    </span>
                    <h3 className="font-bold text-indigo-900">Adicionar Conteúdo Manual</h3>
                </div>
            </div>

            <form ref={formRef} action={formAction} className="p-6 space-y-6">
                <input type="hidden" name="guia_id" value={guiaId} />

                {state?.error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
                        {state.error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Período da Semana</label>
                    <input
                        type="text"
                        name="data_semana"
                        required
                        placeholder="Ex: 11/03 a 15/03"
                        className="w-full md:w-1/2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 font-medium"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Conteúdos</label>
                        <textarea
                            name="conteudos"
                            required
                            rows={4}
                            placeholder="Quais conteúdos serão abordados?"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 resize-none"
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Estratégias Didáticas</label>
                        <textarea
                            name="estrategias_didaticas"
                            required
                            rows={4}
                            placeholder="Como as aulas serão conduzidas?"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 resize-none"
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Metodologias (Opcional)</label>
                        <textarea
                            name="metodologias"
                            rows={3}
                            placeholder="Metodologias ativas aplicadas..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 resize-none"
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Avaliação (Opcional)</label>
                        <textarea
                            name="avaliacao"
                            rows={3}
                            placeholder="Formas de avaliar a aprendizagem..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 resize-none"
                        ></textarea>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                        type="submit"
                        disabled={isPending}
                        className={`font-semibold px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2 text-white ${isPending ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'}`}
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isPending ? 'Salvando...' : 'Salvar Semana'}
                    </button>
                </div>
            </form>
        </div>
    )
}
