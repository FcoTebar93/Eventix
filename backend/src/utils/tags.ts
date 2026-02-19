import { prisma } from '../lib/prisma';

export async function getOrCreateTag(name: string): Promise<string> {
    const trimmedName = name.trim();
    const slug = trimmedName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    if (!slug) {
        throw new Error(`Nombre de tag inválido: ${name}`);
    }

    let tag = await prisma.tag.findUnique({
        where: { slug },
    });

    if (!tag) {
        tag = await prisma.tag.findUnique({
            where: { name: trimmedName },
        });
    }

    if (!tag) {
        try {
            tag = await prisma.tag.create({
                data: {
                    name: trimmedName,
                    slug,
                },
            });
        } catch (error: any) {
            if (error?.code === 'P2002') {
                tag = await prisma.tag.findUnique({
                    where: { name: trimmedName },
                });
                if (!tag) {
                    tag = await prisma.tag.findUnique({
                        where: { slug },
                    });
                }
                if (!tag) {
                    throw error;
                }
            } else {
                throw error;
            }
        }
    }

    return tag.id;
}

export async function associateTagsToEvent(eventId: string, tagNames: string[]): Promise<void> {
    try {
        if (tagNames.length === 0) {
            const deleted = await prisma.eventTag.deleteMany({
                where: { eventId },
            });
            console.log(`[TAGS] Eliminados ${deleted.count} tags del evento ${eventId}`);
            return;
        }

        console.log(`[TAGS] Procesando ${tagNames.length} tags para evento ${eventId}: ${tagNames.join(', ')}`);
        
        const tagIds = await Promise.all(
            tagNames.map(name => getOrCreateTag(name))
        );

        console.log(`[TAGS] IDs de tags obtenidos: ${tagIds.join(', ')}`);

        const deleted = await prisma.eventTag.deleteMany({
            where: { eventId },
        });

        if (tagIds.length > 0) {
            await Promise.all(
                tagIds.map(tagId =>
                    prisma.eventTag.create({
                        data: {
                            eventId,
                            tagId,
                        },
                    })
                )
            );
        }

        const verification = await prisma.eventTag.findMany({
            where: { eventId },
            include: {
                tag: {
                    select: {
                        name: true,
                    },
                },
            },
        });
    } catch (error) {
        throw error;
    }
}
