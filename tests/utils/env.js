// Fake settings for frontend tests only. Firebase is left unset on purpose,
// so the app skips it (see src/lib/firebase.ts).
process.env.NEXT_PUBLIC_API_URL = 'http://api.test/api/v1';
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://api.test';
process.env.NEXT_PUBLIC_ENFORCE_WHATSAPP_VERIFICATION = 'false';
process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY = 'test-site-key';
process.env.NEXT_PUBLIC_OA_USERNAME = 'oa-bypass@example.org';
