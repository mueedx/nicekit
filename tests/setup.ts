// Keep tests hermetic: strip real Upstash credentials so no test ever
// touches production Redis. Tests that need Redis mock @upstash/redis and
// stub these vars explicitly.
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;
