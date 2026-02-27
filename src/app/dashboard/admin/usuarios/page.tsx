import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Shield, Users } from 'lucide-react'
import { updateUserRole } from '@/actions/admin'
import { getServiceClient, getUserProfile } from '@/lib/supabase-admin'

const ROLES = ['Aluno', 'Professor', 'CGPG', 'Admin'] as const

const ROLE_COLORS: Record<string, string> = {
    Aluno: 'bg-slate-100 text-slate-600',
    Professor: 'bg-blue-100 text-blue-700',
    CGPG: 'bg-purple-100 text-purple-700',
    Admin: 'bg-red-100 text-red-700',
}

export const dynamic = 'force-dynamic'

export default async function AdminUsuariosPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const dbUser = await getUserProfile(user.id)
    if (dbUser?.role !== 'Admin') redirect('/dashboard')

    const adminClient = getServiceClient()
    const { data: usuarios } = await adminClient
        .from('usuarios')
        .select('*')
        .order('nome', { ascending: true })

    return (
        <div className="p-4 sm:p-8 max-w-5xl mx-auto">
            <div className="mb-8 flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                    <Shield className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Gerenciar Usuários e Cargos</h1>
                    <p className="text-slate-500 mt-0.5">Promova professores para Coordenadores (CGPG) ou outros cargos.</p>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
                <span className="text-amber-500 text-lg mt-0.5">ℹ️</span>
                <p className="text-sm text-amber-800">
                    <strong>Como promover um Coordenador (CGPG):</strong> Selecione o novo cargo no dropdown ao lado do usuário e clique em <strong>Salvar</strong>.
                </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                    <h2 className="font-bold text-slate-700 flex items-center gap-2">
                        <Users className="w-5 h-5 text-slate-400" />
                        Todos os Usuários ({usuarios?.length || 0})
                    </h2>
                </div>

                <ul className="divide-y divide-slate-100">
                    {usuarios?.map(u => (
                        <li key={u.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                                    {u.nome?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-800 truncate">{u.nome}</p>
                                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 flex-shrink-0">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-600'}`}>
                                    {u.role}
                                </span>

                                {/* Cada usuário tem seu próprio form isolado */}
                                {u.id !== user.id && (
                                    <form action={updateUserRole.bind(null, u.id) as any} className="flex items-center gap-2">
                                        <select
                                            name="newRole"
                                            defaultValue={u.role}
                                            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                                        >
                                            {ROLES.map(r => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="submit"
                                            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg transition-all"
                                        >
                                            Salvar
                                        </button>
                                    </form>
                                )}
                            </div>
                        </li>
                    ))}
                    {(!usuarios || usuarios.length === 0) && (
                        <li className="p-10 text-center text-slate-400 italic">
                            Nenhum usuário encontrado. Os usuários aparecem aqui após o primeiro login.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    )
}
