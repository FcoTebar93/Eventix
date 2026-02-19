import { prisma } from '../lib/prisma';

export async function getOrCreateTag(name: string): Promise<string> {
    const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    if (!slug) {
        throw new Error(`Nombre de tag inválido: ${name}`);
    }

    let tag = await prisma.tag.findUnique({
        where: { slug },
    });

    if (!tag) {
        tag = await prisma.tag.create({
            data: {
                name: name.trim(),
                slug,
            },
        });
    }

    return tag.id;
}

export async function associateTagsToEvent(eventId: string, tagNames: string[]): Promise<void> {
    if (tagNames.length === 0) {
        await prisma.eventTag.deleteMany({
            where: { eventId },
        });
        return;
    }

    const tagIds = await Promise.all(
        tagNames.map(name => getOrCreateTag(name))
    );

    await prisma.$transaction([
        prisma.eventTag.deleteMany({
            where: { eventId },
        }),
        ...tagIds.map(tagId =>
            prisma.eventTag.create({
                data: {
                    eventId,
                    tagId,
                },
            })
        ),
    ]);
}
