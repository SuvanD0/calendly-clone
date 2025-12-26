import { createSignal, createEffect, For, Show } from 'solid-js';
import { fetchAvailableEvents, createBooking, type Event } from '../lib/api';

export default function Booking() {
  const [events, setEvents] = createSignal<Event[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [selectedEvent, setSelectedEvent] = createSignal<Event | null>(null);
  const [submitting, setSubmitting] = createSignal(false);
  const [success, setSuccess] = createSignal(false);

  const [formData, setFormData] = createSignal({
    guest_name: '',
    guest_email: '',
    notes: '',
  });

  createEffect(async () => {
    try {
      setLoading(true);
      const availableEvents = await fetchAvailableEvents();
      setEvents(availableEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const event = selectedEvent();
    if (!event) return;

    setSubmitting(true);
    setError(null);

    try {
      await createBooking({
        event_id: event.id,
        guest_name: formData().guest_name,
        guest_email: formData().guest_email,
        notes: formData().notes || undefined,
      });
      setSuccess(true);
      setFormData({ guest_name: '', guest_email: '', notes: '' });
      setSelectedEvent(null);
      // Refresh events list
      const availableEvents = await fetchAvailableEvents();
      setEvents(availableEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div class="container">
      <Show when={loading()}>
        <div class="loading">Loading available slots...</div>
      </Show>

      <Show when={success()}>
        <div class="success">
          <h2>Booking Confirmed!</h2>
          <p>You will receive a confirmation email with calendar details.</p>
        </div>
        <button class="btn btn-primary" onClick={() => setSuccess(false)}>
          Book Another Slot
        </button>
      </Show>

      <Show when={!loading() && !success() && selectedEvent()}>
        <div>
          <h1>Book a Meeting</h1>
          <Show when={error()}>
            <div class="error">{error()}</div>
          </Show>
          
          <div class="card">
            <h3>Selected Time Slot</h3>
            <p><strong>Time:</strong> {formatDate(selectedEvent()!.start_time)} - {formatDate(selectedEvent()!.end_time)}</p>
            <Show when={selectedEvent()!.title}>
              <p><strong>Title:</strong> {selectedEvent()!.title}</p>
            </Show>
            <Show when={selectedEvent()!.description}>
              <p><strong>Description:</strong> {selectedEvent()!.description}</p>
            </Show>
          </div>

          <form onSubmit={handleSubmit} class="card">
            <div class="form-group">
              <label for="guest_name">Your Name *</label>
              <input
                type="text"
                id="guest_name"
                required
                value={formData().guest_name}
                onInput={(e) => setFormData({ ...formData(), guest_name: e.currentTarget.value })}
              />
            </div>

            <div class="form-group">
              <label for="guest_email">Your Email *</label>
              <input
                type="email"
                id="guest_email"
                required
                value={formData().guest_email}
                onInput={(e) => setFormData({ ...formData(), guest_email: e.currentTarget.value })}
              />
            </div>

            <div class="form-group">
              <label for="notes">Additional Notes (optional)</label>
              <textarea
                id="notes"
                value={formData().notes}
                onInput={(e) => setFormData({ ...formData(), notes: e.currentTarget.value })}
              />
            </div>

            <button type="submit" class="btn btn-primary" disabled={submitting()}>
              {submitting() ? 'Booking...' : 'Confirm Booking'}
            </button>
            <button
              type="button"
              class="btn btn-secondary"
              onClick={() => setSelectedEvent(null)}
              style="margin-left: 1rem;"
            >
              Cancel
            </button>
          </form>
        </div>
      </Show>

      <Show when={!loading() && !success() && !selectedEvent()}>
        <div>
          <h1>Available Time Slots</h1>
          <Show when={error()}>
            <div class="error">{error()}</div>
          </Show>

          <Show when={events().length === 0}>
            <div class="card">
              <p>No available slots at the moment. Please check back later.</p>
            </div>
          </Show>

          <Show when={events().length > 0}>
            <For each={events()}>
              {(event) => (
                <div class="card">
                  <h3>{event.title || 'Available Slot'}</h3>
                  <p><strong>Time:</strong> {formatDate(event.start_time)} - {formatDate(event.end_time)}</p>
                  <Show when={event.description}>
                    <p>{event.description}</p>
                  </Show>
                  <Show when={event.event_type_name}>
                    <p><strong>Type:</strong> {event.event_type_name} ({event.duration_minutes} minutes)</p>
                  </Show>
                  <button
                    class="btn btn-primary"
                    onClick={() => setSelectedEvent(event)}
                    style="margin-top: 1rem;"
                  >
                    Book This Slot
                  </button>
                </div>
              )}
            </For>
          </Show>
        </div>
      </Show>
    </div>
  );
}
