/**
 * Biblioteca de Email - Resend
 * 
 * Centraliza o envio de emails transacionais.
 */

import { Resend } from 'resend';

// Lazy initialization do cliente Resend
let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[EMAIL] RESEND_API_KEY não configurada');
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// Configurações
const FROM_EMAIL = process.env.EMAIL_FROM || 'IndicAgro <noreply@indicagro.com.br>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://indicagro.com.br';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Envia um email genérico
 */
export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const client = getResendClient();

  if (!client) {
    console.warn('[EMAIL] Resend não configurado, email não enviado:', { to, subject });
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[EMAIL] Erro ao enviar:', error);
      return { success: false, error };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[EMAIL] Exceção ao enviar:', err);
    return { success: false, error: err };
  }
}

/**
 * Email de verificação de conta
 */
export async function sendVerificationEmail(email: string, token: string, name?: string) {
  const verifyUrl = `${APP_URL}/verificar-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; padding: 40px 20px; }
        .container { max-width: 560px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; }
        .logo { font-size: 24px; font-weight: bold; color: #16a34a; margin-bottom: 24px; }
        h1 { font-size: 20px; color: #18181b; margin-bottom: 16px; }
        p { color: #52525b; line-height: 1.6; margin-bottom: 16px; }
        .button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; }
        .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e4e4e7; font-size: 12px; color: #71717a; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🌾 IndicAgro</div>
        <h1>Verifique seu email</h1>
        <p>Olá${name ? ` ${name}` : ''},</p>
        <p>Obrigado por se cadastrar no IndicAgro! Para ativar sua conta e acessar todas as funcionalidades, clique no botão abaixo:</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}" class="button">Verificar meu email</a>
        </p>
        <p>Se você não criou uma conta no IndicAgro, ignore este email.</p>
        <p>Este link expira em 24 horas.</p>
        <div class="footer">
          <p>IndicAgro - Cotações de commodities agrícolas em tempo real</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Verifique seu email - IndicAgro',
    html,
  });
}

/**
 * Email de reset de senha
 */
export async function sendPasswordResetEmail(email: string, token: string, name?: string) {
  const resetUrl = `${APP_URL}/redefinir-senha?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; padding: 40px 20px; }
        .container { max-width: 560px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; }
        .logo { font-size: 24px; font-weight: bold; color: #16a34a; margin-bottom: 24px; }
        h1 { font-size: 20px; color: #18181b; margin-bottom: 16px; }
        p { color: #52525b; line-height: 1.6; margin-bottom: 16px; }
        .button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; }
        .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e4e4e7; font-size: 12px; color: #71717a; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🌾 IndicAgro</div>
        <h1>Redefinir senha</h1>
        <p>Olá${name ? ` ${name}` : ''},</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha:</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" class="button">Redefinir minha senha</a>
        </p>
        <p>Se você não solicitou isso, ignore este email. Sua senha continuará a mesma.</p>
        <p>Este link expira em 1 hora.</p>
        <div class="footer">
          <p>IndicAgro - Cotações de commodities agrícolas em tempo real</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Redefinir senha - IndicAgro',
    html,
  });
}

/**
 * Email de notificação de alerta de preço
 */
export async function sendAlertNotificationEmail(
  email: string,
  commodityName: string,
  alertType: string,
  targetValue: number,
  currentValue: number,
  name?: string
) {
  const alertTypeLabels: Record<string, string> = {
    ACIMA: 'acima de',
    ABAIXO: 'abaixo de',
    VARIACAO: 'com variação de',
  };

  const alertLabel = alertTypeLabels[alertType] || alertType;
  const priceChange = currentValue - targetValue;
  const isUp = priceChange >= 0;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; padding: 40px 20px; }
        .container { max-width: 560px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; }
        .logo { font-size: 24px; font-weight: bold; color: #16a34a; margin-bottom: 24px; }
        h1 { font-size: 20px; color: #18181b; margin-bottom: 16px; }
        p { color: #52525b; line-height: 1.6; margin-bottom: 16px; }
        .price-box { background: #f4f4f5; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0; }
        .price { font-size: 32px; font-weight: bold; color: #18181b; }
        .change { font-size: 14px; color: ${isUp ? '#16a34a' : '#dc2626'}; margin-top: 8px; }
        .button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; }
        .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e4e4e7; font-size: 12px; color: #71717a; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🌾 IndicAgro</div>
        <h1>🔔 Alerta de Preço: ${commodityName}</h1>
        <p>Olá${name ? ` ${name}` : ''},</p>
        <p>O preço de <strong>${commodityName}</strong> atingiu a condição do seu alerta (${alertLabel} R$ ${targetValue.toFixed(2)}).</p>
        <div class="price-box">
          <div class="price">R$ ${currentValue.toFixed(2)}</div>
          <div class="change">${isUp ? '▲' : '▼'} ${isUp ? '+' : ''}${priceChange.toFixed(2)}</div>
        </div>
        <p style="text-align: center;">
          <a href="${APP_URL}/cotacoes/${commodityName.toLowerCase().replace(/\s+/g, '-')}" class="button">Ver cotação completa</a>
        </p>
        <div class="footer">
          <p>Você recebeu este email porque configurou um alerta de preço no IndicAgro.</p>
          <p><a href="${APP_URL}/alertas">Gerenciar meus alertas</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `🔔 Alerta: ${commodityName} ${alertLabel} R$ ${targetValue.toFixed(2)}`,
    html,
  });
}
