'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface Config {
  id?: string;
  base_url?: string;
  is_active?: boolean;
}

export const ConnectionTab: React.FC = () => {
  const { showToast } = useToast();
  const [config, setConfig] = useState<Config | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message?: string } | null>(null);

  useEffect(() => {
    fetch('/api/integrations/smartzap/config')
      .then((r) => r.json())
      .then(({ config: c }) => {
        if (c) {
          setConfig(c);
          setBaseUrl(c.base_url ?? '');
          setIsActive(c.is_active ?? false);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!baseUrl.trim()) {
      showToast('URL base é obrigatória', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/integrations/smartzap/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl, apiKey: apiKey || undefined, isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar');
      showToast('Configuração salva com sucesso!', 'success');
      setApiKey(''); // Clear key input after save
      setConfig((prev) => ({ ...prev, base_url: baseUrl, is_active: isActive }));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const body: Record<string, string> = {};
      if (baseUrl.trim()) body.baseUrl = baseUrl.trim();
      if (apiKey.trim()) body.apiKey = apiKey.trim();

      const res = await fetch('/api/integrations/smartzap/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ ok: false, message: 'Falha na requisição' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            config?.is_active ? 'bg-green-500' : 'bg-slate-400'
          }`}
        />
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {config?.is_active ? 'Conectado' : 'Desconectado'}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            URL Base do SmartZap
          </label>
          <input
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.smartzap.com.br"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={config?.id ? '••••••••  (deixe em branco para manter a atual)' : 'Cole sua API Key aqui'}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsActive((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isActive ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {isActive ? 'Integração ativa' : 'Integração desativada'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar
        </button>

        <button
          type="button"
          onClick={handleTest}
          disabled={testing}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/10 transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {testing && <Loader2 className="h-4 w-4 animate-spin" />}
          Testar Conexão
        </button>
      </div>

      {testResult && (
        <div
          className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 ${
            testResult.ok
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
          }`}
        >
          {testResult.ok ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          {testResult.ok
            ? 'Conexão bem-sucedida!'
            : testResult.message || 'Falha na conexão'}
        </div>
      )}
    </div>
  );
};
