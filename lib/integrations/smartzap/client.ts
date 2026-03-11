import type { SmartZapTemplate, SmartZapCampaignPayload } from '@/types/smartzap';

export class SmartZapClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  async getTemplates(): Promise<SmartZapTemplate[]> {
    const res = await fetch(`${this.baseUrl}/api/templates`, {
      method: 'GET',
      headers: this.headers(),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`SmartZap getTemplates failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    // SmartZap may return { templates: [...] } or [...] directly
    return Array.isArray(data) ? data : (data.templates ?? []);
  }

  async testConnection(): Promise<{ ok: boolean; message?: string }> {
    try {
      await this.getTemplates();
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err) };
    }
  }

  async dispatch(payload: SmartZapCampaignPayload): Promise<{ status: number; body: unknown }> {
    const res = await fetch(`${this.baseUrl}/api/campaigns`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(payload),
    });

    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text().catch(() => null);
    }

    return { status: res.status, body };
  }
}
