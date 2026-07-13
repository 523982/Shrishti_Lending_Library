-- Supabase/PostgreSQL schema for Shrishti Lending Library.
-- Run this in Supabase SQL Editor before pointing the Spring Boot app to Supabase.

create table if not exists book_status (
    status_id bigint primary key,
    description varchar(50) not null unique
);

insert into book_status (status_id, description) values
    (1, 'AVAILABLE'),
    (2, 'UNAVAILABLE'),
    (3, 'SOLD'),
    (4, 'LOST_DAMAGED'),
    (5, 'TO_BE_SOLD'),
    (6, 'OBSOLETE')
on conflict (status_id) do update
set description = excluded.description;

create table if not exists communities (
    community_id bigint primary key,
    community_name varchar(255) not null unique
);

create table if not exists inventory (
    book_id bigint primary key,
    book_name varchar(255) not null,
    author varchar(255),
    genre varchar(255),
    status_id bigint references book_status(status_id),
    lending_cost numeric(10, 2) not null check (lending_cost >= 0),
    purchase_price numeric(10, 2)
);

create table if not exists customers (
    customer_id varchar(64) primary key,
    customer_name varchar(255) not null,
    block_number varchar(100),
    unit_number varchar(100),
    mobile_number varchar(30),
    community_id bigint not null references communities(community_id)
);

create table if not exists transactions (
    transaction_id varchar(64) primary key,
    customer_id varchar(64) not null references customers(customer_id),
    book_id bigint not null references inventory(book_id),
    pickup_date date not null default current_date,
    return_date date,
    total_amount numeric(10, 2) not null,
    is_swap boolean default false,
    is_partially_paid boolean default false,
    amount_paid numeric(10, 2)
);

create index if not exists idx_inventory_status_id on inventory(status_id);
create index if not exists idx_inventory_book_name on inventory(lower(book_name));
create index if not exists idx_customers_community_id on customers(community_id);
create index if not exists idx_customers_customer_name on customers(lower(customer_name));
create index if not exists idx_transactions_book_id on transactions(book_id);
create index if not exists idx_transactions_customer_id on transactions(customer_id);
create index if not exists idx_transactions_active_book on transactions(book_id) where return_date is null;
