// =============================================================================
// SmartZap Integration Types
// =============================================================================

export interface SmartZapConfig {
  id: string;
  organizationId: string;
  baseUrl: string;
  apiKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Maps a deal/contact field to a template variable position */
export interface VariableMapping {
  /** e.g. "contact.name", "deal.title", "deal.value" */
  field: string;
  /** Display label for UI */
  label?: string;
}

export interface SmartZapAutomation {
  id: string;
  organizationId: string;
  boardStageId: string;
  templateId: string;
  templateName?: string;
  variableMappings: VariableMapping[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SmartZapDispatchLog {
  id: string;
  organizationId: string;
  automationId?: string;
  dealId: string;
  contactPhone?: string;
  templateId?: string;
  payload?: SmartZapCampaignPayload;
  responseStatus?: number;
  responseBody?: unknown;
  error?: string;
  dispatchedAt: string;
}

// -----------------------------------------------------------------------------
// SmartZap API types
// -----------------------------------------------------------------------------

export interface SmartZapTemplate {
  id: string;
  name: string;
  /** Number of variables expected by the template */
  variablesCount?: number;
  status?: string;
  category?: string;
}

export interface SmartZapCampaignPayload {
  templateId: string;
  phone: string;
  variables: string[];
  /** Optional campaign name for traceability */
  campaignName?: string;
}
