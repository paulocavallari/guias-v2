import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Activity, BookCheck, ShieldAlert, Users, CheckCircle2 } from 'lucide-react'
import { getUserProfile } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    // Usar service client para garantir leitura correta independente de RLS
    const dbUser = await getUserProfile(user.id)

    // Se o usuário for CGPG ou Admin, buscar a visão Macro da Escola
    let macroStats = null
    let turmasProgress: any[] = []

    if (dbUser?.role === 'CGPG' || dbUser?.role === 'Admin') {
        const [{ data: turmas }, { data: guias }] = await Promise.all([
            supabase.from('turmas').select('*').order('ano_serie', { ascending: true }),
            supabase.from('guias_aprendizagem').select('id, turma_id, concluido')
        ])

        macroStats = {
            totalGuia: guias?.length || 0,
            totalConcluidos: guias?.filter(g => g.concluido).length || 0,
            totalTurmas: turmas?.length || 0
        }

        if (turmas && guias) {
            turmasProgress = turmas.map(turma => {
                const guiasDaTurma = guias.filter(g => g.turma_id === turma.id)
                const guiasConcluidos = guiasDaTurma.filter(g => g.concluido).length
                const percentual = guiasDaTurma.length > 0 ? (guiasConcluidos / guiasDaTurma.length) * 100 : 0
                return { ...turma, totalGuias: guiasDaTurma.length, guiasConcluidos, percentual }
            })
        }
    }

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
            <div className="bg-gradient-to-tr from-indigo-600 to-purple-700 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>

                <h1 className="text-3xl font-extrabold mb-2 text-white/95 tracking-tight relative z-10">
                    Olá, {dbUser?.nome?.split(' ')[0] || user.email?.split('@')[0]} 👋
                </h1>
                <p className="text-indigo-100 text-lg relative z-10 max-w-lg">
                    Acompanhe o andamento acadêmico da escola através do Painel de Guias de Aprendizagem.
                </p>

                <div className="mt-6 inline-flex items-center bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 shadow-sm relative z-10">
                    <ShieldAlert className="w-5 h-5 mr-3 text-amber-300" />
                    <span className="font-bold text-sm tracking-widest uppercase">Perfil: {dbUser?.role || 'Carregando...'}</span>
                </div>
            </div>

            {/* Painel Exclusivo: CGPG / Admin */}
            {(dbUser?.role === 'CGPG' || dbUser?.role === 'Admin') && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <Activity className="w-6 h-6 text-indigo-500" />
                        Termômetro da Escola (Progresso)
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="bg-white border text-center border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-center">
                            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center text-indigo-500 justify-center mb-4"><Users className="w-6 h-6" /></div>
                            <h3 className="font-bold text-slate-800 text-3xl mb-1">{macroStats?.totalTurmas}</h3>
                            <p className="text-slate-500 font-medium text-sm">Turmas Cadastradas</p>
                        </div>
                        <div className="bg-white border text-center border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-center">
                            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center text-amber-500 justify-center mb-4"><BookCheck className="w-6 h-6" /></div>
                            <h3 className="font-bold text-slate-800 text-3xl mb-1">{macroStats?.totalGuia}</h3>
                            <p className="text-slate-500 font-medium text-sm">Guias em Andamento / Total</p>
                        </div>
                        <div className="bg-emerald-50 border text-center border-emerald-100 rounded-3xl p-6 shadow-sm flex flex-col items-center">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center text-emerald-600 justify-center mb-4"><CheckCircle2 className="w-6 h-6" /></div>
                            <h3 className="font-bold text-emerald-700 text-3xl mb-1">{macroStats?.totalConcluidos}</h3>
                            <p className="text-emerald-700 font-medium text-sm">Guias 100% Concluídos</p>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">Desempenho por Turma</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
                            {turmasProgress.map(turma => (
                                <div key={turma.id}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-slate-700">{turma.ano_serie} {turma.nome}</span>
                                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                            {turma.guiasConcluidos} de {turma.totalGuias} concluídos
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                                        <div
                                            className={`h-3 rounded-full transition-all duration-1000 ${turma.percentual === 100 ? 'bg-emerald-500' : turma.percentual > 50 ? 'bg-indigo-500' : turma.percentual > 0 ? 'bg-amber-400' : 'bg-slate-300'}`}
                                            style={{ width: `${turma.percentual > 0 ? turma.percentual : 2}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                            {turmasProgress.length === 0 && (
                                <p className="text-slate-400 italic lg:col-span-2 text-center py-6">Nenhuma turma cadastrada no banco de dados ainda.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {dbUser?.role !== 'CGPG' && dbUser?.role !== 'Admin' && (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm max-w-2xl mx-auto">
                    <BookCheck className="w-12 h-12 text-indigo-200 mx-auto mb-4" />
                    <h3 className="font-bold text-xl text-slate-800 mb-2">Bem-vindo(a) ao seu Painel</h3>
                    <p className="text-slate-500 mb-6">
                        {dbUser?.role === 'Professor'
                            ? 'Acesse "Meus Guias" para importar novos Guias via IA e avaliar apontamentos das turmas.'
                            : 'Acesse "Meus Guias" para visualizar os conteúdos semanais e, caso seja líder, enviar seus relatórios.'}
                    </p>
                    <Link href="/dashboard/guias" className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md">
                        Acessar Meus Guias
                    </Link>
                </div>
            )}
        </div>
    )
}
