create table fornecedor(
fornecedorID int primary key auto_increment not null,
fornecedorNome varchar(100) not null,
fornecedorCnpj varchar(30) not null unique,
fornecedorTelefone varchar(20) not null
);

create table produto(
produtoID int primary key auto_increment not null,
produtoNome varchar(100) not null,
produtoEstoque int not null,
produtoPreco decimal(10,2) not null,
produtoFornecedorIDFK int not null,
foreign key (produtoFornecedorIDFK) references fornecedor(fornecedorID)
);

create table categoria (
categoriaID int not null primary key auto_increment,
categoriaNome varchar(100) not null,
categoriaProdutoIDFK int not null,
foreign key (categoriaProdutoIDFK) references produto(produtoID)
);

create table loja(
lojaID int not null primary key auto_increment,
lojaNome varchar(100),
lojaEndereco varchar(100)

);

create table fornecedorLoja (
fornecedorLojaID int not null primary key auto_increment,
fornecedorLojaFornecedorIDFK int not null,
fornecedorLojaLojaIDFK int not null,
foreign key (fornecedorLojaFornecedorIDFK) references fornecedor(fornecedorID),
foreign key (fornecedorLojaLojaIDFK) references loja(lojaID)
);

create table cliente (
clienteID int not null primary key auto_increment,
clienteNome varchar(50) not null,
clienteCpf varchar(11) not null unique,
clienteProdutoIDFK int not null,
foreign key (clienteProdutoIDFK) references produto(produtoID)
);

create table cargo (
cargoID int not null primary key auto_increment,
cargoNome varchar(100) not null,
cargoSalario decimal(10,2) not null
);

create table funcionario (
funcionarioID int not null primary key auto_increment,
funcionarioNome varchar(100) not null,
funcionarioCPF varchar(11) not null,
funcionarioCargoIDFK int not null,
foreign key (funcionarioCargoIDFK) references cargo(cargoID)
);

create table formasPagamento(
formasPagamentoID int not null primary key auto_increment,
formasPagamentoDescricao varchar(100) not null
);

create table pedido (
pedidoID int not null primary key auto_increment,
pedidoData date not null,
pedidoValorTotal decimal(10,2) not null,
pedidoClienteIDFK int not null,
pedidoFuncionarioIDFK int not null,
pedidoFormasPagamentoIDFK int not null,
foreign key (pedidoClienteIDFK) references cliente(clienteID),
foreign key (pedidoFormasPagamentoIDFK) references formasPagamento(formasPagamentoID),
foreign key (pedidoFuncionarioIDFK) references funcionario(funcionarioID)
);



create table itemPedido(
itemPedidoID int not null primary key auto_increment,
itemPedidoQuantidade int not null,
itemPedidoPrecoUnitario decimal(10,2) not null,
itemPedidoSubTotal decimal(10,2) not null,
itemPedidoPedidoIDFK int not null,
itemPedidoProdutoIDFK int not null,
foreign key (itemPedidoPedidoIDFK) references pedido(pedidoID),
foreign key (itemPedidoProdutoIDFK) references produto(produtoID)
);