// P4BA18: Verification Email Sender
// Description: Email verification library using Nodemailer

import nodemailer from 'nodemailer'

export class VerificationEmailSender {
  private transporter: nodemailer.Transporter | null = null

  constructor() {
    // Only create transporter if SMTP credentials are configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      })
    }
  }

  async sendVerificationEmail(
    email: string,
    politicianName: string,
    verificationCode: string
  ): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_USER || 'noreply@politicianfinder.kr',
      to: email,
      subject: `[정치인파인더] ${politicianName}님 본인 인증 요청`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif;
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
            .content {
              background: #ffffff;
              padding: 30px;
              border: 1px solid #e0e0e0;
              border-top: none;
            }
            .code-box {
              background: #f3f4f6;
              border: 2px solid #3b82f6;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              color: #3b82f6;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .footer {
              background: #f9fafb;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
              border-radius: 0 0 10px 10px;
              border: 1px solid #e0e0e0;
              border-top: none;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">정치인파인더</h1>
            <p style="margin: 10px 0 0 0;">정치인 본인 인증</p>
          </div>

          <div class="content">
            <h2>안녕하세요, ${politicianName}님</h2>
            <p>정치인파인더에서 정치인 프로필 본인 인증을 요청하셨습니다.</p>
            <p>아래 인증 코드를 입력하여 인증을 완료해주세요:</p>

            <div class="code-box">
              <div class="code">${verificationCode}</div>
              <p style="margin: 10px 0 0 0; color: #6b7280;">인증 코드</p>
            </div>

            <div class="warning">
              <strong>⏰ 유효 시간:</strong> 이 코드는 발송 시각으로부터 <strong>15분간</strong> 유효합니다.
            </div>

            <p>인증이 완료되면 귀하의 프로필에 <strong>"Verified"</strong> 배지가 표시됩니다.</p>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

            <p style="color: #6b7280; font-size: 14px;">
              본인이 요청하지 않은 경우, 이 이메일을 무시하셔도 됩니다.<br>
              문의사항이 있으시면 support@politicianfinder.kr로 연락주세요.
            </p>
          </div>

          <div class="footer">
            <p>© 2024 정치인파인더. All rights reserved.</p>
            <p>이 이메일은 발신 전용입니다. 회신하지 마세요.</p>
          </div>
        </body>
        </html>
      `,
      text: `
정치인파인더 - 정치인 본인 인증

안녕하세요, ${politicianName}님

정치인파인더에서 정치인 프로필 본인 인증을 요청하셨습니다.

인증 코드: ${verificationCode}

이 코드는 발송 시각으로부터 15분간 유효합니다.

인증이 완료되면 귀하의 프로필에 "Verified" 배지가 표시됩니다.

본인이 요청하지 않은 경우, 이 이메일을 무시하셔도 됩니다.

© 2024 정치인파인더
      `.trim()
    }

    // If transporter is not configured, log to console instead
    if (!this.transporter) {
      console.log('=====================================')
      console.log('SMTP not configured. Email would be sent:')
      console.log(`To: ${email}`)
      console.log(`Subject: ${mailOptions.subject}`)
      console.log(`Verification Code: ${verificationCode}`)
      console.log('=====================================')
      return
    }

    try {
      await this.transporter.sendMail(mailOptions)
      console.log(`Verification email sent successfully to ${email}`)
    } catch (error) {
      console.error('Failed to send verification email:', error)
      throw new Error('이메일 발송에 실패했습니다.')
    }
  }
}
