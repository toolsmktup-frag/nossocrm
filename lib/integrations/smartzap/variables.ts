import type { VariableMapping } from '@/types/smartzap';

interface DealContext {
  title?: string;
  value?: number | null;
  ownerName?: string;
  stageName?: string;
}

interface ContactContext {
  name?: string;
  phone?: string;
  email?: string;
}

/**
 * Resolves variable mappings into an ordered string array for the SmartZap template.
 * Each mapping entry maps a field path (e.g. "contact.name") to a position.
 */
export function resolveVariables(
  mappings: VariableMapping[],
  deal: DealContext,
  contact: ContactContext
): string[] {
  return mappings.map((m) => {
    switch (m.field) {
      case 'contact.name':
        return contact.name ?? '';
      case 'contact.phone':
        return contact.phone ?? '';
      case 'contact.email':
        return contact.email ?? '';
      case 'deal.title':
        return deal.title ?? '';
      case 'deal.value':
        return deal.value != null
          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.value)
          : '';
      case 'deal.owner_name':
        return deal.ownerName ?? '';
      case 'deal.stage_name':
        return deal.stageName ?? '';
      default:
        return '';
    }
  });
}

/** Available field options for VariableMapper UI */
export const AVAILABLE_FIELDS: { value: string; label: string }[] = [
  { value: 'contact.name', label: 'Nome do contato' },
  { value: 'contact.phone', label: 'Telefone do contato' },
  { value: 'contact.email', label: 'E-mail do contato' },
  { value: 'deal.title', label: 'Título do deal' },
  { value: 'deal.value', label: 'Valor do deal' },
  { value: 'deal.owner_name', label: 'Responsável' },
  { value: 'deal.stage_name', label: 'Nome da etapa' },
];
