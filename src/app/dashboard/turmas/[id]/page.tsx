import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, UserPlus, Star, ShieldAlert } from 'lucide-react'
import { updateAlunoTurma, updateAlunoCargos } from '@/actions/usuarios'

export default async function TurmaDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: dbUser } = await supabase
        .from('usuarios')
        .select('role')
        .eq('id', user.id)
        .single()

    if (dbUser?.role !== 'Admin' && dbUser?.role !== 'CGPG') {
        redirect('/dashboard')
    }

    // Busca dados da Turma
    const { data: turma, error: errorTurma } = await supabase
        .from('turmas')
        .select('*')
        .eq('id', params.id)
        .single()

    if (!turma) {
        return <div className="p-8">Turma não encontrada.</div>
    }

    // Busca Alunos dessa turma
    const { data: alunosTurma } = await supabase
        .from('usuarios')
        .select('*')
        .eq('turma_id', turma.id)
        .order('nome', { ascending: true })

    // Busca Alunos sem turma (para poder adicionar)
    const { data: alunosSemTurma } = await supabase
        .from('usuarios')
        .select('*')
        .eq('role', 'Aluno')
        .is('turma_id', null)
        .order('nome', { ascending: true })

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <Link href="/dashboard/turmas" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Turmas
            </Link>

            <div className="mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                    Turma {turma.ano_serie} {turma.nome}
                </h1>
                <p className="text-slate-500 mt-1">Gerencie os alunos vinculados e eleja os líderes de sala.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Alunos da Turma */}
                <div className="xl:col-span-2 space-y-4">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        Alunos Matriculados <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{alunosTurma?.length || 0}</span>
                    </h2>

                    <ul className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
                        {alunosTurma && alunosTurma.length > 0 ? alunosTurma.map(aluno => (
                            <li key={aluno.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">
                                        {aluno.nome.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                            {aluno.nome}
                                            {aluno.is_lider && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold">LÍDER</span>}
                                            {aluno.is_vice_lider && <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">VICE</span>}
                                        </h3>
                                        <p className="text-xs text-slate-500">{aluno.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Remover da Turma */}
                                    <form action={updateAlunoTurma.bind(null, aluno.id, null, `/dashboard/turmas/${turma.id}`) as any}>
                                        <button type="submit" className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors">
                                            Remover
                                        </button>
                                    </form>

                                    {/* Toggle Lider/Vice */}
                                    <form action={updateAlunoCargos.bind(null, aluno.id, aluno.is_lider ? 'NENHUM' : 'LIDER', `/dashboard/turmas/${turma.id}`) as any}>
                                        <button type="submit" className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1 transition-colors ${aluno.is_lider ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`}>
                                            <Star className={`w-3 h-3 ${aluno.is_lider ? 'fill-amber-500 text-amber-500' : ''}`} />
                                            {aluno.is_lider ? 'Remover Líder' : 'Tornar Líder'}
                                        </button>
                                    </form>
                                </div>
                            </li>
                        )) : (
                            <li className="p-8 text-center text-sm text-slate-500">Nenhum aluno vinculado a esta turma.</li>
                        )}
                    </ul>
                </div>

                {/* Adicionar Alunos */}
                <div className="xl:col-span-1 space-y-4">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        Adicionar à Turma
                    </h2>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm max-h-[500px] overflow-y-auto">
                        {alunosSemTurma && alunosSemTurma.length > 0 ? (
                            <div className="space-y-3">
                                {alunosSemTurma.map(aluno => (
                                    <div key={aluno.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="truncate pr-3">
                                            <p className="text-sm font-semibold text-slate-800 truncate" title={aluno.nome}>{aluno.nome}</p>
                                            <p className="text-[11px] text-slate-500 truncate">{aluno.email}</p>
                                        </div>
                                        <form action={updateAlunoTurma.bind(null, aluno.id, turma.id, `/dashboard/turmas/${turma.id}`) as any}>
                                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors" title="Adicionar à Turma">
                                                <UserPlus className="w-4 h-4" />
                                            </button>
                                        </form>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">Nenhum aluno disponível (todos já estão em turmas ou não fizeram login).</p>
                                <p className="text-xs mt-1 text-slate-400">Dica: Os alunos precisam fazer o primeiro login com o e-mail institucional para aparecerem aqui.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
