require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const db = require('./db');

const app = express();

// O segredo da sessão vem do arquivo .env (nunca escrito no código)
if (!process.env.SESSION_SECRET) {
    console.log('Erro: defina a variável SESSION_SECRET no arquivo .env');
    process.exit(1);
}

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Configuração da sessão (precisa vir ANTES das rotas)
app.use(session({
    name: 'butik.sid',                  // nome do cookie da sessão
    secret: process.env.SESSION_SECRET, // segredo usado para assinar o cookie
    resave: false,                      // não salva a sessão se nada mudou
    saveUninitialized: false,           // não cria sessão para quem não fez login
    cookie: {
        httpOnly: true,                 // o JavaScript da página não consegue ler o cookie
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 2      // 2 horas
    }
}));

// Deixa o usuário logado disponível em todas as views (para o menu).
// Isso NÃO protege nenhuma página, só serve para mostrar os links certos.
app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario;
    next();
});

// Página inicial com as opções "Entrar" e "Criar conta"
app.get('/', (req, res) => {
    res.render('inicio');
});

// Catálogo de produtos (antes ficava em "/")
app.get('/produtos', (req, res) => {
    const sqlProdutos = `select p.produtoID, p.produtoNome, p.produtoCategoria, p.produtoPreco, p.produtoEstoque, f.fornecedorNome from produto p join fornecedor f on f.fornecedorID = p.produtoFornecedorIDFK;`;
    db.query(sqlProdutos, (error, produtos) => {
        if (error) {
            console.log('Erro ao buscar produtos', error);
            return res.status(500).send('Erro interno no servidor.');
        }

        res.render('home', { produtos });

    });
});

app.get('/sobre', (req, res) => {
    res.render('sobre');
});

// ---------- Cadastro de conta ----------

app.get('/cadastro', (req, res) => {
    res.render('cadastro', { erro: null, email: '' });
});

app.post('/cadastro', (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const senha = req.body.senha || '';

    // Validação no servidor (não dá para confiar só no "required" do HTML)
    if (!email || !senha) {
        return res.status(400).render('cadastro', { erro: 'Preencha o e-mail e a senha.', email });
    }
    if (!email.includes('@') || !email.includes('.') || email.length > 100) {
        return res.status(400).render('cadastro', { erro: 'Digite um e-mail válido.', email });
    }
    if (senha.length < 6 || senha.length > 72) {
        return res.status(400).render('cadastro', { erro: 'A senha deve ter entre 6 e 72 caracteres.', email });
    }

    // Gera o hash da senha. O número 10 é o "custo" (quanto maior, mais lento e mais seguro).
    bcrypt.hash(senha, 10, (error, hash) => {
        if (error) {
            console.log('Erro ao gerar hash', error);
            return res.status(500).send('Erro interno no servidor.');
        }

        // Salva SOMENTE o hash, nunca a senha digitada
        const sqlUsuario = `insert into usuario (usuarioEmail, usuarioSenhaHash) values (?, ?);`;
        db.query(sqlUsuario, [email, hash], (error) => {
            if (error) {
                // A coluna usuarioEmail é UNIQUE: o MySQL avisa quando o e-mail já existe
                if (error.code === 'ER_DUP_ENTRY') {
                    return res.status(409).render('cadastro', { erro: 'Este e-mail já está cadastrado.', email });
                }
                console.log('Erro ao cadastrar usuário', error);
                return res.status(500).send('Erro interno no servidor.');
            }

            res.redirect('/login?cadastro=ok');
        });
    });
});

// ---------- Login ----------

app.get('/login', (req, res) => {
    let mensagem = null;
    if (req.query.cadastro === 'ok') {
        mensagem = 'Conta criada! Agora faça o login.';
    }
    res.render('login', { erro: null, mensagem, email: '' });
});

