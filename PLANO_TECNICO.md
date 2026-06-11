# BELLA — Plano Técnico & Roadmap

App único multi-categoria de **agendamento e gestão para beleza feminina** (Cabelo, Unhas, Sobrancelha/Cílios, Estética), com dois lados: **Cliente** e **Profissional/Salão**.

---

## 1. Visão de arquitetura (versão final)

```
┌─────────────────────────────────────────────┐
│              FLUTTER (1 codebase)             │
│        Android · iOS · Web (PWA)              │
│   - Cliente (sem login) + Profissional        │
│   - Riverpod/Bloc (estado) · go_router (nav)  │
└──────────────┬───────────────────┬────────────┘
               │                   │
        Supabase SDK          Iugu (REST + Webhooks)
               │                   │
┌──────────────▼───────┐   ┌───────▼────────────────┐
│ SUPABASE             │   │ IUGU                    │
│ - Auth (profissional)│   │ - PIX dinâmico + QR     │
│ - PostgreSQL + RLS   │   │ - Split de recebíveis   │
│ - Realtime (agenda)  │   │ - Subcontas (marketplace)│
│ - Storage (fotos)    │   │ - Webhooks → Edge Func  │
│ - Edge Functions     │   └─────────────────────────┘
└──────────────────────┘
```

**Por que essa stack:** Flutter cobre Android/iOS/Web com um só código; Supabase entrega Auth + Postgres + Realtime + Storage gerenciados (agenda atualiza em tempo real entre cliente e salão); Iugu tem PIX nativo e **split automático** — essencial para o modelo (cliente paga 1 valor; divisão profissional/freelancer/plataforma fica invisível).

---

## 2. Modelo de dados (PostgreSQL / Supabase)

Tabelas principais:

- **estabelecimentos** — id, nome, endereço, lat, lng, nota, dona_id
- **profissionais** — id, nome, doc(CPF/CNPJ), tipo(`freelancer`|`dona`|`equipe`), estab_id (nullable p/ freelancer), comissao_pct, iugu_subconta_id, chave_pix, expediente(jsonb), almoco(jsonb), nota
- **categorias** — id, nome, icone
- **servicos** — id, estab_id, categoria_id, nome, preco, duracao_min
- **agendamentos** — id, estab_id, profissional_id, servico_id, data, hora, cliente_nome, cliente_cpf, cliente_wpp, status(`pago`|`aguardando`|`cancelado`), faltou(bool), iugu_invoice_id
- **avaliacoes** — id, agendamento_id, profissional_id, estrelas, comentario
- **fidelidade** — cliente_cpf (ou hash), estab_id, contagem
- **vagas** — id, estab_id, titulo, valor, categoria_id, tipo(`diaria`|`mensal`)
- **candidaturas** — id, vaga_id, profissional_id, status
- **metas** — profissional_id/estab_id, periodo(`mes`|`6meses`|`ano`), valor
- **politicas** — estab_id, desconto_falta_pct
- **pagamentos** — id, agendamento_id, valor_total, split(jsonb), taxa_plataforma, provedor

**Segurança (RLS):** profissional só lê/escreve dados do próprio estabelecimento; cliente não precisa de conta (checkout anônimo grava via Edge Function com `service_role`, nunca expondo a chave no app).

---

## 3. Pagamento — PIX com split (Iugu)

Fluxo no checkout (cliente informa só **nome, CPF, WhatsApp**):

1. App chama **Edge Function `criar-cobranca`** → cria invoice PIX na Iugu com `splits` definindo os percentuais.
2. Iugu devolve **QR Code + copia-e-cola** → app exibe com cronômetro (10 min).
3. Cliente paga → Iugu dispara **webhook** → Edge Function `webhook-iugu` marca `agendamento.status = pago`, incrementa fidelidade, e o Realtime atualiza a agenda do salão na hora.

**Split (invisível ao cliente):** um único valor é dividido entre profissional, freelancer (quando aplicável) e plataforma. Ex.: serviço R$ 100 → profissional R$ 95,01, plataforma R$ 2,99 (taxa) + ~0,99% Iugu sobre o total.

