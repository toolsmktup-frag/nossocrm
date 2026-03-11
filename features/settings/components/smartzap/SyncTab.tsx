'use client';

import React, { useState } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export const SyncTab: React.FC = () => {
  const { showToast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{
    synced: number;
    skipped: number;
    total: number;
  } | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    try {
      const res = await fetch('/api/integrations/smartzap/sync-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao sincronizar');
      setResult(data);
      showToast(`Sincronização concluída: ${data.synced} contatos`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro na sincronização', 'error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          Sincronize os contatos do CRM com o SmartZap para garantir que os números de telefone
          estejam cadastrados antes de enviar mensagens.
        </p>

        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {syncing ? 'Sincronizando…' : 'Sincronizar contatos'}
        </button>
      </div>

      {result && (
        <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 space-y-1">
          <p className="text-sm font-semibold text-slate-800 dark:text-white">
            Resultado da sincronização
          </p>
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-0.5">
            <p>Total encontrado: <strong>{result.total}</strong></p>
            <p>Sincronizados: <strong className="text-green-600 dark:text-green-400">{result.synced}</strong></p>
            <p>Ignorados (sem telefone): <strong className="text-amber-600 dark:text-amber-400">{result.skipped}</strong></p>
          </div>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <strong>Nota:</strong> A sincronização processa até 500 contatos com telefone cadastrado.
          Os contatos sem telefone são ignorados automaticamente.
        </p>
      </div>
    </div>
  );
};
