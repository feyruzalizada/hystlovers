/**
 * SERVER_URL without a trailing slash. Payload trusts the login cookie only on
 * requests whose Origin equals it, and a browser's Origin never ends in "/".
 */
export const serverUrl = process.env.SERVER_URL?.trim().replace(/\/+$/, "") || undefined;
