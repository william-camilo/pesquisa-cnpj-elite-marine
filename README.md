# Pesquisa CNPJ · Elite Marine

Consulta gratuita de dados públicos de empresas brasileiras pelo CNPJ.
**Site:** https://william-camilo.github.io/pesquisa-cnpj-elite-marine/

## O que mostra
- Razão social, nome fantasia, matriz/filial
- Situação cadastral com data e motivo (alerta quando BAIXADA, INAPTA ou SUSPENSA)
- Simples Nacional (com datas de opção/exclusão) e MEI
- Natureza jurídica, porte, capital social, regime tributário
- Endereço, telefone, e-mail
- Atividades (CNAE principal e secundárias) e quadro de sócios

Cor do cabeçalho do resultado: **vermelho** = optante do Simples · **verde** = não optante · **cinza** = não informado.

## Como funciona
Página estática única (`index.html`), sem servidor e sem banco de dados.
O navegador consulta, nesta ordem, até um responder:

1. [BrasilAPI](https://brasilapi.com.br/docs#tag/CNPJ)
2. [Minha Receita](https://minhareceita.org)
3. [CNPJ.ws pública](https://docs.cnpj.ws) (limite de ~3 consultas/minuto)

- Os dígitos verificadores são conferidos antes da consulta (numérico e alfanumérico, IN RFB 2.229/2024).
- Link direto: `?cnpj=33000167000101` abre a consulta pronta.
- **Histórico compartilhado (Supabase):** toda consulta fica salva na tabela `consultas_cnpj` e aparece para qualquer visitante. Se o CNPJ já está no histórico, os dados vêm de lá (sem chamar as APIs); o botão **↻ Atualizar agora** força uma consulta nova e atualiza o registro.
- Sem `SUPABASE_URL`/`SUPABASE_ANON_KEY` preenchidos no `index.html`, o site volta ao histórico local do navegador (`localStorage`, 10 últimas).

## Publicar
Qualquer alteração em `index.html` na branch `main` vai ao ar pelo GitHub Pages em 1–2 minutos.

## Aviso
Dados públicos da Receita Federal, repassados por serviços de terceiros e sujeitos a atraso.
Para decisões fiscais, jurídicas ou cadastrais, confirme nos canais oficiais da Receita Federal.

## Configurar o Supabase
1. Supabase → **SQL Editor** → cole o conteúdo de `supabase.sql` → **Run** (cria a tabela, as regras de leitura pública e a função `salvar_consulta`).
2. Supabase → **Project Settings → API**: copie a *Project URL* e a chave *anon public*.
3. No `index.html`, preencha `SUPABASE_URL` e `SUPABASE_ANON_KEY` (bloco "Histórico compartilhado").
4. Opcional: `CACHE_MAX_AGE_DAYS = 30` faz o site reconsultar dados com mais de 30 dias (0 = usa sempre o histórico).

Visitantes só leem a tabela; gravar é possível apenas pela função, que valida CNPJ, tamanho e fonte. Apagar registros: pelo painel do Supabase.
