import { createSearchParamsCache, parseAsString } from "nuqs/server";

export const historyParsers = {
  q: parseAsString.withDefault("").withOptions({
    shallow: false,
  }),
};

export const historyCacheParams = createSearchParamsCache(historyParsers);
