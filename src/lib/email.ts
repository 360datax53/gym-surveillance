import { Resend } from 'resend';

const getResend = () => new Resend(process.env.RESEND_API_KEY);

interface AlertDetails {
  cameraName: string;
  snapshotUrl: string;
  timestamp: string;
  organizationName?: string;
  location?: string;
  confidence?: number;
}

/**
 * Sends an email alert for an unrecognized person detection.
 * Includes confidence score and dashboard links as required.
 */
export async function sendUnrecognizedPersonAlert(
  to: string,
  details: AlertDetails
) {
  const { cameraName, snapshotUrl, timestamp, organizationName, location, confidence } = details;
  
  const dateStr = new Date(timestamp).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  });

  const confidencePct = confidence ? Math.round(confidence * 100) : 0;
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/alerts`;

  try {
    const { data, error } = await getResend().emails.send({
      from: 'Gym Surveillance <onboarding@resend.dev>',
      to: [to],
      subject: `🚨 Security Alert: Unrecognised Person at ${cameraName}`,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; color: #1e293b;">
          <div style="display: flex; align-items: center; margin-bottom: 24px;">
             <span style="background: #fee2e2; color: #dc2626; padding: 6px 12px; border-radius: 99px; font-weight: 600; font-size: 14px;">High Priority Alert</span>
          </div>

          <h1 style="color: #0f172a; margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">Unrecognised Entry Detected</h1>
          <p style="font-size: 16px; line-height: 24px; color: #64748b; margin-bottom: 32px;">
            A person entering the gym was not recognized by the AI matching system.
          </p>
          
          <div style="background: #f8fafc; padding: 24px; border-radius: 12px; margin-bottom: 32px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Camera</td>
                <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${cameraName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Time</td>
                <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${dateStr} (UTC)</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">AI Confidence</td>
                <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right; text-transform: lowercase;">${confidencePct}%</td>
              </tr>
              ${location ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Zone</td>
                <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${location}</td>
              </tr>` : ''}
            </table>
          </div>

          <div style="margin-bottom: 32px;">
            <p style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 12px;">Security Snapshot:</p>
            <img src="${snapshotUrl}" alt="Detection Snapshot" style="width: 100%; border-radius: 12px; border: 1px solid #e2e8f0; display: block;" />
          </div>

          <div style="text-align: center;">
            <a href="${dashboardUrl}" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 14px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 15px;">Review Alert in Dashboard</a>
          </div>

          <p style="color: #94a3b8; font-size: 12px; margin-top: 48px; border-top: 1px solid #f1f5f9; padding-top: 24px; text-align: center;">
            This security alert was automatically generated for ${organizationName || 'your branch'}.
            <br />
            &copy; 2024 Gym Surveillance Security Systems.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send email alert via Resend:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Error in sendUnrecognizedPersonAlert:', err);
    return { success: false, error: err };
  }
}
