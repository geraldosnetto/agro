#!/bin/bash
# Cron job para atualizar preços do CEPEA - IndicAgro
# Adicionar ao crontab: 0 18 * * 1-5 /opt/indicagro/scripts/cron-update-prices.sh
# Roda às 18:00 de segunda a sexta (após fechamento CEPEA)

APP_URL="https://indicagro.com.br"
CRON_SECRET="pgGbhwtUQkla1JhlmHaae2GuKhJf9j2qNcZZx5AjIXg="
LOG_FILE="/var/log/indicagro-cron.log"

echo "$(date '+%Y-%m-%d %H:%M:%S') - Iniciando atualização de preços" >> "$LOG_FILE"

RESPONSE=$(curl -s -X POST "$APP_URL/api/admin/update-prices" \
    -H "Authorization: Bearer $CRON_SECRET" \
    -H "Content-Type: application/json" \
    --max-time 300)

echo "$(date '+%Y-%m-%d %H:%M:%S') - Resposta: $RESPONSE" >> "$LOG_FILE"
