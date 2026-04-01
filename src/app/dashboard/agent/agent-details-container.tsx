"use client";

import { AgentDetailsV4 } from "./agent-details-v4";

export function AgentDetailsContainer({ agentId }: { agentId?: string }) {
  return <AgentDetailsV4 agentId={agentId} />;
}
