import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { BookOpenCheck, LayoutDashboard, Users, FileText, LogOut, CheckSquare, Shield } from 'lucide-react'

// Define a estrutura de itens do menu
type MenuItem = {
    name: string
    href: string
    icon: React.ElementType
    roles: string[]
}

const MENU_ITEMS: MenuItem[] = [
    { name: 'Visão Geral', href: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'CGPG', 'Professor', 'Aluno'] },
    { name: 'Meus Guias', href: '/dashboard/guias', icon: FileText, roles: ['Admin', 'Professor', 'Aluno'] },
    { name: 'Painel de Validação', href: '/dashboard/validacao', icon: CheckSquare, roles: ['Admin', 'Professor'] },
    { name: 'Gestão de Turmas', href: '/dashboard/turmas', icon: Users, roles: ['Admin', 'CGPG'] },
    { name: 'Gestão de Disciplinas', href: '/dashboard/disciplinas', icon: FileText, roles: ['Admin', 'CGPG'] },
    { name: 'Gerenciar Usuários', href: '/dashboard/admin/usuarios', icon: Shield, roles: ['Admin'] },
]

export default async function Sidebar() {
    const supabase = await createClient()

    // 1. Obter usuário autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // 2. Obter a role oficial do banco de dados (Tabela usuarios gravada pela trigger)
    const { data: dbUser } = await supabase
        .from('usuarios')
        .select('role, is_lider, is_vice_lider, nome')
        .eq('id', user.id)
        .single()

    const userRole = dbUser?.role || 'Aluno'
    const isLiderOrVice = dbUser?.is_lider || dbUser?.is_vice_lider

    // Filtra itens permitidos para a role atual
    const allowedItems = MENU_ITEMS.filter(item => item.roles.includes(userRole))

    return (
        <div className="flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300">
            <div className="flex h-16 items-center flex-shrink-0 px-6 bg-slate-950/50">
                <div className="flex items-center gap-2">
                    <BookOpenCheck className="w-6 h-6 text-indigo-500" />
                    <span className="font-bold text-lg text-white tracking-tight">Gestão PEI</span>
                </div>
            </div>

            <div className="px-6 py-6 border-b border-slate-800/50">
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-white truncate" title={dbUser?.nome || user.email}>
                        {dbUser?.nome || user.email}
                    </span>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="inline-flex items-center rounded-md bg-indigo-400/10 px-2 py-0.5 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-400/30">
                            {userRole}
                        </span>
                        {isLiderOrVice && (
                            <span className="inline-flex items-center rounded-md bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-inset ring-amber-400/20">
                                Líder
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="px-3 space-y-1">
                    {allowedItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
                        >
                            <item.icon className="text-slate-500 group-hover:text-indigo-400 flex-shrink-0 w-5 h-5 mr-3 transition-colors" />
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="p-4 border-t border-slate-800">
                <form action="/auth/signout" method="post">
                    <button type="submit" className="group flex w-full items-center px-3 py-2.5 text-sm font-medium rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                        <LogOut className="flex-shrink-0 w-5 h-5 mr-3" />
                        Sair do Sistema
                    </button>
                </form>
            </div>
        </div>
    )
}
