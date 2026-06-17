const express = require('express');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('.'));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/chat', async (req, res) => {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "Você é a Dream - respostas claras e amigáveis" },
                { role: "user", content: req.body.mensagem }
            ]
        });
        res.json({ resposta: completion.choices[0].message.content });
    } catch {
        res.status(500).json({ erro: "Falha na IA" });
    }
});

app.listen(3000, () => console.log('🚀 Rodando em http://localhost:3000'));
