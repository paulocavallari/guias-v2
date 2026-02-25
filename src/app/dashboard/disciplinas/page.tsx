import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Plus, Trash2, Library } from 'lucide-react'
import { addDisciplina, deleteDisciplina } from '@/actions/disciplinas'

export default async function DisciplinasPage() {
    const supabase = await createClient()

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
                    <p>Apenas Gestores e Administradores podem gerenciar as disciplinas.</p>
                </div>
            </div>
        )
    }

    const { data: disciplinas, error } = await supabase
        .from('disciplinas')
        .select('*')
        .order('nome', { ascending: true })

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Gestão de Disciplinas</h1>
                <p className="text-slate-500 mt-1">Cadastre e gerencie as disciplinas ministradas na escola.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <Plus className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-800">Nova Disciplina</h2>
                        </div>
                        <form action={addDisciplina as any} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Disciplina</label>
                                <input
                                    type="text"
                                    name="nome"
                                    placeholder="Ex: Matemática, Projeto de Vida..."
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-800"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                Cadastrar
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    {error ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
                            Erro ao carregar: {error.message}
                        </div>
                    ) : disciplinas && disciplinas.length > 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <ul className="divide-y divide-slate-100">
                                {disciplinas.map(disciplina => (
                                    <li key={disciplina.id} className="p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center">
                                                <Library className="w-5 h-5" />
                                            </div>
                                            <span className="font-medium text-slate-800">{disciplina.nome}</span>
                                        </div>
                                        <form action={deleteDisciplina.bind(null, disciplina.id) as any}>
                                            <button type="submit" className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </form>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 text-center text-slate-500">
                            Nenhuma disciplina cadastrada.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
