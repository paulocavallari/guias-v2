import { createClient as createServiceClient, SupabaseClient } from '@supabase/supabase-js'

// Singleton: reutiliza a mesma instância entre chamadas no mesmo processo
let _serviceClient: SupabaseClient | null = null

/**
 * Cria (ou reutiliza) um cliente Supabase com a Service Role Key (bypass total de RLS).
 * Singleton para evitar múltiplas instâncias por request.
 * Use APENAS em Server Components e Server Actions — nunca no client.
 */
export function getServiceClient(): SupabaseClient {
    if (_serviceClient) return _serviceClient

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!url || !key) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.')
    }

    _serviceClient = createServiceClient(url, key)
    return _serviceClient
}

/**
 * Busca o perfil completo do usuário pelo ID via service role (bypass RLS).
 * Retorna null se não encontrado.
 */
export async function getUserProfile(userId: string) {
    const adminClient = getServiceClient()

    const { data, error } = await adminClient
        .from('usuarios')
        .select('id, nome, email, role, is_lider, is_vice_lider, turma_id')
        .eq('id', userId)
        .maybeSingle()

    if (error) {
        console.error('[getUserProfile] Erro:', error.message)
        return null
    }

    return data
}
