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
        produtoNome, produtoEstoque, produtoPreco, produtoFornecedorIDFK,
        categoriaNome, categoriaProdutoIDFK,
        lojaNome, lojaEndereco,
        fornecedorLojaFornecedorIDFK, fornecedorLojaLojaIDFK,
        clienteNome, clienteCpf, clienteProdutoIDFK,
        cargoNome, cargoSalario,
        funcionarioNome, funcionarioCPF, funcionarioCargoIDFK,
        formasPagamentoDescricao,
        pedidoData, pedidoValorTotal, pedidoClienteIDFK, pedidoFuncionarioIDFK, pedidoFormasPagamentoIDFK,
        itemPedidoQuantidade, itemPedidoPrecoUnitario, itemPedidoSubTotal, itemPedidoPedidoIDFK, itemPedidoProdutoIDFK
    } = req.body;

     try {
    const sqlFornecedor = `insert into fornecedor (fornecedorNome, fornecedorCnpj, fornecedorTelefone) values (?, ?, ?);`;
    db.query(sqlFornecedor, [fornecedorNome, fornecedorCnpj, fornecedorTelefone], (error) => {
    if (error) {
        console.log('Erro ao inserir fornecedor', error);
        return res.status(500).send('Erro interno no servidor.');
    }

    const sqlProduto = `insert into produto (produtoNome, produtoEstoque, produtoPreco, produtoFornecedorIDFK) values (?, ?, ?, ?);`;
    db.query(sqlProduto, [produtoNome, produtoEstoque, produtoPreco, produtoFornecedorIDFK], (error) => {
    if (error) {
        console.log('Erro ao inserir produto', error);
        return res.status(500).send('Erro interno no servidor.');
    }

    const sqlCategoria = `insert into categoria (categoriaNome, categoriaProdutoIDFK) values (?, ?);`;
    db.query(sqlCategoria, [categoriaNome, categoriaProdutoIDFK], (error) => {
    if (error) {
        console.log('Erro ao inserir categoria', error);
        return res.status(500).send('Erro interno no servidor.');
    }

    const sqlLoja = `insert into loja (lojaNome, lojaEndereco) values (?, ?);`;
    db.query(sqlLoja, [lojaNome, lojaEndereco], (error) => {
    if (error) {
        console.log('Erro ao inserir loja', error);
        return res.status(500).send('Erro interno no servidor.');
    }

    const sqlFornecedorLoja = `insert into fornecedorLoja (fornecedorLojaFornecedorIDFK, fornecedorLojaLojaIDFK) values (?, ?);`;
    db.query(sqlFornecedorLoja, [fornecedorLojaFornecedorIDFK, fornecedorLojaLojaIDFK], (error) => {
    if (error) {
        console.log('Erro ao inserir fornecedorLoja', error);
        return res.status(500).send('Erro interno no servidor.');
    }

    const sqlCliente = `insert into cliente (clienteNome, clienteCpf, clienteProdutoIDFK) values (?, ?, ?);`;
    db.query(sqlCliente, [clienteNome, clienteCpf, clienteProdutoIDFK], (error) => {
    if (error) {
        console.log('Erro ao inserir cliente', error);
        return res.status(500).send('Erro interno no servidor.');
    }

    const sqlCargo = `insert into cargo (cargoNome, cargoSalario) values (?, ?);`;
    db.query(sqlCargo, [cargoNome, cargoSalario], (error) => {
    if (error) {
        console.log('Erro ao inserir cargo', error);
        return res.status(500).send('Erro interno no servidor.');
    }

    const sqlFuncionario = `insert into funcionario (funcionarioNome, funcionarioCPF, funcionarioCargoIDFK) values (?, ?, ?);`;
    db.query(sqlFuncionario, [funcionarioNome, funcionarioCPF, funcionarioCargoIDFK], (error) => {
    if (error) {
        console.log('Erro ao inserir funcionario', error);
        return res.status(500).send('Erro interno no servidor.');
    }

    const sqlFormasPagamento = `insert into formasPagamento (formasPagamentoDescricao) values (?);`;
    db.query(sqlFormasPagamento, [formasPagamentoDescricao], (error) => {
    if (error) {
        console.log('Erro ao inserir formasPagamento', error);
        return res.status(500).send('Erro interno no servidor.');
    }

    const sqlPedido = `insert into pedido (pedidoData, pedidoValorTotal, pedidoClienteIDFK, pedidoFuncionarioIDFK, pedidoFormasPagamentoIDFK) values (?, ?, ?, ?, ?);`;
    db.query(sqlPedido, [pedidoData, pedidoValorTotal, pedidoClienteIDFK, pedidoFuncionarioIDFK, pedidoFormasPagamentoIDFK], (error) => {
    if (error) {
        console.log('Erro ao inserir pedido', error);
        return res.status(500).send('Erro interno no servidor.');
    }

    const sqlItemPedido = `insert into itemPedido (itemPedidoQuantidade, itemPedidoPrecoUnitario, itemPedidoSubTotal, itemPedidoPedidoIDFK, itemPedidoProdutoIDFK) values (?, ?, ?, ?, ?);`;
    db.query(sqlItemPedido, [itemPedidoQuantidade, itemPedidoPrecoUnitario, itemPedidoSubTotal, itemPedidoPedidoIDFK, itemPedidoProdutoIDFK], (error) => {
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