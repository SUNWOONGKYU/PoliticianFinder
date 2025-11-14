// Email service utility using Resend
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendInquiryResponseEmailParams {
  to: string;
  inquiryTitle: string;
  inquiryContent: string;
  adminResponse: string;
  inquiryId: string;
}

export async function sendInquiryResponseEmail({
  to,
  inquiryTitle,
  inquiryContent,
  adminResponse,
  inquiryId,
}: SendInquiryResponseEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: "PoliticianFinder <noreply@politicianfinder.com>",
      to: [to],
      subject: `[PoliticianFinder] 문의 답변: ${inquiryTitle}`,
      html: `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .inquiry-box {
      background: white;
      padding: 20px;
      border-left: 4px solid #667eea;
      margin-bottom: 20px;
      border-radius: 5px;
    }
    .inquiry-box h3 {
      margin-top: 0;
      color: #667eea;
    }
    .response-box {
      background: white;
      padding: 20px;
      border-left: 4px solid #10b981;
      border-radius: 5px;
      margin-top: 20px;
    }
    .response-box h3 {
      margin-top: 0;
      color: #10b981;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding: 20px;
      color: #666;
      font-size: 14px;
      border-top: 1px solid #e0e0e0;
    }
    .label {
      font-weight: bold;
      color: #666;
      font-size: 14px;
      margin-bottom: 5px;
    }
    .value {
      color: #333;
      white-space: pre-wrap;
      line-height: 1.8;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏛️ PoliticianFinder</h1>
    <p style="margin: 10px 0 0 0;">문의하신 내용에 대한 답변이 도착했습니다</p>
  </div>

  <div class="content">
    <p>안녕하세요,</p>
    <p>고객님께서 문의하신 내용에 대한 답변을 보내드립니다.</p>

    <div class="inquiry-box">
      <h3>📝 원래 문의 내용</h3>
      <div class="label">제목:</div>
      <div class="value">${inquiryTitle}</div>
      <br>
      <div class="label">내용:</div>
      <div class="value">${inquiryContent}</div>
    </div>

    <div class="response-box">
      <h3>💬 관리자 답변</h3>
      <div class="value">${adminResponse}</div>
    </div>

    <p style="margin-top: 30px;">
      추가 문의사항이 있으시면 언제든지 연락 주시기 바랍니다.
    </p>

    <center>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://politicianfinder.com"}" class="button">
        사이트 방문하기
      </a>
    </center>
  </div>

  <div class="footer">
    <p>이 이메일은 PoliticianFinder의 문의 답변 서비스에서 자동으로 발송되었습니다.</p>
    <p>답장이 필요하신 경우 웹사이트를 통해 새로운 문의를 남겨주세요.</p>
    <p style="margin-top: 20px; font-size: 12px; color: #999;">
      © 2025 PoliticianFinder. All rights reserved.
    </p>
  </div>
</body>
</html>
      `,
    });

    if (error) {
      console.error("Failed to send email:", error);
      return { success: false, error };
    }

    console.log("Email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Email service error:", error);
    return { success: false, error };
  }
}
