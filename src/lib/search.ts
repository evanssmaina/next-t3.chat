import { env } from "@/env";
import { Search } from "@upstash/search";

export const upstashSearch = new Search({
  url: env.UPSTASH_SEARCH_REST_URL,
  token: env.UPSTASH_SEARCH_REST_TOKEN,
});
