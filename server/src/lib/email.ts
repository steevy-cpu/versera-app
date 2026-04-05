import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(
  to: string,
  name: string
) {
  return resend.emails.send({
    from: 'Versera <hello@versera.dev>',
    to,
    subject: 'Welcome to Versera 🚀',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Inter, sans-serif;
        background: #0a0a0a; color: #ffffff;
        padding: 40px; max-width: 560px; margin: 0 auto;">

        <h1 style="color: #7F77DD; font-size: 24px;
          margin-bottom: 8px;">
          Welcome to Versera, ${name}
        </h1>

        <p style="color: #888; margin-bottom: 24px;">
          You're all set. Here's everything you need
          to get started.
        </p>

        <div style="background: #111; border-radius: 8px;
          padding: 24px; margin-bottom: 24px;">
          <h2 style="font-size: 16px; margin-bottom: 16px;">
            Your quick start checklist
          </h2>
          <p style="color: #ccc; margin: 8px 0;">
            ✓ Account created — 1,000 free credits included
          </p>
          <p style="color: #ccc; margin: 8px 0;">
            → Create your first prompt in the dashboard
          </p>
          <p style="color: #ccc; margin: 8px 0;">
            → Generate an API key
          </p>
          <p style="color: #ccc; margin: 8px 0;">
            → Make your first resolve call
          </p>
        </div>

        <a href="https://versera.dev/dashboard"
          style="background: #7F77DD; color: white;
          padding: 12px 24px; border-radius: 6px;
          text-decoration: none; display: inline-block;
          margin-bottom: 32px;">
          Go to dashboard →
        </a>

        <div style="border-top: 1px solid #222;
          padding-top: 24px;">
          <p style="color: #555; font-size: 13px;">
            Read the docs at
            <a href="https://versera.dev/docs"
              style="color: #7F77DD;">
              versera.dev/docs
            </a>
          </p>
          <p style="color: #555; font-size: 13px;">
            Questions? Reply to this email or reach us
            at hello@versera.dev
          </p>
          <p style="color: #333; font-size: 12px;
            margin-top: 16px;">
            Versera · Prompt version control for LLM apps
            <br>
            <a href="https://versera.dev/unsubscribe"
              style="color: #444;">Unsubscribe</a>
          </p>
        </div>
      </body>
      </html>
    `
  })
}

export async function sendLowCreditsEmail(
  to: string,
  name: string,
  creditsRemaining: number
) {
  return resend.emails.send({
    from: 'Versera <hello@versera.dev>',
    to,
    subject: `You have ${creditsRemaining} credits remaining`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Inter, sans-serif;
        background: #0a0a0a; color: #ffffff;
        padding: 40px; max-width: 560px; margin: 0 auto;">

        <h1 style="color: #7F77DD; font-size: 24px;">
          Running low on credits
        </h1>

        <p style="color: #888;">
          Hi ${name}, your Versera account has
          ${creditsRemaining} credits remaining.
        </p>

        <div style="background: #111; border-radius: 8px;
          padding: 24px; margin: 24px 0;">
          <p style="color: #EF9F27; font-size: 32px;
            font-weight: bold; margin: 0;">
            ${creditsRemaining} credits left
          </p>
          <p style="color: #888; margin: 8px 0 0;">
            Each resolve call costs 1 credit.
            Top up to keep your app running smoothly.
          </p>
        </div>

        <a href="https://versera.dev/billing"
          style="background: #7F77DD; color: white;
          padding: 12px 24px; border-radius: 6px;
          text-decoration: none; display: inline-block;
          margin-bottom: 32px;">
          Buy more credits →
        </a>

        <div style="border-top: 1px solid #222;
          padding-top: 24px;">
          <p style="color: #333; font-size: 12px;">
            Versera · Prompt version control for LLM apps
            <br>
            <a href="https://versera.dev/unsubscribe"
              style="color: #444;">Unsubscribe</a>
          </p>
        </div>
      </body>
      </html>
    `
  })
}

export async function sendAccountDeletionEmail(
  to: string,
  name: string
) {
  return resend.emails.send({
    from: 'Versera <hello@versera.dev>',
    to,
    subject: 'Your Versera account has been deleted',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Inter, sans-serif;
        background: #0a0a0a; color: #ffffff;
        padding: 40px; max-width: 560px; margin: 0 auto;">

        <h1 style="color: #7F77DD; font-size: 24px;">
          Account deleted
        </h1>

        <p style="color: #888;">
          Hi ${name}, your Versera account and all
          associated data have been permanently deleted.
        </p>

        <div style="background: #111; border-radius: 8px;
          padding: 24px; margin: 24px 0;">
          <p style="color: #ccc; margin: 8px 0;">
            ✓ Account deleted
          </p>
          <p style="color: #ccc; margin: 8px 0;">
            ✓ All prompts and versions deleted
          </p>
          <p style="color: #ccc; margin: 8px 0;">
            ✓ All API keys revoked
          </p>
          <p style="color: #ccc; margin: 8px 0;">
            ✓ Billing data removed
          </p>
        </div>

        <p style="color: #888;">
          We're sorry to see you go. If you change
          your mind, you can always create a new
          account at versera.dev
        </p>

        <p style="color: #555; font-size: 13px;">
          If you didn't request this deletion,
          contact us immediately at hello@versera.dev
        </p>

        <div style="border-top: 1px solid #222;
          padding-top: 24px; margin-top: 24px;">
          <p style="color: #333; font-size: 12px;">
            Versera · Prompt version control for LLM apps
          </p>
        </div>
      </body>
      </html>
    `
  })
}
