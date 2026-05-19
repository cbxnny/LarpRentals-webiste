# CAB230 Rentals

A React + Vite web app for browsing and rating rental properties, built as a client for the CAB230 rental API.

## Project Overview

This repository contains:

- A React frontend using Vite, React Router, Bootstrap, Axios, and AOS animations.
- A client interface for searching and filtering rentals, viewing rental details, rating properties, and managing user profiles.
- A backend API in the `cab230-rental-api/` folder that provides rental data, authentication, and rating endpoints.

## Features

- Search rentals by state, suburb, postcode, property type, rent range, bedrooms, bathrooms, and parking.
- View rental details with map and rating options.
- User authentication with registration and login flows.
- Rating system for saved rentals and profile management.
- Responsive navigation and page routing.

## Repository Structure

- `src/` - React frontend source code
  - `components/` - reusable UI components such as navigation
  - `pages/` - route pages including Home, Search, RentalDetail, Login, Register, RatedRentals, About, Profile
  - `api/` - Axios wrapper for backend API calls
  - `context/` - auth context for user session state
- `cab230-rental-api/` - Express backend API server
  - `app.js` - main API server
  - `routes/` - API route handlers
  - `middleware/` - auth and database middleware
  - `migrations/` - database migration scripts
- `public/` - static assets and images

## Requirements

- Node.js 20+ recommended
- npm or yarn
- Local MySQL database for the backend API if using full server functionality

## Setup and Run

### Frontend

1. Open a terminal in the project root.
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open the app in the browser at `http://localhost:5173`.

### Backend API

1. Open a terminal in `cab230-rental-api/`.
2. Install backend dependencies:

```bash
cd cab230-rental-api
npm install
```

3. Start the API server:

```bash
npm run dev
```

4. The backend runs by default on `http://localhost:3000`.

> The frontend expects the API server at `http://localhost:3000`.

## Scripts

- `npm run dev` - start Vite frontend dev server
- `npm run build` - build production frontend assets
- `npm run preview` - preview built frontend
- `npm run lint` - run ESLint on the frontend source

## Notes

- Authentication and protected routes use JWT tokens.
- The frontend uses `axios` to call the backend API at `http://localhost:3000`.
- If you update the backend port or API routes, update `src/api/rentals.js` accordingly.

## Contact

For development or debugging, inspect the frontend entry at `src/App.jsx` and the backend API entry at `cab230-rental-api/app.js`.
