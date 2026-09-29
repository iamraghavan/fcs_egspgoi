const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;
const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

// NEXT_PUBLIC_API_URL selects the API used by this build. The older base URL
// remains a fallback for deployments that have not set the newer variable.
export const API_ORIGIN = configuredApiUrl
  ? new URL(configuredApiUrl).origin
  : configuredBaseUrl
    ? new URL(configuredBaseUrl).origin
    : "";

export const API_V1 = `${API_ORIGIN}/api/v1`;
