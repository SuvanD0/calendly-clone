-- Users table: Only for hosts who authenticate with Google
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    google_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    google_access_token TEXT,
    google_refresh_token TEXT,
    google_token_expires_at INTEGER,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);

-- Event types table: Predefined event types (30min, 1hr, etc.)
CREATE TABLE IF NOT EXISTS event_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    host_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    description TEXT,
    color TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);

-- Availability table: Working hours configuration
CREATE TABLE IF NOT EXISTS availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    host_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
    start_time TEXT NOT NULL, -- HH:MM format
    end_time TEXT NOT NULL, -- HH:MM format
    enabled INTEGER DEFAULT 1, -- 0 or 1 (boolean)
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    UNIQUE(host_user_id, day_of_week)
);

-- Events table: Available time slots created by the host
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    host_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type_id INTEGER REFERENCES event_types(id) ON DELETE SET NULL,
    start_time INTEGER NOT NULL, -- Unix timestamp
    end_time INTEGER NOT NULL, -- Unix timestamp
    title TEXT,
    description TEXT,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'booked', 'cancelled')),
    google_calendar_event_id TEXT, -- ID of event in Google Calendar
    google_meet_link TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);

-- Bookings table: Guest reservations of specific event slots
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    guest_email TEXT NOT NULL,
    guest_name TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_host_time ON events(host_user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_bookings_event ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_event_types_host ON event_types(host_user_id);
CREATE INDEX IF NOT EXISTS idx_availability_host ON availability(host_user_id);

