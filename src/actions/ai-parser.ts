'use server'

import { z } from 'zod'

// Fallback Chain solicitada pelo usuario
const MODELS_FALLBACK_CHAIN = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemma-3-27b-it:free',
    'google/gemma-3-12b-it:free',
    'deepseek/deepseek-r1-distill-llama-70b:free',
    'mistralai/mistral-7b-instruct:free',
    'qwen/qwen-2.5-72b-instruct:free',
    'microsoft/phi-3-medium-128k-instruct:free',
]

const TIMEOUT_MS = 40000 // 40 segundos por modelo

/**
 * Função utilitária que adiciona timeout numa Promise (fetch)
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number) {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)

    try {
        const response = await fetch(url, { ...options, signal: controller.signal })
        clearTimeout(id)
        return response
    } catch (error) {
        clearTimeout(id)
        throw error
    }
}

/**
 * Core Parser do Guia de Aprendizagem via OpenRouter
 */
export async function parseDocxWithAI(extractedText: string) {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

    if (!OPENROUTER_API_KEY) {
        throw new Error('Chave do OpenRouter não configurada no servidor.')
    }

    const systemPrompt = `Você é um Extrator de Dados Sênior. Sua função é receber o texto bruto lido de um documento DOCX (Guia de Aprendizagem Escolar) e devolver estritamente um JSON estruturado e válido.
  
  A Estrutura do JSON deve ser exatamente:
  {
    "cabecalho": {
      "professor_nome": "Nome", "disciplina_nome": "Nome", "ano_serie": "ex: 1ºA", "bimestre": 1, "total_aulas_bimestre": 20, "ano_letivo": 2024
    },
    "semanas": [
      {
        "data_semana": "01/02 a 05/02",
        "conteudos": "Matéria X",
        "metodologias": "Aula expositiva",
        "estrategias_didaticas": "Uso de lousa",
        "avaliacao": "Participação",
        "apontamentos_comentarios": ""
      }
    ]
  }
  Extraia o texto a seguir devolvendo apenas o corpo JSON limpo, sem markdown block.`

    // Loop of Resilience (Cascata de Modelos)
    for (const model of MODELS_FALLBACK_CHAIN) {
        try {
            console.log(`[OpenRouter] Tentando Modelo: ${model}...`)

            const response = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
                    'X-Title': 'Gestao de Guias PEI',
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: extractedText }
                    ]
                })
            }, TIMEOUT_MS)

            if (!response.ok) {
                throw new Error(`Erro na API (${response.status}): ${response.statusText}`)
            }

            const data = await response.json()
            const content = data.choices?.[0]?.message?.content

            if (!content) {
                throw new Error('Sem resposta na key choices')
            }

            console.log(`[OpenRouter] Sucesso com ${model}!`)
            return content

        } catch (error: any) {
            console.warn(`[OpenRouter] Falha ou Timeout (${TIMEOUT_MS / 1000}s) no modelo ${model}. Saltando para o próximo... Detalhe: ${error.message}`)
            continue // Try next model in the chain
        }
    }

    throw new Error('Falha crítica: Todos os modelos do OpenRouter deram falha ou excederam o timeout de 40 segundos. Tente novamente em alguns minutos.')
}
