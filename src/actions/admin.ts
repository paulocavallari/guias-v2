'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserRole(userId: string, newRole: 'Professor' | 'CGPG' | 'Admin' | 'Aluno', formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autorizado.' }

    // Apenas Admin pode alterar roles
    const { data: dbUser } = await supabase
        .from('usuarios')
        .select('role')
        .eq('id', user.id)
        .single()

    if (dbUser?.role !== 'Admin') {
        return { error: 'Apenas Administradores podem alterar cargos.' }
    }

    const { error } = await supabase
        .from('usuarios')
        .update({ role: newRole })
        .eq('id', userId)

    if (error) {
        return { error: `Erro ao atualizar cargo: ${error.message}` }
    }

    revalidatePath('/dashboard/admin/usuarios')
    return { success: true }
}
