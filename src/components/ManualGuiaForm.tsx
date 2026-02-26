'use client'

import { useActionState, useEffect, useState } from 'react'
import { createGuiaManual } from '@/actions/guias'
import { PlusCircle, Loader2, AlertTriangle, Presentation, BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Turma = { id: string, nome: string, ano_serie: string }
type Disciplina = { id: string, nome: string }

export default function ManualGuiaForm({ turmas, disciplinas }: { turmas: Turma[], disciplinas: Disciplina[] }) {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(createGuiaManual, null)

    const [selectedTurma, setSelectedTurma] = useState<string>('')
    const [selectedDisciplina, setSelectedDisciplina] = useState<string>('')

    useEffect(() => {
        if (state?.success && state.guiaId) {
            router.push(`/dashboard/guias/${state.guiaId}`)
        }
    }, [state, router])

    return (
        <form action={formAction} className="mt-8 space-y-6">
            {!isPending && state?.error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold mb-1">Erro ao Criar Guia</p>
                        <p>{state.error}</p>
                    </div>
                </div>
            )}

            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Turma */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                            <Presentation className="w-4 h-4 text-indigo-500" /> Turma
                        </label>
                        <div className="relative">
                            <select
                                name="turma_id"
                                required
                                value={selectedTurma}
                                onChange={(e) => setSelectedTurma(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-slate-700 font-medium"
                            >
                                <option value="" disabled>Selecione a turma...</option>
                                {turmas.map(t => (
                                    <option key={t.id} value={t.id}>{t.ano_serie} {t.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Disciplina */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-indigo-500" /> Disciplina
                        </label>
                        <div className="relative">
                            <select
                                name="disciplina_id"
                                required
                                value={selectedDisciplina}
                                onChange={(e) => setSelectedDisciplina(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-slate-700 font-medium"
                            >
                                <option value="" disabled>Selecione a disciplina...</option>
                                {disciplinas.map(d => (
                                    <option key={d.id} value={d.id}>{d.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Bimestre */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bimestre</label>
                        <select
                            name="bimestre"
                            required
                            defaultValue="1"
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 font-medium appearance-none"
                        >
                            <option value="1">1º Bimestre</option>
                            <option value="2">2º Bimestre</option>
                            <option value="3">3º Bimestre</option>
                            <option value="4">4º Bimestre</option>
                        </select>
                    </div>

                    {/* Total de Aulas */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Total de Aulas</label>
                        <input
                            type="number"
                            name="total_aulas"
                            required
                            min="1"
                            defaultValue="20"
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 font-medium"
                        />
                    </div>

                    {/* Ano Letivo */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ano Letivo</label>
                        <input
                            type="number"
                            name="ano_letivo"
                            required
                            min="2024"
                            defaultValue={new Date().getFullYear()}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 font-medium"
                        />
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={isPending || !selectedTurma || !selectedDisciplina}
                className={`w-full py-4 font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 text-white ${!selectedTurma || !selectedDisciplina
                    ? 'bg-slate-300 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl cursor-pointer'
                    }`}
            >
                {isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <PlusCircle className="w-5 h-5" />
                )}
                {isPending ? 'Criando novo guia...' : 'Criar Guia Manualmente'}
            </button>
        </form >
    )
}
