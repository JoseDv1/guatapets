import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { z } from 'astro:schema';
import { postTypeEnum, speciesEnum, genderEnum, statusEnum, visibilityEnum } from '../../../../db/schema';
import { v2 as cloudinary } from 'cloudinary';

// Authentication helper
const checkAuth = (request: Request) => {
    // Manually parse cookies since Astro.cookies is only available in pages directly
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => {
            const [key, ...v] = c.trim().split('=');
            return [key, v.join('=')];
        }).filter(([k]) => k)
    );
    
    return cookies['admin_session'] === import.meta.env.ADMIN_PASSWORD;
};

export const DELETE: APIRoute = async ({ request, params }) => {
    try {
        if (!checkAuth(request)) {
            return new Response(JSON.stringify({ success: false, message: "No autorizado" }), { 
                status: 401, headers: { 'Content-Type': 'application/json' } 
            });
        }
        
        const id = parseInt(params.id || '0');
        if (!id) {
            return new Response(JSON.stringify({ success: false, message: "ID inválido" }), { 
                status: 400, headers: { 'Content-Type': 'application/json' } 
            });
        }
        
        // Find post to see if it has an image to delete from Cloudinary
        const post = await db.post.findUnique({
            where: { id: id }
        });
        
        if (!post) {
            return new Response(JSON.stringify({ success: false, message: "Caso no encontrado" }), { 
                status: 404, headers: { 'Content-Type': 'application/json' } 
            });
        }
        
        /* 
         * Optional: Cloudinary image deletion logic could go here
         * If images are large and need cleanup:
         * if (post.imageUrl && post.imageUrl.includes('cloudinary')) { ... }
         */

        await db.post.delete({
            where: { id: id }
        });

        return new Response(JSON.stringify({ success: true, message: "Caso eliminado correctamente" }), { 
            status: 200, headers: { 'Content-Type': 'application/json' } 
        });

    } catch (e) {
        console.error("API Route error (DELETE):", e);
        return new Response(JSON.stringify({ success: false, message: "Ocurrió un error al intentar eliminar el caso." }), { 
            status: 500, headers: { 'Content-Type': 'application/json' } 
        });
    }
};

const updatePostSchema = z.object({
    type: z.enum(postTypeEnum, { invalid_type_error: "Tipo inválido" }).optional(),
    species: z.enum(speciesEnum, { invalid_type_error: "Especie inválida" }).optional(),
    name: z.string().optional(),
    description: z.string().min(10, "La descripción debe tener al menos 10 caracteres").optional(),
    breed: z.string().optional(),
    color: z.string().optional(),
    gender: z.enum(genderEnum).optional(),
    location: z.string().min(3, "La ubicación es muy corta").optional(),
    status: z.enum(statusEnum).optional(),
    visibility: z.enum(visibilityEnum).optional(),
    contactName: z.string().min(2, "El nombre de contacto es muy corto").optional(),
    contactPhone: z.string().min(7, "El teléfono de contacto es muy corto").optional(),
    contactEmail: z.string().email("Correo inválido").optional().or(z.literal('')),
});

export const PUT: APIRoute = async ({ request, params }) => {
    try {
        if (!checkAuth(request)) {
            return new Response(JSON.stringify({ success: false, message: "No autorizado" }), { 
                status: 401, headers: { 'Content-Type': 'application/json' } 
            });
        }
        
        const id = parseInt(params.id || '0');
        if (!id) {
            return new Response(JSON.stringify({ success: false, message: "ID inválido" }), { 
                status: 400, headers: { 'Content-Type': 'application/json' } 
            });
        }

        const formData = await request.formData();
        
        // Extract updated fields
        const updateData: Record<string, any> = {};
        
        for (const [key, value] of formData.entries()) {
            if (key !== 'image') {
               updateData[key] = value;
            }
        }
        
        // Handle explicit nulls for optional fields
        if (updateData.name === '') updateData.name = null;
        if (updateData.breed === '') updateData.breed = null;
        if (updateData.color === '') updateData.color = null;
        if (updateData.contactEmail === '') updateData.contactEmail = null;

        const parsed = updatePostSchema.safeParse(updateData);

        if (!parsed.success) {
            const errors = parsed.error.flatten().fieldErrors;
            return new Response(JSON.stringify({ success: false, errors }), { 
                status: 400, headers: { 'Content-Type': 'application/json' } 
            });
        }

        const data = parsed.data;
        const dbUpdateData: any = { ...data };
        
        // Handle new image upload if present
        const image = formData.get('image');
        if (image instanceof File && image.size > 0) {
            cloudinary.config({
                cloud_name: import.meta.env.CLOUDINARY_CLOUD_NAME,
                api_key: import.meta.env.CLOUDINARY_API_KEY,
                api_secret: import.meta.env.CLOUDINARY_API_SECRET
            });
            
            try {
                const arrayBuffer = await image.arrayBuffer();
                const base64String = Buffer.from(arrayBuffer).toString('base64');
                const dataURI = `data:${image.type};base64,${base64String}`;
                const uploadResponse = await cloudinary.uploader.upload(dataURI, {
                    folder: 'guatapets',
                    fetch_format: 'auto',
                    quality: 'auto',
                });
                
                dbUpdateData.imageUrl = uploadResponse.secure_url;
            } catch (error) {
                console.error("Cloudinary update upload failed:", error);
                // We'll continue the update even if image fails
            }
        }

        const result = await db.post.update({
            where: { id: id },
            data: dbUpdateData
        });

        return new Response(JSON.stringify({ success: true, id: result.id }), { 
            status: 200, headers: { 'Content-Type': 'application/json' } 
        });

    } catch (e) {
        console.error("API Route error (PUT):", e);
        return new Response(JSON.stringify({ success: false, message: "Ocurrió un error al actualizar el caso." }), { 
            status: 500, headers: { 'Content-Type': 'application/json' } 
        });
    }
};
