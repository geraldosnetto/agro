---
description: Regras de performance para scripts de banco de dados
---

# Performance Rules for Database Scripts

## Batch Inserts (OBRIGATÓRIO)

Sempre que criar scripts que inserem dados em lote:

1. **NUNCA** usar `prisma.model.create()` em loop
2. **SEMPRE** usar `prisma.model.createMany()` com lotes de 500-1000 registros
3. **SEMPRE** adicionar `skipDuplicates: true` quando apropriado

### Exemplo ERRADO ❌
```typescript
for (const item of items) {
  await prisma.cotacao.create({ data: item });
}
```

### Exemplo CORRETO ✅
```typescript
const batchSize = 500;
for (let i = 0; i < items.length; i += batchSize) {
  const batch = items.slice(i, i + batchSize);
  await prisma.cotacao.createMany({ 
    data: batch,
    skipDuplicates: true 
  });
}
```

## Estimativa de Tempo

Antes de criar um script de importação, sempre:

1. Estimar quantidade de registros
2. Se > 1000 registros, OBRIGATORIAMENTE usar batch
3. Informar ao usuário tempo estimado de execução

## Verificação de Dados Existentes

Para evitar duplicatas:

1. Carregar IDs existentes em memória ANTES do loop (Set/Map)
2. NÃO fazer query individual para cada registro
