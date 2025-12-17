import nodemailer from 'nodemailer';

interface EmailOptions {
  recipient: string;
  language: string;
  protocolPdf: Buffer | null;
  groundingPdf?: Buffer | null;
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
        console.log('Protocol PDF:', options.protocolPdf ? `${options.protocolPdf.length} bytes` : 'not attached');
        console.log('Grounding PDF:', options.groundingPdf ? `${options.groundingPdf.length} bytes` : 'not attached');
        console.log('Error List PDF:', options.errorListPdf ? `${options.errorListPdf.length} bytes` : 'not attached');
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Email sent successfully (mock)');
        return;
      }

      const transporter = this.getTransporter();
      const emailContent = this.getEmailContent(options.language, options.receptionDate, {
        hasProtocol: !!options.protocolPdf,
        hasGrounding: !!options.groundingPdf,
        hasErrorList: !!options.errorListPdf,
      });
      
      const attachments: nodemailer.SendMailOptions['attachments'] = [];

      if (options.protocolPdf) {
        attachments.push({
          filename: `OTIS-Protocol-${options.receptionDate}.pdf`,
          content: options.protocolPdf,
        });
      }

      if (options.groundingPdf) {
        attachments.push({
          filename: `OTIS-Grounding-${options.receptionDate}.pdf`,
          content: options.groundingPdf,
        });
      }

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

  private getEmailContent(language: string, receptionDate: string, attached: { hasProtocol: boolean; hasGrounding: boolean; hasErrorList: boolean }) {
    const attachmentList = this.getAttachmentListText(language, attached);
    
    const templates: Record<string, { subject: string; body: string }> = {
      hu: {
        subject: `OTIS Átvételi Protokoll - ${receptionDate}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a365d;">OTIS Lift Átvételi Dokumentumok</h2>
            <p>Tisztelt Címzett,</p>
            <p>Csatolva találja az OTIS lift dokumentumokat.</p>
            <p><strong>Átvétel dátuma:</strong> ${receptionDate}</p>
            <p><strong>Csatolt dokumentumok:</strong></p>
            ${attachmentList}
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
            <p style="color: #718096; font-size: 14px;">Üdvözlettel,<br>OTIS Csapat</p>
          </div>
        `
      },
      de: {
        subject: `OTIS Abnahmeprotokoll - ${receptionDate}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a365d;">OTIS Aufzug Abnahmedokumente</h2>
            <p>Sehr geehrte Damen und Herren,</p>
            <p>Anbei finden Sie die OTIS Aufzug-Dokumente.</p>
            <p><strong>Abnahmedatum:</strong> ${receptionDate}</p>
            <p><strong>Angehängte Dokumente:</strong></p>
            ${attachmentList}
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
            <p style="color: #718096; font-size: 14px;">Mit freundlichen Grüßen,<br>OTIS Team</p>
          </div>
        `
      },
      en: {
        subject: `OTIS Acceptance Protocol - ${receptionDate}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a365d;">OTIS Elevator Acceptance Documents</h2>
            <p>Dear Recipient,</p>
            <p>Please find attached the OTIS elevator documents.</p>
            <p><strong>Acceptance date:</strong> ${receptionDate}</p>
            <p><strong>Attached documents:</strong></p>
            ${attachmentList}
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
            <p style="color: #718096; font-size: 14px;">Best regards,<br>OTIS Team</p>
          </div>
        `
      },
      fr: {
        subject: `Protocole de réception OTIS - ${receptionDate}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a365d;">Documents de réception d'ascenseur OTIS</h2>
            <p>Cher destinataire,</p>
            <p>Veuillez trouver ci-joint les documents de l'ascenseur OTIS.</p>
            <p><strong>Date de réception:</strong> ${receptionDate}</p>
            <p><strong>Documents joints:</strong></p>
            ${attachmentList}
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
            <p style="color: #718096; font-size: 14px;">Cordialement,<br>Équipe OTIS</p>
          </div>
        `
      },
      it: {
        subject: `Protocollo di accettazione OTIS - ${receptionDate}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a365d;">Documenti di accettazione ascensore OTIS</h2>
            <p>Gentile destinatario,</p>
            <p>In allegato trova i documenti dell'ascensore OTIS.</p>
            <p><strong>Data di accettazione:</strong> ${receptionDate}</p>
            <p><strong>Documenti allegati:</strong></p>
            ${attachmentList}
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
            <p style="color: #718096; font-size: 14px;">Cordiali saluti,<br>Team OTIS</p>
          </div>
        `
      }
    };

    return templates[language] || templates.de;
  }

  private getAttachmentListText(language: string, attached: { hasProtocol: boolean; hasGrounding: boolean; hasErrorList: boolean }): string {
    const labels: Record<string, { protocol: string; grounding: string; errorList: string }> = {
      hu: { protocol: 'Átvételi protokoll', grounding: 'Földelési ellenállás mérés', errorList: 'Hibalista' },
      de: { protocol: 'Abnahmeprotokoll', grounding: 'Erdungswiderstandsmessung', errorList: 'Fehlerliste' },
      en: { protocol: 'Acceptance Protocol', grounding: 'Grounding Resistance Measurement', errorList: 'Error List' },
      fr: { protocol: 'Protocole de réception', grounding: 'Mesure de résistance de mise à la terre', errorList: 'Liste des erreurs' },
      it: { protocol: 'Protocollo di accettazione', grounding: 'Misurazione resistenza di messa a terra', errorList: 'Elenco errori' },
    };

    const lang = labels[language] || labels.de;
    const items: string[] = [];

    if (attached.hasProtocol) items.push(`<li>${lang.protocol}</li>`);
    if (attached.hasGrounding) items.push(`<li>${lang.grounding}</li>`);
    if (attached.hasErrorList) items.push(`<li>${lang.errorList}</li>`);

    return `<ul style="color: #4a5568;">${items.join('')}</ul>`;
  }
}

export const emailService = new EmailService();
