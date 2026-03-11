'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Power, Loader2 } from 'lucide-react';
import { AutomationForm } from './AutomationForm';
import { useToast } from '@/context/ToastContext';
import { useBoards } from '@/context/boards/BoardsContext';
import type { SmartZapAutomation } from '@/types/smartzap';

export const AutomationsTab: React.FC = () => {
  const { showToast } = useToast();
  const { boards } = useBoards();

  const [automations, setAutomations] = useState<SmartZapAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SmartZapAutomation | null>(null);

  const stageMap = new Map(
    boards.flatMap((b) =>
      (b.stages ?? []).map((s) => [s.id, { label: s.label, boardName: b.name }])
    )
  );

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/integrations/smartzap/automations')
      .then((r) => r.json())
      .then(({ automations: a }) => {
        setAutomations(
          (a ?? []).map((item: Record<string, unknown>) => ({
            id: item.id,
            organizationId: item.organization_id,
            boardStageId: item.board_stage_id,
            templateId: item.template_id,
            templateName: item.template_name,
            variableMappings: item.variable_mappings ?? [],
            isActive: item.is_active,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          }))
        );
      })
      .catch(() => setAutomations([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta automação?')) return;
    try {
      const res = await fetch(`/api/integrations/smartzap/automations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao remover');
      setAutomations((prev) => prev.filter((a) => a.id !== id));
      showToast('Automação removida', 'success');
    } catch {
      showToast('Erro ao remover automação', 'error');
    }
  };

  const handleToggle = async (auto: SmartZapAutomation) => {
    try {
      const res = await fetch(`/api/integrations/smartzap/automations/${auto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !auto.isActive }),
      });
      if (!res.ok) throw new Error('Erro ao atualizar');
      setAutomations((prev) =>
        prev.map((a) => (a.id === auto.id ? { ...a, isActive: !a.isActive } : a))
      );
    } catch {
      showToast('Erro ao atualizar automação', 'error');
    }
  };

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (a: SmartZapAutomation) => { setEditing(a); setFormOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Defina qual template enviar quando um deal muda de etapa.
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova automação
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-6">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
        </div>
      ) : automations.length === 0 ? (
        <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
          Nenhuma automação configurada ainda.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {automations.map((auto) => {
            const stage = stageMap.get(auto.boardStageId);
            return (
              <div
                key={auto.id}
                className="flex items-center gap-3 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {stage
                      ? `${stage.boardName} › ${stage.label}`
                      : `Etapa: ${auto.boardStageId.slice(0, 8)}…`}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Template: {auto.templateName || auto.templateId}
                    {' · '}
                    {auto.variableMappings.length} variável
                    {auto.variableMappings.length !== 1 ? 'is' : ''}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(auto)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      auto.isActive
                        ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                        : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                    title={auto.isActive ? 'Desativar' : 'Ativar'}
                  >
                    <Power className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => openEdit(auto)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(auto.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AutomationForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        editing={editing}
      />
    </div>
  );
};
