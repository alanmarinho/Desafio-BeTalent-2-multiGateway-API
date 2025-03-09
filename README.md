# Desafio BeTalent 2 - Multi gateway API!

  

O Teste consiste em estruturar uma API RESTful conectada a um banco de dados e a duas APIs de terceiros. Trata-se de um sistema gerenciador de pagamentos multi-gateway. Ao realizar uma compra, deve-se tentar realizar a cobrança junto aos gateways, seguindo a ordem de prioridade definida. Caso o primeiro gateway dê erro, deve-se fazer a tentativa no segundo gateway. Se algum gateway retornar sucesso, não deve ser informado erro no retorno da API. Deve ser levada em consideração a facilidade de adicionar novos gateways de forma simples e modular.

  

# Candidato

- Nome: Francisco Alan do Nascimento Marinho

- Email: alanmarinho020@gmail.com

- Repositório: https://github.com/alanmarinho/Desafio-BeTalent-2-multiGateway-API

  

# Stack escolhida

  

- Framework: **Adonis (Node.js)**

Motivação: Maior afinidade do candidato com a linguagem de programação **JavaScrip/TypeScript**

- Administração do banco de dados: **Lucid**

Motivação: Integração nativa com o framework **Adonis** e maior facilidade na administração do banco de dados.

- Banco de dados: **MySQL**

Motivação: requisito fixo.

- Níveis de Implementação: **Nível 2**

Motivação: é onde me encaixo e também quis me desafiar um pouco com a autenticação.

  

## Requisitos

  

### Projeto

- Node **v20.14.0+** devidamente instalado.

- Npm **v10.9.0+** devidamente instalado.

- Git **v2.45.2+** devidamente instalado.

  

### Ferramenta de consulta a APIs - sugestões

