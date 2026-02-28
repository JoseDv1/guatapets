import type { APIRoute } from 'astro';
import { z } from 'astro:schema';
import { db } from '../../db';
import { postTypeEnum, speciesEnum, genderEnum } from '../../db/schema';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';

cloudinary.config({
    cloud_name: import.meta.env.CLOUDINARY_CLOUD_NAME,
    api_key: import.meta.env.CLOUDINARY_API_KEY,
    api_secret: import.meta.env.CLOUDINARY_API_SECRET
});

const createPostSchema = z.object({
    type: z.enum(postTypeEnum, { required_error: "Requerido", invalid_type_error: "Inválido" }),
    species: z.enum(speciesEnum, { required_error: "Requerido", invalid_type_error: "Inválido" }),
    name: z.string().optional(),
    description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
    breed: z.string().optional(),
    color: z.string().optional(),
    gender: z.enum(genderEnum).default('unknown'),
    location: z.string().min(3, "La ubicación es requerida"),
    contactName: z.string().min(2, "El nombre de contacto es requerido"),
    contactPhone: z.string().min(7, "El teléfono de contacto es requerido"),
    contactEmail: z.string().email("Correo inválido").optional().or(z.literal('')),
});

export const POST: APIRoute = async ({ request }) => {
    try {
        const formData = await request.formData();
        const type = formData.get('type');
        const species = formData.get('species');
        const name = formData.get('name') || '';
        const description = formData.get('description');
        const breed = formData.get('breed') || '';
        const color = formData.get('color') || '';
        const gender = formData.get('gender') || 'unknown';
        const location = formData.get('location');
        const contactName = formData.get('contactName');
        const contactPhone = formData.get('contactPhone');
        const contactEmail = formData.get('contactEmail') || '';
        const image = formData.get('image');
        const turnstileToken = formData.get('cf-turnstile-response');

        // Verify Turnstile Captcha
        const secretKey = import.meta.env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY;

        if (secretKey) {
            if (!turnstileToken) {
                return new Response(JSON.stringify({ success: false, message: "Por favor, completa el captcha de seguridad." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }

            const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(turnstileToken.toString())}`
            });
            const verifyData = await verifyResponse.json();

            if (!verifyData.success) {
                return new Response(JSON.stringify({ success: false, message: "Captcha inválido. Por favor intenta recargando la página." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }
        } else {
            console.warn("TURNSTILE_SECRET_KEY no configurado, omitiendo validación del captcha.");
        }

        const parsed = createPostSchema.safeParse({
            type, species, name, description, breed, color, gender, location, contactName, contactPhone, contactEmail, image
        });

        if (!parsed.success) {
            const errors = parsed.error.flatten().fieldErrors;
            return new Response(JSON.stringify({ success: false, errors }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const data = parsed.data;
        let imageUrl: string | null = null;

        if (image instanceof File && image.size > 0) {
            try {
                imageUrl = await uploadImageToCloudinary(image);
            } catch (error) {
                console.error("Cloudinary upload failed:", error);
            }
        }

        const result = await db.post.create({
            data: {
                type: data.type,
                species: data.species,
                name: data.name || null,
                description: data.description,
                breed: data.breed || null,
                color: data.color || null,
                gender: data.gender,
                imageUrl,
                location: data.location,
                contactName: data.contactName,
                contactPhone: data.contactPhone,
                contactEmail: data.contactEmail || null,
            }
        });

        return new Response(JSON.stringify({ success: true, id: result.id }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (e) {
        console.error("API Route error:", e);
        return new Response(JSON.stringify({ success: false, message: "Ocurrió un error al procesar tu solicitud." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};

async function uploadImageToCloudinary(image: File): Promise<string | null> {
    try {
        const arrayBuffer = await image.arrayBuffer();

        // Optimize image with sharp before uploading
        const optimizedBuffer = await sharp(Buffer.from(arrayBuffer))
            .resize({
                width: 1200,
                height: 1200,
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 80 })
            .toBuffer();

        const base64String = optimizedBuffer.toString('base64');
        const dataURI = `data:image/webp;base64,${base64String}`;

        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
            folder: 'guatapets',
            fetch_format: 'auto',
            quality: 'auto',
        });

        return uploadResponse.secure_url;
    } catch (error) {
        console.error("Cloudinary upload failed:", error);
        return null;
    }
}
