'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addDisciplina(formData: FormData) {
    const supabase = await createClient()

    const nome = formData.get('nome') as string

    if (!nome) {
        return { error: 'Nome da disciplina é obrigatório.' }
    }

    const { error } = await supabase
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

    const { error } = await supabase
        .from('disciplinas')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Erro ao deletar disciplina:', error)
        return { error: 'Ocorreu um erro ao apagar.' }
    }

    revalidatePath('/dashboard/disciplinas')
}
