# Pesquisa CNPJ Elite Marine - Documentação Completa

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Funcionalidades](#funcionalidades)
3. [Arquitetura Técnica](#arquitetura-técnica)
4. [Stack Tecnológico](#stack-tecnológico)
5. [Estrutura do Projeto](#estrutura-do-projeto)
6. [Guia de Uso](#guia-de-uso)
7. [API tRPC](#api-trpc)
8. [Banco de Dados](#banco-de-dados)
9. [Autenticação](#autenticação)
10. [Testes](#testes)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

**Pesquisa CNPJ Elite Marine** é uma aplicação web moderna para consulta de status de CNPJ com suporte a:
- Busca por CNPJ (formato numérico e alfanumérico)
- Busca por nome de empresa com Fuzzy Search
- Histórico persistente de pesquisas (até 1000 registros)
- Sistema de apelidos/variantes de nomes
- Status de optante pelo Simples Nacional (verde/vermelho)
- Informações completas: Data de Abertura, Natureza Jurídica, SIMEI
- Autenticação obrigatória via OAuth Manus

**URL de Produção:** https://cnpjmarine-tuvxncpz.manus.space

---

## ✨ Funcionalidades

### 1. Busca por CNPJ
- **Entrada:** CNPJ com máscara (XX.XXX.XXX/XXXX-XX) ou apenas números
- **Validação:** Algoritmo de dígito verificador (módulo 11)
- **Suporte:** Formato alfanumérico (A-Z + 0-9) obrigatório a partir de 31/07/2026
- **Resultado:** Status, Data de Abertura, Natureza Jurídica, SIMEI, Optante Simples Nacional
- **APIs:** ReceitaWS, CNPJ.ws, OpenCNPJ (com fallback automático)

### 2. Busca por Nome
- **Tipo:** Busca no histórico local (muito mais confiável que APIs externas)
- **Algoritmo:** Fuzzy Search com Levenshtein Distance (mínimo 60% de similaridade)
- **Resultados:** Aparecem em tempo real conforme digita (mínimo 3 caracteres)
- **Dropdown:** Clique para preencher automaticamente o campo CNPJ

### 3. Sistema de Apelidos
- **Objetivo:** Reconhecer variantes de nomes de empresas
- **CRUD:** Adicionar, editar, deletar apelidos
- **Modal:** Interface intuitiva para gerenciar apelidos
- **Integração:** Apelidos são considerados na busca por nome

### 4. Histórico de Pesquisas
- **Persistência:** Banco de dados (até 1000 registros)
- **Exibição:** Últimas 5 pesquisas na interface
- **Busca Preditiva:** Filtra em tempo real por nome ou CNPJ
- **Ações:** Clique para repesquisar, botão X para deletar

### 5. Otimização de Performance
- **Prioridade 1:** Busca no histórico local (<1ms)
- **Prioridade 2:** APIs externas como fallback (~5s)
- **Cache:** 24 horas para resultados de API
- **Chamadas Paralelas:** Múltiplas APIs consultadas simultaneamente

---

## 🏗️ Arquitetura Técnica

### Fluxo de Busca por CNPJ

```
Usuário digita CNPJ
    ↓
Validação de formato e dígito verificador
    ↓
Busca no histórico local (prioridade 1)
    ↓
Se encontrado: Retorna resultado
Se não encontrado: Consulta APIs em paralelo
    ↓
ReceitaWS + CNPJ.ws + OpenCNPJ (simultâneas)
    ↓
Primeiro resultado bem-sucedido é retornado
    ↓
Resultado é salvo no histórico
    ↓
Exibição com status colorido (verde/vermelho)
```

### Fluxo de Busca por Nome

```
Usuário digita nome (3+ caracteres)
    ↓
Busca no histórico local
    ↓
Aplicar Fuzzy Search (Levenshtein Distance)
    ↓
Considerar apelidos cadastrados
    ↓
Retornar resultados com score de similaridade
    ↓
Exibir dropdown com resultados
    ↓
Clique preenche CNPJ automaticamente
```

---

## 💻 Stack Tecnológico

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Frontend** | React | 19 |
| **Styling** | Tailwind CSS | 4 |
| **Backend** | Express | 4 |
| **RPC** | tRPC | 11 |
| **ORM** | Drizzle | 0.44.5 |
| **Banco de Dados** | MySQL/TiDB | - |
| **Testes** | Vitest | - |
| **Build** | Vite | 7.1.9 |
| **Autenticação** | OAuth Manus | - |

---

## 📁 Estrutura do Projeto

```
pesquisa-cnpj-elite-marine/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx          # Página principal com UI
│   │   │   └── NotFound.tsx      # Página 404
│   │   ├── components/
│   │   │   ├── ui/               # shadcn/ui components
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── AIChatBox.tsx
│   │   ├── hooks/
│   │   │   ├── useCNPJMask.ts    # Formatação e validação de CNPJ
│   │   │   ├── useCNPJSearch.ts  # Lógica de busca
│   │   │   └── useAuth.ts        # Autenticação
│   │   ├── lib/
│   │   │   └── trpc.ts           # Cliente tRPC
│   │   ├── const.ts              # Constantes
│   │   ├── App.tsx               # Roteamento
│   │   ├── main.tsx              # Entry point
│   │   └── index.css             # Estilos globais
│   ├── public/
│   │   ├── favicon.ico
│   │   └── robots.txt
│   └── index.html
├── server/
│   ├── routers.ts                # Procedures tRPC
│   ├── db.ts                      # Query helpers
│   ├── cache.ts                   # Cache em memória
│   ├── storage.ts                 # S3 helpers
│   ├── index.ts                   # Entry point
│   └── _core/                     # Framework internals
├── drizzle/
│   ├── schema.ts                  # Definição de tabelas
│   ├── relations.ts               # Relacionamentos
│   ├── migrations/                # Histórico de migrações
│   └── meta/
├── shared/
│   ├── const.ts                   # Constantes compartilhadas
│   └── types.ts                   # Tipos compartilhados
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── drizzle.config.ts
└── todo.md                        # Checklist de features
```

---

## 🚀 Guia de Uso

### Para Usuários Finais

#### 1. Login
- Acesse https://cnpjmarine-tuvxncpz.manus.space
- Clique em "Entrar" e autentique com sua conta Manus

#### 2. Buscar por CNPJ
- Digite o CNPJ no formato: XX.XXX.XXX/XXXX-XX ou apenas números
- Pressione Enter ou clique em "Buscar"
- Resultado aparece com status colorido:
  - 🟢 **Verde:** Não optante pelo Simples Nacional
  - 🔴 **Vermelho:** Optante pelo Simples Nacional

#### 3. Buscar por Nome
- Digite o nome da empresa (mínimo 3 caracteres)
- Resultados aparecem em tempo real
- Clique em um resultado para preencher o CNPJ automaticamente

#### 4. Gerenciar Apelidos
- Após uma busca, clique no botão "Apelidos" (ícone de tag)
- Adicione variantes de nomes para facilitar buscas futuras
- Edite ou delete apelidos conforme necessário

#### 5. Histórico
- Últimas 5 pesquisas aparecem abaixo
- Use a barra de busca para filtrar por nome ou CNPJ
- Clique em qualquer empresa para repesquisar
- Clique no X para remover do histórico

---

## 🔌 API tRPC

### Procedures Disponíveis

#### `cnpj.search`
Busca CNPJ por número com validação e fallback de APIs.

```typescript
Input: { cnpj: string }
Output: {
  cnpj: string
  company_name: string
  status: string
  optante_simples_nacional: boolean
  founding_date: string
  legal_nature: string
  address: string
  simei: boolean
}
```

#### `cnpj.searchByName`
Busca no histórico local por nome com Fuzzy Search.

```typescript
Input: { name: string }
Output: Array<{
  cnpj: string
  company_name: string
  alias?: string
  similarity_score?: number
}>
```

#### `cnpj.getHistory`
Retorna histórico de pesquisas do usuário.

```typescript
Input: {}
Output: Array<{
  cnpj: string
  company_name: string
  status: string
  optante_simples_nacional: boolean
  founding_date: string
  legal_nature: string
  address: string
  simei: boolean
  createdAt: Date
}>
```

#### `cnpj.deleteFromHistory`
Remove CNPJ do histórico.

```typescript
Input: { cnpj: string }
Output: { success: boolean }
```

#### `cnpj.addAlias`
Adiciona apelido para uma empresa.

```typescript
Input: { cnpj: string, alias: string }
Output: { id: number, cnpj: string, alias: string }
```

#### `cnpj.updateAlias`
Atualiza apelido existente.

```typescript
Input: { id: number, alias: string }
Output: { id: number, cnpj: string, alias: string }
```

#### `cnpj.deleteAlias`
Remove apelido.

```typescript
Input: { id: number }
Output: { success: boolean }
```

#### `cnpj.getAliases`
Retorna todos os apelidos de uma empresa.

```typescript
Input: { cnpj: string }
Output: Array<{
  id: number
  cnpj: string
  alias: string
}>
```

---

## 🗄️ Banco de Dados

### Tabela: `cnpj_history`
Armazena histórico de pesquisas de CNPJ.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INTEGER | Chave primária |
| user_id | TEXT | ID do usuário (OAuth) |
| cnpj | VARCHAR(14) | CNPJ sem formatação |
| company_name | VARCHAR(255) | Nome da empresa |
| status | VARCHAR(50) | Status da empresa |
| optante_simples_nacional | BOOLEAN | Optante SN |
| founding_date | VARCHAR(10) | Data de abertura |
| legal_nature | VARCHAR(100) | Natureza jurídica |
| address | TEXT | Endereço completo |
| simei | BOOLEAN | Indicador SIMEI |
| createdAt | TIMESTAMP | Data da pesquisa |

### Tabela: `company_aliases`
Armazena apelidos/variantes de nomes de empresas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INTEGER | Chave primária |
| user_id | TEXT | ID do usuário (OAuth) |
| cnpj | VARCHAR(14) | CNPJ da empresa |
| alias | VARCHAR(255) | Apelido/variante |
| createdAt | TIMESTAMP | Data de criação |

### Tabela: `users`
Armazena informações de usuários autenticados.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | TEXT | ID único (OAuth) |
| email | VARCHAR(255) | Email |
| name | VARCHAR(255) | Nome completo |
| role | ENUM | 'admin' ou 'user' |
| createdAt | TIMESTAMP | Data de criação |

---

## 🔐 Autenticação

### Fluxo OAuth Manus

1. **Login:** Usuário clica em "Entrar"
2. **Redirecionamento:** Redireciona para portal OAuth Manus
3. **Autenticação:** Usuário autentica com credenciais
4. **Callback:** Retorna para `/api/oauth/callback`
5. **Sessão:** Cookie de sessão é criado
6. **Acesso:** Usuário pode acessar recursos protegidos

### Proteção de Rotas

Todas as procedures tRPC usam `protectedProcedure`, garantindo que apenas usuários autenticados possam acessar.

```typescript
export const protectedProcedure = baseProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx });
});
```

---

## ✅ Testes

### Executar Testes
```bash
pnpm test
```

### Cobertura de Testes

| Módulo | Testes | Status |
|--------|--------|--------|
| CNPJ Mask | 12 | ✅ Passando |
| CNPJ Search | 20 | ✅ Passando |
| CNPJ Aliases | 12 | ✅ Passando |
| **Total** | **44** | **✅ Passando** |

### Testes Principais

#### `useCNPJMask.test.ts`
- Validação de CNPJ com dígito verificador
- Formatação com máscara
- Limpeza de caracteres especiais
- Suporte a formato alfanumérico

#### `cnpj.search.test.ts`
- Busca por CNPJ válido
- Tratamento de CNPJ inválido
- Cache de resultados
- Fallback de APIs

#### `cnpj.searchByName.test.ts`
- Busca no histórico local
- Fuzzy Search com Levenshtein Distance
- Consideração de apelidos
- Score de similaridade

#### `cnpj.aliases.test.ts`
- Adicionar apelido
- Editar apelido
- Deletar apelido
- Listar apelidos

---

## 🚀 Deployment

### Ambiente de Produção

**Plataforma:** Manus WebDev (Autoscale)
**URL:** https://cnpjmarine-tuvxncpz.manus.space
**Auto-Publish:** Habilitado (cada checkpoint é publicado automaticamente)

### Variáveis de Ambiente

```env
DATABASE_URL=mysql://user:password@host/database
JWT_SECRET=seu_secret_jwt
VITE_APP_ID=seu_app_id
OAUTH_SERVER_URL=https://oauth.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
OWNER_OPEN_ID=seu_owner_id
OWNER_NAME=seu_nome
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=seu_api_key
VITE_FRONTEND_FORGE_API_KEY=seu_frontend_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
```

### Processo de Deploy

1. Fazer alterações no código
2. Executar testes: `pnpm test`
3. Salvar checkpoint: `webdev_save_checkpoint`
4. Checkpoint é publicado automaticamente em produção

---

## 🔧 Troubleshooting

### Problema: "CNPJ inválido"
**Causa:** Dígito verificador incorreto ou formato inválido
**Solução:** Verifique o CNPJ e tente novamente

### Problema: "Nenhuma empresa encontrada"
**Causa:** CNPJ não existe nas bases de dados das APIs
**Solução:** Verifique se o CNPJ está correto

### Problema: Busca por nome muito lenta
**Causa:** Histórico muito grande ou muitos apelidos
**Solução:** Limpe o histórico ou remova apelidos antigos

### Problema: Erro de autenticação
**Causa:** Sessão expirada ou cookie inválido
**Solução:** Faça logout e login novamente

### Problema: Histórico não persiste
**Causa:** Banco de dados desconectado
**Solução:** Verifique conexão com banco de dados

---

## 📊 Performance

### Métricas

| Métrica | Valor | Descrição |
|---------|-------|-----------|
| Busca Local | <1ms | Histórico em memória |
| Busca API | ~5s | Fallback com timeout |
| Cache | 24h | Resultados em cache |
| Histórico | 1000+ | Registros persistidos |
| Testes | 44 | Cobertura completa |

---

## 📝 Notas de Desenvolvimento

### Convenções de Código

- **TypeScript:** Tipos explícitos em todas as funções
- **React:** Functional components com hooks
- **Styling:** Tailwind CSS com classes utilitárias
- **Nomes:** camelCase para variáveis, PascalCase para componentes
- **Testes:** Nomes descritivos com padrão `describe` + `it`

### Padrões Utilizados

- **tRPC:** Procedures como contratos type-safe
- **Drizzle ORM:** Schema-first com migrations
- **React Query:** Gerenciamento de estado assíncrono
- **Fuzzy Search:** Levenshtein Distance para similaridade

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a seção [Troubleshooting](#troubleshooting)
2. Verifique os testes para exemplos de uso
3. Revise a documentação das APIs tRPC
4. Contate o time de desenvolvimento

---

**Última atualização:** 20 de julho de 2026
**Versão:** 1.0.0
**Status:** Produção ✅
