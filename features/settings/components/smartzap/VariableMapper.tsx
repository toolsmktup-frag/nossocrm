'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AVAILABLE_FIELDS } from '@/lib/integrations/smartzap/variables';
import type { VariableMapping } from '@/types/smartzap';

interface VariableMapperProps {
  mappings: VariableMapping[];
  onChange: (mappings: VariableMapping[]) => void;
  variablesCount?: number;
}

export const VariableMapper: React.FC<VariableMapperProps> = ({
  mappings,
  onChange,
  variablesCount,
}) => {
  const addRow = () => {
    onChange([...mappings, { field: AVAILABLE_FIELDS[0].value }]);
  };

  const updateRow = (index: number, field: string) => {
    const updated = mappings.map((m, i) => (i === index ? { ...m, field } : m));
    onChange(updated);
  };

  const removeRow = (index: number) => {
    onChange(mappings.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Mapeie os campos do CRM para as variáveis do template
          {variablesCount != null && ` (${variablesCount} variável${variablesCount !== 1 ? 'is' : ''} esperada${variablesCount !== 1 ? 's' : ''})`}
        </p>
      </div>

      {mappings.map((mapping, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-6 shrink-0 text-right">#{i + 1}</span>
          <select
            value={mapping.field}
            onChange={(e) => updateRow(i, e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {AVAILABLE_FIELDS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => removeRow(i)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:underline"
      >
        <Plus className="h-3.5 w-3.5" />
        Adicionar variável
      </button>
    </div>
  );
};
