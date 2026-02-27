'use client'

import { useActionState, useEffect, useState } from 'react'
import { createGuiaManual } from '@/actions/guias'
import { PlusCircle, Loader2, AlertTriangle, Presentation, BookOpen, Trash2, CalendarDays } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Turma = { id: string, nome: string, ano_serie: string }
type Disciplina = { id: string, nome: string }

export default function ManualGuiaForm({ turmas, disciplinas }: { turmas: Turma[], disciplinas: Disciplina[] }) {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(createGuiaManual, null)

    const [selectedTurma, setSelectedTurma] = useState<string>('')
    const [selectedDisciplina, setSelectedDisciplina] = useState<string>('')

    // State for dynamic week forms
    const [weeks, setWeeks] = useState<number[]>([1])
    const [nextWeekId, setNextWeekId] = useState<number>(2)

    const addWeek = () => {
        setWeeks(prev => [...prev, nextWeekId])
        setNextWeekId(prev => prev + 1)
    }

    const removeWeek = (id: number) => {
        if (weeks.length > 1) {
            setWeeks(prev => prev.filter(wId => wId !== id))
        }
    }

    useEffect(() => {
        if (state?.success && state.guiaId) {
            router.push(`/dashboard/guias/${state.guiaId}`)
        }
    }, [state, router])

    return (
        <form action={formAction} className="mt-8 space-y-8">
            <input type="hidden" name="week_ids" value={weeks.join(',')} />

            {!isPending && state?.error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold mb-1">Erro ao Criar Guia</p>
                        <p>{state.error}</p>
                    </div>
                </div>
            )}

            {/* Configurações Iniciais */}
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-5">
                <div className="flex items-center gap-3 mb-2 border-b border-slate-200 pb-3">
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">1. Dados Básicos do Guia</h2>
                </div>

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

            {/* Semanas */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2 border-b border-slate-200 pb-3">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                        <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">2. Planejamento Semanal</h2>
                        <p className="text-sm text-slate-500">Adicione todas as semanas do bimestre. Todos os campos são obrigatórios.</p>
                    </div>
                </div>

                {weeks.map((weekId, index) => (
                    <div key={weekId} className="bg-white border border-slate-200 rounded-2xl p-6 relative shadow-sm group">
                        <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg tracking-wider">
                                SEMANA {index + 1}
                            </span>

                            {weeks.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (window.confirm(`Remover a Semana ${index + 1}? Todo o conteúdo preenchido será perdido.`)) {
                                            removeWeek(weekId)
                                        }
                                    }}
                                    className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                                    title="Remover semana"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Período da Semana</label>
                                <input
                                    type="text"
                                    name={`semana_${weekId}_data`}
                                    required
                                    placeholder="Ex: 11/03 a 15/03"
                                    className="w-full md:w-1/2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Conteúdos</label>
                                    <textarea
                                        name={`semana_${weekId}_conteudos`}
                                        required
                                        rows={3}
                                        placeholder="Quais conteúdos serão abordados?"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 resize-none"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Estratégias Didáticas</label>
                                    <textarea
                                        name={`semana_${weekId}_estrategias`}
                                        required
                                        rows={3}
                                        placeholder="Como as aulas serão conduzidas?"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 resize-none"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Metodologias</label>
                                    <textarea
                                        name={`semana_${weekId}_metodologias`}
                                        required
                                        rows={3}
                                        placeholder="Metodologias ativas aplicadas..."
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 resize-none"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Avaliação</label>
                                    <textarea
                                        name={`semana_${weekId}_avaliacao`}
                                        required
                                        rows={3}
                                        placeholder="Formas de avaliar a aprendizagem..."
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 resize-none"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={addWeek}
                    className="w-full py-4 border-2 border-dashed border-indigo-200 text-indigo-600 font-bold rounded-2xl hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-2"
                >
                    <PlusCircle className="w-5 h-5" />
                    Adicionar Mais Uma Semana
                </button>
            </div>

            {/* Contador e botão de envio */}
            <div className="flex items-center justify-between bg-slate-100 rounded-2xl px-6 py-4">
                <div className="text-sm font-semibold text-slate-600">
                    <span className="bg-indigo-600 text-white rounded-lg px-2.5 py-1 mr-2 font-bold">{weeks.length}</span>
                    {weeks.length === 1 ? 'semana planejada' : 'semanas planejadas'}
                </div>
                <button
                    type="submit"
                    disabled={isPending || !selectedTurma || !selectedDisciplina}
                    className={`font-bold py-3 px-8 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 text-white ${!selectedTurma || !selectedDisciplina
                            ? 'bg-slate-300 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl cursor-pointer'
                        }`}
                >
                    {isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <CalendarDays className="w-5 h-5" />
                    )}
                    {isPending ? 'Salvando Guia e Semanas...' : 'Salvar Guia de Aprendizagem'}
                </button>
            </div>
        </form >
    )
}