**Monetização (já simulável no protótipo):**
- **Taxa por atendimento:** R$ 2,99 (entrada, bom para baixo volume).
- **Assinatura mensal:** ~R$ 89,90 (teto para alto volume — sai mais barato que a taxa acima de ~30 atend./mês).
- Lógica recomenda automaticamente o modelo mais barato conforme o volume.

**Migração futura:** ao escalar, mover de Iugu para um **BaaS / Banking-as-a-Service** (contas e liquidação próprias) reduz custo por transação e dá controle do float. Manter a camada de pagamento atrás de uma interface (`PaymentProvider`) para trocar o provedor sem reescrever o app.

---

## 4. Funcionalidades por lado (mapeadas ao protótipo)

**Cliente:** escolha de estabelecimento + "a mais próxima" (geolocalização, prioriza quem tem horário livre) · filtro por categoria · serviço com preço/duração · profissional (qualquer/específica) · data → horários livres (desconta intervalos e agendamentos) · checkout PIX sem cadastro · avaliação por estrelas · cartão fidelidade (10 → próximo grátis).

**Profissional/Salão:** onboarding (freelancer vs dona) · cadastro com dados do provedor (+ "Pular demo") · **Agenda** com cores por status e barra de fidelidade por cliente · **Resumo** (faturamento dia/semana/mês, comissão, top serviços, política de faltas configurável) · **Rede** (mural de vagas + vitrine de profissionais com nota e distância; candidatar/convidar) · **Equipe** (só donas; comissão por pessoa) · **Metas** (mês/6m/1a configuráveis + fidelização com botão "Lembrar" que abre o WhatsApp com mensagem pronta) · menu de usuário (trocar cliente/profissional, minha conta).

---

## 5. Roadmap por fases

### Fase 0 — Protótipo web (ENTREGUE)
HTML/CSS/JS, Liquid Glass, dados de exemplo, localStorage. Valida fluxos e UX antes de codar em Flutter.

### Fase 1 — MVP Cliente (4–6 semanas)
Flutter + Supabase. Catálogo (estab/categoria/serviço/profissional), motor de horários livres, **checkout PIX real (Iugu) sem cadastro**, confirmação via webhook, avaliação e fidelidade. Geolocalização real. **Critério de sucesso:** cliente agenda e paga em < 1 min.

### Fase 2 — MVP Profissional (4–6 semanas)
Auth do profissional, onboarding + cadastro Iugu (criação de subconta), Agenda em Realtime com status, Resumo financeiro, política de faltas, configuração de expediente/serviços/preços. **Split** ativo.

### Fase 3 — Rede + Equipe (3–4 semanas)
Marketplace freelancer↔salão (vagas, vitrine, candidatura/convite), gestão de equipe e comissões, split de 3 partes (salão + freelancer + plataforma).

### Fase 4 — IA & Relatórios (3–5 semanas)
Previsão de demanda e melhores horários, sugestão de preço/meta, detecção de clientes em risco de churn, mensagens de fidelização automáticas, relatórios exportáveis. Metas com acompanhamento automático.

### Fase 5 — Monetização & Escala
Cobrança de assinatura, painel de planos, otimização de taxa por volume, e avaliação de migração de Iugu → BaaS. Observabilidade, antifraude, multi-cidade.

---

## 6. Riscos & decisões em aberto

- **Checkout sem conta + CPF:** definir LGPD (consentimento, retenção, hash do CPF na fidelidade).
- **Split com freelancer:** exige subconta Iugu por profissional — incluir no onboarding.
- **Horários livres:** mover o cálculo de slots para o backend (Edge Function) na produção, evitando divergência e concorrência (dois clientes no mesmo horário → usar transação/lock).
- **No-show / faltas:** decidir se o desconto é crédito, multa pré-autorizada ou só ajuste manual.
- **QR do protótipo é visual** (placeholder); produção usa o payload PIX real da Iugu.
