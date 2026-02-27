export type UserRole = 'BUYER' | 'SELLER' | 'ORGANIZER' | 'ADMIN';
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
export type TicketStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'TRANSFERRED' | 'CANCELLED';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
export type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  location?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  venue: string;
  address: string | null;
  city: string;
  country: string;
  date: string;
  imageUrl: string | null;
  category: string | null;
  status: EventStatus;
  organizerId?: string;
  organizer?: { id: string; name: string; email: string; displayName?: string | null; avatarUrl?: string | null };
  tags?: EventTagItem[];
  isFavorite?: boolean;
  _count?: { tickets: number; reviews: number; favorites: number };
  averageRating?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  location?: string | null;
  role: UserRole;
  createdAt: string;
  stats: {
    organizedEventsCount: number;
    averageEventRating: number | null;
    averageProfileRating: number | null;
    totalEventReviews: number;
    totalProfileReviews: number;
  };
}

export interface UserProfileReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  authorUser: {
    id: string;
    name: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  };
}

export interface EventTagItem {
  id: string;
  tag: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface Ticket {
  id: string;
  eventId: string;
  type: string;
  price: number | string;
  section: string | null;
  row: string | null;
  seat: string | null;
  status: TicketStatus;
  event?: Event;
}

export interface OrderItem {
  id: string;
  ticketId: string;
  quantity: number;
  price: number | string;
  subtotal: number | string;
  ticket?: Ticket;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number | string;
  deliveryEmail: string | null;
  deliveryAddress: string | null;
  eventId: string | null;
  event?: { id: string; title: string; date: string; venue?: string };
  items?: OrderItem[];
  payments?: unknown[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  events?: T[];
  tickets?: T[];
  orders?: T[];
  total: number;
  page: number;
  totalPages: number;
}