import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BotMessageSquare } from 'lucide-react'
import UploadForm from '@/components/UploadForm'
import { getUserProfile } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export default async function NovaGuiaPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const dbUser = await getUserProfile(user.id)

    if (dbUser?.role !== 'Admin' && dbUser?.role !== 'Professor') {
        redirect('/dashboard')
    }

    return (
        <div className="p-8 max-w-4xl mx-auto h-full flex flex-col">
            <Link href="/dashboard/guias" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Meus Guias
            </Link>

            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden flex-1">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 opacity-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl text-white">
                            <BotMessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Importação por Inteligência Artificial</h1>
                            <p className="text-slate-500 text-sm mt-0.5">Faça o upload do Word (docx) e deixe a IA cuidar do preenchimento das colunas.</p>
                        </div>
                    </div>

                    <UploadForm />
                </div>
            </div>
        </div>
    )
}
