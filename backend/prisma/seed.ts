import { PrismaClient } from '@prisma/client';
import { clearEventsCache } from '../src/utils/cache';

const prisma = new PrismaClient();

// Función helper para crear o obtener un tag
async function getOrCreateTag(name: string): Promise<string> {
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  let tag = await prisma.tag.findUnique({
    where: { slug }
  });

  if (!tag) {
    tag = await prisma.tag.create({
      data: {
        name,
        slug,
      },
    });
    console.log(`✅ Tag creado: ${name}`);
  }

  return tag.id;
}

async function main() {
  console.log('🌱 Iniciando seed...');

  // Limpiar cache de eventos (opcional, no falla si Redis no está disponible)
  try {
    console.log('🧹 Limpiando cache de eventos...');
    await clearEventsCache();
  } catch (error) {
    console.log('⚠️  No se pudo limpiar el cache (Redis puede no estar disponible)');
  }

  // Limpiar datos existentes del seed
  console.log('🧹 Limpiando datos existentes...');
  
  // Lista de títulos de eventos del seed
  const seedEventTitles = [
    'Concierto de Rock en Vivo',
    'Partido de Fútbol: Real Madrid vs Barcelona',
    'Obra de Teatro: El Fantasma de la Ópera',
    'Festival de Música Electrónica',
    'Conferencia de Tecnología',
  ];

  // Eliminar EventTags de los eventos del seed
  const seedEvents = await prisma.event.findMany({
    where: {
      title: { in: seedEventTitles }
    },
    select: { id: true }
  });

  if (seedEvents.length > 0) {
    const eventIds = seedEvents.map(e => e.id);
    
    // Eliminar relaciones EventTag
    await prisma.eventTag.deleteMany({
      where: {
        eventId: { in: eventIds }
      }
    });
    console.log(`🗑️  Eliminadas relaciones de tags de ${seedEvents.length} eventos`);

    // Eliminar tickets de esos eventos
    await prisma.ticket.deleteMany({
      where: {
        eventId: { in: eventIds }
      }
    });
    console.log(`🗑️  Eliminados tickets de ${seedEvents.length} eventos`);

    // Eliminar los eventos
    await prisma.event.deleteMany({
      where: {
        id: { in: eventIds }
      }
    });
    console.log(`🗑️  Eliminados ${seedEvents.length} eventos`);
  }

  // Eliminar tags que no estén asociados a ningún evento
  const tagsInUse = await prisma.eventTag.findMany({
    select: { tagId: true },
    distinct: ['tagId']
  });
  const tagIdsInUse = tagsInUse.map(t => t.tagId);

  if (tagIdsInUse.length > 0) {
    await prisma.tag.deleteMany({
      where: {
        id: { notIn: tagIdsInUse }
      }
    });
    console.log(`🗑️  Eliminados tags no utilizados`);
  } else {
    // Si no hay tags en uso, eliminar todos
    await prisma.tag.deleteMany({});
    console.log(`🗑️  Eliminados todos los tags`);
  }

  // Crear usuario organizador si no existe
  let organizer = await prisma.user.findUnique({
    where: { email: 'organizer@ticketmonster.com' }
  });

  if (!organizer) {
    organizer = await prisma.user.create({
      data: {
        email: 'organizer@ticketmonster.com',
        password: '$2a$10$rOzJqZqZqZqZqZqZqZqZqO', // password: "password123"
        name: 'Organizador Demo',
        role: 'ORGANIZER',
      },
    });
    console.log('✅ Usuario organizador creado');
  }

  // Eventos de prueba con tags
  const events = [
    {
      title: 'Concierto de Rock en Vivo',
      description: 'Una noche inolvidable con las mejores bandas de rock nacional e internacional.',
      venue: 'Estadio Wanda Metropolitano',
      address: 'Av. de Luis Aragonés, 4',
      city: 'Madrid',
      country: 'España',
      date: new Date('2026-03-15T20:00:00'),
      imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop',
      category: 'Música',
      status: 'PUBLISHED' as const,
      organizerId: organizer.id,
      tags: ['rock', 'música', 'concierto', 'en vivo'],
      tickets: [
        { type: 'General', price: 45.00, section: 'General', status: 'AVAILABLE' as const },
        { type: 'VIP', price: 120.00, section: 'VIP', status: 'AVAILABLE' as const },
        { type: 'Early Bird', price: 35.00, section: 'General', status: 'AVAILABLE' as const },
      ],
    },
    {
      title: 'Partido de Fútbol: Real Madrid vs Barcelona',
      description: 'El clásico español más esperado del año.',
      venue: 'Santiago Bernabéu',
      address: 'Av. de Concha Espina, 1',
      city: 'Madrid',
      country: 'España',
      date: new Date('2026-04-10T18:00:00'),
      imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=600&fit=crop',
      category: 'Deportes',
      status: 'PUBLISHED' as const,
      organizerId: organizer.id,
      tags: ['fútbol', 'deportes', 'real madrid', 'barcelona', 'clásico'],
      tickets: [
        { type: 'Tribuna', price: 80.00, section: 'Tribuna', status: 'AVAILABLE' as const },
        { type: 'Fondo', price: 50.00, section: 'Fondo', status: 'AVAILABLE' as const },
        { type: 'Preferencia', price: 100.00, section: 'Preferencia', status: 'AVAILABLE' as const },
      ],
    },
    {
      title: 'Obra de Teatro: El Fantasma de la Ópera',
      description: 'Una producción espectacular del clásico musical.',
      venue: 'Teatro Real',
      address: 'Plaza de Isabel II',
      city: 'Madrid',
      country: 'España',
      date: new Date('2026-05-20T19:30:00'),
      imageUrl: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=600&fit=crop',
      category: 'Teatro',
      status: 'PUBLISHED' as const,
      organizerId: organizer.id,
      tags: ['teatro', 'musical', 'ópera', 'clásico', 'espectáculo'],
      tickets: [
        { type: 'Platea', price: 65.00, section: 'Platea', status: 'AVAILABLE' as const },
        { type: 'Palco', price: 150.00, section: 'Palco', status: 'AVAILABLE' as const },
        { type: 'Anfiteatro', price: 40.00, section: 'Anfiteatro', status: 'AVAILABLE' as const },
      ],
    },
    {
      title: 'Festival de Música Electrónica',
      description: 'Los mejores DJs del mundo en un festival único.',
      venue: 'Parque del Retiro',
      address: 'Plaza de la Independencia',
      city: 'Madrid',
      country: 'España',
      date: new Date('2026-06-15T16:00:00'),
      imageUrl: 'https://images.unsplash.com/photo-1478147427282-58a87a120781?w=800&h=600&fit=crop',
      category: 'Música',
      status: 'PUBLISHED' as const,
      organizerId: organizer.id,
      tags: ['música electrónica', 'festival', 'dj', 'edm', 'música'],
      tickets: [
        { type: 'Día 1', price: 55.00, section: 'General', status: 'AVAILABLE' as const },
        { type: 'Día 2', price: 55.00, section: 'General', status: 'AVAILABLE' as const },
        { type: 'Pase Completo', price: 95.00, section: 'General', status: 'AVAILABLE' as const },
      ],
    },
    {
      title: 'Conferencia de Tecnología',
      description: 'Las últimas tendencias en tecnología e innovación.',
      venue: 'Palacio de Congresos',
      address: 'Paseo de la Castellana, 99',
      city: 'Madrid',
      country: 'España',
      date: new Date('2026-07-05T10:00:00'),
      imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=600&fit=crop',
      category: 'Conferencia',
      status: 'PUBLISHED' as const,
      organizerId: organizer.id,
      tags: ['tecnología', 'conferencia', 'innovación', 'tech', 'educación'],
      tickets: [
        { type: 'Entrada General', price: 75.00, section: 'General', status: 'AVAILABLE' as const },
        { type: 'Estudiante', price: 45.00, section: 'General', status: 'AVAILABLE' as const },
      ],
    },
  ];

  // Crear eventos y tickets con tags
  for (const eventData of events) {
    const { tickets, tags, ...eventInfo } = eventData;
    
    // Crear o obtener los tags
    const tagIds = await Promise.all(
      tags.map(tagName => getOrCreateTag(tagName))
    );

    const event = await prisma.event.create({
      data: {
        ...eventInfo,
        tickets: {
          create: tickets.map(ticket => ({
            type: ticket.type,
            price: ticket.price,
            section: ticket.section,
            status: ticket.status,
          })),
        },
        tags: {
          create: tagIds.map(tagId => ({
            tagId,
          })),
        },
      },
    });
    console.log(`✅ Evento creado: ${event.title} con ${tags.length} tags`);
  }

  console.log('🎉 Seed completado!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });