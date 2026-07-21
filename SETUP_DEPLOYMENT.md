# Setup e Deployment - Pesquisa CNPJ Elite Marine

## 🚀 Início Rápido (Desenvolvimento)

### Pré-requisitos
- Node.js 22.13.0+
- pnpm 9.0.0+
- Git
- MySQL 8.0+ ou TiDB

### 1. Clonar Repositório
```bash
git clone <repository-url>
cd pesquisa-cnpj-elite-marine
```

### 2. Instalar Dependências
```bash
pnpm install
```

### 3. Configurar Variáveis de Ambiente
```bash
cp .env.example .env.local
```

Editar `.env.local` com suas credenciais:
```env
DATABASE_URL=mysql://user:password@localhost:3306/cnpj_db
JWT_SECRET=seu_secret_jwt_aleatorio_aqui
VITE_APP_ID=seu_app_id_manus
OAUTH_SERVER_URL=https://oauth.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
OWNER_OPEN_ID=seu_owner_id
OWNER_NAME=Seu Nome
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=sua_api_key
VITE_FRONTEND_FORGE_API_KEY=sua_frontend_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
```

### 4. Configurar Banco de Dados
```bash
# Criar banco de dados
mysql -u root -p -e "CREATE DATABASE cnpj_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Executar migrações
pnpm db:push
```

### 5. Iniciar Servidor de Desenvolvimento
```bash
pnpm dev
```

Acesse: http://localhost:3000

---

## 🧪 Testes

### Executar Todos os Testes
```bash
pnpm test
```

### Executar Testes de um Arquivo
```bash
pnpm test server/cnpj.search.test.ts
```

### Modo Watch
```bash
pnpm test --watch
```

### Cobertura
```bash
pnpm test --coverage
```

---

## 🏗️ Build para Produção

### 1. Build Frontend
```bash
pnpm build
```

Gera: `dist/`

### 2. Build Backend
```bash
pnpm build
```

Gera: `dist/server/`

### 3. Verificar Build
```bash
ls -la dist/
```

---

## 📦 Deployment na Manus WebDev

### Opção 1: Via CLI (Recomendado)

#### 1. Salvar Checkpoint
```bash
webdev_save_checkpoint
```

Descrição:
```
Pesquisa CNPJ Elite Marine - Versão X.X.X

✅ Funcionalidades:
- Busca por CNPJ com validação
- Busca por nome com Fuzzy Search
- Sistema de apelidos
- Histórico persistente
- Autenticação OAuth

✅ Testes: 44/44 passando
```

#### 2. Publicar (Automático)
O checkpoint é publicado automaticamente em produção.

#### 3. Verificar Deploy
```bash
# Acessar URL de produção
https://cnpjmarine-tuvxncpz.manus.space
```

### Opção 2: Via Management UI

1. Abrir Management UI
2. Ir para "Dashboard"
3. Clicar em "Publish"
4. Confirmar publicação

---

## 🔧 Configuração de Produção

### Variáveis de Ambiente em Produção

**Via Management UI:**
1. Settings → Secrets
2. Adicionar cada variável
3. Valores são criptografados

**Variáveis Obrigatórias:**
- DATABASE_URL
- JWT_SECRET
- VITE_APP_ID
- OAUTH_SERVER_URL
- VITE_OAUTH_PORTAL_URL

### Domínio Customizado

1. Management UI → Settings → Domains
2. Comprar domínio ou conectar existente
3. Configurar DNS
4. Aguardar propagação (24-48h)

---

## 📊 Monitoramento

### Logs de Desenvolvimento
```bash
# Ver logs do servidor
tail -f .manus-logs/devserver.log

# Ver logs do console do navegador
tail -f .manus-logs/browserConsole.log

# Ver requisições de rede
tail -f .manus-logs/networkRequests.log
```

### Logs de Produção
```bash
# Ver logs do site publicado
manus-webdev-logs

# Últimas 50 linhas
manus-webdev-logs --limit 50

# Próxima página de logs
manus-webdev-logs --end-time <oldest_time>
```

### Dashboard de Produção
1. Management UI → Dashboard
2. Visualizar:
   - Status do servidor
   - Uptime
   - Requisições
   - Erros

---

## 🔄 Rollback

### Se algo der errado em produção:

```bash
# Ver histórico de versões
git log --oneline

# Rollback para versão anterior
webdev_rollback_checkpoint <version_id>
```

Exemplo:
```bash
webdev_rollback_checkpoint 95fd3ecc
```

---

## 🗄️ Gerenciamento de Banco de Dados

### Migrações

#### Criar Nova Migração
```bash
# Editar schema em drizzle/schema.ts
# Depois:
pnpm db:push
```

#### Ver Status de Migrações
```bash
pnpm db:push --dry
```

#### Reverter Migração
```bash
# Editar schema
# Remover tabela/coluna
pnpm db:push
```

