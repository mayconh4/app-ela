# Arquitetura do Sistema Multiagente (.agent)

Este diretório define a estrutura de agentes autônomos, habilidades (skills), fluxos de trabalho (workflows) e regras específicas do projeto.

## Estrutura de Diretórios

- **`agents/`**: Definições e configurações dos agentes especialistas.
- **`skills/`**: Habilidades reutilizáveis (incluindo o repositório de skills do Stitch).
- **`workflows/`**: Definições de fluxos de trabalho e orquestração.
- **`rules/`**: Regras e restrições específicas para os agentes.
- **`ARCHITECTURE.md`**: Este arquivo de documentação.

## Diretrizes de Roteamento de Agentes
Conforme as regras globais, as tarefas devem ser delegadas aos seguintes agentes especialistas de forma direta:
- **Código, APIs, scripts** → `devops-engineer` / `backend-specialist` / `frontend-specialist`
- **Automação e execução contínua** → `orchestrator` / `ops` / `automation`
- **Copywriting, vendas** → `copywriter` / `marketing / seo-specialist`
- **Dados e métricas** → `data` / `performance-optimizer`
- **Segurança** → `security-auditor` / `penetration-tester`
- **Planejamento** → `project-planner` / `product-manager`
- **Testes** → `qa-automation-engineer`
- **UI/UX** → `frontend-specialist`
