export function generateEmail(prefix = 'user'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}@agentboard.test`;
}

export function generateWorkspaceName(): string {
  return `WS-${Date.now()}`;
}
