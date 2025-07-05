import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASS'),
      },
    });
  }

  async sendVerificationEmail(to: string, token: string) {
    const verificationLink = `${this.configService.get('SERVER_URL')}auth/verify?token=${token}`;

    console.log('verificationLink', verificationLink);
    const generateVerificationEmail = (verificationUrl: string) => `
      <div style="font-family: Arial, sans-serif; color: #000; padding: 20px;">
        <p>Dear Customer :</p>

        <p>Have a nice day!</p>

        <p>This is an automatic email, please do not reply.<br>
        If you have any questions, please contact 
          <a href="mailto:sales@yourcompany.com">sales@yourcompany.com</a> / 
          <a href="mailto:support@yourcompany.com">support@yourcompany.com</a>.
          Thank you !
        </p>

        <p style="margin-top: 20px;">
          Thank you for registering on <strong>YourCompany</strong> website<br>
          Please verify your email by clicking the link below:<br><br>
          <a href="${verificationUrl}" style="color: #0000EE;">${verificationUrl}</a>
        </p>

        <p style="margin-top: 40px;">Best Regards,</p>
      </div>
      `;

    await this.transporter.sendMail({
      from: this.configService.get('FROM_EMAIL'),
      to,
      subject: 'Verify Your Email',
      html: generateVerificationEmail(verificationLink),
    });
  }

  // email.service.ts or inside auth.service.ts
  generateResetPasswordEmail = (url: string) => `
      <div style="font-family: Arial; color: #000; padding: 20px;">
        <p>Dear Customer,</p>
        <p>We received a request to reset your password.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${url}" style="color: #1a73e8;">${url}</a></p>
        <p>If you did not request this, just ignore this email.</p>
        <p style="margin-top: 20px;">Best regards,<br/>YourCompany Team</p>
      </div>
      `;

  async sendResetEmail(email: string, token: string) {
    const url = `${this.configService.get('SERVER_URL')}reset-password?token=${token}`;
    const html = this.generateResetPasswordEmail(url);

    await this.transporter.sendMail({
      to: email,
      subject: 'Reset your password',
      html,
      from: process.env.FROM_EMAIL,
    });
  }
}