app.post('/login', (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const senha = req.body.senha || '';

    if (!email || !senha) {
        return res.status(400).render('login', { erro: 'Preencha o e-mail e a senha.', mensagem: null, email });
    }

    // Consulta parametrizada (o "?" evita SQL Injection)
    const sqlBusca = `select usuarioID, usuarioEmail, usuarioSenhaHash from usuario where usuarioEmail = ?;`;
    db.query(sqlBusca, [email], (error, usuarios) => {
        if (error) {
            console.log('Erro ao buscar usuário', error);
            return res.status(500).send('Erro interno no servidor.');
        }

        // A mesma mensagem para "e-mail não existe" e "senha errada",
        // assim ninguém descobre quais e-mails estão cadastrados.
        const mensagemErro = 'E-mail ou senha incorretos.';

        if (usuarios.length === 0) {
            return res.status(401).render('login', { erro: mensagemErro, mensagem: null, email });
        }

        const usuario = usuarios[0];

        // Compara a senha digitada com o hash salvo no banco
        bcrypt.compare(senha, usuario.usuarioSenhaHash, (error, senhaCorreta) => {
            if (error) {
                console.log('Erro ao comparar senha', error);
                return res.status(500).send('Erro interno no servidor.');
            }
            if (!senhaCorreta) {
                return res.status(401).render('login', { erro: mensagemErro, mensagem: null, email });
            }

            // Cria uma sessão nova (troca o ID da sessão antiga por segurança)
            req.session.regenerate((error) => {
                if (error) {
                    console.log('Erro ao criar sessão', error);
                    return res.status(500).send('Erro interno no servidor.');
                }

                // Guarda só o necessário. Nada de senha ou hash na sessão!
                req.session.usuario = {
                    id: usuario.usuarioID,
                    email: usuario.usuarioEmail
                };

                // Garante que a sessão foi salva antes de redirecionar
                req.session.save((error) => {
                    if (error) {
                        console.log('Erro ao salvar sessão', error);
                        return res.status(500).send('Erro interno no servidor.');
                    }
                    res.redirect('/produtos');
                });
            });
        });
    });
});

// ---------- Logout ----------

app.post('/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.log('Erro ao encerrar sessão', error);
            return res.status(500).send('Erro interno no servidor.');
        }
        res.clearCookie('butik.sid'); // mesmo nome definido em "name" na configuração
        res.redirect('/');
    });
});

// ---------- Formulário de dados comerciais ----------

app.get('/formulario', (req, res) => {
    res.render('formulario');
});

app.post('/formulario', (req, res) => {
    // A senha do cliente não é mais coletada aqui: login e senha ficam na tabela usuario
    const {
        fornecedorNome, fornecedorCnpj, fornecedorTelefone,
        produtoNome, produtoCategoria, produtoEstoque, produtoPreco,
        clienteNome, clienteCpf, clienteEmail,
        pedidoData, pedidoValorTotal, pedidoFormaPagamento,
        itemPedidoQuantidade, itemPedidoPrecoUnitario, itemPedidoSubTotal
    } = req.body;

    const sqlFornecedor = `insert into fornecedor (fornecedorNome, fornecedorCnpj, fornecedorTelefone) values (?, ?, ?);`;
    db.query(sqlFornecedor, [fornecedorNome, fornecedorCnpj, fornecedorTelefone], (error, resFornecedor) => {
        if (error) {
            console.log('Erro ao inserir fornecedor', error);
            return res.status(500).send('Erro interno no servidor.');
        }

        const fornecedorID = resFornecedor.insertId;
        const sqlProduto = `insert into produto (produtoNome, produtoCategoria, produtoEstoque, produtoPreco, produtoFornecedorIDFK) values (?, ?, ?, ?, ?);`;
        db.query(sqlProduto, [produtoNome, produtoCategoria, produtoEstoque, produtoPreco, fornecedorID], (error, resProduto) => {
            if (error) {
                console.log('Erro ao inserir produto', error);
                return res.status(500).send('Erro interno no servidor.');
            }

            const produtoID = resProduto.insertId;
            const sqlCliente = `insert into cliente (clienteNome, clienteCpf, clienteEmail) values (?, ?, ?);`;
            db.query(sqlCliente, [clienteNome, clienteCpf, clienteEmail], (error, resCliente) => {
                if (error) {
                    console.log('Erro ao inserir cliente', error);
                    return res.status(500).send('Erro interno no servidor.');
                }

                const clienteID = resCliente.insertId;
                const sqlPedido = `insert into pedido (pedidoData, pedidoValorTotal, pedidoFormaPagamento, pedidoClienteIDFK) values (?, ?, ?, ?);`;
                db.query(sqlPedido, [pedidoData, pedidoValorTotal, pedidoFormaPagamento, clienteID], (error, resPedido) => {
                    if (error) {
                        console.log('Erro ao inserir pedido', error);
                        return res.status(500).send('Erro interno no servidor.');
                    }

                    const pedidoID = resPedido.insertId;
                    const sqlItemPedido = `insert into itemPedido (itemPedidoQuantidade, itemPedidoPrecoUnitario, itemPedidoSubTotal, itemPedidoPedidoIDFK, itemPedidoProdutoIDFK) values (?, ?, ?, ?, ?);`;
                    db.query(sqlItemPedido, [itemPedidoQuantidade, itemPedidoPrecoUnitario, itemPedidoSubTotal, pedidoID, produtoID], (error) => {
                        if (error) {
                            console.log('Erro ao inserir itemPedido', error);
                            return res.status(500).send('Erro interno no servidor.');
                        } console.log('Dados inseridos com sucesso');
                        res.redirect('/formulario');
                    });
                });
            });
        });
    });
});

app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000/');
})
