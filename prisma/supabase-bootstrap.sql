-- Enable functions for UUID generation (usually already enabled in Supabase)
create extension if not exists pgcrypto;

begin;

-- ========== SCHEMA ==========

-- Users
create table if not exists "users" (
  "id" text primary key,
  "email" text not null unique,
  "name" text,
  "image" text,
  "language" text not null default 'en',
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null
);

-- Accounts (NextAuth)
create table if not exists "accounts" (
  "id" text primary key,
  "userId" text not null,
  "type" text not null,
  "provider" text not null,
  "providerAccountId" text not null,
  "refresh_token" text,
  "access_token" text,
  "expires_at" integer,
  "token_type" text,
  "scope" text,
  "id_token" text,
  "session_state" text
);
create unique index if not exists "accounts_provider_providerAccountId_key"
  on "accounts"("provider","providerAccountId");

-- Sessions (NextAuth)
create table if not exists "sessions" (
  "id" text primary key,
  "sessionToken" text not null unique,
  "userId" text not null,
  "expires" timestamp(3) not null
);

-- Verification tokens (NextAuth)
create table if not exists "verification_tokens" (
  "identifier" text not null,
  "token" text not null unique,
  "expires" timestamp(3) not null
);
create unique index if not exists "verification_tokens_identifier_token_key"
  on "verification_tokens"("identifier","token");

-- Households
create table if not exists "households" (
  "id" text primary key,
  "name" text not null,
  "description" text,
  "invitationCode" text not null unique,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null
);

-- Household members
create table if not exists "household_members" (
  "id" text primary key,
  "userId" text not null,
  "householdId" text not null,
  "role" text not null default 'USER',
  "joinedAt" timestamp(3) not null default current_timestamp
);
create unique index if not exists "household_members_userId_householdId_key"
  on "household_members"("userId","householdId");

-- Rooms
create table if not exists "rooms" (
  "id" text primary key,
  "name" text not null,
  "description" text,
  "householdId" text not null,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null
);

-- Cabinets
create table if not exists "cabinets" (
  "id" text primary key,
  "name" text not null,
  "description" text,
  "roomId" text not null,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null
);

-- Categories
create table if not exists "categories" (
  "id" text primary key,
  "name" text not null,
  "description" text,
  "level" integer not null,
  "parentId" text,
  "householdId" text not null,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null
);

-- Items
create table if not exists "items" (
  "id" text primary key,
  "name" text not null,
  "description" text,
  "quantity" integer not null default 1,
  "minQuantity" integer not null default 0,
  "barcode" text,
  "qrCode" text,
  "imageUrl" text,
  "aiDescription" text,
  "language" text,
  "categoryId" text,
  "roomId" text,
  "cabinetId" text,
  "householdId" text not null,
  "addedById" text not null,
  "buyDate" timestamp(3),
  "buyCost" double precision,
  "buyLocation" text,
  "invoiceNumber" text,
  "sellerName" text,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null
);
create unique index if not exists "items_qrCode_key" on "items"("qrCode");

-- Item history
create table if not exists "item_history" (
  "id" text primary key,
  "itemId" text not null,
  "action" text not null,
  "description" text not null,
  "oldRoomId" text,
  "newRoomId" text,
  "oldCabinetId" text,
  "newCabinetId" text,
  "performedBy" text not null,
  "createdAt" timestamp(3) not null default current_timestamp
);

-- Barcodes
create table if not exists "barcodes" (
  "id" text primary key,
  "barcode" text not null unique,
  "name" text not null,
  "description" text,
  "category" text not null,
  "subcategory" text,
  "brand" text,
  "imageUrl" text,
  "language" text,
  "confidence" integer not null default 0,
  "source" text not null default 'ai',
  "isVerified" boolean not null default false,
  "createdBy" text not null,
  "householdId" text not null,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null
);

-- Notifications
create table if not exists "notifications" (
  "id" text primary key,
  "type" text not null,
  "title" text not null,
  "message" text not null,
  "isRead" boolean not null default false,
  "userId" text not null,
  "householdId" text not null,
  "itemId" text,
  "createdAt" timestamp(3) not null default current_timestamp
);

-- FKs
alter table "accounts"
  add constraint "accounts_userId_fkey"
  foreign key ("userId") references "users"("id") on delete cascade on update cascade;

alter table "sessions"
  add constraint "sessions_userId_fkey"
  foreign key ("userId") references "users"("id") on delete cascade on update cascade;

alter table "household_members"
  add constraint "household_members_userId_fkey"
  foreign key ("userId") references "users"("id") on delete cascade on update cascade;

alter table "household_members"
  add constraint "household_members_householdId_fkey"
  foreign key ("householdId") references "households"("id") on delete cascade on update cascade;

