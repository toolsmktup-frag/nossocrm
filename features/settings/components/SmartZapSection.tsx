'use client';

import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { SettingsSection } from './SettingsSection';
import { ConnectionTab } from './smartzap/ConnectionTab';
import { AutomationsTab } from './smartzap/AutomationsTab';
import { SyncTab } from './smartzap/SyncTab';

type SmartZapSubTab = 'connection' | 'automations' | 'sync';

const SUB_TABS: { id: SmartZapSubTab; label: string }[] = [
  { id: 'connection', label: 'Conexão' },
  { id: 'automations', label: 'Automações' },
  { id: 'sync', label: 'Sincronização' },
];

export const SmartZapSection: React.FC = () => {
  const [subTab, setSubTab] = useState<SmartZapSubTab>('connection');

  return (
    <SettingsSection title="SmartZap (WhatsApp)" icon={MessageSquare}>
      <div className="mt-4 space-y-5">
        {/* Sub-tab bar */}
        <div className="flex items-center gap-2">
          {SUB_TABS.map((t) => {
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubTab(t.id)}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-colors ${
                  active
                    ? 'border-primary-500/50 bg-primary-500/10 text-primary-700 dark:text-primary-300'
                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {subTab === 'connection' && <ConnectionTab />}
        {subTab === 'automations' && <AutomationsTab />}
        {subTab === 'sync' && <SyncTab />}
      </div>
    </SettingsSection>
  );
};
