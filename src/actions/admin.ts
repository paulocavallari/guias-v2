'use server'

import { createClient } from '@/utils/supabase/server'
import { getServiceClient, getUserProfile } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function updateUserRole(userId: string, formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autorizado.' }

    // Usar service client para checar role do executante sem bloqueio de RLS
    const dbUser = await getUserProfile(user.id)
    if (dbUser?.role !== 'Admin') {
        return { error: 'Apenas Administradores podem alterar cargos.' }
    }

    // A nova role vem do select via FormData
    const newRole = formData.get('newRole') as string
    if (!newRole || !['Aluno', 'Professor', 'CGPG', 'Admin'].includes(newRole)) {
        return { error: 'Cargo inválido.' }
    }

    const adminClient = getServiceClient()
    const { error } = await adminClient
        .from('usuarios')
        .update({ role: newRole })
        .eq('id', userId)

    if (error) {
        return { error: `Erro ao atualizar cargo: ${error.message}` }
    }

    revalidatePath('/dashboard/admin/usuarios')
    return { success: true }
}
