import { createSignal, createEffect, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import {
  fetchEvents,
  fetchBookings,
  createEvent,
  deleteEvent,
  cancelBooking,
  type Event,
  type Booking,
} from '../lib/api';

export default function Dashboard() {
  const [events, setEvents] = createSignal<Event[]>([]);
  const [bookings, setBookings] = createSignal<Booking[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [showEventForm, setShowEventForm] = createSignal(false);

  const [eventForm, setEventForm] = createSignal({
    start_time: '',
    end_time: '',
    title: '',
    description: '',
  });

  createEffect(async () => {
    try {
      setLoading(true);
      const [eventsData, bookingsData] = await Promise.all([
        fetchEvents(),
        fetchBookings(),
      ]);
      setEvents(eventsData);
      setBookings(bookingsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  });

  const handleCreateEvent = async (e: Event) => {
    e.preventDefault();
    setError(null);

    try {
      const startTime = Math.floor(new Date(eventForm().start_time).getTime() / 1000);
      const endTime = Math.floor(new Date(eventForm().end_time).getTime() / 1000);

      await createEvent({
        start_time: startTime,
        end_time: endTime,
        title: eventForm().title || undefined,
        description: eventForm().description || undefined,
      });

      setEventForm({ start_time: '', end_time: '', title: '', description: '' });
      setShowEventForm(false);

      // Refresh events
      const eventsData = await fetchEvents();
      setEvents(eventsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await deleteEvent(id);
      const eventsData = await fetchEvents();
      setEvents(eventsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
    }
  };

  const handleCancelBooking = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await cancelBooking(id);
      const [eventsData, bookingsData] = await Promise.all([
        fetchEvents(),
        fetchBookings(),
      ]);
      setEvents(eventsData);
      setBookings(bookingsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div class="container">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h1>Dashboard</h1>
        <A href="/" class="btn btn-secondary">Home</A>
      </div>

      <Show when={loading()}>
        <div class="loading">Loading dashboard...</div>
      </Show>

      <Show when={!loading()}>
        <Show when={error()}>
          <div class="error">{error()}</div>
        </Show>

      <div style="margin-bottom: 2rem;">
        <button
          class="btn btn-primary"
          onClick={() => setShowEventForm(!showEventForm())}
        >
          {showEventForm() ? 'Cancel' : 'Create New Event'}
        </button>
      </div>

      {showEventForm() && (
        <form onSubmit={handleCreateEvent} class="card">
          <h3>Create New Event</h3>
          <div class="form-group">
            <label for="start_time">Start Time *</label>
            <input
              type="datetime-local"
              id="start_time"
              required
              value={eventForm().start_time}
              onInput={(e) => setEventForm({ ...eventForm(), start_time: e.currentTarget.value })}
            />
          </div>

          <div class="form-group">
            <label for="end_time">End Time *</label>
            <input
              type="datetime-local"
              id="end_time"
              required
              value={eventForm().end_time}
              onInput={(e) => setEventForm({ ...eventForm(), end_time: e.currentTarget.value })}
            />
          </div>

          <div class="form-group">
            <label for="title">Title (optional)</label>
            <input
              type="text"
              id="title"
              value={eventForm().title}
              onInput={(e) => setEventForm({ ...eventForm(), title: e.currentTarget.value })}
            />
          </div>

          <div class="form-group">
            <label for="description">Description (optional)</label>
            <textarea
              id="description"
              value={eventForm().description}
              onInput={(e) => setEventForm({ ...eventForm(), description: e.currentTarget.value })}
            />
          </div>

          <button type="submit" class="btn btn-primary">Create Event</button>
        </form>
      )}

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem;">
        <div>
          <h2>Upcoming Events</h2>
          {events().length === 0 ? (
            <div class="card">
              <p>No events scheduled.</p>
            </div>
          ) : (
            <For each={events()}>
              {(event) => (
                <div class="card">
                  <h3>{event.title || 'Untitled Event'}</h3>
                  <p><strong>Time:</strong> {formatDate(event.start_time)} - {formatDate(event.end_time)}</p>
                  <p><strong>Status:</strong> {event.status}</p>
                  {event.description && <p>{event.description}</p>}
                  {event.google_meet_link && (
                    <p>
                      <strong>Meet Link:</strong>{' '}
                      <a href={event.google_meet_link} target="_blank" rel="noopener noreferrer">
                        {event.google_meet_link}
                      </a>
                    </p>
                  )}
                  <button
                    class="btn btn-secondary"
                    onClick={() => handleDeleteEvent(event.id)}
                    style="margin-top: 1rem;"
                  >
                    Delete
                  </button>
                </div>
              )}
            </For>
          )}
        </div>

        <div>
          <h2>Bookings</h2>
          {bookings().length === 0 ? (
            <div class="card">
              <p>No bookings yet.</p>
            </div>
          ) : (
            <For each={bookings()}>
              {(booking) => (
                <div class="card">
                  <h3>{booking.guest_name}</h3>
                  <p><strong>Email:</strong> {booking.guest_email}</p>
                  {booking.event_title && <p><strong>Event:</strong> {booking.event_title}</p>}
                  {booking.start_time && (
                    <p><strong>Time:</strong> {formatDate(booking.start_time)}</p>
                  )}
                  {booking.notes && <p><strong>Notes:</strong> {booking.notes}</p>}
                  <p><strong>Status:</strong> {booking.status}</p>
                  {booking.status === 'confirmed' && (
                    <button
                      class="btn btn-secondary"
                      onClick={() => handleCancelBooking(booking.id)}
                      style="margin-top: 1rem;"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              )}
            </For>
          )}
        </div>
      </div>
      </Show>
    </div>
  );
}

