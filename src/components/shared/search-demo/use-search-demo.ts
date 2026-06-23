"use client";

import { useState } from "react";
import {
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";

export interface UseSearchDemoOptions<TData> {
  /**
   * Stable prefix for this demo's react-query cache (e.g. "reranking" or
   * "similarity-search"). Used both as the queryKey root and as the key passed
   * to cache-clearing helpers.
   */
  queryKeyBase: string;
  /**
   * Extra values that participate in the query key (e.g. applied topK /
   * threshold). Changing any of these refetches, exactly like before.
   */
  queryKeyParams: ReadonlyArray<unknown>;
  /** Performs the search for the given submitted query. */
  search: (submittedQuery: string) => Promise<TData>;
  /** Value returned by the query when there is no submitted query yet. */
  emptyResult: TData;
  /** Passed through to react-query (defaults differ per page). */
  staleTime?: number;
  retry?: number | boolean;
}

/**
 * Encapsulates the search-query / loading / error / results state plus submit
 * handling shared by the react-query backed search demo pages. The per-page
 * search function, query key params, and react-query options are injected so
 * each page keeps its exact prior behavior.
 */
export function useSearchDemo<TData>({
  queryKeyBase,
  queryKeyParams,
  search,
  emptyResult,
  staleTime,
  retry = 2,
}: UseSearchDemoOptions<TData>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const queryClient = useQueryClient();

  const queryKey: QueryKey = [queryKeyBase, submittedQuery, ...queryKeyParams];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!submittedQuery.trim()) {
        return emptyResult;
      }
      return search(submittedQuery);
    },
    enabled: !!submittedQuery.trim(),
    staleTime,
    retry,
  });

  const submit = () => {
    if (searchQuery.trim()) {
      setSubmittedQuery(searchQuery.trim());
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    submittedQuery,
    setSubmittedQuery,
    submit,
    queryClient,
    /** The underlying react-query result (data/error/isPending/isFetching/refetch...). */
    query,
  };
}
