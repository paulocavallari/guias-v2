'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateAlunoTurma(userId: string, turmaId: string | null, pathToRevalidate: string, formData?: FormData) {
    const supabase = await createClient()

    const { error } = await supabase
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

    let is_lider = false
    let is_vice_lider = false

    if (cargo === 'LIDER') is_lider = true
    if (cargo === 'VICE') is_vice_lider = true

    const { error } = await supabase
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
