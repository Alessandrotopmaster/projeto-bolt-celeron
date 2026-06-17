document.addEventListener("DOMContentLoaded", () => {
    const entrada = document.getElementById("entrada");
    const botao = document.getElementById("enviar");
    const saida = document.getElementById("saida");

    botao.addEventListener("click", async () => {
        const pergunta = entrada.value.trim();
        if (!pergunta) return;

        saida.textContent = "Pensando…";
        
        try {
            const resposta = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mensagem: pergunta })
            });
            const dados = await resposta.json();
            const texto = dados.resposta || "Erro ao responder.";
            saida.textContent = texto;

            const fala = new SpeechSynthesisUtterance(texto);
            fala.lang = "pt-BR";
            fala.rate = 1.05;
            window.speechSynthesis.speak(fala);
        } catch {
            saida.textContent = "⚠️ Falha ao acessar a IA.";
        }
    });
});
