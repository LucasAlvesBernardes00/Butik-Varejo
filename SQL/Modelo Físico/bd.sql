create database if not exists butikVarejoDB;
use butikVarejoDB;

create table fornecedor (
fornecedorID int primary key auto_increment not null,
fornecedorNome varchar(100) not null,
fornecedorCnpj varchar(30) not null unique,
fornecedorTelefone varchar(20) not null
);

create table produto (
produtoID int primary key auto_increment not null,
produtoNome varchar(100) not null,
produtoCategoria varchar(100) not null,
produtoEstoque int not null,
produtoPreco decimal(10,2) not null,
produtoFornecedorIDFK int not null,
foreign key (produtoFornecedorIDFK) references fornecedor(fornecedorID)
);

create table cliente (
clienteID int not null primary key auto_increment,
clienteNome varchar(50) not null,
clienteCpf varchar(11) not null unique,
clienteEmail varchar(100) not null unique,
clienteSenha varchar(50) not null
);

create table pedido (
pedidoID int not null primary key auto_increment,
pedidoData date not null,
pedidoValorTotal decimal(10,2) not null,
pedidoFormaPagamento enum('dinheiro','pix','debito','credito') not null,
pedidoClienteIDFK int not null,
foreign key (pedidoClienteIDFK) references cliente(clienteID)
);

create table itemPedido (
itemPedidoID int not null primary key auto_increment,
itemPedidoQuantidade int not null,
itemPedidoPrecoUnitario decimal(10,2) not null,
itemPedidoSubTotal decimal(10,2) not null,
itemPedidoPedidoIDFK int not null,
itemPedidoProdutoIDFK int not null,
foreign key (itemPedidoPedidoIDFK) references pedido(pedidoID),
foreign key (itemPedidoProdutoIDFK) references produto(produtoID)
);