-- Enable pgcrypto extension for password hashing (crypt and gen_salt functions)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;