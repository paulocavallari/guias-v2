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

    // 1. Cliente SSR para trocar o código OAuth pela sessão
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
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
        console.error('[AUTH CALLBACK] Erro na troca de código:', error?.message)
        return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
    }

    const user = session.user
    const email = user.email || ''
    const nome = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0]

    // 2. Lógica de RBAC pelos novos domínios Google SEDUC
    let role: 'Aluno' | 'Professor' | 'CGPG' | 'Admin' = 'Aluno'

    if (email === 'paulocavallari@prof.educacao.sp.gov.br') {
        role = 'Admin'
    } else if (email.endsWith('@prof.educacao.sp.gov.br')) {
        role = 'Professor'
    } else if (email.endsWith('@al.educacao.sp.gov.br')) {
        role = 'Aluno'
    }

    console.log(`[AUTH CALLBACK] Email: ${email} | Role determinada: ${role}`)

    // 3. Verificar se a Service Role Key está configurada
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
        console.error('[AUTH CALLBACK] SUPABASE_SERVICE_ROLE_KEY não está configurada no .env.local!')
        return NextResponse.redirect(`${origin}/dashboard`)
    }

    // 4. Usar Service Role Key (bypass RLS) para criar/atualizar o usuário
    const adminClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
    )

    // Primeiro, verificar se o usuário já existe
    const { data: existingUser } = await adminClient
        .from('usuarios')
        .select('id, role')
        .eq('id', user.id)
        .maybeSingle()

    if (existingUser) {
        // Usuário existe: atualizar APENAS nome e email.
        // A role NÃO é sobrescrita — preserva promoções manuais (ex: Admin, CGPG)
        const { error: updateError } = await adminClient
            .from('usuarios')
            .update({ nome, email })
            .eq('id', user.id)

        if (updateError) {
            console.error('[AUTH CALLBACK] Erro ao atualizar usuário:', updateError.message)
        } else {
            console.log(`[AUTH CALLBACK] Usuário atualizado (role mantida: ${existingUser.role}): ${email}`)
        }
    } else {
        // Usuário NÃO existe: inserir novo com role baseada no domínio de e-mail
        const { error: insertError } = await adminClient
            .from('usuarios')
            .insert({ id: user.id, email, nome, role })

        if (insertError) {
            console.error('[AUTH CALLBACK] Erro ao inserir usuário:', insertError.message, insertError.details)
        } else {
            console.log(`[AUTH CALLBACK] Usuário criado: ${email} → ${role}`)
        }
    }

    return NextResponse.redirect(`${origin}/dashboard`)
}
