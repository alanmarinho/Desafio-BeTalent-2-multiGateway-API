# Desafio BeTalent 2 - Multi gateway API!

  

O Teste consiste em estruturar uma API RESTful conectada a um banco de dados e a duas APIs de terceiros. Trata-se de um sistema gerenciador de pagamentos multi-gateway. Ao realizar uma compra, deve-se tentar realizar a cobrança junto aos gateways, seguindo a ordem de prioridade definida. Caso o primeiro gateway dê erro, deve-se fazer a tentativa no segundo gateway. Se algum gateway retornar sucesso, não deve ser informado erro no retorno da API. Deve ser levada em consideração a facilidade de adicionar novos gateways de forma simples e modular.

  

# Candidato

- Nome: Francisco Alan do Nascimento Marinho

- Email: alanmarinho020@gmail.com

- Repositório: https://github.com/alanmarinho/desafio_BeTalent

  

# Stack escolhida

  

- Framework: **Adonis (Node.js)**

Motivação: Maior afinidade do candidato com a linguagem de programação **JavaScrip/TypeScript**

- Administração do banco de dados: **Lucid**

Motivação: Integração nativa com o framework **Adonis** e maior facilidade na administração do banco de dados.

- Banco de dados: **MySQL**

Motivação: requisito fixo.

  

## Requisitos

  

### Projeto

- Node **v20.14.0+** devidamente instalado.

- Npm **v10.9.0+** devidamente instalado.

- Git **v2.45.2+** devidamente instalado.

  

### Ferramenta de consulta a APIs - sugestões

- Insomnia - **Recomendado**

- Postman.

- Outra a gosto.

  

### Banco de dados

#### Docker

- Docker **v27.3.1+** devidamente instalado.

  

### Mock APIs

- Sobem junto com Docker Compose e ficam disponíveis em: http://localhost portas 3001 e 3002.

  

## Como executar

  

### Clonar repositório

1. Clone o repositório com o comando

  

`git clone `

  

### Configuração do projeto

1. Arquivo .env

- Criar um arquivo chamado *.env* na raiz do projeto usando o arquivo *.env.example* como exemplo (ele já vem com 1 exemplo completo).

- Opcionalmente, uma nova key pode ser gerada para a aplicação usando o comando `node ./tools/generate64bitkey.cjs` , basta copiar a key do console e substituir o campo **APP_KEY** no arquivo *.env*,

  

-  **OBS:** uma vez povoado o banco, a modificação de **APP_KEY** vai gerar erros de descriptografia de dados, cujo o tratamento desses erros e forma segura de migração de **APP_KEYs**  **NÃO** foram implementados. Essa key é usada em encriptações e decriptações de dados sensíveis. Então, caso queira modificar a key, faça isso antes de povoar o banco.

  

2. Projeto

- Instale as dependências usando o comando `npm install` na raiz do projeto

  

3. Banco de Dados e Mock APIs

1. Docker

- Crie o stack contêiner com o comando `docker-compose up -d` na raiz do projeto, aguarde a conclusão do processo, uma pasta chamada **db_data** deve ser gerada automaticamente, ele é a referência para o banco do contêiner , caso necessário remover um banco já gerado (não somente o contêiner ), a pasta **db_data** deve ser deletada.

- Opcionalmente a porta do contêiner pode ser modificado para evitar conflitos com outros aplicativos, basta modificar a porta no arquivo *docker-compose.yml*, por padrão e porta é 3390 (é necessário alterar o valor **DB_PORT** no arquivo .env caso a porta padrão seja modificada em *docker-compose.yml*).

> ports: <br>

>\- '127.0.0.1:**3390**:3306'

  

2. Mock APIs

- As Mock APIs são automaticamente instanciadas com o comando do passo anterior.

3. Primeiro ADM

- O primeiro administrador precisa ser configurado no povoamento automático inicial do banco, os dados do primeiro ADM podem ser configurados no arquivo *.env* sob prefixo **ADM_**, uma configuração já vem pronta no exemplo *.env.exemplo*.

  

3. Execute a migração do banco com o comando `node ace migration:run`.

- O seguinte corpo deve aparecer no console.

> migrated database/migrations/1_create_roles_table <br>

> migrated database/migrations/2_create_users_table <br>

> migrated database/migrations/2.1_create_sessions_table <br>

[...] <br>

> migrated database/migrations/8_create_auth_gateway_configs_table <br>

> migrated database/migrations/9_create_auth_gateway_key_values_table <br>

Migrated in N s

- Caso ocorra algum erro, verifique as dependências, analise o erro e refaça os passos anteriores.

  

4. Povoamento inicial do banco de dados

