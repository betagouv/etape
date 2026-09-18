import { createHttpClient } from "@etape/api-client";

export const httpClient = createHttpClient(import.meta.env.VITE_API_BASE_URL);
