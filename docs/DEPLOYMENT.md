# INDICAGRO - Guia de Deploy para Produção

**Domínio:** indicagro.com.br  
**VPS:** Hostinger (72.61.35.22)  
**Stack:** Docker Compose + nginx + Let's Encrypt

---

## Pré-requisitos

No VPS já configurado (reutiliza setup do Folkor):
- ✅ Ubuntu 22.04 LTS
- ✅ Docker + Docker Compose
- ✅ nginx + certbot
- ✅ Git, UFW, Fail2ban

---

## 1. DNS (Hostinger ou registrar)

Adicione os registros DNS:

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| A | @ | 72.61.35.22 | 3600 |
| A | www | 72.61.35.22 | 3600 |

> Aguarde propagação (pode levar até 24h, geralmente 15min)

---

## 2. Deploy Inicial

```bash
# SSH no VPS
ssh root@72.61.35.22

# Clonar repositório
git clone https://github.com/geraldosnetto/agro.git /home/indicagro
cd /home/indicagro

# Criar arquivo de ambiente
cp .env.production.example .env.production
vim .env.production  # Configurar senhas

# Build e start containers
docker compose -f docker/docker-compose.production.yml build
docker compose -f docker/docker-compose.production.yml up -d

# Executar migrations
docker exec indicagro_web_prod npx prisma migrate deploy

# Executar seed (dados iniciais)
docker exec indicagro_web_prod npx prisma db seed

# Verificar containers
docker ps | grep indicagro
```

---

## 3. Configurar SSL

```bash
# Parar nginx temporariamente
systemctl stop nginx

# Gerar certificado
certbot certonly --standalone -d indicagro.com.br -d www.indicagro.com.br

# Copiar configuração nginx
cp /home/indicagro/nginx/nginx-indicagro-ssl.conf /etc/nginx/sites-available/indicagro.com.br
ln -s /etc/nginx/sites-available/indicagro.com.br /etc/nginx/sites-enabled/

# Testar e reiniciar nginx
nginx -t
systemctl start nginx
```

---

## 4. GitHub Actions Secrets

Configurar em **github.com/geraldosnetto/agro → Settings → Secrets → Actions**:

| Secret | Valor |
|--------|-------|
| `APP_URL` | `https://indicagro.com.br` |
| `CRON_SECRET` | (mesmo valor do .env.production) |

---

## 5. Verificação

```bash
# Testar HTTPS
curl -I https://indicagro.com.br

# Testar API
curl https://indicagro.com.br/api/cotacoes | jq

# Testar update manual
curl -X POST "https://indicagro.com.br/api/admin/update-prices" \
  -H "Authorization: Bearer SEU_CRON_SECRET"
```

---

## Deploy Contínuo

```bash
# No VPS
cd /home/indicagro
git pull origin main

# Rebuild se houve mudanças de código
docker compose -f docker/docker-compose.production.yml build
docker compose -f docker/docker-compose.production.yml up -d

# Se houve migrations
docker exec indicagro_web_prod npx prisma migrate deploy

# Verificar logs
docker logs -f indicagro_web_prod --tail 50
```

---

## Troubleshooting

### Container não inicia
```bash
docker logs indicagro_web_prod
```

### Erro de banco
```bash
docker exec -it indicagro_db_prod psql -U indicagro -d indicagro
```

### Renovar SSL
```bash
certbot renew --dry-run
```

---

## Portas Usadas

| Serviço | Porta Externa | Porta Interna |
|---------|---------------|---------------|
| PostgreSQL | 5433 | 5432 |
| Next.js | 3010 | 3000 |
| Folkor Web | 3004 | 3000 |
| Folkor API | 3005 | 3001 |
