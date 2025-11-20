// P3BA1-HOOK: Send Email Hook - Custom email sending with correct redirect URL
/**
 * Supabase Send Email Hook - Edge Function
 *
 * Purpose: Override default Supabase email templates to use correct redirect URL
 * Problem: Default templates use {{ .SiteURL }} which doesn't respect emailRedirectTo
 * Solution: Use this hook to send emails with {{ .RedirectTo }} from emailRedirectTo parameter
 *
 * Documentation: https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
 */

import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SEND_EMAIL_HOOK_SECRET = Deno.env.get("SEND_EMAIL_HOOK_SECRET");

if (!RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is required");
}

if (!SEND_EMAIL_HOOK_SECRET) {
  throw new Error("SEND_EMAIL_HOOK_SECRET is required");
}

// Remove "v1,whsec_" prefix from the secret
const hookSecret = SEND_EMAIL_HOOK_SECRET.replace("v1,whsec_", "");

interface EmailData {
  token: string;
  token_hash: string;
  redirect_to: string;
  email_action_type: 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change';
  site_url: string;
  token_new?: string;
  token_hash_new?: string;
}

interface WebhookPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      name?: string;
    };
  };
  email_data: EmailData;
}

/**
 * Send email via Resend API
 */
async function sendEmailViaResend(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "PoliticianFinder <noreply@politicianfinder.ai.kr>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Resend API error:", errorData);
      return { success: false, error: JSON.stringify(errorData) };
    }

    const result = await response.json();
    console.log("Email sent successfully via Resend:", result);
    return { success: true };
  } catch (error) {
    console.error("Failed to send email via Resend:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Generate email HTML based on action type
 */
function generateEmailHTML(email_data: EmailData, userEmail: string): { subject: string; html: string } {
  const { email_action_type, redirect_to } = email_data;

  switch (email_action_type) {
    case 'signup':
      return {
        subject: '이메일 인증을 완료해 주세요 - PoliticianFinder',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
                .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
                .button:hover { background: #5568d3; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                .info-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎯 PoliticianFinder</h1>
                  <p>회원가입을 환영합니다!</p>
                </div>
                <div class="content">
                  <h2>이메일 인증</h2>
                  <p>안녕하세요! <strong>${userEmail}</strong>님,</p>
                  <p>PoliticianFinder에 가입해 주셔서 감사합니다. 아래 버튼을 클릭하여 이메일 인증을 완료해 주세요.</p>

                  <div style="text-align: center;">
                    <a href="${redirect_to}" class="button">이메일 인증하기</a>
                  </div>

                  <div class="info-box">
                    <p><strong>💡 참고사항:</strong></p>
                    <ul>
                      <li>이 링크는 24시간 동안 유효합니다</li>
                      <li>한 번만 사용할 수 있습니다</li>
                      <li>본인이 요청하지 않았다면 이 이메일을 무시하세요</li>
                    </ul>
                  </div>

                  <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br>
                    <code style="background: #f4f4f4; padding: 8px; display: block; margin-top: 10px; word-break: break-all;">${redirect_to}</code>
                  </p>
                </div>
                <div class="footer">
                  <p>© 2025 PoliticianFinder. All rights reserved.</p>
                  <p>이 이메일은 <a href="https://www.politicianfinder.ai.kr">www.politicianfinder.ai.kr</a>에서 발송되었습니다.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      };

    case 'recovery':
      return {
        subject: '비밀번호 재설정 - PoliticianFinder',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
                .button { display: inline-block; background: #f5576c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
                .button:hover { background: #e04658; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                .warning-box { background: #fff3cd; border-left: 4px solid #f5576c; padding: 15px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔐 비밀번호 재설정</h1>
                </div>
                <div class="content">
                  <h2>비밀번호 재설정 요청</h2>
                  <p>안녕하세요! <strong>${userEmail}</strong>님,</p>
                  <p>비밀번호 재설정 요청을 받았습니다. 아래 버튼을 클릭하여 새 비밀번호를 설정하세요.</p>

                  <div style="text-align: center;">
                    <a href="${redirect_to}" class="button">비밀번호 재설정</a>
                  </div>

                  <div class="warning-box">
                    <p><strong>⚠️ 보안 알림:</strong></p>
                    <ul>
                      <li>이 링크는 1시간 동안 유효합니다</li>
                      <li>한 번만 사용할 수 있습니다</li>
                      <li>본인이 요청하지 않았다면 즉시 계정을 확인하세요</li>
                    </ul>
                  </div>

                  <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br>
                    <code style="background: #f4f4f4; padding: 8px; display: block; margin-top: 10px; word-break: break-all;">${redirect_to}</code>
                  </p>
                </div>
                <div class="footer">
                  <p>© 2025 PoliticianFinder. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      };

    case 'magiclink':
      return {
        subject: '로그인 링크 - PoliticianFinder',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
                .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>✨ Magic Link 로그인</h1>
                </div>
                <div class="content">
                  <p>안녕하세요! <strong>${userEmail}</strong>님,</p>
                  <p>아래 버튼을 클릭하여 로그인하세요.</p>

                  <div style="text-align: center;">
                    <a href="${redirect_to}" class="button">로그인하기</a>
                  </div>

                  <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    이 링크는 1시간 동안 유효하며, 한 번만 사용할 수 있습니다.<br>
                    본인이 요청하지 않았다면 이 이메일을 무시하세요.
                  </p>
                </div>
                <div class="footer">
                  <p>© 2025 PoliticianFinder. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      };

    default:
      return {
        subject: 'PoliticianFinder 알림',
        html: `
          <!DOCTYPE html>
          <html>
            <body>
              <p>안녕하세요! ${userEmail}님,</p>
              <p><a href="${redirect_to}">여기를 클릭</a>하여 계속 진행하세요.</p>
            </body>
          </html>
        `,
      };
  }
}

/**
 * Main handler
 */
Deno.serve(async (req) => {
  try {
    // Verify webhook signature
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);

    const wh = new Webhook(hookSecret);
    const { user, email_data } = wh.verify(payload, headers) as WebhookPayload;

    console.log("Webhook verified - Email action:", email_data.email_action_type);
    console.log("Redirect URL:", email_data.redirect_to);
    console.log("User email:", user.email);

    // Generate email content
    const { subject, html } = generateEmailHTML(email_data, user.email);

    // Send email via Resend
    const result = await sendEmailViaResend(user.email, subject, html);

    if (!result.success) {
      console.error("Failed to send email:", result.error);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: result.error }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Email sent successfully to:", user.email);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-email-hook:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
