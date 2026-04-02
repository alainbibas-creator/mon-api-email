// ── API Vercel Serverless Function ──
// Endpoint : POST /api/send
// Variables d'environnement requises (Vercel Dashboard → Settings → Environment Variables) :
//   RESEND_API_KEY  → clé API Resend (re_xxxxxxxxxxxx)
//   FROM_EMAIL      → adresse expéditeur vérifiée dans Resend  (ex: no-reply@tondomaine.com)

import { Resend } from 'resend';

export default async function handler(req, res) {
    // Seul POST est accepté
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { to, title, message } = req.body ?? {};

    // Validation des champs
    if (!to || !title || !message) {
        return res.status(400).json({ error: 'Champs manquants (to, title, message)' });
    }

    // Regex simple pour vérifier l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
        return res.status(400).json({ error: 'Email invalide' });
    }

    if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'Titre invalide' });
    }

    if (typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message invalide' });
    }

    // Vérification de la clé API
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL ?? 'onboarding@resend.dev';

    if (!apiKey) {
        console.error('RESEND_API_KEY manquante — passage en mode simulation');
        return res.status(200).json({
            success: true,
            simulated: true,
            title: title.trim(),
            to,
            note: 'Mode simulation : configurez RESEND_API_KEY dans les variables d\'environnement Vercel.',
        });
    }

    const resend = new Resend(apiKey);

    // Corps HTML de l'email
    const htmlBody = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;background:#f4f4f5;padding:32px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
    <h2 style="margin:0 0 16px;color:#0e0f11;">${escapeHtml(title.trim())}</h2>
    <p style="color:#374151;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message.trim())}</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
    <p style="color:#9ca3af;font-size:0.8rem;">Envoyé via mon-api-email</p>
  </div>
</body>
</html>`;

    try {
        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to,
            subject: title.trim(),
            text: message.trim(),
            html: htmlBody,
        });

        if (error) {
            console.error('Erreur Resend :', error);
            return res.status(502).json({ error: error.message ?? 'Erreur lors de l\'envoi.' });
        }

        return res.status(200).json({
            success: true,
            id: data.id,
            title: title.trim(),
            to,
        });
    } catch (err) {
        console.error('Erreur serveur :', err);
        return res.status(500).json({ error: 'Erreur serveur inattendue.' });
    }
}

// Utilitaire : échappe les caractères HTML pour éviter les injections XSS dans le corps de l'email
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
