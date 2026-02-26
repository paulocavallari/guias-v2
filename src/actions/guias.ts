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
