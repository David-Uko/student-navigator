# Student Result Prediction System

A web application that predicts student academic performance from attendance, test scores, and study habits, and flags students who may need early support. Built as a final-year Computer Science project.

## What it does

The system uses a linear regression model, trained in Python with scikit-learn, to predict a student's likely final score from three inputs:

- **Attendance rate** — proportion of classes attended
- **Average test score** — continuous assessment / test average
- **Study habits score** — a composite of self-reported study hours and consistency

The prediction is classified into one of three risk bands so lecturers and academic advisers can act on it at a glance:

| Predicted score | Risk band     |
| --------------- | ------------- |
| 0 – 39          | At Risk       |
| 40 – 59         | Needs Support |
| 60 – 100        | On Track      |

## How it's built

The project has two connected but separately-developed parts:

1. **The model** (`ml/`) — a Python script generates a 300-record training dataset and fits a scikit-learn `LinearRegression` model, then evaluates it on a held-out test split and reports R², MAE, and RMSE. See `ml/metrics_report.txt` for the full evaluation and `ml/train_model.py` / `ml/generate_dataset.py` for the code.
2. **The web app** (`src/`) — a React + TypeScript app (TanStack Start) with a Supabase backend (Postgres database + auth). The model's trained intercept and coefficients are applied server-side, in a TanStack Start server function, so predictions never depend on running Python in production — only the final small set of numbers crosses from the Python side into the app.

### Tech stack

- **Frontend:** React, TypeScript, Tailwind CSS, TanStack Start / TanStack Router, Recharts
- **Backend:** Supabase (PostgreSQL database, authentication, server-side prediction logic)
- **Model:** Python, pandas, NumPy, scikit-learn

### Pages

- `/` — Landing page
- `/dashboard` — Overview: stat cards, risk distribution, at-risk students
- `/predict` — Enter a student's data and get a live prediction
- `/students` — Search, filter, and manage the student register
- `/students/:id` — Individual student profile and performance history
- `/reports` — Aggregate charts and model-accuracy comparison
- `/about` — Plain-language explanation of the methodology
- `/login` — Email/password authentication for lecturers and advisers

## Getting started

You'll need Node.js and a Supabase project.

```sh
npm install
```

Create a `.env` file in the project root with your Supabase project's URL and publishable key:

```
VITE_SUPABASE_URL="https://<your-project-ref>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<your-publishable-key>"
VITE_SUPABASE_PROJECT_ID="<your-project-ref>"
SUPABASE_URL="https://<your-project-ref>.supabase.co"
SUPABASE_PUBLISHABLE_KEY="<your-publishable-key>"
SUPABASE_PROJECT_ID="<your-project-ref>"
```

Run the database migration in `supabase/migrations/` against your Supabase project to create the `students` and `performance_records` tables, then start the dev server:

```sh
npm run dev
```

### Other scripts

```sh
npm run build     # production build
npm run preview   # preview the production build locally
npm run lint       # lint the codebase
npm run format     # format with Prettier
```

### Retraining the model

```sh
cd ml
pip install numpy pandas scikit-learn
python generate_dataset.py   # regenerates ml/dataset.csv
python train_model.py        # retrains and writes ml/model_coefficients.json + ml/metrics_report.txt
```

If you retrain with different data, copy the new values from `ml/model_coefficients.json` into the `MODEL` constant in `src/lib/prediction.functions.ts`.
