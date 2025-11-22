import { useState, useCallback } from "react";

interface UseCommentsRefreshResult {
  commentsRefreshKey: number;
  refreshComments: () => void;
}

/**
 * Hook to manage comments refresh trigger
 */
export function useCommentsRefresh(): UseCommentsRefreshResult {
  const [commentsRefreshKey, setCommentsRefreshKey] = useState(0);

  const refreshComments = useCallback(() => {
    setCommentsRefreshKey((prev) => prev + 1);
  }, []);

  return {
    commentsRefreshKey,
    refreshComments,
  };
}

