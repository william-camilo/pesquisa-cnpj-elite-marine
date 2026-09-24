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
- O histórico (últimas 10 consultas) fica só no navegador de quem usa (`localStorage`).

## Publicar
Qualquer alteração em `index.html` na branch `main` vai ao ar pelo GitHub Pages em 1–2 minutos.

## Aviso
Dados públicos da Receita Federal, repassados por serviços de terceiros e sujeitos a atraso.
Para decisões fiscais, jurídicas ou cadastrais, confirme nos canais oficiais da Receita Federal.
