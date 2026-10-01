# System Architecture

The Student Result Prediction System is deliberately split into three simple parts.

## 1. React + JavaScript

The web application is a standard Vite React application written in JavaScript. React builds the pages and forms, React Router handles navigation, and JavaScript performs input validation, derives values such as assignment completion rate and recent-performance trend, applies the trained Ridge Regression equation, and generates the lecturer-facing result.

## 2. Supabase

Supabase is the backend service. It provides:

- email/password authentication for lecturers and advisers;
- the PostgreSQL database;
- Row Level Security protecting `students` and `performance_records`;
- storage of each student's prediction history.

Only authenticated users can read or add student and prediction records.

## 3. Python + scikit-learn

Python is used offline for the machine-learning work in the `ml/` folder. It generates the synthetic dataset, trains and compares Linear Regression, Ridge Regression, Random Forest and Gradient Boosting, evaluates them, and writes the selected Ridge Regression coefficients to `ml/model_coefficients.json`.

The live website does not need Python to be running. The final coefficients are copied into `src/lib/predictPerformance.js`, where the same equation is applied in JavaScript.

## End-to-end flow

1. A lecturer signs in through Supabase Auth.
2. React loads student information from Supabase.
3. The lecturer enters academic information on the Predict page.
4. JavaScript validates the inputs and calculates derived values.
5. JavaScript applies the coefficients learned by the Python-trained Ridge Regression model.
6. The system assigns a risk band and generates positive factors, risk factors and a recommendation.
7. The complete prediction is stored in Supabase and becomes part of the student's history.

This separation keeps the project easy to explain: **Python trains the model, React/JavaScript runs the website and prediction equation, and Supabase handles login and data storage.**
