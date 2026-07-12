import nodemailer from 'nodemailer';
import { config } from '../config';

let transporter: nodemailer.Transporter | null = null;

export function getEmailTransporter() {
  if (transporter) return transporter;

  if (!config.email.user || !config.email.pass) {
    console.warn('Email credentials not configured. Email OTP will be disabled.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });

  return transporter;
}

export async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  const transport = getEmailTransporter();
  if (!transport) {
    console.warn('Email transporter not available, cannot send OTP email');
    return false;
  }

  try {
    await transport.sendMail({
      from: config.email.from,
      to: email,
      subject: 'Your Discover SMEs Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1B5E20;">Verify Your Account</h2>
          <p>Your verification code is:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in ${config.otp.expiryMinutes} minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return false;
  }
}
