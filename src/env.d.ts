/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** fa-auth API base the host injects; used by the fa-auth bridge. */
  readonly PUBLIC_FA_AUTH_API_BASE?: string;
}
