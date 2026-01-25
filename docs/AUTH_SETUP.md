# Configuração de Autenticação (OAuth)

Para que o login com Google e GitHub funcione, você precisa criar "Aplicativos" nas plataformas de desenvolvedor de cada serviço.

## 1. Google (Gmail/Youtube)

**Onde:** [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

1. Crie um **Novo Projeto** (ex: "IndicAgro").
2. Vá em **APIs e Serviços** > **Tela de permissão OAuth**.
   - Tipo: **Externo**.
   - Preencha Nome ("IndicAgro"), Email de suporte e Email de contato.
   - Clique em Salvar e Continuar (pode pular Escopos por enquanto, ou adicionar `userinfo.email` e `userinfo.profile`).
3. Vá em **Credenciais** > **Criar Credenciais** > **ID do cliente OAuth**.
   - Tipo de Aplicativo: **Aplicação da Web**.
   - Nome: "IndicAgro Web".
   - **Origens JavaScript autorizadas:**
     - `http://localhost:3000` (Dev)
     - `https://indicagro.com.br` (Prod)
   - **URIs de redirecionamento autorizados:**
     - `http://localhost:3000/api/auth/callback/google` (Dev)
     - `https://indicagro.com.br/api/auth/callback/google` (Prod)
4. Copie o **ID do Cliente** e a **Chave Secreta** e cole no seu `.env`.

---

## 2. GitHub

**Onde:** [GitHub Developer Settings](https://github.com/settings/developers)

1. Vá em **OAuth Apps** > **New OAuth App**.
2. Preencha:
   - **Application Name:** IndicAgro
   - **Homepage URL:** `https://indicagro.com.br` (ou `http://localhost:3000` para teste local, mas o GitHub permite apenas uma URL principal. Recomendo criar dois apps: "IndicAgro Dev" e "IndicAgro Prod" se quiser testar local).
   - **Authorization callback URL:**
     - `http://localhost:3000/api/auth/callback/github` (Para Dev)
     - OU `https://indicagro.com.br/api/auth/callback/github` (Para Prod)
3. Clique em **Register application**.
4. Copie o **Client ID**.
5. Clique em **Generate a new client secret** para pegar o Secret.
6. Cole no seu `.env`.

## Exemplo no .env

```env
# Google
GOOGLE_CLIENT_ID="seu-id-do-google..."
GOOGLE_CLIENT_SECRET="seu-segredo-do-google..."

# GitHub
GITHUB_CLIENT_ID="seu-id-do-github..."
GITHUB_CLIENT_SECRET="seu-segredo-do-github..."
```
