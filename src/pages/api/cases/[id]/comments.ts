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

export const GET: APIRoute = async ({ params }) => {
    try {
        const id = parseInt(params.id || '', 10);
        if (isNaN(id)) {
            return new Response(JSON.stringify({ error: "ID inválido" }), { status: 400 });
        }

        const comments = await db.comment.findMany({
            where: { postId: id },
            orderBy: { createdAt: 'desc' },
        });

        return new Response(JSON.stringify({ comments }), {
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

        if (!content) {
            return new Response(JSON.stringify({ error: "El contenido del comentario es requerido" }), { status: 400 });
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
