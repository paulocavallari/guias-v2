// Script para atribuir role Admin ao usuario paulocavallari@prof.educacao.sp.gov.br
// Execute com: node scripts/set-admin.mjs

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Lê o .env.local manualmente
const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
const env = {}
for (const line of envFile.split('\n')) {
    const [key, ...rest] = line.split('=')
    if (key && rest.length) env[key.trim()] = rest.join('=').trim()
}

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl || !serviceKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes no .env.local')
    process.exit(1)
}

const adminClient = createClient(supabaseUrl, serviceKey)

const TARGET_EMAIL = 'paulocavallari@prof.educacao.sp.gov.br'

async function main() {
    // 1. Buscar em auth.users
    const { data: authData, error: authError } = await adminClient.auth.admin.listUsers()
    if (authError) {
        console.error('❌ Erro ao listar auth.users:', authError.message)
        process.exit(1)
    }

    const authUser = authData.users.find(u => u.email === TARGET_EMAIL)
    if (!authUser) {
        console.error(`❌ Usuário ${TARGET_EMAIL} NÃO encontrado em auth.users. Faça login primeiro.`)
        process.exit(1)
    }
    console.log(`✅ Encontrado em auth.users: ID=${authUser.id}`)

    // 2. Verificar se existe em public.usuarios
    const { data: publicUser } = await adminClient
        .from('usuarios')
        .select('id, email, role')
        .eq('id', authUser.id)
        .maybeSingle()

    if (publicUser) {
        console.log(`📋 Usuário atual em public.usuarios: role=${publicUser.role}`)
        // Atualizar para Admin
        const { error: updateError } = await adminClient
            .from('usuarios')
            .update({ role: 'Admin' })
            .eq('id', authUser.id)
        if (updateError) {
            console.error('❌ Erro ao atualizar role:', updateError.message)
        } else {
            console.log(`✅ Role atualizada para Admin com sucesso!`)
        }
    } else {
        console.log('⚠️  Usuário não existe em public.usuarios. Criando...')
        const nome = authUser.user_metadata?.full_name || TARGET_EMAIL.split('@')[0]
        const { error: insertError } = await adminClient
            .from('usuarios')
            .insert({ id: authUser.id, email: TARGET_EMAIL, nome, role: 'Admin' })
        if (insertError) {
            console.error('❌ Erro ao inserir usuário:', insertError.message, insertError.details)
        } else {
            console.log(`✅ Usuário criado como Admin!`)
        }
    }
}

main()