### Backup do Banco de Dados

#### Backup Manual
```bash
# MySQL
mysqldump -u user -p cnpj_db > backup_$(date +%Y%m%d_%H%M%S).sql

# TiDB
mysqldump -h tidb-host -u user -p cnpj_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Restaurar Backup
```bash
mysql -u user -p cnpj_db < backup_20260720_120000.sql
```

### Limpeza de Dados

#### Remover Histórico Antigo
```bash
# Via SQL (cuidado!)
DELETE FROM cnpj_history 
WHERE createdAt < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

#### Remover Apelidos Órfãos
```bash
DELETE FROM company_aliases 
WHERE cnpj NOT IN (SELECT DISTINCT cnpj FROM cnpj_history);
```

---

## 🔐 Segurança

### Checklist de Segurança

- [ ] JWT_SECRET é forte e único
- [ ] DATABASE_URL usa SSL/TLS
- [ ] HTTPS habilitado em produção
- [ ] CORS configurado corretamente
- [ ] Rate limiting implementado
- [ ] Inputs validados no backend
- [ ] Senhas hasheadas (se aplicável)
- [ ] Logs não contêm dados sensíveis

### Variáveis Sensíveis

**NUNCA commitar:**
- `.env.local`
- `JWT_SECRET`
- `API_KEYS`
- Credenciais de banco de dados

**Usar:**
- Management UI → Secrets
- Variáveis de ambiente do sistema
- `.env.example` (sem valores reais)

---

## 📈 Performance

### Otimizações Implementadas

1. **Cache em Memória**
   - Histórico carregado ao iniciar
   - Resultados de API com TTL 24h

2. **Busca em Duas Camadas**
   - Local: <1ms
   - API: ~5s com timeout

3. **Chamadas Paralelas**
   - 3 APIs consultadas simultaneamente
   - Primeiro resultado retornado

4. **Índices no Banco**
   - CNPJ
   - user_id
   - Apelidos

### Monitoramento de Performance

```bash
# Tempo de resposta
curl -w "@curl-format.txt" -o /dev/null -s https://cnpjmarine-tuvxncpz.manus.space

# Tamanho de assets
du -sh dist/

# Tamanho do banco
SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb 
FROM information_schema.tables 
WHERE table_schema = 'cnpj_db';
```

---

## 🐛 Troubleshooting

### Erro: "Cannot find module"
```bash
# Limpar cache e reinstalar
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Erro: "Database connection failed"
```bash
# Verificar conexão
mysql -h localhost -u user -p -e "SELECT 1"

# Verificar DATABASE_URL
echo $DATABASE_URL
```

### Erro: "OAuth callback failed"
```bash
# Verificar VITE_APP_ID
# Verificar OAUTH_SERVER_URL
# Verificar redirect_uri em OAuth config
```

### Erro: "CNPJ inválido"
```bash
# Verificar dígito verificador
# Usar apenas números
# Formato: 14 dígitos
```

### Servidor não inicia
```bash
# Limpar cache Vite
rm -rf .vite

# Limpar build
rm -rf dist/

# Reinstalar dependências
pnpm install

# Iniciar novamente
pnpm dev
```

---

## 📚 Referências

### Documentação Oficial
- [React 19](https://react.dev)
- [Tailwind CSS 4](https://tailwindcss.com)
- [tRPC 11](https://trpc.io)
- [Drizzle ORM](https://orm.drizzle.team)
- [Vitest](https://vitest.dev)

### Ferramentas
- [pnpm](https://pnpm.io)
- [Vite](https://vitejs.dev)
- [Express](https://expressjs.com)

### APIs Externas
- [ReceitaWS](https://www.receitaws.com.br)
- [CNPJ.ws](https://cnpj.ws)
- [OpenCNPJ](https://opencnpj.com.br)

---

## 📞 Suporte

### Problemas Comuns

1. **Testes falhando**
   - Executar: `pnpm test`
   - Verificar logs em `.manus-logs/`

2. **Build lento**
   - Limpar cache: `rm -rf .vite dist/`
   - Verificar espaço em disco

3. **Banco de dados lento**
   - Verificar índices
   - Executar ANALYZE TABLE
   - Aumentar pool de conexões

4. **Deploy falhando**
   - Verificar testes: `pnpm test`
   - Verificar build: `pnpm build`
   - Ver logs: `manus-webdev-logs`

---

## 🎯 Checklist de Deploy

- [ ] Todos os testes passando (`pnpm test`)
- [ ] Sem erros de TypeScript (`pnpm build`)
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados migrado (`pnpm db:push`)
- [ ] Backup do banco realizado
- [ ] Checkpoint criado com descrição
- [ ] Logs monitorados após deploy
- [ ] Funcionalidades testadas em produção

---

**Versão:** 1.0.0
**Última atualização:** 20 de julho de 2026
