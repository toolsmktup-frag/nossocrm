'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { VariableMapper } from './VariableMapper';
import { useBoards } from '@/context/boards/BoardsContext';
import type { SmartZapAutomation, SmartZapTemplate, VariableMapping } from '@/types/smartzap';

interface AutomationFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing?: SmartZapAutomation | null;
}

export const AutomationForm: React.FC<AutomationFormProps> = ({
  open,
  onClose,
  onSaved,
  editing,
}) => {
  const { boards } = useBoards();

  const [stageId, setStageId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [variableMappings, setVariableMappings] = useState<VariableMapping[]>([]);
  const [isActive, setIsActive] = useState(true);

  const [templates, setTemplates] = useState<SmartZapTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // All stages from all boards
  const allStages = boards.flatMap((b) =>
    (b.stages ?? []).map((s) => ({
      id: s.id,
      label: s.label,
      boardName: b.name,
    }))
  );

  useEffect(() => {
    if (!open) return;
    setLoadingTemplates(true);
    fetch('/api/integrations/smartzap/templates')
      .then((r) => r.json())
      .then(({ templates: t }) => setTemplates(t ?? []))
      .catch(() => setTemplates([]))
      .finally(() => setLoadingTemplates(false));
  }, [open]);

  useEffect(() => {
    if (editing) {
      setStageId(editing.boardStageId);
      setTemplateId(editing.templateId);
      setTemplateName(editing.templateName ?? '');
      setVariableMappings(editing.variableMappings ?? []);
      setIsActive(editing.isActive);
    } else {
      setStageId('');
      setTemplateId('');
      setTemplateName('');
      setVariableMappings([]);
      setIsActive(true);
    }
    setError('');
  }, [editing, open]);

  const selectedTemplate = templates.find((t) => t.id === templateId);

  const handleTemplateChange = (id: string) => {
    setTemplateId(id);
    const tpl = templates.find((t) => t.id === id);
    setTemplateName(tpl?.name ?? '');
  };

  const handleSubmit = async () => {
    if (!stageId) { setError('Selecione uma etapa'); return; }
    if (!templateId) { setError('Selecione um template'); return; }
    setSaving(true);
    setError('');

    const payload = {
      boardStageId: stageId,
      templateId,
      templateName,
      variableMappings,
      isActive,
    };

    try {
      const url = editing
        ? `/api/integrations/smartzap/automations/${editing.id}`
        : '/api/integrations/smartzap/automations';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar');
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={editing ? 'Editar automação' : 'Nova automação'}>
      <div className="space-y-5 min-w-[420px]">
        {/* Stage select */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            Etapa do Kanban
          </label>
          <select
            value={stageId}
            onChange={(e) => setStageId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Selecione uma etapa...</option>
            {allStages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.boardName} › {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Template select */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            Template de mensagem
          </label>
          {loadingTemplates ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando templates...
            </div>
          ) : (
            <select
              value={templateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Selecione um template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Variable Mapper */}
        {templateId && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Variáveis
            </label>
            <VariableMapper
              mappings={variableMappings}
              onChange={setVariableMappings}
              variablesCount={selectedTemplate?.variablesCount}
            />
          </div>
        )}

        {/* Active toggle */}
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
            {isActive ? 'Ativa' : 'Desativada'}
          </span>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex gap-3 pt-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? 'Salvar alterações' : 'Criar automação'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
