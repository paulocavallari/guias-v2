'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import * as mammoth from 'mammoth'
import { parseDocxWithAI } from './ai-parser'

export async function processDocxUpload(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autorizado.' }

    const file = formData.get('guia_file') as File
    if (!file) return { error: 'Nenhum arquivo enviado.' }

    try {
        // 1. Lê os bytes do arquivo enviado e converte usando Mammoth
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const { value: extractedText } = await mammoth.extractRawText({ buffer })

        if (!extractedText || extractedText.trim() === '') {
            return { error: 'O arquivo DOCX está vazio ou ilegível.' }
        }

        // 2. Envia para a IA do OpenRouter para parsear o texto (usando a cascata)
        const aiResponse = await parseDocxWithAI(extractedText)

        // Opcionalmente remover Markdown blocks (se a IA vacilar mas enviar JSON certo)
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

        // 3. Checa/Recupera IDs de Banco - Isso simula relacionamentos flexíveis
        // No mundo real: Professor selecionaria turma e disciplina no form, aqui usamos IA
        // Como a IA adivinha pela string, vamos buscar a turma correta no banco
        const { data: turmaFound } = await supabase
            .from('turmas')
            .select('id')
            .ilike('ano_serie', `%${cabecalho.ano_serie}%`)
            .limit(1)
            .single()

        const { data: disciplinaFound } = await supabase
            .from('disciplinas')
            .select('id')
            .ilike('nome', `%${cabecalho.disciplina_nome}%`)
            .limit(1)
            .single()

        if (!turmaFound || !disciplinaFound) {
            return { error: `Entidades não encontradas no sistema. Certifique-se que a Turma e Disciplina existam.` }
        }

        // 4. Salva o Cabeçalho
        const { data: newGuia, error: errGuia } = await supabase
            .from('guias_aprendizagem')
            .insert([{
                professor_id: user.id,
                professor_nome: cabecalho.professor_nome,
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

        // 5. Salva as Semanas
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

        const { error: errSemanas } = await supabase
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
