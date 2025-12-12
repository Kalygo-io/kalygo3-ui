export interface KbStats {
  index_name: string;
  namespace: string;
  index_dimension: number;
  index_metric: string;
  index_pods: number;
  index_replicas: number;
  index_shards: number;
  total_vector_count: number;
  namespaces: Record<string, any>;
  namespace_vector_count: number;
  error?: string;
}

export async function callGetAiSchoolKbStats(): Promise<KbStats> {
  try {
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_AI_API_URL}/api/kalygo-agent/kb-stats`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status}`);
    }

    const data = await resp.json();
    return data;
  } catch (error) {
    console.error("Error fetching KB stats:", error);
    throw error;
  }
}