alter table "rooms"
  add constraint "rooms_householdId_fkey"
  foreign key ("householdId") references "households"("id") on delete cascade on update cascade;

alter table "cabinets"
  add constraint "cabinets_roomId_fkey"
  foreign key ("roomId") references "rooms"("id") on delete cascade on update cascade;

alter table "categories"
  add constraint "categories_householdId_fkey"
  foreign key ("householdId") references "households"("id") on delete cascade on update cascade;

alter table "categories"
  add constraint "categories_parentId_fkey"
  foreign key ("parentId") references "categories"("id") on delete set null on update cascade;

alter table "items"
  add constraint "items_categoryId_fkey"
  foreign key ("categoryId") references "categories"("id") on delete set null on update cascade;

alter table "items"
  add constraint "items_roomId_fkey"
  foreign key ("roomId") references "rooms"("id") on delete set null on update cascade;

alter table "items"
  add constraint "items_cabinetId_fkey"
  foreign key ("cabinetId") references "cabinets"("id") on delete set null on update cascade;

alter table "items"
  add constraint "items_householdId_fkey"
  foreign key ("householdId") references "households"("id") on delete cascade on update cascade;

alter table "items"
  add constraint "items_addedById_fkey"
  foreign key ("addedById") references "users"("id") on delete restrict on update cascade;

alter table "item_history"
  add constraint "item_history_itemId_fkey"
  foreign key ("itemId") references "items"("id") on delete cascade on update cascade;

alter table "item_history"
  add constraint "item_history_oldRoomId_fkey"
  foreign key ("oldRoomId") references "rooms"("id") on delete set null on update cascade;

alter table "item_history"
  add constraint "item_history_newRoomId_fkey"
  foreign key ("newRoomId") references "rooms"("id") on delete set null on update cascade;

alter table "item_history"
  add constraint "item_history_oldCabinetId_fkey"
  foreign key ("oldCabinetId") references "cabinets"("id") on delete set null on update cascade;

alter table "item_history"
  add constraint "item_history_newCabinetId_fkey"
  foreign key ("newCabinetId") references "cabinets"("id") on delete set null on update cascade;

alter table "item_history"
  add constraint "item_history_performedBy_fkey"
  foreign key ("performedBy") references "users"("id") on delete restrict on update cascade;

alter table "barcodes"
  add constraint "barcodes_createdBy_fkey"
  foreign key ("createdBy") references "users"("id") on delete restrict on update cascade;

alter table "barcodes"
  add constraint "barcodes_householdId_fkey"
  foreign key ("householdId") references "households"("id") on delete cascade on update cascade;

alter table "notifications"
  add constraint "notifications_userId_fkey"
  foreign key ("userId") references "users"("id") on delete cascade on update cascade;

alter table "notifications"
  add constraint "notifications_householdId_fkey"
  foreign key ("householdId") references "households"("id") on delete cascade on update cascade;

alter table "notifications"
  add constraint "notifications_itemId_fkey"
  foreign key ("itemId") references "items"("id") on delete set null on update cascade;

-- ========== DEMO DATA ==========

-- Demo user
insert into "users" ("id","email","name","language","createdAt","updatedAt")
values ('demo-user','demo@smartwarehouse.com','Demo User','en', now(), now())
on conflict ("id") do nothing;

-- Demo household
insert into "households" ("id","name","description","invitationCode","createdAt","updatedAt")
values ('demo-household','Demo Household','Demo household',''||gen_random_uuid()::text||'', now(), now())
on conflict ("id") do nothing;

-- Demo membership (OWNER)
insert into "household_members" ("id","userId","householdId","role","joinedAt")
values (gen_random_uuid()::text,'demo-user','demo-household','OWNER', now())
on conflict do nothing;

-- Demo rooms
insert into "rooms" ("id","name","description","householdId","createdAt","updatedAt") values
('demo-kitchen','廚房','Kitchen','demo-household', now(), now()),
('demo-living','Living Room','Main living area','demo-household', now(), now())
on conflict ("id") do nothing;

-- Demo categories
insert into "categories" ("id","name","description","level","parentId","householdId","createdAt","updatedAt") values
(gen_random_uuid()::text,'Electronics','Electronic devices and accessories',1,null,'demo-household', now(), now()),
(gen_random_uuid()::text,'Kitchen','Kitchen utensils and appliances',1,null,'demo-household', now(), now()),
(gen_random_uuid()::text,'Tools','Hand tools and equipment',1,null,'demo-household', now(), now()),
(gen_random_uuid()::text,'Clothing','Clothing and accessories',1,null,'demo-household', now(), now())
on conflict do nothing;

commit;


