'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export async function salvarApontamento(semanaId: string, formData: FormData) {
    const supabase = await createClient()
    const comentarios = formData.get('comentarios') as string

    // 1. Identifica e valida o usuário
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autorizado.' }

    const { data: dbUser } = await supabase
        .from('usuarios')
        .select('is_lider, is_vice_lider')
        .eq('id', user.id)
        .single()

    if (!dbUser?.is_lider && !dbUser?.is_vice_lider) {
        return { error: 'Apenas os líderes da turma podem fazer apontamentos.' }
    }

    // 2. Atualiza o banco
    const { error } = await supabase
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

    const { data: dbUser } = await supabase
        .from('usuarios')
        .select('role')
        .eq('id', user.id)
        .single()

    if (dbUser?.role !== 'Professor' && dbUser?.role !== 'Admin') {
        return { error: 'Apenas professores podem validar as semanas.' }
    }

    // Valida a semana
    const { error } = await supabase
        .from('semanas_guia')
        .update({ status_validacao: 'Validado' })
        .eq('id', semanaId)

    if (error) {
        return { error: 'Erro ao validar a semana.' }
    }

    // Verifica se TODAS as semanas estão validadas para fechar o guia (Regra de Negócio Automática)
    const { data: countSemanasPendentes } = await supabase
        .from('semanas_guia')
        .select('id', { count: 'exact' })
        .eq('guia_id', guiaId)
        .neq('status_validacao', 'Validado')

    if (countSemanasPendentes && countSemanasPendentes.length === 0) {
        // Concluir guia! Todas validadas
        await supabase
            .from('guias_aprendizagem')
            .update({ concluido: true })
            .eq('id', guiaId)

        // Buscar o nome da disciplina e turma para a mensagem
        const { data: info } = await supabase
            .from('guias_aprendizagem')
            .select('disciplina_nome, ano_serie, turmas(nome)')
            .eq('id', guiaId)
            .single()

        if (info) {
            const turmasObj: any = info.turmas
            const mensagem = `🌟 *Alerta de Conclusão!*\nO Guia de Aprendizagem de *${info.disciplina_nome}* da turma *${info.ano_serie} ${turmasObj?.nome || ''}* foi 100% validado e concluído com sucesso.\n\nAcesse o painel CGPG para mais detalhes.`

            // Substitua pelo número real do grupo de gestão escolar ou celular do responsável
            const numeroWhatsAppCGPG = "5511999999999"

            await sendWhatsAppMessage(numeroWhatsAppCGPG, mensagem)
        }
    }

    revalidatePath(`/dashboard/guias/${guiaId}`)
    return { success: true }
}
