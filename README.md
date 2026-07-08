# Shrishti Lending Library

A household lending library management app — track books, customers, communities, and lending/return transactions.

## Structure

This is a monorepo with two parts:

```
├── backend/    Spring Boot REST API (Java, Spring Data JPA, HikariCP, H2/PostgreSQL)
└── frontend/   React + Vite single-page app
```

## Backend (`/backend`)

**Stack:** Spring Boot, Spring Data JPA, HikariCP (default connection pool), H2 (local dev) / PostgreSQL (production)

### Setup
1. `cd backend`
2. Copy the example config and fill in your own values:
   ```
   cp src/main/resources/application.properties.example src/main/resources/application.properties
   ```
   This file is gitignored — it will never be committed.
3. Run:
   ```
   ./mvnw spring-boot:run
   ```
   The API will start on `http://localhost:8080`.

## Frontend (`/frontend`)

**Stack:** React 19, Vite, React Router, Axios

### Setup
1. `cd frontend`
2. Install dependencies:
   ```
   npm install
   ```
3. Run the dev server:
   ```
   npm run dev
   ```
   By default it expects the backend at `http://localhost:8080/api` (see `src/services/api.js`).

## Notes

- Local H2 database files (`backend/data/`) are gitignored — they're generated automatically when you run the app.
- Never commit real database credentials. Use `application.properties.example` as the template and keep your real `application.properties` local-only.
