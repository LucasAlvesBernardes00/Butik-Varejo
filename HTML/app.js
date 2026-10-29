require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const db = require('./db');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    name: 'butik.sid',                  
    secret: process.env.SESSION_SECRET, 
    resave: false,                     
    saveUninitialized: false,           
}));

app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario;
    next();
});

app.get('/', (req, res) => {
    res.render('inicio');
});

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

app.get('/cadastro', (req, res) => {
    res.render('cadastro', { erro: null, email: '' });
});

app.post('/cadastro', (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const senha = req.body.senha || '';


    if (!email || !senha) {
        return res.status(400).render('cadastro', { erro: 'Preencha o e-mail e a senha.', email });
    }
    if (!email.includes('@') || !email.includes('.') || email.length > 100) {
        return res.status(400).render('cadastro', { erro: 'Digite um e-mail válido.', email });
    }
    if (senha.length < 6 || senha.length > 72) {
        return res.status(400).render('cadastro', { erro: 'A senha deve ter entre 6 e 72 caracteres.', email });
    }

    bcrypt.hash(senha, 10, (error, hash) => {
        if (error) {
            console.log('Erro ao gerar hash', error);
            return res.status(500).send('Erro interno no servidor.');
        }

        const sqlUsuario = `insert into usuario (usuarioEmail, usuarioSenhaHash) values (?, ?);`;
        db.query(sqlUsuario, [email, hash], (error) => {
            if (error) {

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

    const sqlBusca = `select usuarioID, usuarioEmail, usuarioSenhaHash from usuario where usuarioEmail = ?;`;
    db.query(sqlBusca, [email], (error, usuarios) => {
        if (error) {
            console.log('Erro ao buscar usuário', error);
            return res.status(500).send('Erro interno no servidor.');
        }

        const mensagemErro = 'E-mail ou senha incorretos.';

        if (usuarios.length === 0) {
            return res.status(401).render('login', { erro: mensagemErro, mensagem: null, email });
        }

        const usuario = usuarios[0];

        bcrypt.compare(senha, usuario.usuarioSenhaHash, (error, senhaCorreta) => {
            if (error) {
                console.log('Erro ao comparar senha', error);
                return res.status(500).send('Erro interno no servidor.');
            }
            if (!senhaCorreta) {
                return res.status(401).render('login', { erro: mensagemErro, mensagem: null, email });
            }

            req.session.regenerate((error) => {
                if (error) {
                    console.log('Erro ao criar sessão', error);
                    return res.status(500).send('Erro interno no servidor.');
                }

                req.session.usuario = {
                    id: usuario.usuarioID,
                    email: usuario.usuarioEmail
                };

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


app.post('/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.log('Erro ao encerrar sessão', error);
            return res.status(500).send('Erro interno no servidor.');
        }
        res.clearCookie('butik.sid'); 
        res.redirect('/');
    });
});


app.get('/formulario', (req, res) => {
    res.render('formulario');
});

app.post('/formulario', (req, res) => {
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
