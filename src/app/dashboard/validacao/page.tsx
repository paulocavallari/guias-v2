import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, Clock, CheckCircle2, ArrowRight } from 'lucide-react'
import { validarSemana } from '@/actions/semanas'
import { getUserProfile } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export default async function ValidacaoPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const dbUser = await getUserProfile(user.id)

    if (dbUser?.role !== 'Professor' && dbUser?.role !== 'Admin') {
        redirect('/dashboard')
    }

    // Buscar todos os guias do professor com semanas aguardando validação
    const guiasQuery = supabase
        .from('guias_aprendizagem')
        .select('id, disciplina_nome, ano_serie, bimestre, ano_letivo, turmas(nome)')
        .order('created_at', { ascending: false })

    if (dbUser.role === 'Professor') {
        // Professor só vê seus próprios guias
        (guiasQuery as any).eq('professor_id', user.id)
    }

    const { data: guias } = await guiasQuery

    // Buscar todas as semanas aguardando validação
    const { data: semanasAguardando } = await supabase
        .from('semanas_guia')
        .select('*, guias_aprendizagem(id, disciplina_nome, ano_serie, bimestre, turma_id, turmas(nome))')
        .eq('status_validacao', 'Aguardando Validação')
        .order('data_apontamento_lider', { ascending: true })

    // Filtrar por guias do professor se necessário
    const semanasFiltered = dbUser.role === 'Professor'
        ? semanasAguardando?.filter((s: any) => {
            const guia = s.guias_aprendizagem
            return guias?.some(g => g.id === guia?.id)
        })
        : semanasAguardando

    return (
        <div className="p-4 sm:p-8 max-w-5xl mx-auto">
            <div className="mb-8 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Painel de Validação</h1>
                    <p className="text-slate-500 mt-0.5">Apontamentos de líderes aguardando sua aprovação.</p>
                </div>
            </div>

            {/* Contador */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-extrabold text-blue-700">{semanasFiltered?.length || 0}</p>
                        <p className="text-sm font-medium text-blue-600">Apontamentos a Validar</p>
                    </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-extrabold text-emerald-700">{guias?.length || 0}</p>
                        <p className="text-sm font-medium text-emerald-600">Guias sob sua Responsabilidade</p>
                    </div>
                </div>
            </div>

            {/* Lista de semanas pendentes */}
            {semanasFiltered && semanasFiltered.length > 0 ? (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-700">Apontamentos Pendentes de Validação</h2>
                    {semanasFiltered.map((semana: any) => {
                        const guia = semana.guias_aprendizagem
                        const turmaObj: any = guia?.turmas
                        return (
                            <div key={semana.id} className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-blue-100 text-blue-700 text-xs font-extrabold px-2.5 py-1 rounded-lg">
                                                {guia?.disciplina_nome}
                                            </span>
                                            <span className="text-xs text-slate-500 font-medium">
                                                Bim. {guia?.bimestre} / {guia?.ano_serie} {turmaObj?.nome}
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700 mb-1">Período: {semana.data_semana}</p>
                                        <p className="text-sm text-slate-600 mt-2 bg-slate-50 rounded-xl p-3 border border-slate-100 line-clamp-3">
                                            {semana.apontamentos_comentarios || <span className="italic text-slate-400">Sem comentários do líder.</span>}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2 min-w-fit">
                                        <form action={validarSemana.bind(null, semana.id, guia?.id) as any}>
                                            <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm text-sm flex items-center justify-center gap-2">
                                                <CheckCircle2 className="w-4 h-4" /> Validar
                                            </button>
                                        </form>
                                        <Link
                                            href={`/dashboard/guias/${guia?.id}`}
                                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-5 py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                                        >
                                            Ver Guia <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
                    <CheckCircle2 className="w-14 h-14 text-emerald-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Tudo em Dia!</h3>
                    <p className="text-slate-500">Nenhum apontamento aguarda sua validação no momento.</p>
                </div>
            )}
        </div>
    )
}
