# Student Result Prediction System

A final-year Computer Science project that predicts student academic performance and highlights students who may need early support.

## Simplified architecture

The website intentionally uses a small, easy-to-explain stack:

- **React + JavaScript** — interface, routing, validation, derived features and live prediction calculation
- **Supabase** — PostgreSQL database, authentication and Row Level Security
- **Python + scikit-learn** — offline dataset generation, model training and evaluation
- **Vercel** — static hosting for the React application

This version uses a standard Vite + React setup written in plain JavaScript so the web architecture stays easy to follow and defend.

## How prediction works

Python is used offline to generate the sample dataset, train and compare four models, and export the selected Ridge Regression coefficients. The React application then applies those fixed coefficients in JavaScript when an authenticated lecturer runs a prediction. If the lecturer chooses to save the prediction, the browser writes the full record to Supabase using the logged-in user's session and the database's Row Level Security policies.

The deployed model uses 13 features covering previous performance, current performance, attendance and study habits, engagement, and course context. The application also calculates assignment rates, recent-performance trend, positive/risk factors, recommendations, and the estimated score range.

## Main pages

- `/` — landing page
- `/about` — methodology
- `/login` — Supabase email/password authentication
- `/dashboard` — cohort overview and risk distribution
- `/predict` — run and save a prediction
- `/students` — student register and CSV import
- `/students/:id` — individual student history
- `/reports` — aggregate charts and model analysis

## Getting started

1. Install Node.js.
2. Copy `.env.example` to `.env` and add the Supabase project URL and publishable key.
3. Install packages and start the application:

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Supabase

The existing schema is kept in `supabase/migrations/`. The React application connects directly to Supabase with the publishable key. Access to `students` and `performance_records` remains controlled by Supabase Authentication and Row Level Security.

## Retraining the model

```bash
cd ml
pip install numpy pandas scikit-learn
python generate_dataset.py
python train_model.py
```

If retraining produces new coefficients, copy the values from `ml/model_coefficients.json` into the `MODEL` constant in `src/lib/predictPerformance.js`.

## Deployment

This is a standard Vite single-page React application. `vercel.json` rewrites deep links such as `/students/:id` back to `index.html`, allowing React Router to handle navigation after refresh.
