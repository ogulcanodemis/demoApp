CREATE TABLE users (
    id INTEGER,
    username TEXT,
    email TEXT,
    password TEXT,
    created_at TEXT
);

CREATE TABLE instagram_accounts (
    id INTEGER,
    user_id INTEGER,
    account_name TEXT,
    is_competitor INTEGER,
    access_token TEXT,
    created_at TEXT
);

CREATE TABLE posts (
    id INTEGER,
    instagram_account_id INTEGER,
    post_id TEXT,
    content_type TEXT,
    caption TEXT,
    hashtags TEXT,
    posted_at TEXT,
    engagement_rate REAL,
    likes INTEGER,
    comments INTEGER,
    created_at TEXT
);

CREATE TABLE content_calendar (
    id INTEGER,
    user_id INTEGER,
    post_title TEXT,
    post_description TEXT,
    planned_date TEXT,
    status TEXT,
    created_at TEXT
);

CREATE TABLE team_members (
    id INTEGER,
    user_id INTEGER,
    member_email TEXT,
    role TEXT,
    created_at TEXT
); 