export async function sendWhatsAppMessage(phone: string, text: string) {
    const url = process.env.EVOLUTION_API_URL
    const apiKey = process.env.EVOLUTION_API_KEY
    const instance = process.env.EVOLUTION_INSTANCE_NAME

    if (!url || !apiKey || !instance) {
        console.warn('⚠️ Credenciais da Evolution API ausentes no .env.local')
        return false
    }

    // A Evolution API geralmente recebe o telefone no formato DDD+Numero (ex: 5511999999999)
    const to = phone.replace(/\D/g, '')

    try {
        const response = await fetch(`${url}/message/sendText/${instance}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey,
            },
            body: JSON.stringify({
                number: to,
                text: text,
            }),
        })

        if (!response.ok) {
            console.error('Falha no envio WhatsApp:', await response.text())
            return false
        }

        return true
    } catch (err) {
        console.error('Erro ao conectar com Evolution API:', err)
        return false
    }
}
