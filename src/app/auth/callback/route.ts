import { createServerClient } from '@supabase/ssr'
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

    // --- Lógica de RBAC por domínio do Google ---
    let role: 'Aluno' | 'Professor' | 'Admin' = 'Aluno'

    if (email === 'paulocavallari@prof.educacao.sp.gov.br') {
        role = 'Admin'
    } else if (email.endsWith('@prof.educacao.sp.gov.br')) {
        role = 'Professor'
    } else if (email.endsWith('@al.educacao.sp.gov.br')) {
        role = 'Aluno'
    }

    // Upsert do usuário na tabela 'usuarios' (cria na primeira vez, ignora nas subsequentes)
    const { error: upsertError } = await supabase
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
                ignoreDuplicates: false, // Atualiza nome e email se mudar
            }
        )

    if (upsertError) {
        console.error('Erro ao fazer upsert do usuário:', upsertError.message)
    }

    return NextResponse.redirect(`${origin}/dashboard`)
}
