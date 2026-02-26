'use server'

import { createClient } from '@/utils/supabase/server'
import { getServiceClient, getUserProfile } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function addDisciplina(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autorizado.' }

    const dbUser = await getUserProfile(user.id)
    if (dbUser?.role !== 'Admin' && dbUser?.role !== 'CGPG') {
        return { error: 'Sem permissão.' }
    }

    const nome = formData.get('nome') as string
    if (!nome) return { error: 'Nome da disciplina é obrigatório.' }

    const adminClient = getServiceClient()
    const { error } = await adminClient
        .from('disciplinas')
        .insert([{ nome }])

    if (error) {
        console.error('Erro ao adicionar disciplina:', error.message)
        return { error: 'Ocorreu um erro ao criar.' }
    }

    revalidatePath('/dashboard/disciplinas')
}

export async function deleteDisciplina(id: string, formData?: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autorizado.' }

    const dbUser = await getUserProfile(user.id)
    if (dbUser?.role !== 'Admin' && dbUser?.role !== 'CGPG') {
        return { error: 'Sem permissão.' }
    }

    const adminClient = getServiceClient()
    const { error } = await adminClient
        .from('disciplinas')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Erro ao deletar disciplina:', error)
        return { error: 'Ocorreu um erro ao apagar.' }
    }

    revalidatePath('/dashboard/disciplinas')
}
