const express = require('express');
const db = require('./db');

const app = express();


app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    const sqlProdutos = `select p.produtoID, p.produtoNome, p.produtoCategoria, p.produtoPreco, p.produtoEstoque, f.fornecedorNome from produto p join fornecedor f on f.fornecedorID = p.produtoFornecedorIDFK;`;
    db.query(sqlProdutos, (error, produtos) => {
    if (error) {
        console.log('Erro ao buscar produtos', error);
        return res.status(500).send('Erro interno no servidor.');
    }

    res.render('home', { produtos });

    });
});

app.get('/formulario', (req, res) => {
    res.render('formulario');
});

app.post('/formulario', (req, res) => {
    const {
        fornecedorNome, fornecedorCnpj, fornecedorTelefone,
        produtoNome, produtoCategoria, produtoEstoque, produtoPreco,
        clienteNome, clienteCpf,
        funcionarioNome, funcionarioCPF, funcionarioCargo, funcionarioSalario,
        pedidoData, pedidoValorTotal, pedidoFormaPagamento,
        itemPedidoQuantidade, itemPedidoPrecoUnitario, itemPedidoSubTotal
    } = req.body;

     try {
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
    const sqlCliente = `insert into cliente (clienteNome, clienteCpf) values (?, ?);`;
    db.query(sqlCliente, [clienteNome, clienteCpf], (error, resCliente) => {
    if (error) {
        console.log('Erro ao inserir cliente', error);
        return res.status(500).send('Erro interno no servidor.');
    }

    const clienteID = resCliente.insertId;
    const sqlFuncionario = `insert into funcionario (funcionarioNome, funcionarioCPF, funcionarioCargo, funcionarioSalario) values (?, ?, ?, ?);`;
    db.query(sqlFuncionario, [funcionarioNome, funcionarioCPF, funcionarioCargo, funcionarioSalario], (error, resFuncionario) => {
    if (error) {
        console.log('Erro ao inserir funcionario', error);
        return res.status(500).send('Erro interno no servidor.');
    }

    const funcionarioID = resFuncionario.insertId;
    const sqlPedido = `insert into pedido (pedidoData, pedidoValorTotal, pedidoFormaPagamento, pedidoClienteIDFK, pedidoFuncionarioIDFK) values (?, ?, ?, ?, ?);`;
    db.query(sqlPedido, [pedidoData, pedidoValorTotal, pedidoFormaPagamento, clienteID, funcionarioID], (error, resPedido) => {
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
    }

    console.log('Dados inseridos com sucesso');
    res.redirect('/formulario');

    });
    });
    });
    });
    });
    });
    } catch (error) {
        console.log('Ocorreu um erro', error);
    }
});

app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000/');
})