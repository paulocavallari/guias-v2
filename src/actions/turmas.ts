'use server'

import { createClient } from '@/utils/supabase/server'
import { getServiceClient, getUserProfile } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function addTurma(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autorizado.' }

    const dbUser = await getUserProfile(user.id)
    if (dbUser?.role !== 'Admin' && dbUser?.role !== 'CGPG') {
        return { error: 'Sem permissão.' }
    }

    const nome = formData.get('nome') as string
    const ano_serie = formData.get('ano_serie') as string

    if (!nome || !ano_serie) return { error: 'Nome e Ano/Série são obrigatórios.' }

    const adminClient = getServiceClient()
    const { error } = await adminClient
        .from('turmas')
        .insert([{ nome, ano_serie }])

    if (error) {
        console.error('Erro ao adicionar turma:', error.message)
        return { error: 'Ocorreu um erro ao criar a turma.' }
    }

    revalidatePath('/dashboard/turmas')
    return { success: true }
}

export async function deleteTurma(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autorizado.' }

    const dbUser = await getUserProfile(user.id)
    if (dbUser?.role !== 'Admin' && dbUser?.role !== 'CGPG') {
        return { error: 'Sem permissão.' }
    }

    const adminClient = getServiceClient()
    const { error } = await adminClient
        .from('turmas')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Erro ao deletar turma:', error)
        return { error: 'Ocorreu um erro ao apagar a turma.' }
    }

    revalidatePath('/dashboard/turmas')
    return { success: true }
}
