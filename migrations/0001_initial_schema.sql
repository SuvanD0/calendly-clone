-- Initial database schema migration
-- Minimal schema: users (hosts only), events, bookings

-- Users table: Only for hosts who authenticate with Google
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    google_id TEXT UNIQUE,
    email TEXT,
    name TEXT,
    created_at INTEGER DEFAULT (unixepoch())
);

-- Events table: Links to host users via foreign key
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    host_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time INTEGER NOT NULL, -- Unix timestamp
    end_time INTEGER, -- Unix timestamp
    title TEXT,
    description TEXT,
    created_at INTEGER DEFAULT (unixepoch())
);

-- Bookings table: Links to events via foreign key
-- Guests book anonymously via public links, no user row needed
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    guest_email TEXT,
    notes TEXT,
    created_at INTEGER DEFAULT (unixepoch())
);

-- Index for fast free-slot calculations
CREATE INDEX IF NOT EXISTS idx_events_host_time ON events(host_user_id, start_time);
