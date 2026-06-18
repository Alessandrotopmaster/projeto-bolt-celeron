const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Muitas requisições, tente novamente mais tarde.' }
});
app.use('/api/', limiter);

app.use(express.static(path.join(__dirname, 'public')));

const users = [
    {
        id: 1,
        nome: 'João Silva',
        email: 'joao@email.com',
        senha: bcrypt.hashSync('123456', 10),
        telefone: '(11) 99999-9999',
        cpf: '123.456.789-00',
        tipo: 'usuario',
        saldo: 2450.00,
        criadoEm: new Date('2026-01-01')
    }
];

const transacoes = [
    { id: 1, usuarioId: 1, tipo: 'credito', descricao: 'Venda - Maquininha', valor: 89.90, data: '2026-01-15', status: 'confirmado' },
    { id: 2, usuarioId: 1, tipo: 'credito', descricao: 'Comissão Afiliado', valor: 150.00, data: '2026-01-14', status: 'pago' }
];

const servicos = [
    { id: 1, nome: 'Conta Digital', icone: 'fa-university', descricao: 'Conta completa sem taxas abusivas' },
    { id: 2, nome: 'Maquininha', icone: 'fa-credit-card', descricao: 'Taxas mais baixas do mercado' },
    { id: 3, nome: 'Entregas', icone: 'fa-motorcycle', descricao: 'Entrega rápida e segura' },
    { id: 4, nome: 'Marketplace', icone: 'fa-store', descricao: 'Integrado com as maiores plataformas' },
    { id: 5, nome: 'Afiliados', icone: 'fa-users', descricao: 'Ganhe comissões indicando' },
    { id: 6, nome: 'Contabilidade', icone: 'fa-calculator', descricao: 'Gestão completa da sua empresa' },
    { id: 7, nome: 'Consultoria', icone: 'fa-chalkboard-user', descricao: 'Treinamento e estratégias' },
    { id: 8, nome: 'Sites e Apps', icone: 'fa-code', descricao: 'Criação de sites e aplicativos' },
    { id: 9, nome: 'Segurança Digital', icone: 'fa-shield-alt', descricao: 'Proteção total dos seus dados' }
];

function generateToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, tipo: user.tipo },
        process.env.JWT_SECRET || 'topmaster_secret_2026',
        { expiresIn: '7d' }
    );
}

function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'topmaster_secret_2026');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/servicos', (req, res) => {
    res.json({ success: true, data: servicos });
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
        
        const user = users.find(u => u.email === email);
        if (!user) return res.status(401).json({ error: 'E-mail ou senha incorretos' });
        
        const senhaValida = await bcrypt.compare(senha, user.senha);
        if (!senhaValida) return res.status(401).json({ error: 'E-mail ou senha incorretos' });
        
        const token = generateToken(user);
        res.json({
            success: true,
            data: {
                token,
                usuario: {
                    id: user.id,
                    nome: user.nome,
                    email: user.email,
                    tipo: user.tipo,
                    saldo: user.saldo
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const { nome, email, senha, telefone, cpf } = req.body;
        if (!nome || !email || !senha) return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios' });
        if (senha.length < 6) return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
        if (users.find(u => u.email === email)) return res.status(409).json({ error: 'E-mail já cadastrado' });
        
        const hashedPassword = await bcrypt.hash(senha, 10);
        const newUser = {
            id: users.length + 1,
            nome,
            email,
            senha: hashedPassword,
            telefone: telefone || '',
            cpf: cpf || '',
            tipo: 'usuario',
            saldo: 0,
            criadoEm: new Date()
        };
        users.push(newUser);
        const token = generateToken(newUser);
        res.status(201).json({
            success: true,
            data: {
                token,
                usuario: {
                    id: newUser.id,
                    nome: newUser.nome,
                    email: newUser.email,
                    tipo: newUser.tipo,
                    saldo: newUser.saldo
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/dashboard', authMiddleware, (req, res) => {
    try {
        const user = users.find(u => u.id === req.user.id);
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
        
        const userTransactions = transacoes.filter(t => t.usuarioId === user.id);
        res.json({
            success: true,
            data: {
                usuario: {
                    id: user.id,
                    nome: user.nome,
                    email: user.email,
                    tipo: user.tipo,
                    saldo: user.saldo,
                    telefone: user.telefone
                },
                transacoes: userTransactions,
                estatisticas: {
                    totalGanhos: userTransactions.filter(t => t.tipo === 'credito').reduce((acc, t) => acc + t.valor, 0),
                    totalTransacoes: userTransactions.length
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/saldo', authMiddleware, (req, res) => {
    try {
        const user = users.find(u => u.id === req.user.id);
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json({ success: true, data: { saldo: user.saldo, disponivel: user.saldo, bloqueado: 0 } });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/transferir', authMiddleware, async (req, res) => {
    try {
        const { valor, destinatario, descricao } = req.body;
        if (!valor || !destinatario) return res.status(400).json({ error: 'Valor e destinatário são obrigatórios' });
        if (valor <= 0) return res.status(400).json({ error: 'Valor deve ser maior que zero' });
        
        const user = users.find(u => u.id === req.user.id);
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
        if (user.saldo < valor) return res.status(400).json({ error: 'Saldo insuficiente' });
        
        const destinatarioUser = users.find(u => u.email === destinatario || u.id == destinatario);
        if (!destinatarioUser) return res.status(404).json({ error: 'Destinatário não encontrado' });
        
        user.saldo -= valor;
        destinatarioUser.saldo += valor;
        
        const transacao = {
            id: transacoes.length + 1,
            usuarioId: user.id,
            tipo: 'debito',
            descricao: descricao || `Transferência para ${destinatarioUser.nome}`,
            valor: valor,
            data: new Date().toISOString().split('T')[0],
            status: 'confirmado'
        };
        transacoes.push(transacao);
        
        res.json({
            success: true,
            data: { transacao, novoSaldo: user.saldo, mensagem: `Transferência de R$ ${valor.toFixed(2)} realizada com sucesso` }
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/notificacoes', authMiddleware, (req, res) => {
    const notificacoes = [
        { id: 1, mensagem: 'Pagamento recebido: R$ 450,00', lida: false, data: '2026-01-15' },
        { id: 2, mensagem: 'Seus investimentos renderam 1.2% hoje', lida: false, data: '2026-01-14' },
        { id: 3, mensagem: 'Entrega #1234 foi concluída', lida: false, data: '2026-01-13' }
    ];
    res.json({ success: true, data: notificacoes, naoLidas: notificacoes.filter(n => !n.lida).length });
});

app.get('/health', (req, res) => {
    res.json({ status: 'online', timestamp: new Date().toISOString(), versao: '2.0.0' });
});

app.use((req, res) => {
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        res.status(404).json({ error: 'Rota não encontrada' });
    }
});

app.listen(PORT, () => {
    console.log('🚀 TOP MASTER - Servidor rodando!');
    console.log(`📡 http://localhost:${PORT}`);
    console.log('✅ API disponível em /api/*');
});
