-- Users table: Only for hosts who authenticate with Google
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    google_id TEXT UNIQUE,
    email TEXT,
    name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table: Links to host users via foreign key
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    host_user_id TEXT NOT NULL REFERENCES users(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    title TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table: Links to events via foreign key
-- Guests book anonymously via public links, no user row needed
CREATE TABLE bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id),
    guest_email TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast free-slot calculations
CREATE INDEX idx_events_host_time ON events(host_user_id, start_time);
