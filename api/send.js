
// ── API Vercel Serverless Function ──
// Endpoint : POST /api/send

export default async function handler(req, res) {
    // Seul POST est accepté
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { to, title, message } = req.body;

    // Validation basique
    if (!to || !title || !message) {
        return res.status(400).json({ error: 'Champs manquants (to, title, message)' });
    }

    // Regex simple pour vérifier l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
        return res.status(400).json({ error: 'Email invalide' });
    }

    /*
    ════════════════════════════════════════════
    POUR UN VRAI ENVOI D'EMAIL (optionnel) :
    ════════════════════════════════════════════

    1. Installe Resend : npm install resend
       (ou ajoute "resend" dans package.json dependencies)

    2. Ajoute ces variables dans Vercel :
       - RESEND_API_KEY = re_xxxxx
       - TO_EMAIL = ton@email.com

    3. Décommente le code ci-dessous :

    import { Resend } from 'resend';
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        const { data, error } = await resend.emails.send({
            from: 'Mon Site <onboarding@resend.dev>',
            to: to,
            subject: title,
            text: message,
        });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({
            success: true,
            id: data.id,
            title: title,
            to: to
        });
    } catch (err) {
        return res.status(500).json({ error: 'Erreur serveur' });
    }
    */

    // ── MODE SIMULATION (par défaut, sans Resend) ──
    console.log('📧 Email simulé :');
    console.log('  → Destinataire :', to);
    console.log('  → Titre :', title);
    console.log('  → Message :', message.substring(0, 80) + '...');

    return res.status(200).json({
        success: true,
        simulated: true,
        title: title,
        to: to,
        note: 'Mode simulation. Branche Resend pour un vrai envoi.'
    });
}
