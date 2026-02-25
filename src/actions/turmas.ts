'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addTurma(formData: FormData) {
    const supabase = await createClient()

    const nome = formData.get('nome') as string
    const ano_serie = formData.get('ano_serie') as string

    if (!nome || !ano_serie) {
        return { error: 'Nome e Ano/Série são obrigatórios.' }
    }

    const { error } = await supabase
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

    const { error } = await supabase
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
