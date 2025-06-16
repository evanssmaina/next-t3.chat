import { parseAsString, useQueryState } from "nuqs";

export function useRecentsParams() {
  const [query, setQuery] = useQueryState("q", parseAsString.withDefault(""));

  return {
    query,
    setQuery,
  };
}
