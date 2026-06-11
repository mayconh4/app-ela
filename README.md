# BELLA — Agendamento & Gestão de Beleza

Protótipo web (Liquid Glass) de um app único multi-categoria para o nicho de beleza feminina,
cobrindo **Unhas, Cabelo, Cílios, Sobrancelhas, Tratamento de estrias e Botox (ácido hialurônico)**.

Dois lados em um só app:

- **Cliente** — menu de categorias, escolha de studio ("a mais próxima de você" por geolocalização),
  serviço, profissional, horário (só horários livres), checkout via **PIX sem cadastro**
  (nome/CPF/WhatsApp), avaliação e cartão fidelidade (10 → próximo grátis).
- **Profissional / Studio** — onboarding (freelancer ou dono de studio), cadastro com dados do
  provedor de pagamento, e painel com abas: **Agenda** (cores por status + fidelidade),
  **Resumo** (faturamento, comissão, top serviços, política de faltas), **Rede** (marketplace de
  vagas + vitrine de profissionais), **Equipe** (comissão editável por pessoa, cadastro de
  freelancer) e **Metas** (por período + fidelização via WhatsApp).

## Como rodar

Abra `index.html` em qualquer navegador. Os três arquivos precisam estar na mesma pasta.
Os dados de teste são persistidos no `localStorage` do navegador.

## Arquivos

- `index.html` — estrutura das telas e ícones SVG
- `style.css` — tema visual Liquid Glass (claro, pastel)
- `app.js` — lógica, dados de exemplo e persistência
- `PLANO_TECNICO.md` — arquitetura final (Flutter + Supabase + Iugu) e roadmap por fases

## Stack-alvo da versão final

Flutter (Android/iOS/Web), Supabase (Auth, PostgreSQL, Realtime, Storage) e Iugu para
pagamentos PIX com split. Detalhes em `PLANO_TECNICO.md`.

> Protótipo para validação de UX e fluxos. O QR Code do PIX é visual (placeholder);
> a versão de produção usa o payload real da Iugu.
