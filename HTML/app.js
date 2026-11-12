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
    if (!req.session.usuario) return res.render('inicio', { saldo: 0 });
    db.query('select usuarioSaldo from usuario where usuarioID = ?', [req.session.usuario.id], (erro, r) => {
        res.render('inicio', { saldo: r[0].usuarioSaldo });
    });
});

app.get('/produtos', (req, res) => {
    db.query('select produtoID, produtoNome, produtoFoto, produtoCategoria, produtoPreco, produtoEstoque from produto', (error, produtos) => {
        if (error) {
            console.log('Erro ao buscar produtos', error);
            return res.status(500).send('Erro interno no servidor.');
        }
        res.render('produtos', { produtos });
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

    const sqlBusca = `select usuarioID, usuarioEmail, usuarioSenhaHash, usuarioTipo from usuario where usuarioEmail = ?;`;
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
                    email: usuario.usuarioEmail,
                    tipo: usuario.usuarioTipo
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


app.get('/admin', (req, res) => {
    if (!req.session.usuario || req.session.usuario.tipo !== 'admin') return res.status(403).send('Acesso negado.');

    db.query('select fornecedorID, fornecedorNome from fornecedor', (error, fornecedores) => {
        if (error) return res.status(500).send('Erro interno no servidor.');

        db.query('select produtoID, produtoNome, produtoFoto, produtoCategoria, produtoPreco, produtoEstoque from produto', (error, produtos) => {
            if (error) return res.status(500).send('Erro interno no servidor.');

            db.query('select usuarioID, usuarioEmail, usuarioTipo from usuario', (error, usuarios) => {
                if (error) return res.status(500).send('Erro interno no servidor.');
                res.render('admin', { fornecedores, produtos, usuarios });
            });
        });
    });
});

app.post('/admin/usuario/:id/tipo', (req, res) => {
    if (!req.session.usuario || req.session.usuario.tipo !== 'admin') return res.status(403).send('Acesso negado.');

    const tipo = req.body.tipo === 'admin' ? 'admin' : 'cliente';
    db.query('update usuario set usuarioTipo = ? where usuarioID = ? and usuarioID <> ?',
        [tipo, req.params.id, req.session.usuario.id],
        () => res.redirect('/admin'));
});

app.post('/admin', (req, res) => {
    if (!req.session.usuario || req.session.usuario.tipo !== 'admin') return res.status(403).send('Acesso negado.');
    const { produtoNome, produtoFoto, produtoCategoria, produtoEstoque, produtoPreco, produtoFornecedorIDFK } = req.body;

    if (!produtoNome || !produtoCategoria || !produtoFornecedorIDFK) {
        return res.status(400).send('Preencha nome, categoria e fornecedor.');
    }

    const sqlProduto = `insert into produto
        (produtoNome, produtoFoto, produtoCategoria, produtoEstoque, produtoPreco, produtoFornecedorIDFK)
        values (?, ?, ?, ?, ?, ?);`;

    db.query(sqlProduto, [produtoNome, produtoFoto, produtoCategoria, produtoEstoque, produtoPreco, produtoFornecedorIDFK], (error) => {
        if (error) {
            console.log('Erro ao inserir produto', error);
            return res.status(500).send('Erro interno no servidor.');
        }
        res.redirect('/produtos');
    });
});

app.get('/fornecedores', (req, res) => {
    const sqlFornecedores = `select fornecedorID, fornecedorNome, fornecedorCnpj, fornecedorTelefone from fornecedor`;
    db.query(sqlFornecedores, (error, fornecedores) => {
        if (error) {
        console.log('Erro ao buscar fornecedores', error);
        return res.status(500).send('Erro interno no servidor.');
        }
        res.render('fornecedores', { fornecedores });
    });
});

app.get('/admin/fornecedor', (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/login');
    }
    res.render('admin-fornecedor');
});

app.post('/admin/fornecedor', (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/login');
    }
    const { fornecedorNome, fornecedorCnpj, fornecedorTelefone } = req.body;

    if (!fornecedorNome || !fornecedorCnpj || !fornecedorTelefone) {
        return res.status(400).send('Preencha nome, CNPJ e telefone.');
    }

    const sqlFornecedor = `insert into fornecedor
        (fornecedorNome, fornecedorCnpj, fornecedorTelefone)
        values (?, ?, ?);`;

    db.query(sqlFornecedor, [fornecedorNome, fornecedorCnpj, fornecedorTelefone], (error) => {
        if (error) {
            console.log('Erro ao inserir fornecedor', error);
            return res.status(500).send('Erro interno no servidor.');
        }
        res.redirect('/fornecedores');
    });
});
app.get('/admin/produto/:id/editar', (req, res) => {
    if (!req.session.usuario || req.session.usuario.tipo !== 'admin') return res.status(403).send('Acesso negado.');
    if (!req.session.usuario) {
        return res.redirect('/login');
    }

    db.query('select * from produto where produtoID = ?', [req.params.id], (error, produtos) => {
        if (error) {
            console.log('Erro ao buscar produto', error);
            return res.status(500).send('Erro interno no servidor.');
        }
        const produto = produtos[0];
        res.render('editar-produto', { produto });
    });
});

app.post('/admin/produto/:id/editar', (req, res) => {
    if (!req.session.usuario || req.session.usuario.tipo !== 'admin') return res.status(403).send('Acesso negado.');
    const { produtoNome, produtoFoto, produtoCategoria, produtoEstoque, produtoPreco } = req.body;
    const sqlUpdate = `update produto
        set produtoNome = ?, produtoFoto = ?, produtoCategoria = ?, produtoEstoque = ?, produtoPreco = ?
        where produtoID = ?;`;

    db.query(sqlUpdate, [produtoNome, produtoFoto, produtoCategoria, produtoEstoque, produtoPreco, req.params.id], (error) => {
        if (error) {
            console.log('Erro ao atualizar produto', error);
            return res.status(500).send('Erro interno no servidor.');
        }
        res.redirect('/admin');
    });
});

app.post('/admin/produto/:id/excluir', (req, res) => {
    if (!req.session.usuario || req.session.usuario.tipo !== 'admin') return res.status(403).send('Acesso negado.');
    db.query('delete from produto where produtoID = ?', [req.params.id], (error) => {
        if (error) {
            console.log('Erro ao excluir produto', error);
            return res.status(500).send('Erro interno no servidor.');
        }
        res.redirect('/admin');
    });
});

app.post('/saldo', (req, res) => {
    const valor = parseFloat(req.body.valor);
    db.query(
        'update usuario set usuarioSaldo = usuarioSaldo + ? where usuarioID = ? and usuarioSaldo + ? >= 0',
        [valor, req.session.usuario.id, valor],
        () => res.redirect('/')
    );
}); 

app.post('/comprar/:id', (req, res) => {
    const sql = `update usuario u, produto p
        set u.usuarioSaldo = u.usuarioSaldo - p.produtoPreco,
            p.produtoEstoque = p.produtoEstoque - 1
        where u.usuarioID = ? and p.produtoID = ?
          and p.produtoEstoque > 0 and u.usuarioSaldo >= p.produtoPreco`;
    db.query(sql, [req.session.usuario.id, req.params.id], () => res.redirect('/produtos'));
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Servidor rodando');
});