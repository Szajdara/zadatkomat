import type { Booking, Studio } from './types';
import { escapeHtml, sanitizeText } from './security';

export async function sendBookingConfirmationEmail(params: {
  to?: string;
  booking: Booking;
  studio?: Studio;
  apiKey?: string;
}): Promise<{ sent: boolean; provider: 'resend' | 'skipped' }> {
  const key = params.apiKey?.trim() || process.env.RESEND_API_KEY?.trim();
  const to = params.to?.trim();
  if (!key || !to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { sent: false, provider: 'skipped' };
  }

  const clientName = escapeHtml(params.booking.clientName);
  const studioName = escapeHtml(params.booking.studioName);
  const serviceName = escapeHtml(params.booking.serviceName);
  const date = escapeHtml(params.booking.date);
  const time = escapeHtml(params.booking.time);
  const shortCode = escapeHtml(params.booking.shortCode);
  const depositAmount = escapeHtml(String(params.booking.depositAmount));
  const studioPhone = escapeHtml(params.studio?.phone ?? '');
  const studioCity = escapeHtml(params.studio?.city ?? '');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Zadatkomat <powiadomienia@zadatkomat.pl>',
        to: [to],
        subject: sanitizeText(
          `Potwierdzenie rezerwacji ${params.booking.shortCode} — ${params.booking.studioName}`,
          140
        ),
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #0a192f;">
            <h2>Zadatek opłacony — termin potwierdzony</h2>
            <p>Cześć <strong>${clientName}</strong>,</p>
            <p>Twoja wizyta w <strong>${studioName}</strong> została potwierdzona:</p>
            <ul>
              <li><strong>Usługa:</strong> ${serviceName}</li>
              <li><strong>Termin:</strong> ${date} o godz. ${time}</li>
              <li><strong>Opłacony zadatek:</strong> ${depositAmount} zł</li>
              <li><strong>Kod rezerwacji:</strong> ${shortCode}</li>
            </ul>
            <p>Kontakt do studia: ${studioPhone} (${studioCity}).</p>
          </div>
        `,
      }),
    });
    return { sent: res.ok, provider: 'resend' };
  } catch {
    return { sent: false, provider: 'resend' };
  }
}

export async function sendBookingSms(params: {
  phone?: string;
  message: string;
  token?: string;
}): Promise<{ sent: boolean; provider: 'smsapi' | 'skipped' }> {
  const apiToken = params.token?.trim() || process.env.SMSAPI_TOKEN?.trim();
  const rawPhone = params.phone?.replace(/\D/g, '') || '';
  if (!apiToken || rawPhone.length < 9) {
    return { sent: false, provider: 'skipped' };
  }

  const normalizedPhone = rawPhone.length === 9 ? `48${rawPhone}` : rawPhone;

  try {
    const body = new URLSearchParams({
      to: normalizedPhone,
      message: sanitizeText(params.message, 320),
      format: 'json',
    });
    const res = await fetch('https://api.smsapi.pl/sms.do', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    return { sent: res.ok, provider: 'smsapi' };
  } catch {
    return { sent: false, provider: 'smsapi' };
  }
}
