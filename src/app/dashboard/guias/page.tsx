import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, BookOpenText, Target, CalendarDays, BookCheck, Sparkles, Pencil } from 'lucide-react'
import { getUserProfile } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export default async function GuiasPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    // Usar service client para evitar problema de RLS recursiva
    const dbUser = await getUserProfile(user.id)

    let guiasQuery = supabase
        .from('guias_aprendizagem')
        .select('*, disciplinas(nome), turmas(nome, ano_serie)')
        .order('created_at', { ascending: false })

    if (dbUser?.role === 'Aluno') {
        if (!dbUser.turma_id) {
            return (
                <div className="p-8 text-center bg-white border border-dashed rounded-2xl h-full flex items-center justify-center text-slate-500">
                    Você não está vinculado a nenhuma turma. Aguarde a gestão da escola (CGPG).
                </div>
            )
        }
        guiasQuery = guiasQuery.eq('turma_id', dbUser.turma_id)
    } else if (dbUser?.role === 'Professor') {
        guiasQuery = guiasQuery.eq('professor_id', user.id)
    }
    // Admin e CGPG vêem todos os guias (sem filtro)

    const { data: guias, error } = await guiasQuery

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{dbUser?.role === 'Aluno' ? 'Guias da Minha Turma' : 'Meus Guias de Ensino'}</h1>
                    <p className="text-slate-500 mt-1">Acompanhe e valide o progresso dos Guias de Aprendizagem.</p>
                </div>

                {(dbUser?.role === 'Professor' || dbUser?.role === 'Admin') && (
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                            href="/dashboard/guias/nova-manual"
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                            <Pencil className="w-4 h-4 text-emerald-500" />
                            Escrita Manual
                        </Link>
                        <Link
                            href="/dashboard/guias/nova"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            Importar com IA
                        </Link>
                    </div>
                )}
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mb-6">
                    Erro ao carregar os guias: {error.message}
                </div>
            )}

            {guias && guias.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {guias.map(guia => (
                        <div key={guia.id} className="bg-white flex flex-col pt-6 rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all group">
                            <div className="px-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                                        <BookOpenText className="w-6 h-6" />
                                    </div>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${guia.concluido ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {guia.concluido ? 'Concluído' : 'Em Andamento'}
                                    </span>
                                </div>

                                <h3 className="font-bold text-xl text-slate-800 mb-1">{guia.disciplina_nome}</h3>
                                <p className="text-sm font-medium text-slate-500 mb-4">{(guia.turmas as any)?.nome} ({guia.ano_serie})</p>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                        <Target className="w-4 h-4 text-slate-400" />
                                        <span>{guia.total_aulas_bimestre} Aulas no Bimestre</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                        <CalendarDays className="w-4 h-4 text-slate-400" />
                                        <span>Bimestre {guia.bimestre} / {guia.ano_letivo}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
                                <Link href={`/dashboard/guias/${guia.id}`} className="text-indigo-600 font-bold text-sm hover:text-indigo-700 flex items-center justify-between group-hover:px-2 transition-all">
                                    <span>Abrir e Analisar</span>
                                    <BookCheck className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
                    <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BookOpenText className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Sem Resultados</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">Nenhum Guia de Aprendizagem foi importado ou disponibilizado para você no momento.</p>
                </div>
            )}
        </div>
    )
}
