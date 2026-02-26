'use server'

import { createClient } from '@/utils/supabase/server'
import { getServiceClient, getUserProfile } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function salvarApontamento(semanaId: string, formData: FormData) {
    const supabase = await createClient()
    const comentarios = formData.get('comentarios') as string

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autorizado.' }

    // Usar service client para checar role sem bloqueio de RLS
    const dbUser = await getUserProfile(user.id)

    if (!dbUser?.is_lider && !dbUser?.is_vice_lider) {
        return { error: 'Apenas os líderes da turma podem fazer apontamentos.' }
    }

    const adminClient = getServiceClient()
    const { error } = await adminClient
        .from('semanas_guia')
        .update({
            apontamentos_comentarios: comentarios,
            data_apontamento_lider: new Date().toISOString(),
            status_validacao: 'Aguardando Validação'
        })
        .eq('id', semanaId)

    if (error) {
        console.error('Erro ao salvar apontamento:', error.message)
        return { error: 'Ocorreu um erro ao salvar o comentário.' }
    }

    revalidatePath('/dashboard/guias/[id]', 'page')
    return { success: true }
}

export async function validarSemana(semanaId: string, guiaId: string, formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autorizado.' }

    const dbUser = await getUserProfile(user.id)

    if (dbUser?.role !== 'Professor' && dbUser?.role !== 'Admin') {
        return { error: 'Apenas professores podem validar as semanas.' }
    }

    const adminClient = getServiceClient()

    const { error } = await adminClient
        .from('semanas_guia')
        .update({ status_validacao: 'Validado' })
        .eq('id', semanaId)

    if (error) {
        return { error: 'Erro ao validar a semana.' }
    }

    // Verifica se TODAS as semanas estão validadas para fechar o guia
    const { data: semanasPendentes } = await adminClient
        .from('semanas_guia')
        .select('id')
        .eq('guia_id', guiaId)
        .neq('status_validacao', 'Validado')

    if (semanasPendentes && semanasPendentes.length === 0) {
        await adminClient
            .from('guias_aprendizagem')
            .update({ concluido: true })
            .eq('id', guiaId)

        const { data: info } = await adminClient
            .from('guias_aprendizagem')
            .select('disciplina_nome, ano_serie, turmas(nome)')
            .eq('id', guiaId)
            .single()

        if (info) {
            try {
                const { sendWhatsAppMessage } = await import('@/lib/whatsapp')
                const turmasObj: any = info.turmas
                const mensagem = `🌟 *Alerta de Conclusão!*\nO Guia de Aprendizagem de *${info.disciplina_nome}* da turma *${info.ano_serie} ${turmasObj?.nome || ''}* foi 100% validado e concluído com sucesso.\n\nAcesse o painel CGPG para mais detalhes.`
                const numeroWhatsAppCGPG = "5511999999999"
                await sendWhatsAppMessage(numeroWhatsAppCGPG, mensagem)
            } catch (e) {
                console.warn('WhatsApp notification failed (non-critical):', e)
            }
        }
    }

    revalidatePath(`/dashboard/guias/${guiaId}`)
    return { success: true }
}

export async function addWeeklyContent(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autorizado. Faça login novamente.' }

    const dbUser = await getUserProfile(user.id)
    if (dbUser?.role !== 'Professor' && dbUser?.role !== 'Admin') {
        return { error: 'Apenas professores e administradores podem adicionar conteúdo.' }
    }

    const guia_id = formData.get('guia_id') as string
    const data_semana = formData.get('data_semana') as string
    const conteudos = formData.get('conteudos') as string
    const estrategias_didaticas = formData.get('estrategias_didaticas') as string
    const metodologias = formData.get('metodologias') as string
    const avaliacao = formData.get('avaliacao') as string

    if (!guia_id || !data_semana || !conteudos || !estrategias_didaticas) {
        return { error: 'Preencha todos os campos obrigatórios.' }
    }

    const adminClient = getServiceClient()

    const { error } = await adminClient
        .from('semanas_guia')
        .insert([{
            guia_id,
            data_semana,
            conteudos,
            estrategias_didaticas,
            metodologias: metodologias || '',
            avaliacao: avaliacao || '',
            status_validacao: 'Pendente'
        }])

    if (error) {
        console.error('Erro ao adicionar semana:', error)
        return { error: 'Ocorreu um erro ao salvar a semana.' }
    }

    revalidatePath(`/dashboard/guias/${guia_id}`)
    return { success: true }
}