- Insomnia - **Recomendado** [Arquivo Insomnia do projeto](#Ambiente_de_teste)

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

  

`git clone https://github.com/alanmarinho/Desafio-BeTalent-2-multiGateway-API.git`

  

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

## Rotas

1. Auth - Prefixo: **/auth**
	-  **/login** - POST
		- Objetivo: fazer login e obter token de autenticação.
		- Corpo
		```
		{
			"email":"admin@email.com",
			"password":"1234567Ab@"
		}
		```
	
-  **/logout** - POST
		- Objetivo: fazer logout e remover a sessão de usuário.
		- Corpo: não
		
2. Products - Prefixo: **/products**
	- **/**	- GET
		- Objetivo: listar todos os produtos.
		- Corpo: não
		- Parametros URL:
			- include_deleted: incluir produtos deletados no retorno. - Boolean
	- **/**	- POST
		- Objetivo: adicionar novo produto.
		- Corpo: 
		```
		{
			"name": "Coconut",
			"unit_price": 4.1
		}
		```
		
	- **/:id**	- GET
		- Objetivo: detalhar um produto pelo id.
		- Corpo: não
		
	- **/:id**	- PUT
		- Objetivo: editar um produto.
		- Corpo: 
		```
		{
			"name": "Coconut2",
			"unit_price": 1.1
		}
		```

	- **/:id**	- DELETE
		- Objetivo: deletar um produto (SoftDelete - apenas marca o produto como indisponível e ele é ignorado pelo sistema exceto nas rotas **GET /?include_deleted=true** ou em **GET /:id**)
		- Corpo: não
		
	- **/:id/restore**	- PATCH
		- Objetivo: deletar um produto (SoftDelete - apenas marca o produto como indisponível e ele é ignorado pelo sistema exceto nas rotas **GET /?include_deleted=true** ou em **GET /:id**)
		- Corpo: não
		
3. Users - Prefixo: **/users**
	- **/**	- GET
		- Objetivo: listar todos os users.
		- Corpo: não
		
	- **/**	- POST
		- Objetivo: adicionar novo user.
		- Corpo: 
		```
		{
			"email":"user@email.com",
			"password":"1234567Ab@",
			"name":"User Name",
			"role": "USER"
		}
		```
		
	- **/:id**	- GET
		- Objetivo: detalhar um user pelo id.
		- Corpo: não
		
	- **/:id**	- PUT
		- Objetivo: editar um user.
		- Corpo: 
		```
		{
			"email":"user2@email.com",
			"password":"7654321Ab@",
			"name":"Name User",
			"role": "USER"
		}
		```

	- **/:id**	- DELETE
		- Objetivo: deletar um user 
		- Corpo: não
	
4. Purchases - Prefixo: **/purchases **
- **/**	- GET
		- Objetivo: listar todos as comprar, ser for role ADM lista tudo e for USER lista somente as próprias compras .
		- Corpo: não
		
	- **/**	- POST
		- Objetivo: adicionar nova compra.
		- Corpo: 
		```
		{
			"products":[
				{
				"product_id":1,
				"quantity":2
				}
			],
			"credit_card":{
				"number": "5512 5417 5850 2986",
				"cvv": "358"
			}
		}
		```
		
	- **/:id/reimbursement**- POST
		- Objetivo: fazer reembolso de uma compra.
		- Corpo: não
		
5. Gateways - Prefixo: **/gateways**
	- **/**	- GET
		- Objetivo: listar todos os gateways.
		- Corpo: não
		
	- **/:id**	- GET
		- Objetivo: detalhar um gateway pelo id.
		- Corpo: não
	- **/**	- POST
		- Objetivo: adicionar a configuração e credenciais de um gateway.
		- Corpo: 
		```
		{
			"name":"gateway1",
			"is_active":true,
			"url":"http://localhost",
			"priority":1,
			"port":"3001",
			"auth":{
				"need_login":true,
				"tokens_used_in":"BEARER",
				"expected_login_tokens_map":{"token": "token"}
			},
	
			"credentials":[
				{
					"key":"email",
					"value":"dev@betalent.tech",
					"use_in":"BODY",
					"type":"LOGIN"
				},
				{
					"key":"token",
					"value":"FEC9BB078BF338F464F96B48089EB498",
					"use_in":"BODY",
					"type":"LOGIN"
				}
			]
		}
		```
	- **/:id**	- PUT
		- Objetivo: editar configuração de um gateway.
		- Corpo: 
		```
			{
			"name":"gateway1",
			"url":"http://localhost",
			"port":"3001",
			"auth":{
				"need_login":true,
				"tokens_used_in":"BEARER",
				"expected_login_tokens_map":{"token": "token"}
			}
		}
		```
	- **/:id/priority**	- PACTH
		- Objetivo: editar prioridade de um gateway.
		- Corpo: 
		```
		{
			"priority":1
		}	
		```
- **/:id/status**	- PACTH
		- Objetivo: editar status de is_active do gateway (inverte o valor booleano que está lá).
		- Corpo: não
		
- **/:id/credentials**	- POST
		- Objetivo: Visualizar credencias de um gateway em texto livre (precisa confirmação de senha).
		- Corpo: 
			```
			{
				"password":"1234567Ab@"
			}	
		```
- **/:id/credentials/:credential_id**	- PACTH
		- Objetivo: Visualizar credencias de um gateway em texto livre (precisa confirmação de senha).
		- Corpo: 
			```
			{
				"key":  "email",
				"value": "dev2@betalent.tech" ,
				"use_in": "BODY" ,
				"type": "LOGIN",
			}	
		```
		
- **/:id**	- DELETE
		- Objetivo: deletar as configuração de uma gateway.
		- Corpo: não

7. Clients
	- **/**	- GET
		- Objetivo: listar todos os clientes.
		- Corpo: não
		
	- **/:id**	- GET
		- Objetivo: detalhar um cliente pelo id + suas compras.
		- Corpo: não

## Autenticação
1. Definição
	- Método: Token JWT
	- Localização: Bearer ->  `Authorization: "Bearer <tokenJwt>"`
	- Abrangência: Rotas
	```
	 todas, exceto /auth/login
	 ```
2. Metodologia 
	a. Foi utilizado a noção de seções para autenticação, depois de cadastrado um **User** pode realizar *login* com **email** + **password** corretas, após isso uma **chave 256bits** é gerada com o auxílio da biblioteca *crypto*, essa chave então é usada para assinar o **token JWT** do user, antes de enviar o **token JWT**para o user uma **Sessão** é criada na tabela **Sessions** responsável por guardar a **chave 256bits** que é criptografada com o algoritmo *aes-256-ctr* +*IV (initialization vector)*+ 
	*+*APP_KEY (256bit)* com o auxílio biblioteca *crypto*, após o sucesso no armazenamento, o **token JWT**é enviado para o usuário que deve  usá-lo nas rotas autenticadas.
	
3. Motivação da Metodologia 
	- Desacoplamento das assinaturas dos tokens de **User** da APP_KEY e delegando essa responsabilidade para a **Chave de Sessão**, tornando cada token utilizável somente na sua respectiva sessão existente.
	-  Invalidação de tokens facilitada: Caso uma sessão seja deletada (*/logout*), **TODOS** os tokens gerados naquela sessão se tornarão inválidos, já que a chave se assinatura deles foi deletada, tonando o uso de tokens de forma indevida mais dificultoso.

4. Execução
	- Para aplicar a autenticação nas rotas corretas, usou-se o conceito de *Middlewares* aplicado aos grupos de rotas *Adonis* que devem ser protegidas. Um *Middlewre de Autenticação* (*auth_middleware.ts*) foi criado para receber o token em `Authorization: "Bearer <tokenJwt>"` localizado no **Header** da requisição e processá-lo: recepção -> decodificação -> busca da sessão correspondente -> validação com a chave da sessão. Se válido executa `next()` liberando o fluxo para os validadores de conteúdo e ocasionalmente os *Controllers* correspondentes, se não Válido, impede a requisição de prosseguir.
	Ex: 
	```
	  router.group(() => {
		   // routes here
	  })
	  .prefix('/routeGroup')
	  .use(middleware.auth());
	                   ☝️
	            ou individualmente 
	router.post('/logout', [AuthController, 'logout']).use(middleware.auth()); 
											                   ☝️
	```
5. Roles
	- No middleware de autenticação é possível configurar que rotas e métodos de requisição cada role tem acesso, feito através da configuração `const  permissions` no arquivo *./app/middleware/auth_middleware.ts*
	

## Validação de campos
- A validação de campos de requisição foram feitas com a ferramenta VineJs nativa do AdonisJs, Abrangendo todos os campos e parâmetros de entrada, implementados em *./app/validators/***

## Dados sensíveis
- Qualquer dado sensível na aplicação, como: chaves de sessão, senhas e credenciais de gateways são armazenadas criptografadas com encriptação de cifra simétrica aes-256-ctr + vetor de inicialização. O fluxo de encriptação de decriptação são descritos em *./utils/auth/encryptAndDecrypt.ts* .
- Campos de **password** dos users são armazenados de forma segura com o método hash disponibilizado pelo framework AdonisJs.

## Metodologia dos gateways
- Os métodos de implementação dos gateways: Login, nova transação e listar transações foram implementados da forma mais genérica que o candidato conseguiu, com todos os gateway compartilhando a mesma implementação, o que difere cada gateway é o conjunto de dados de configuração do banco de dados (autenticação) e configuração fixa em *./app/services/factory/gatewayFactory.ts* (dados e rotas esperadas).
- Em teoria, para adicionar mais gateways no mesmo padrão, basca adicionar a configuração em *./app/services/factory/gatewayFactory.ts*, adicionar um nome para o gateway em **static  create** instanciando um novo gateway e configurar a autenticação com uma entrada no banco atrás rota **/gateways/ POST** **OBS** o nome do gateway deve ser o mesmo que foi configurado em **static  create**, pois esse é o dados que liga a configuração do banco com a fixa.
- Exemplo de configuração fixa:
```
	const  gateway1:  GatewayConfig  = {
		methods: {
			login: {
				endPoint:  '/login',
				metod:  'POST',
				expectedError: {
				message:  'error',
			},
		},

		transaction: {
			endPoint:  '/transactions',
			metod:  'POST',
			dataRoute:  'data',
			expectedData: { external_id:  'id' },
			bodyDataMap: {
				transaction_amount:  'amount',
				client_name:  'name',
				client_email:  'email',
				card_number:  'cardNumber',
				card_CVV:  'cvv',
			},
			expectedError: {
					message:  'error',
				},
			},
			listTransactions: {
				endPoint:  '/transactions',
				metod:  'GET',
				dataRoute:  'data',
				expectedDataMap: [
					{
						external_id:  'id',
						client_name:  'name',
						client_email:  'email',
						trasaction_status:  'status',
						transaction_amount:  'amount',
					},
				],
				expectedError: {
					message:  'error',
				},
		},
		reimbursement: {
			endPoint:  '/transactions/:id/charge_back',
			metod:  'POST',
			dataRoute:  'data',
			params: [{ external_id:  'id', type:  'ROUTE' }],
			expectedDataMap: [
				{
					external_id:  'id',
					client_name:  'name',
					client_email:  'email',
					trasaction_status:  'status',
					card_last_digits:  'card_last_digits',
					transaction_amount:  'amount',
				},
			],
			expectedError: {
				message:  'error',
			},
		},
		},
};
```

## Extras
### Retornos padronizados
- Foi adotado uma metodologia de padronização de retorno de Error e Success contendo dos dados
		-	Success
			```
		{
			"status": 200,
			"msg":"msg",
			"data": {}
		}
			```
				-	Error
			```
		{
			"status": 400,
			"msg":"msg",
			"data": {},
			"fields":[{}],
			"parameters":[{}],
			"actions:[{}]
		}
			```
			
	- O retorno padronizado assim como uso de status adequado visa deixar os retornos mas previsíveis e fáceis de se lidar em um eventual consumidor.

<a id="Ambiente_de_teste"></a>
### Ambiente de teste de requisição 
- Um projeto Insomnia já configurado para o teste da API é disponibilizado em ./tools/Insomnia_project.json, basta abrir o Aplicativo Insomnia, na Home Page clicar em Import, Choose a File, selecionar o arquivo .json, Abrir, Scan, Import.
OBS: com esse projeto não é necessário modificar o token, ele é automaticamente coletado da requisição login, e distribuído para as rotas autenticadas. Para fins de teste de autenticação (token inválido) basta modificar o token nas variáveis de ambiente.

## Erros reconhecidos | eventuais
  - Erros de ortografia em: documentação, nomes de variáveis, mensagens de retorno e em outros locais podem ter ocorrido.
  - O crud de Credenciais dos gateways não foi 100% implementado, faltando os métodos create e delete para um gateway já existente, existindo apenas o update e view. Motivação: O candidato esqueceu mesmo :)


/end

<!-- -..- -....- -..- -->
