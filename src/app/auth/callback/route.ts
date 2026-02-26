import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin

    if (!code) {
        return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
    }

    const cookieStore = await cookies()

    // Cliente SSR para troca do código OAuth (usa anon key + cookies)
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !session?.user) {
        console.error('Erro na troca de código:', error?.message)
        return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
    }

    const user = session.user
    const email = user.email || ''
    const nome = user.user_metadata?.full_name || user.user_metadata?.name || email

    // --- Lógica de RBAC por domínio de e-mail do Google ---
    let role: 'Aluno' | 'Professor' | 'CGPG' | 'Admin' = 'Aluno'

    if (email === 'paulocavallari@prof.educacao.sp.gov.br') {
        role = 'Admin'
    } else if (email.endsWith('@prof.educacao.sp.gov.br')) {
        role = 'Professor'
    } else if (email.endsWith('@al.educacao.sp.gov.br')) {
        role = 'Aluno'
    }

    // Cliente com Service Role Key para bypass de RLS no upsert
    // Necessário pois o RLS impede a atualização da role via chave anon
    const serviceClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: upsertError } = await serviceClient
        .from('usuarios')
        .upsert(
            {
                id: user.id,
                email: email,
                nome: nome,
                role: role,
            },
            {
                onConflict: 'id',
                ignoreDuplicates: false,
            }
        )

    if (upsertError) {
        console.error('Erro ao fazer upsert do usuário:', upsertError.message)
    } else {
        console.log(`✅ Usuário ${email} logou com role: ${role}`)
    }

    return NextResponse.redirect(`${origin}/dashboard`)
}
