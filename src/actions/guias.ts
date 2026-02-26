'use server'

import { createClient } from '@/utils/supabase/server'
import { getServiceClient, getUserProfile } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import * as mammoth from 'mammoth'
import { parseDocxWithAI } from './ai-parser'

export async function processDocxUpload(prevState: any, formData: FormData) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Não autorizado. Faça login novamente.' }

        const dbUser = await getUserProfile(user.id)
        if (dbUser?.role !== 'Professor' && dbUser?.role !== 'Admin') {
            return { error: 'Apenas professores e administradores podem importar guias.' }
        }

        const file = formData.get('guia_file') as File
        if (!file || file.size === 0) return { error: 'Nenhum arquivo enviado. Selecione um arquivo .docx.' }

        console.log(`[UPLOAD] Processando arquivo: ${file.name} (${file.size} bytes) por ${dbUser.email}`)

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const { value: extractedText } = await mammoth.extractRawText({ buffer })

        if (!extractedText || extractedText.trim() === '') {
            return { error: 'O arquivo DOCX está vazio ou ilegível.' }
        }

        const aiResponse = await parseDocxWithAI(extractedText)
        const cleanJsonString = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim()

        let parsedData
        try {
            parsedData = JSON.parse(cleanJsonString)
        } catch (e) {
            console.error('Falha no JSON da IA:', cleanJsonString)
            return { error: 'A Inteligência Artificial não conseguiu entender a estrutura deste guia.' }
        }

        const cabecalho = parsedData.cabecalho
        const semanas = parsedData.semanas

        if (!cabecalho || !semanas || !Array.isArray(semanas)) {
            return { error: 'Estrutura JSON devolvida pela IA é inválida.' }
        }

        const adminClient = getServiceClient()

        // Busca turma e disciplina via service client
        const { data: turmaFound } = await adminClient
            .from('turmas')
            .select('id')
            .ilike('ano_serie', `%${cabecalho.ano_serie}%`)
            .limit(1)
            .single()

        const { data: disciplinaFound } = await adminClient
            .from('disciplinas')
            .select('id')
            .ilike('nome', `%${cabecalho.disciplina_nome}%`)
            .limit(1)
            .single()

        if (!turmaFound || !disciplinaFound) {
            return {
                error: `Turma "${cabecalho.ano_serie}" ou Disciplina "${cabecalho.disciplina_nome}" não encontrada. Cadastre-as em Gestão de Turmas/Disciplinas primeiro.`
            }
        }

        const { data: newGuia, error: errGuia } = await adminClient
            .from('guias_aprendizagem')
            .insert([{
                professor_id: user.id,
                professor_nome: dbUser.nome || cabecalho.professor_nome,
                disciplina_id: disciplinaFound.id,
                disciplina_nome: cabecalho.disciplina_nome,
                turma_id: turmaFound.id,
                ano_serie: cabecalho.ano_serie,
                bimestre: Number(cabecalho.bimestre) || 1,
                total_aulas_bimestre: Number(cabecalho.total_aulas_bimestre) || 20,
                ano_letivo: cabecalho.ano_letivo || new Date().getFullYear(),
                concluido: false
            }])
            .select('id')
            .single()

        if (errGuia || !newGuia) {
            console.error(errGuia)
            return { error: 'Erro ao salvar o cabeçalho do Guia.' }
        }

        const semanasInsert = semanas.map((s: any) => ({
            guia_id: newGuia.id,
            data_semana: s.data_semana,
            conteudos: s.conteudos,
            metodologias: s.metodologias,
            estrategias_didaticas: s.estrategias_didaticas,
            avaliacao: s.avaliacao,
            apontamentos_comentarios: s.apontamentos_comentarios || '',
            status_validacao: 'Pendente'
        }))

        const { error: errSemanas } = await adminClient
            .from('semanas_guia')
            .insert(semanasInsert)

        if (errSemanas) {
            console.error(errSemanas)
            return { error: 'Erro ao salvar as semanas do Guia.' }
        }

        revalidatePath('/dashboard/guias')
        return { success: true, guiaId: newGuia.id }

    } catch (error: any) {
        console.error('MAMMOTH/AI ERROR:', error)
        return { error: error.message || 'Tentativa de Importação falhou no servidor.' }
    }
}

