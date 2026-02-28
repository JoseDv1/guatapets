// @ts-check
import { defineConfig } from 'astro/config';
export default defineConfig({
    output: 'server',
    env: {
        schema: {
            DATABASE_URL: {
                access: 'secret',
                context: 'server',
                type: 'string',
            },
            CLOUDINARY_CLOUD_NAME: {
                access: 'secret',
                context: 'server',
                type: 'string',
            },
            CLOUDINARY_API_KEY: {
                access: 'secret',
                context: 'server',
                type: 'string',
            },
            CLOUDINARY_API_SECRET: {
                access: 'secret',
                context: 'server',
                type: 'string',
            },
            PUBLIC_TURNSTILE_SITE_KEY: {
                access: 'public',
                context: 'client',
                type: 'string',
                optional: true,
            },
            TURNSTILE_SECRET_KEY: {
                access: 'secret',
                context: 'server',
                type: 'string',
                optional: true,
            },
            TURSO_DATABASE_URL: {
                access: 'secret',
                context: 'server',
                type: 'string',
                optional: true,
            },
            TURSO_AUTH_TOKEN: {
                access: 'secret',
                context: 'server',
                type: 'string',
                optional: true,
            }
        }
    }
});
