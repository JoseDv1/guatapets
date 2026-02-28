import type { APIRoute } from 'astro';
import { db } from '../../../../db';

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

        const body = await request.json();
        const content = body.content?.trim();
        const turnstileToken = body.cfTurnstileResponse;

        // Verify Turnstile Captcha
        const secretKey = import.meta.env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY;

        if (secretKey) {
            if (!turnstileToken) {
                return new Response(JSON.stringify({ error: "Por favor, completa el captcha de seguridad." }), { status: 400 });
            }

            const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(turnstileToken)}`
            });
            const verifyData = await verifyResponse.json();

            if (!verifyData.success) {
                return new Response(JSON.stringify({ error: "Captcha inválido. Por favor intenta recargando la página." }), { status: 400 });
            }
        } else {
            console.warn("TURNSTILE_SECRET_KEY no configurado, omitiendo validación del captcha.");
        }

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
