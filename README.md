# Harpa API

API RESTful para acessar hinos da Harpa Cristã.

## Recursos

- **Endpoints:**
  - Listar todos os hinos `(GET /hymns)`
  - Obter hino por ID `(GET /hymns/:id)`
  - Buscar por título `(GET /hymns/search/title/:query)`
  - Buscar por estrofe `(GET /hymns/search/verse/:query)`
  - Buscar por número `(GET /hymns/search/number/:number)`
  - Obter hino aleatório `(GET /hymns/random)`

## Tecnologias

- Node.js v16+
- Express
- MongoDB

## Instalação e Uso

1. **Requisitos:** Node.js e MongoDB instalados.
2. **Clonar:** `git clone https://github.com/rxpt/harpa-api.git`
3. **Instalar:** npm install (dentro do diretório do projeto)
4. **Configurar:**
   - Copiar `.env.example` para `.env`
   - Editar `.env` com suas configurações
5. **Popular o banco de dados:**
   - Os dados para popular o banco de dados estão presentes no projeto ["harpa-crista-app"](https://github.com/rxpt/harpa-crista-app/blob/main/src/data/anthems.json).
6. **Iniciar:** npm start

## Middleware

- **cors:** Permite requisições de origens diferentes.
- **helmet:** Segurança através de cabeçalhos HTTP.
- **express.json():** Interpreta o corpo das requisições como JSON.
- **errorHandler:** Tratamento de erros personalizado.
- **express-validator:** Validação de parâmetros e queries.
