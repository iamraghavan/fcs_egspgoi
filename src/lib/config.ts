export const BASE_DOMAIN = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9002';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1` : 'http://localhost:9002/api/v1';
