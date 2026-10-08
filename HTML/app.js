const express = require('express');
const db = require('./db');

const app = express();


app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/formulario', (req, res) => {
    res.render('formulario');
});

app.post('/formulario', (req, res) => {
    const {
        fornecedorNome, fornecedorCnpj, fornecedorTelefone,
        categoriaNome,
        produtoNome, produtoEstoque, produtoPreco,
        lojaNome, lojaEndereco,
        clienteNome, clienteCpf,
        cargoNome, cargoSalario,
        funcionarioNome, funcionarioCPF,
        formasPagamentoDescricao,
        pedidoData, pedidoValorTotal,
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
    const sqlCategoria = `insert into categoria (categoriaNome) values (?);`;
    db.query(sqlCategoria, [categoriaNome], (error, resCategoria) => {
    if (error) {
        console.log('Erro ao inserir categoria', error);
        return res.status(500).send('Erro interno no servidor.');
    }

    const categoriaID = resCategoria.insertId;
    const sqlProduto = `insert into produto (produtoNome, produtoEstoque, produtoPreco, produtoFornecedorIDFK, produtoCategoriaIDFK) values (?, ?, ?, ?, ?);`;
    db.query(sqlProduto, [produtoNome, produtoEstoque, produtoPreco, fornecedorID, categoriaID], (error, resProduto) => {
    if (error) {
        console.log('Erro ao inserir produto', error);
        return res.status(500).send('Erro interno no servidor.');
    }

    const produtoID = resProduto.insertId;
    const sqlLoja = `insert into loja (lojaNome, lojaEndereco) values (?, ?);`;
    db.query(sqlLoja, [lojaNome, lojaEndereco], (error, resLoja) => {
    if (error) {
        console.log('Erro ao inserir loja', error);
        return res.status(500).send('Erro interno no servidor.');
    }

    const lojaID = resLoja.insertId;
    const sqlFornecedorLoja = `insert into fornecedorLoja (fornecedorLojaFornecedorIDFK, fornecedorLojaLojaIDFK) values (?, ?);`;
    db.query(sqlFornecedorLoja, [fornecedorID, lojaID], (error) => {
    if (error) {
        console.log('Erro ao inserir fornecedorLoja', error);
        return res.status(500).send('Erro interno no servidor.');
    }

    const sqlCliente = `insert into cliente (clienteNome, clienteCpf) values (?, ?);`;
    db.query(sqlCliente, [clienteNome, clienteCpf], (error, resCliente) => {
    if (error) {
        console.log('Erro ao inserir cliente', error);
        return res.status(500).send('Erro interno no servidor.');
    }

    const clienteID = resCliente.insertId;
    const sqlCargo = `insert into cargo (cargoNome, cargoSalario) values (?, ?);`;
    db.query(sqlCargo, [cargoNome, cargoSalario], (error, resCargo) => {
    if (error) {
        console.log('Erro ao inserir cargo', error);
        return res.status(500).send('Erro interno no servidor.');
    }

    const cargoID = resCargo.insertId;
    const sqlFuncionario = `insert into funcionario (funcionarioNome, funcionarioCPF, funcionarioCargoIDFK, funcionarioLojaIDFK) values (?, ?, ?, ?);`;
    db.query(sqlFuncionario, [funcionarioNome, funcionarioCPF, cargoID, lojaID], (error, resFuncionario) => {
    if (error) {
        console.log('Erro ao inserir funcionario', error);
        return res.status(500).send('Erro interno no servidor.');
    }

    const funcionarioID = resFuncionario.insertId;
    const sqlFormasPagamento = `insert into formasPagamento (formasPagamentoDescricao) values (?);`;
    db.query(sqlFormasPagamento, [formasPagamentoDescricao], (error, resFormasPagamento) => {
    if (error) {
        console.log('Erro ao inserir formasPagamento', error);
        return res.status(500).send('Erro interno no servidor.');
    }

    const formasPagamentoID = resFormasPagamento.insertId;
    const sqlPedido = `insert into pedido (pedidoData, pedidoValorTotal, pedidoClienteIDFK, pedidoFuncionarioIDFK, pedidoFormasPagamentoIDFK, pedidoProdutoIDFK) values (?, ?, ?, ?, ?, ?);`;
    db.query(sqlPedido, [pedidoData, pedidoValorTotal, clienteID, funcionarioID, formasPagamentoID, produtoID], (error, resPedido) => {
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
    console.log('Servidor rodando na porta 3000');
})