- Dados cruciais como roles e primeiro ADM precisam ser adicionados antes de anicias as operações da API, execute o comando `node ace db:seed`.

- O seguinte corpo deve aparecer no console.

> completed database/seeders/seeder

- Com o sucesso dos passos anteriores, o projeto está pronto para rodar.

  

### Executando o projeto

1. Para executar o projeto utilize o comando `npm run dev` a mensagem **INFO (): started HTTP server on localhost:3333** de aparecer

2. Para confirmar a execução, acesse http://localhost:3333/, o corpo deve ser retornado

  

```
{"hello":"world"}
```

  

**RECOMENDAÇÃO**

- Adicione inicialmente os dados de autenticação dos gateways usando os dois corpos JSON do arquivo *.gateway.txt* na raiz do arquivo. (Sim, as credenciais dos gateways estão em texto livre, não é a forma ideal de compartilhar os dados, estão desse jeito apenas para facilitar a execução da avaliação do teste técnico). Use o endpoint */gateways/* com método POST e token de autenticação no BEARER.

- Adicione ao menos um produto com o corpo abixo no endpoint */products/* com método POST e token de autenticação no BEARER.

  

```
{
"name": "Coconut",
"unit_price": 4.1
}
```

- Utilizando o projeto Insomnia disponibilizado o processo pe mais falitado.

  

# Docs

  

## Estrutura do banco de dados

### Tabelas e dados

1. roles
	- Função:  Armazenar os dados das roles.
	> id: integer--  PK <br>
	> name: string  (unique)<br>
	> created_at: DataTime <br>
	> updated_at: DataTime <br>
2. users
	- Função: Armazenar os dados dos usuários.
	> id: integer--  PK <br>
	> name: string  (unique)<br>
	> email: string  (unique)<br>
	> password: string  (hash) <br>
	> role_id: number FK <br>
	> created_at: DataTime <br>
	> updated_at: DataTime <br>
3. sessions
	- Função: armazenar os dados das Sessões do Usuário, principalmente a chave de assinatura de seus tokens JWT.
	> id: integer--  PK <br>
	> user_id: integer-- FK <br>
	> token_key: string <br>
	> created_at: DataTime <br>
	> updated_at: DataTime <br>
4. products
- Função: Armazenar dos dados dos Produtos.
	> id: integer--  PK <br>
	> user_id: integer-- FK<br>
	> name: string <br>
	> unit_price: float <br>
	> deleted_in: DataTime | null (soft delete) <br>
	> created_at: DataTime <br>
	> updated_at: DataTime <br>
5. clients
	- Função: Armazenar os dados do Cliente.
	> id: integer--  PK <br>
	> user_id: integer-- FK <br>
	> name: string <br>
	> email: string <br>
	> created_at: DataTime <br>
	> updated_at: DataTime <br>
6.  gateways
- Função: Armazenar os dados dos gateways.
	> id: integer--  PK <br>
	> user_id: integer-- FK <br>
	> name: string <br>
	> url: string <br>
	> port: string <br>
	> is_active: boolean <br>
	> priority: number <br>
	> created_at: DataTime <br>
	> updated_at: DataTime <br>
7.  transactions
- Função: Armazenar os dados das transactions (compras).
	> id: integer--  PK <br>
	> user_id: integer-- FK <br>
	> client_id: integer-- FK <br>
	> gateway_id: integer-- FK <br>
	> external_id: string <br>
	> status: string<br>
	> amount: number<br>
	> card_last_numbers: string<br>
	> created_at: DataTime <br>
	> updated_at: DataTime <br>
8.  transaction_products
- Função: Armazenar os dados das produtos das transações.
	> id: integer--  PK <br>
	> product_id: integer-- FK <br>
	> client_id: integer-- FK <br>
	> transaction_id: integer-- FK <br>
	> external_id: string <br>
	> quantity: number<br>
	> unit_price: number<br>
	> created_at: DataTime <br>
	> updated_at: DataTime <br>
9.  gateway_configs
- Função: Armazenar os dados das configurações do gateway.
	> id: integer--  PK <br>
	> user_id: integer-- FK <br>
	> gateway_id: integer-- FK <br>
	> tokens_used_in: string <br>
	> expected_login_tokens_map: string <br>
	> need_login: boolean<br>
	> created_at: DataTime <br>
	> updated_at: DataTime <br>
10. gateway_key_values 
- Função: Armazenar os dados das key-value do gateway (credenciais).
	> id: integer--  PK <br>
	> user_id: integer-- FK <br>
	> auth_gateway_config_id: integer-- FK <br>
	> gateway_id:  integer-- FK<br>
	> key: string <br>
	> value: string <br>
	> created_at: DataTime <br>
	> updated_at: DataTime <br>