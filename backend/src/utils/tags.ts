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
    await prisma.eventTag.deleteMany({ where: { eventId } });

    if (tagNames.length === 0) return;

    const tagIds = await Promise.all(
        tagNames.map(name => getOrCreateTag(name))
    );

    await prisma.eventTag.createMany({
        data: tagIds.map(tagId => ({ eventId, tagId })),
        skipDuplicates: true,
    });
}
