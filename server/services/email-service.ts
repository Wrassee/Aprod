import nodemailer from 'nodemailer';

interface EmailOptions {
  recipient: string;
  language: string;
  protocolPdf: Buffer;
  errorListPdf?: Buffer | null;
  receptionDate: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter() {
    if (!this.transporter) {
      const gmailUser = process.env.GMAIL_USER;
      const gmailPass = process.env.GMAIL_PASS;

      if (!gmailUser || !gmailPass) {
        throw new Error('GMAIL_USER or GMAIL_PASS environment variables are not set');
      }

      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });
    }
    return this.transporter;
  }

  async sendProtocolEmail(options: EmailOptions): Promise<void> {
    try {
      const gmailUser = process.env.GMAIL_USER;
      const gmailPass = process.env.GMAIL_PASS;

      if (!gmailUser || !gmailPass) {
        console.log('GMAIL_USER or GMAIL_PASS not found, using mock email service');
        console.log('Sending email to:', options.recipient);
        console.log('Language:', options.language);
        console.log('Reception date:', options.receptionDate);
        console.log('Protocol PDF size:', options.protocolPdf.length);
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Email sent successfully (mock)');
        return;
      }

      const transporter = this.getTransporter();
      const emailContent = this.getEmailContent(options.language, options.receptionDate);
      
      const attachments: nodemailer.SendMailOptions['attachments'] = [
        {
          filename: `OTIS-Protocol-${options.receptionDate}.pdf`,
          content: options.protocolPdf,
        }
      ];

      if (options.errorListPdf) {
        attachments.push({
          filename: `OTIS-ErrorList-${options.receptionDate}.pdf`,
          content: options.errorListPdf,
        });
      }

      const mailOptions: nodemailer.SendMailOptions = {
        from: gmailUser,
        to: options.recipient,
        subject: emailContent.subject,
        html: emailContent.body,
        attachments,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully via Gmail SMTP:', result.messageId);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email: ' + (error as Error).message);
    }
  }

  private getEmailContent(language: string, receptionDate: string) {
    const templates = {
      hu: {
        subject: `OTIS Átvételi Protokoll - ${receptionDate}`,
        body: `
          Tisztelt Címzett,
          
          Csatolva találja az OTIS lift átvételi protokollt.
          Átvétel dátuma: ${receptionDate}
          
          Üdvözlettel,
          OTIS Csapat
        `
      },
      de: {
        subject: `OTIS Abnahmeprotokoll - ${receptionDate}`,
        body: `
          Sehr geehrte Damen und Herren,
          
          Anbei finden Sie das OTIS Aufzug-Abnahmeprotokoll.
          Abnahmedatum: ${receptionDate}
          
          Mit freundlichen Grüßen,
          OTIS Team
        `
      }
    };

    return templates[language as keyof typeof templates] || templates.de;
  }
}

export const emailService = new EmailService();
