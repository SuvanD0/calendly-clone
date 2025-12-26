const API_BASE = '/api';

export interface Event {
  id: number;
  host_user_id: string;
  event_type_id?: number;
  start_time: number;
  end_time: number;
  title?: string;
  description?: string;
  status: 'available' | 'booked' | 'cancelled';
  google_calendar_event_id?: string;
  google_meet_link?: string;
  event_type_name?: string;
  duration_minutes?: number;
}

export interface Booking {
  id: number;
  event_id: number;
  guest_email: string;
  guest_name: string;
  notes?: string;
  status: 'confirmed' | 'cancelled';
  start_time?: number;
  end_time?: number;
  event_title?: string;
}

export interface EventType {
  id: number;
  host_user_id: string;
  name: string;
  duration_minutes: number;
  description?: string;
  color?: string;
}

export async function fetchAvailableEvents(): Promise<Event[]> {
  const response = await fetch(`${API_BASE}/events/available`);
  if (!response.ok) throw new Error('Failed to fetch events');
  const data = await response.json();
  return data.events || [];
}

export async function fetchEvents(): Promise<Event[]> {
  const response = await fetch(`${API_BASE}/events`);
  if (!response.ok) throw new Error('Failed to fetch events');
  const data = await response.json();
  return data.events || [];
}

export async function createEvent(event: Partial<Event>): Promise<Event> {
  const response = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create event');
  }
  const data = await response.json();
  return data.event;
}

export async function updateEvent(id: number, event: Partial<Event>): Promise<Event> {
  const response = await fetch(`${API_BASE}/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update event');
  }
  const data = await response.json();
  return data.event;
}

export async function deleteEvent(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/events/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete event');
  }
}

export async function createBooking(booking: {
  event_id: number;
  guest_email: string;
  guest_name: string;
  notes?: string;
}): Promise<Booking> {
  const response = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create booking');
  }
  const data = await response.json();
  return data.booking;
}

export async function fetchBookings(): Promise<Booking[]> {
  const response = await fetch(`${API_BASE}/bookings`);
  if (!response.ok) throw new Error('Failed to fetch bookings');
  const data = await response.json();
  return data.bookings || [];
}

export async function cancelBooking(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/bookings/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to cancel booking');
  }
}

export function getGoogleAuthUrl(): string {
  return `${API_BASE}/auth/google/login`;
}

