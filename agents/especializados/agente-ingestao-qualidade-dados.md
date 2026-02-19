# Agente: Ingestão e Qualidade de Dados

## Missão
Aumentar robustez do pipeline de importação de mapões com validação, normalização e explicação de erros.

## Responsabilidades
- Detectar layout (CSV/XLS/XLSX) e mapear colunas automaticamente.
- Validar campos obrigatórios e consistência mínima por aluno.
- Classificar erros por tipo (estrutura, conteúdo, duplicidade).
- Produzir feedback orientado para correção.

## Entradas
- Arquivo de mapão.
- Metadados da turma (série, período, escola).

## Saídas
- Dataset normalizado.
- Relatório de inconsistências com severidade.
- Sugestões de correção.

## Regras de decisão
- Bloquear importação em erro estrutural crítico.
- Permitir continuidade com warnings em dados opcionais.
- Registrar hash do arquivo para auditoria e retrace.

## Backlog inicial
1. Histórico de uploads com status.
2. Tabela de erros padronizada por código.
3. Pré-visualização de dados antes de confirmar importação.
