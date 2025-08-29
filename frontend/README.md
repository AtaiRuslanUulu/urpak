# URPAK Frontend

This directory contains the Next.js frontend for the URPAK platform. It consumes the backend API so the backend must be running for most pages to function. For full project setup, including the backend, see the [root README](../README.md).

## Environment Variables

Create a `.env.local` in this folder (or set variables in your deployment environment) with the following values:

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_LOGO_URL=/favicon.ico
```

- `NEXT_PUBLIC_API_URL` – Base URL of the backend API. All data requests are prefixed with this value (e.g. `${NEXT_PUBLIC_API_URL}/api/projects/`).
- `NEXT_PUBLIC_LOGO_URL` – Optional URL for the logo shown in the header.

## API Integration

The frontend fetches data from the backend using the URL defined by `NEXT_PUBLIC_API_URL`. Ensure the backend server is available before running the frontend. Example endpoints include:

- `GET /api/projects/`
- `GET /api/developers/`
- `GET /api/apartments/<id>/`

## Development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000) and automatically reloads as you edit files.

## Production

Create an optimized production build and start the server:

```bash
npm run build
npm start
```

## Deployment

A `Dockerfile` is provided for containerized deployments:

```bash
docker build -t urpak-frontend .
docker run -p 3000:3000 --env-file .env.production urpak-frontend
```

Make sure to supply the necessary environment variables either through an env file or your hosting provider's configuration. Platforms like Vercel can also deploy this Next.js app directly.

