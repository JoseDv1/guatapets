import type { APIRoute } from 'astro';
import { db } from '../../../../db';

// Simple in-memory rate limiting store (for basic protection)
// In production, use Redis or a proper rate limiting layer
const rateLimitStore = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // 5 comments per minute per IP

function getClientIp(request: Request): string {
    return request.headers.get('x-forwarded-for') ||
        request.headers.get('cf-connecting-ip') ||
        'unknown';
}

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const store = rateLimitStore.get(ip);

    if (!store || now > store.resetTime) {
        rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }

    if (store.count >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }

    store.count++;
    return true;
}

const ANIMALS = [
    "Gato", "Perro", "León", "Tigre", "Oso", "Lobo", "Zorro", "Erizo", "Búho", "Águila",
    "Delfín", "Ballena", "Pardo", "Koala", "Panda", "Canguro", "Mapache", "Puma", "Jaguar", "Lince"
];

const ADJECTIVES = [
    "Misterioso", "Veloz", "Valiente", "Curioso", "Amigable", "Silencioso", "Astuto", "Feroz", "Sabio", "Ágil",
    "Divertido", "Contento", "Brillante", "Audaz", "Tranquilo", "Rápido", "Fuerte", "Dormilón", "Juguetón", "Leal"
];

function generateAnonymousName() {
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    return `${animal} ${adj}`;
}

export const GET: APIRoute = async ({ request, params }) => {
    try {
        const id = parseInt(params.id || '', 10);
        if (isNaN(id)) {
            return new Response(JSON.stringify({ error: "ID inválido" }), { status: 400 });
        }

        const url = new URL(request.url);
        const cursorParam = url.searchParams.get('cursor');
        const cursor = cursorParam ? parseInt(cursorParam, 10) : undefined;
        const take = 10; // Cargar 10 comentarios por página

        const comments = await db.comment.findMany({
            where: { postId: id },
            orderBy: { createdAt: 'desc' },
            take: take + 1, // Obtener uno extra para saber si hay más páginas
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        });

        let nextCursor: number | undefined = undefined;
        if (comments.length > take) {
            const nextItem = comments.pop(); // Remover el extra
            nextCursor = nextItem?.id;
        }

        return new Response(JSON.stringify({ comments, nextCursor }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        console.error("GET comments error:", e);
        return new Response(JSON.stringify({ error: "Error al obtener comentarios" }), { status: 500 });
    }
}

export const POST: APIRoute = async ({ request, params }) => {
    try {
        const id = parseInt(params.id || '', 10);
        if (isNaN(id)) {
            return new Response(JSON.stringify({ error: "ID inválido" }), { status: 400 });
        }

        // Rate limiting check
        const ip = getClientIp(request);
        if (!checkRateLimit(ip)) {
            return new Response(JSON.stringify({ error: "Has publicado demasiados comentarios. Intenta de nuevo en un minuto." }), { status: 429 });
        }

        const body = await request.json();
        const content = body.content?.trim();

        if (!content) {
            return new Response(JSON.stringify({ error: "El contenido del comentario es requerido" }), { status: 400 });
        }

        if (content.length > 500) {
            return new Response(JSON.stringify({ error: "El comentario no puede exceder los 500 caracteres" }), { status: 400 });
        }

        // Verify post exists
        const postExists = await db.post.findUnique({
            where: { id },
            select: { id: true }
        });

        if (!postExists) {
            return new Response(JSON.stringify({ error: "El post no existe" }), { status: 404 });
        }

        const authorName = generateAnonymousName();

        const comment = await db.comment.create({
            data: {
                content,
                authorName,
                postId: id
            }
        });

        return new Response(JSON.stringify({ comment }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        console.error("POST comment error:", e);
        return new Response(JSON.stringify({ error: "Error al crear comentario" }), { status: 500 });
    }
}
