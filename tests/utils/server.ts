import { setupServer } from 'msw/node';

// Fake backend. Each test adds the answers it needs with server.use(...).
export const server = setupServer();
export const API = 'http://api.test/api/v1';
