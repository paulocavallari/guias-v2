import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Plus, Trash2, UsersIcon } from 'lucide-react'
import { addTurma, deleteTurma } from '@/actions/turmas'

export default async function TurmasPage() {
    const supabase = await createClient()

    // Confere Proteção RLS de Nível de Role via Banco
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: dbUser } = await supabase
        .from('usuarios')
        .select('role')
        .eq('id', user.id)
        .single()

    if (dbUser?.role !== 'Admin' && dbUser?.role !== 'CGPG') {
        return (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 max-w-lg">
                    <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
                    <p>Apenas Gestores (CGPG) e Administradores podem acessar a Gestão de Turmas.</p>
                </div>
            </div>
        )
    }

    // Lista turmas existentes
    const { data: turmas, error: errorTurmas } = await supabase
        .from('turmas')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Gestão de Turmas</h1>
                    <p className="text-slate-500 mt-1">Gerencie as 24 turmas da escola do modelo PEI.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Formulário de Criação */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <Plus className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-800">Nova Turma</h2>
                        </div>

                        <form action={addTurma} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Ano/Série
                                </label>
                                <input
                                    type="text"
                                    name="ano_serie"
                                    placeholder="Ex: 1º Ano, 2ª Série..."
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Letra / Nome
                                </label>
                                <input
                                    type="text"
                                    name="nome"
                                    placeholder="Ex: A, B, C..."
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-800"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                Cadastrar Turma
                            </button>
                        </form>
                    </div>
                </div>

                {/* Listagem */}
                <div className="lg:col-span-2">
                    {errorTurmas ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
                            Erro ao buscar turmas: {errorTurmas.message}
                        </div>
                    ) : turmas && turmas.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {turmas.map((turma) => (
                                <div key={turma.id} className="bg-white border text-center border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center relative group hover:border-indigo-200 transition-all overflow-hidden">
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        <form action={deleteTurma.bind(null, turma.id)}>
                                            <button type="submit" className="text-red-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </form>
                                    </div>
                                    <a href={`/dashboard/turmas/${turma.id}`} className="absolute inset-0 z-10 w-full h-full"></a>
                                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex flex-shrink-0 items-center text-indigo-500 justify-center mb-4 relative z-0">
                                        <UsersIcon className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-lg relative z-0">{turma.ano_serie} {turma.nome}</h3>
                                    <p className="text-indigo-600 font-medium text-sm mt-2 relative z-0 opacity-0 group-hover:opacity-100 transition-opacity">Gerenciar Alunos &rarr;</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 text-center text-slate-500">
                            Nenhuma turma cadastrada no sistema. Utilize o painel ao lado para adicionar.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
