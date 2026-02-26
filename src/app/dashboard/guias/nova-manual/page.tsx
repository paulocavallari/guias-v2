import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import ManualGuiaForm from '@/components/ManualGuiaForm'
import { getUserProfile, getServiceClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export default async function NovaGuiaManualPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const dbUser = await getUserProfile(user.id)

    if (dbUser?.role !== 'Admin' && dbUser?.role !== 'Professor') {
        redirect('/dashboard')
    }

    // Buscar turmas e disciplinas para o formulário manual
    const adminClient = getServiceClient()

    // Se for professor, idealmente buscaríamos só as turmas/disciplinas dele, mas por enquanto pegamos todas
    const [{ data: turmas }, { data: disciplinas }] = await Promise.all([
        adminClient.from('turmas').select('id, nome, ano_serie').order('ano_serie'),
        adminClient.from('disciplinas').select('id, nome').order('nome')
    ])

    return (
        <div className="p-4 sm:p-8 max-w-4xl mx-auto h-full flex flex-col">
            <Link href="/dashboard/guias" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 mb-6 transition-colors w-fit">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Meus Guias
            </Link>

            <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden flex-1">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 opacity-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-2xl text-white">
                            <Pencil className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Criação Manual</h1>
                            <p className="text-slate-500 text-sm mt-0.5">Preencha os dados básicos para iniciar um novo Guia de Aprendizagem em branco.</p>
                        </div>
                    </div>

                    <div className="mt-8">
                        <ManualGuiaForm turmas={turmas || []} disciplinas={disciplinas || []} />
                    </div>
                </div>
            </div>
        </div>
    )
}
