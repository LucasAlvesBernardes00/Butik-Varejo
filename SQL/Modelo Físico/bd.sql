-- =========================================
-- BUTIK - Banco de dados completo
-- Pode ser executado em um banco novo OU no banco que já existe no Aiven:
-- o "if not exists" pula as tabelas que já foram criadas, sem apagar dados.
-- =========================================

-- O db.js conecta no banco "defaultdb" do Aiven, por isso usamos ele aqui.
create database if not exists defaultdb;
use defaultdb;

create table if not exists fornecedor (
fornecedorID int primary key auto_increment not null,
fornecedorNome varchar(100) not null,
fornecedorCnpj varchar(30) not null unique,
fornecedorTelefone varchar(20) not null
);

create table if not exists produto (
produtoID int primary key auto_increment not null,
produtoNome varchar(100) not null,
produtoCategoria varchar(100) not null,
produtoEstoque int not null,
produtoPreco decimal(10,2) not null,
produtoFornecedorIDFK int not null,
foreign key (produtoFornecedorIDFK) references fornecedor(fornecedorID)
);

-- clienteSenha aceita NULL: o login agora fica na tabela usuario
create table if not exists cliente (
clienteID int not null primary key auto_increment,
clienteNome varchar(50) not null,
clienteCpf varchar(11) not null unique,
clienteEmail varchar(100) not null unique,
clienteSenha varchar(50) null
);

create table if not exists pedido (
pedidoID int not null primary key auto_increment,
pedidoData date not null,
pedidoValorTotal decimal(10,2) not null,
pedidoFormaPagamento enum('dinheiro','pix','debito','credito') not null,
pedidoClienteIDFK int not null,
foreign key (pedidoClienteIDFK) references cliente(clienteID)
);

create table if not exists itemPedido (
itemPedidoID int not null primary key auto_increment,
itemPedidoQuantidade int not null,
itemPedidoPrecoUnitario decimal(10,2) not null,
itemPedidoSubTotal decimal(10,2) not null,
itemPedidoPedidoIDFK int not null,
itemPedidoProdutoIDFK int not null,
foreign key (itemPedidoPedidoIDFK) references pedido(pedidoID),
foreign key (itemPedidoProdutoIDFK) references produto(produtoID)
);

-- Entrega 3: contas para login no sistema.
-- usuarioSenhaHash tem 255 caracteres porque o hash do bcrypt tem 60.
create table if not exists usuario (
usuarioID int not null primary key auto_increment,
usuarioEmail varchar(100) not null unique,
usuarioSenhaHash varchar(255) not null,
usuarioCriadoEm timestamp not null default current_timestamp
);

-- Para o banco que JÁ EXISTIA no Aiven: a tabela cliente foi criada
-- com clienteSenha "not null". Este comando libera o NULL sem apagar dados.
-- (Em um banco novo ele não muda nada.)
alter table cliente modify clienteSenha varchar(50) null;
