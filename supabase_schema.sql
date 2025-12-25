-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Jobs Table
create table jobs (
  id text primary key,
  "productName" text not null,
  "clientId" text not null,
  "platingTypeId" text,
  "jigId" text,
  quantity numeric default 0,
  "unitPrice" numeric default 0,
  price numeric default 0,
  cost numeric default 0,
  "startDate" text, -- Storing as YYYY-MM-DD string to match frontend
  "deliveryDate" text,
  status text not null,
  memo text,
  "createdBy" text,
  "createdAt" text,
  "updatedBy" text,
  "updatedAt" text
);

-- 2. Client Master Table
create table clients (
  id text primary key,
  name text not null,
  "contactPerson" text,
  phone text,
  email text
);

-- 3. Plating Type Master Table
create table "platingTypes" (
  id text primary key,
  name text not null,
  "unitPrice" numeric default 0,
  "costPerLot" numeric default 0
);

-- 4. Jig Master Table
create table jigs (
  id text primary key,
  name text not null,
  "totalQuantity" numeric default 0
);

-- 5. Correspondence Logs
create table "correspondenceLogs" (
  id text primary key,
  "clientId" text not null,
  "jobId" text,
  "correspondenceDate" text,
  "staffId" text,
  temperature numeric,
  memo text
);

-- 6. Users Table
create table users (
  id text primary key,
  username text not null,
  name text not null,
  role text not null check (role in ('admin', 'user')),
  password text -- Ideally should be hashed, but storing plain for this demo app compatibility
);

-- 7. App Settings (Key-Value)
create table "appSettings" (
  key text primary key,
  value jsonb
);

-- Row Level Security (RLS) - Enable for all tables but allow public access for simplicity in this MVP
-- In production, you would set up policies based on authenticated user
alter table jobs enable row level security;
create policy "Allow all access" on jobs for all using (true);

alter table clients enable row level security;
create policy "Allow all access" on clients for all using (true);

alter table "platingTypes" enable row level security;
create policy "Allow all access" on "platingTypes" for all using (true);

alter table jigs enable row level security;
create policy "Allow all access" on jigs for all using (true);

alter table "correspondenceLogs" enable row level security;
create policy "Allow all access" on "correspondenceLogs" for all using (true);

alter table users enable row level security;
create policy "Allow all access" on users for all using (true);

alter table "appSettings" enable row level security;
create policy "Allow all access" on "appSettings" for all using (true);

-- Enable Realtime
alter publication supabase_realtime add table jobs;
alter publication supabase_realtime add table clients;
alter publication supabase_realtime add table "platingTypes";
alter publication supabase_realtime add table jigs;
alter publication supabase_realtime add table "correspondenceLogs";
alter publication supabase_realtime add table users;
alter publication supabase_realtime add table "appSettings";
