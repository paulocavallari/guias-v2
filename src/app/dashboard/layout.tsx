import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    // Verifica proteção da rota global
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/auth/login')
    }

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar Lateral - Lado Esquerdo */}
            <Sidebar />

            {/* Área Principal de Conteúdo - Lado Direito */}
            <main className="flex-1 overflow-y-auto">
                <div className="h-full w-full relative">
                    {children}
                </div>
            </main>
        </div>
    )
}
