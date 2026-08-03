import type { D1Database as CloudflareD1Database } from "@cloudflare/workers-types/experimental";

declare global {
  interface Fetcher {
    fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  }

  type D1Database = CloudflareD1Database;
}

export {};
