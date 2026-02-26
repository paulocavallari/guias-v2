'use server'

import { createClient } from '@/utils/supabase/server'
import { getServiceClient, getUserProfile } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function updateAlunoTurma(userId: string, turmaId: string | null, pathToRevalidate: string, formData?: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autorizado.' }

    const dbUser = await getUserProfile(user.id)
    if (dbUser?.role !== 'Admin' && dbUser?.role !== 'CGPG') {
        return { error: 'Sem permissão para esta ação.' }
    }

    const adminClient = getServiceClient()
    const { error } = await adminClient
        .from('usuarios')
        .update({ turma_id: turmaId })
        .eq('id', userId)

    if (error) {
        console.error('Erro ao atualizar turma do usuário:', error)
        return { error: 'Ocorreu um erro.' }
    }

    revalidatePath(pathToRevalidate)
    return { success: true }
}

export async function updateAlunoCargos(userId: string, cargo: 'LIDER' | 'VICE' | 'NENHUM', pathToRevalidate: string, formData?: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autorizado.' }

    const dbUser = await getUserProfile(user.id)
    if (dbUser?.role !== 'Admin' && dbUser?.role !== 'CGPG') {
        return { error: 'Sem permissão para esta ação.' }
    }

    const is_lider = cargo === 'LIDER'
    const is_vice_lider = cargo === 'VICE'

    const adminClient = getServiceClient()
    const { error } = await adminClient
        .from('usuarios')
        .update({ is_lider, is_vice_lider })
        .eq('id', userId)

    if (error) {
        console.error('Erro ao atualizar cargo do usuário:', error)
        return { error: 'Ocorreu um erro.' }
    }

    revalidatePath(pathToRevalidate)
    return { success: true }
}
