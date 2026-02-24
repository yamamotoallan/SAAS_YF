import fs from 'fs';
import path from 'path';

/**
 * Service to handle email sending.
 * In development mode, it logs emails to terminal and a local file.
 */
export const MailService = {
    async send({ to, subject, body }: { to: string; subject: string; body: string }) {
        console.log(`[MAIL] Sending to: ${to}`);
        console.log(`[MAIL] Subject: ${subject}`);
        console.log(`[MAIL] Body: ${body}`);

        // Also save to a local file for verification if running headlessly
        const logDir = path.join(process.cwd(), 'temp', 'mail-logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        const filename = `${new Date().getTime()}-${to}.txt`;
        const content = `TO: ${to}\nSUBJECT: ${subject}\n\n${body}`;

        fs.writeFileSync(path.join(logDir, filename), content);
    },

    async sendPasswordReset(email: string, token: string) {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

        await this.send({
            to: email,
            subject: 'Recuperação de Senha - SAAS_YF',
            body: `Você solicitou a recuperação de senha no sistema SAAS_YF.\n\nClique no link abaixo para definir uma nova senha (válido por 15 minutos):\n${resetUrl}\n\nSe você não solicitou isso, ignore este e-mail.`
        });
    }
};