export async function createGuiaManual(prevState: any, formData: FormData) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Não autorizado. Faça login novamente.' }

        const dbUser = await getUserProfile(user.id)
        if (dbUser?.role !== 'Professor' && dbUser?.role !== 'Admin') {
            return { error: 'Apenas professores e administradores podem criar guias.' }
        }

        const turma_id = formData.get('turma_id') as string
        const disciplina_id = formData.get('disciplina_id') as string
        const bimestre = parseInt(formData.get('bimestre') as string) || 1
        const total_aulas = parseInt(formData.get('total_aulas') as string) || 20
        const ano_letivo = parseInt(formData.get('ano_letivo') as string) || new Date().getFullYear()

        const weekIdsStr = formData.get('week_ids') as string
        const weekIds = weekIdsStr ? weekIdsStr.split(',') : []

        if (!turma_id || !disciplina_id) {
            return { error: 'Turma e Disciplina são obrigatórios.' }
        }

        if (weekIds.length === 0) {
            return { error: 'Você deve adicionar pelo menos uma semana.' }
        }

        // Validate all weeks before doing any database insert
        const semanasParaInserir = []
        for (const weekId of weekIds) {
            const data_semana = formData.get(`semana_${weekId}_data`) as string
            const conteudos = formData.get(`semana_${weekId}_conteudos`) as string
            const estrategias_didaticas = formData.get(`semana_${weekId}_estrategias`) as string
            const metodologias = formData.get(`semana_${weekId}_metodologias`) as string
            const avaliacao = formData.get(`semana_${weekId}_avaliacao`) as string

            if (!data_semana || !conteudos || !estrategias_didaticas || !metodologias || !avaliacao) {
                return { error: 'Todos os campos de todas as semanas devem ser preenchidos.' }
            }

            semanasParaInserir.push({
                data_semana,
                conteudos,
                estrategias_didaticas,
                metodologias,
                avaliacao,
                status_validacao: 'Pendente'
            })
        }

        const adminClient = getServiceClient()

        // Verify that turma and disciplina exist to fetch their names
        const { data: turmaData, error: turmaError } = await adminClient
            .from('turmas')
            .select('nome, ano_serie')
            .eq('id', turma_id)
            .single()

        if (turmaError || !turmaData) return { error: 'Turma selecionada não encontrada.' }

        const { data: disciplinaData, error: disciplinaError } = await adminClient
            .from('disciplinas')
            .select('nome')
            .eq('id', disciplina_id)
            .single()

        if (disciplinaError || !disciplinaData) return { error: 'Disciplina selecionada não encontrada.' }

        // Insert new Guia
        const { data: newGuia, error: insertError } = await adminClient
            .from('guias_aprendizagem')
            .insert([{
                professor_id: user.id,
                professor_nome: dbUser.nome || user.email?.split('@')[0],
                disciplina_id: disciplina_id,
                disciplina_nome: disciplinaData.nome,
                turma_id: turma_id,
                ano_serie: turmaData.ano_serie,
                bimestre: bimestre,
                total_aulas_bimestre: total_aulas,
                ano_letivo: ano_letivo,
                concluido: false
            }])
            .select('id')
            .single()

        if (insertError || !newGuia) {
            console.error('Erro ao inserir guia manual:', insertError)
            return { error: 'Ocorreu um erro ao criar o Guia. Tente novamente.' }
        }

        // Insert Weeks
        const semanasComGuiaId = semanasParaInserir.map(semana => ({
            ...semana,
            guia_id: newGuia.id
        }))

        const { error: errorSemanas } = await adminClient
            .from('semanas_guia')
            .insert(semanasComGuiaId)

        if (errorSemanas) {
            console.error('Erro ao inserir semanas manuais:', errorSemanas)
            // Ideally we would rollback the guide here, but let's just return error
            return { error: 'O Guia foi criado, mas houve um erro ao preencher as semanas. Tente inseri-las na tela do guia.' }
        }

        revalidatePath('/dashboard/guias')
        return { success: true, guiaId: newGuia.id }

    } catch (error: any) {
        console.error('Erro ao Criar Manual:', error)
        return { error: 'Erro inesperado no servidor.' }
    }
}
