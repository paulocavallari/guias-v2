import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock, FileEdit, GraduationCap, ShieldCheck, CalendarDays } from 'lucide-react'
import { salvarApontamento, validarSemana } from '@/actions/semanas'
import ExportPdfButton from '@/components/ExportPdfButton'

export default async function GuiaDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient()

    // --- Auth e Role Check ---
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: dbUser } = await supabase
        .from('usuarios')
        .select('role, is_lider, is_vice_lider, turma_id')
        .eq('id', user.id)
        .single()

    // --- Busca o Guia e RLS ---
    const { data: guia, error: errorGuia } = await supabase
        .from('guias_aprendizagem')
        .select('*, turmas(nome), disciplinas(nome)')
        .eq('id', params.id)
        .single()

    if (errorGuia || !guia) {
        return <div className="p-8 text-center bg-white shadow-sm rounded-3xl">Guia não encontrado ou você não tem acesso a ele.</div>
    }

    // --- Busca as Semanas ---
    const { data: semanas } = await supabase
        .from('semanas_guia')
        .select('*')
        .eq('guia_id', guia.id)
        .order('created_at', { ascending: true })

    const isProfessorGuia = dbUser?.role === 'Admin' || (dbUser?.role === 'Professor' && guia.professor_id === user.id)
    const isLider = dbUser?.is_lider || dbUser?.is_vice_lider
    const canApontar = isLider && (guia.turma_id === dbUser?.turma_id)

    const progresso = (semanas?.filter(s => s.status_validacao === 'Validado').length || 0) / (semanas?.length || 1) * 100

    return (
        <div className="p-4 sm:p-8 max-w-5xl mx-auto" id="guia-export-area">
            <Link href="/dashboard/guias" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
            </Link>

            {/* --- Cabeçalho do Guia --- */}
            <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden mb-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-100 to-purple-50 opacity-50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mb-4 ${guia.concluido ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {guia.concluido ? '✓ Guia 100% Concluído' : '⏳ Em Andamento'}
                            </span>
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-2">
                                {guia.turmas?.nome} - {guia.disciplinas?.nome}
                            </h1>
                            <p className="text-lg text-slate-500 font-medium">Bimestre {guia.bimestre} / {guia.ano_letivo}</p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 md:w-64">
                            <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                                <span>Progresso de Validação</span>
                                <span>{Math.round(progresso)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${progresso}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
                        <div>
                            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Professor(a)</p>
                            <p className="text-slate-800 font-medium flex items-center gap-2"><GraduationCap className="w-4 h-4 text-slate-400" /> {guia.professor_nome}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Série / Ano</p>
                            <p className="text-slate-800 font-medium">{guia.ano_serie}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Aulas Previstas</p>
                            <p className="text-slate-800 font-medium">{guia.total_aulas_bimestre} aulas no total</p>
                        </div>
                        {isProfessorGuia && (
                            <div className="flex items-center justify-end">
                                <ExportPdfButton targetId="guia-export-area" fileName={`Guia_${guia.disciplinas?.nome}_${guia.ano_serie}`} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Linha do Tempo das Semanas --- */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                    <CalendarDays className="w-6 h-6 text-indigo-500" />
                    Semanas de Estudo (Apontamento Líder)
                </h2>

                <div className="space-y-4">
                    {semanas?.map((semana, index) => (
                        <div key={semana.id} className={`bg-white rounded-3xl border shadow-sm overflow-hidden transition-all ${semana.status_validacao === 'Validado' ? 'border-emerald-200' : 'border-slate-200'}`}>
                            {/* Cabecalho da Semana */}
                            <div className={`p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b ${semana.status_validacao === 'Validado' ? 'bg-emerald-50/30 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="bg-indigo-600 text-white text-xs font-extrabold px-2.5 py-1 rounded-lg tracking-wider">
                                            SEMANA {index + 1}
                                        </span>
                                        <span className="font-bold text-slate-700">Período: {semana.data_semana}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {semana.status_validacao === 'Validado' ? (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Apontamento Validado
                                        </span>
                                    ) : semana.status_validacao === 'Aguardando Validação' ? (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                            <Clock className="w-3.5 h-3.5 mr-1" /> Em Validação (Líder Apontou)
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                                            Pendente de Apontamento
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Dados Docx Importados */}
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Conteúdos</p>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{semana.conteudos}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Estratégias Didáticas</p>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{semana.estrategias_didaticas}</p>
                                </div>
                            </div>

                            {/* Área do Líder (Formulário) */}
                            {(isProfessorGuia || dbUser?.role === 'CGPG' || canApontar || semana.apontamentos_comentarios) && (
                                <div className="p-6 bg-slate-50 border-t border-slate-100">
                                    <p className="text-xs font-bold text-indigo-400 tracking-widest uppercase mb-4 flex items-center gap-2">
                                        <FileEdit className="w-4 h-4" /> Relatório do Líder (Apontamento)
                                    </p>

                                    {/* Form Líder */}
                                    {canApontar && semana.status_validacao !== 'Validado' ? (
                                        <form action={salvarApontamento.bind(null, semana.id) as any}>
                                            <textarea
                                                name="comentarios"
                                                defaultValue={semana.apontamentos_comentarios || ''}
                                                placeholder="Líder e Vice: Descreva detalhadamente o que foi dado nesta semana, imprevistos, etc."
                                                className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 min-h-[120px] shadow-sm mb-4"
                                            />
                                            <div className="flex justify-end">
                                                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all text-sm">
                                                    Salvar Apontamento e Enviar p/ Professor
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        // Visualização ReadOnly para Professor / Outros ou Se Validado
                                        <div className="bg-white border border-slate-200 rounded-xl p-5 text-sm text-slate-700 whitespace-pre-wrap">
                                            {semana.apontamentos_comentarios ? semana.apontamentos_comentarios : <span className="text-slate-400 italic">O Líder ainda não preencheu o apontamento desta semana.</span>}
                                        </div>
                                    )}

                                    {/* Ação do Professor Validador */}
                                    {isProfessorGuia && semana.status_validacao === 'Aguardando Validação' && (
                                        <div className="mt-6 flex items-center justify-between bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-100 text-blue-600 p-2 rounded-full"><ShieldCheck className="w-5 h-5" /></div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-800">Você concorda com este apontamento?</p>
                                                    <p className="text-xs text-slate-500">Ao validar, esta semana é travada e avança o progresso bimestral.</p>
                                                </div>
                                            </div>
                                            <form action={validarSemana.bind(null, semana.id, guia.id) as any}>
                                                <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-200 text-sm flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4" /> Aceitar e Validar
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
