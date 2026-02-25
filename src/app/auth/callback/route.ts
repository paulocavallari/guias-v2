import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        // Em Route Handlers do app router a leitura de cookies aqui para a Auth do SSR é diferente
                        // Pelo escopo basta retornar array vazio e usar o request.headers
                        return []
                    },
                    setAll(cookiesToSet) {
                        // Tratado automaticamente pelo supabaseResponse
                    },
                },
            }
        )

        const cookieStore = require('next/headers').cookies()
        const supabaseFromCookies = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet: any[]) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    },
                },
            }
        )

        await supabaseFromCookies.auth.exchangeCodeForSession(code)
    }

    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}
