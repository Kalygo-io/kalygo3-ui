import { useEffect, useState } from "react";

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms have
 * elapsed without a change. Replaces the repeated
 *   useEffect(() => { const t = setTimeout(() => setX(v), 300); return () => clearTimeout(t); }, [v])
 * pattern used by the search boxes across the dashboard list containers.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);

  return debounced;
}
