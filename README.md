# Lead Scoring Dashboard

This project is a Vite + React web application for managing and analyzing lead scoring data.

## Installation

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

- `VITE_SUPABASE_URL` – Supabase project URL
- `VITE_SUPABASE_ANON_KEY` – Supabase anonymous key
- `VITE_API_URL` – (Optional) backend API endpoint
- `VITE_OPENAI_API_KEY` – (Optional) OpenAI API key for AI features

## Deployment

Build the production bundle and deploy the `dist` folder to your hosting provider.
This repo includes a `vercel.json` configuration for deploying to [Vercel](https://vercel.com).

```bash
npm run build
```

## Architecture

The project structure inside `src/` is organized as follows:

```
src/
├── components/        # UI components and pages
├── contexts/          # React context providers
├── lib/               # Supabase client and utility functions
├── App.jsx            # Application routes and layout
└── main.jsx           # Application entry point
```
