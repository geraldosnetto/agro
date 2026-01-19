# Diretrizes de Desenvolvimento (AgroIndica)

Este documento estabelece as regras de ouro para o desenvolvimento deste projeto. Deve ser consultado e seguido rigorosamente em todas as tarefas.

## 🚫 Proibições Absolutas (Inaceitável)
1.  **Nunca fazer downgrade** de bibliotecas/dependências. Resolver a compatibilidade, não fugir dela.
2.  **Nunca simplificar ou falsificar testes** para passar. Encontrar o erro real.
3.  **Nunca fazer "quick fixes"** (gambiarras). Soluções temporárias são dívida técnica imediata.
4.  **Nunca usar `any`, `any[]` ou `as any`**. TypeScript é para segurança. Use type narrowing/guards.
5.  **Nunca "esconder" erros**. Nada de `try/catch` vazio, `.passthrough()` em Zod, ou ignorar validações.
6.  **Nunca assumir caminhos de produção** (ex: `/opt/`). Verificar o ambiente real sempre.

## ✅ Processo & Metodologia
7.  **Preview Visual Obrigatório:** Sempre conferir no browser se o que foi codado realmente funciona visualmente.
8.  **Planejamento Antes de Código:** Pensar, desenhar e planejar passo a passo antes de digitar.
9.  **Divisão de Tarefas:** Quebrar problemas grandes em etapas menores e testáveis.
10. **Schema-First:** Definir contratos (Zod/Interfaces) ANTES da lógica. Backend e Frontend devem concordar no contrato primeiro.
11. **Server is Source of Truth:** O Backend dita a estrutura. O Frontend se adapta.

## 🛠️ Engenharia & Qualidade
12. **Fix Priority (Bugs de Dados):**
    1. Logar erro detalhado (identificar campos).
    2. Corrigir origem (Backend).
    3. Atualizar Schema.
    4. *Jamais* relaxar validação no cliente.
13. **Logging Detalhado:** Em falhas de validação, logar *quais* campos falharam e *por quê*.
14. **Perguntar Sempre:** Na dúvida, pergunte. Não assuma.

## 🔄 Melhoria Contínua
15. **Refactoring (Boy Scout Rule):** Deixar o código sempre melhor do que encontrou.
16. **Atomicidade e Limpeza:** Manter commits/tarefas focados. Código limpo é responsabilidade de todos.
