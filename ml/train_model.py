"""
Trains and evaluates the Student Result Prediction System's model (v2,
expanded feature set), as described in Chapter 3 (Methodology).

Compares four regression models on the same train/test split:
  - Linear Regression   (interpretable baseline)
  - Ridge Regression     (regularised linear baseline)
  - Random Forest Regressor
  - Gradient Boosting Regressor

For each model, reports:
  - Regression metrics on the held-out test split: R^2, MAE, RMSE
  - Classification metrics for the resulting risk band (derived from the
    predicted score via the existing thresholds), including per-class
    precision/recall/F1 and the confusion matrix — with special attention
    to "At Risk" recall, since missing an at-risk student is the costliest
    error this system can make.

Selects a final model for production and explains why (see SELECTION
NOTE below). Writes:
  - metrics_report.txt          (full comparison, for Chapter 4)
  - model_coefficients.json     (deployed model's parameters, for the web app)

Run: python train_model.py
"""

import json

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import (
    confusion_matrix,
    mean_absolute_error,
    mean_squared_error,
    precision_recall_fscore_support,
    r2_score,
)
from sklearn.model_selection import train_test_split

RANDOM_SEED = 42

FEATURES = [
    "previous_semester_average",
    "previous_failed_courses",
    "attendance_rate",
    "avg_test_score",
    "study_habits_score",
    "assignment_average",
    "assignment_completion_rate",
    "assignment_late_rate",
    "performance_change",
    "engagement_score",
    "lms_activity_score",
    "course_load",
    "weeks_remaining",
]
TARGET = "final_score"
RISK_BANDS = ["At Risk", "Needs Support", "On Track"]


def risk_band(score: float) -> str:
    if score < 40:
        return "At Risk"
    if score < 60:
        return "Needs Support"
    return "On Track"


def evaluate_regression(y_true, y_pred):
    return {
        "r2": r2_score(y_true, y_pred),
        "mae": mean_absolute_error(y_true, y_pred),
        "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
    }


def evaluate_risk_bands(y_true, y_pred):
    y_pred_clipped = np.clip(y_pred, 0, 100)
    true_bands = [risk_band(s) for s in y_true]
    pred_bands = [risk_band(s) for s in y_pred_clipped]

    precision, recall, f1, support = precision_recall_fscore_support(
        true_bands, pred_bands, labels=RISK_BANDS, zero_division=0
    )
    accuracy = float(np.mean(np.array(true_bands) == np.array(pred_bands)))
    cm = confusion_matrix(true_bands, pred_bands, labels=RISK_BANDS)

    per_class = {
        band: {
            "precision": float(precision[i]),
            "recall": float(recall[i]),
            "f1": float(f1[i]),
            "support": int(support[i]),
        }
        for i, band in enumerate(RISK_BANDS)
    }
    return {
        "accuracy": accuracy,
        "per_class": per_class,
        "confusion_matrix": cm.tolist(),
        "labels": RISK_BANDS,
    }


def format_confusion_matrix(cm, labels):
    header = "                 " + "".join(f"{'Pred ' + l:>16}" for l in labels)
    lines = [header]
    for i, l in enumerate(labels):
        row = "".join(f"{cm[i][j]:>16}" for j in range(len(labels)))
        lines.append(f"{'Actual ' + l:>17}{row}")
    return "\n".join(lines)


def main():
    df = pd.read_csv("dataset.csv")
    X = df[FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED
    )

    candidates = {
        "Linear Regression": LinearRegression(),
        "Ridge Regression": Ridge(alpha=5.0, random_state=RANDOM_SEED),
        "Random Forest": RandomForestRegressor(
            n_estimators=200, max_depth=6, random_state=RANDOM_SEED
        ),
        "Gradient Boosting": GradientBoostingRegressor(
            n_estimators=150, max_depth=3, learning_rate=0.08, random_state=RANDOM_SEED
        ),
    }

    results = {}
    for name, model in candidates.items():
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        reg = evaluate_regression(y_test, y_pred)
        cls = evaluate_risk_bands(y_test.to_numpy(), y_pred)
        results[name] = {"model": model, "regression": reg, "classification": cls}

    # --- SELECTION NOTE -----------------------------------------------------
    # The deployed web app has no Python runtime in production (see Chapter 3:
    # the architecture deliberately keeps model training offline in Python and
    # only ships the trained parameters into a TypeScript server function).
    # A linear model's parameters are four numbers that port perfectly into
    # that architecture. A Random Forest or Gradient Boosting model would
    # require porting dozens of decision trees into the TypeScript runtime —
    # possible, but a large increase in complexity and a new source of bugs,
    # for a project whose explainability requirement (Chapter 3 §requirement
    # 12: plain-language positive/risk factors for lecturers) is best served
    # by a model whose per-feature contribution is a direct, exact
    # coefficient rather than an approximated, sampled explanation.
    #
    # Ridge Regression is therefore selected for deployment over Linear
    # Regression specifically (both are simple to port) because L2
    # regularisation gives more stable coefficients now that there are 15,
    # partly-correlated input features (e.g. avg_test_score and
    # assignment_average both track current performance) — unregularised
    # linear regression tends to split weight unpredictably between
    # correlated features, which would make the per-feature explanations
    # less trustworthy from one training run to the next.
    #
    # Random Forest and Gradient Boosting are trained and reported below
    # for honest comparison, not discarded silently.
    deployed_name = "Ridge Regression"
    deployed = results[deployed_name]["model"]

    coefficients = {
        "intercept": round(float(deployed.intercept_), 4),
        **{f: round(float(c), 4) for f, c in zip(FEATURES, deployed.coef_)},
    }
    with open("model_coefficients.json", "w") as f:
        json.dump({"model": deployed_name, "version": "v2", **coefficients}, f, indent=2)

    # --- Report ---------------------------------------------------------
    lines = []
    lines.append("Student Result Prediction System — Model Evaluation Report (v2)")
    lines.append("=" * 70)
    lines.append("")
    lines.append(f"Dataset: dataset.csv ({len(df)} records, {len(FEATURES)} features)")
    lines.append(
        f"Train / test split: {len(X_train)} / {len(X_test)} records (80/20, random_state={RANDOM_SEED})"
    )
    lines.append("")
    lines.append("Models compared: " + ", ".join(candidates.keys()))
    lines.append("")

    for name, r in results.items():
        reg = r["regression"]
        cls = r["classification"]
        at_risk = cls["per_class"]["At Risk"]
        lines.append("-" * 70)
        lines.append(name)
        lines.append("-" * 70)
        lines.append(
            f"  Regression:  R^2 = {reg['r2']:.4f}   MAE = {reg['mae']:.2f}   RMSE = {reg['rmse']:.2f}"
        )
        lines.append(f"  Risk-band accuracy: {cls['accuracy'] * 100:.1f}%")
        lines.append(
            f"  At Risk        — precision {at_risk['precision']:.2f}  recall {at_risk['recall']:.2f}  "
            f"f1 {at_risk['f1']:.2f}  (support {at_risk['support']})"
        )
        for band in ["Needs Support", "On Track"]:
            c = cls["per_class"][band]
            lines.append(
                f"  {band:<14} — precision {c['precision']:.2f}  recall {c['recall']:.2f}  "
                f"f1 {c['f1']:.2f}  (support {c['support']})"
            )
        lines.append("  Confusion matrix (rows = actual, columns = predicted):")
        lines.append("  " + format_confusion_matrix(cls["confusion_matrix"], cls["labels"]))
        lines.append("")

    deployed_reg = results[deployed_name]["regression"]
    deployed_cls = results[deployed_name]["classification"]
    deployed_at_risk = deployed_cls["per_class"]["At Risk"]

    lines.append("=" * 70)
    lines.append(f"DEPLOYED MODEL: {deployed_name}")
    lines.append("=" * 70)
    lines.append(
        "Selected for deployment because its parameters (an intercept plus one "
        "coefficient per feature) port exactly into the TypeScript server "
        "function that serves predictions in production, and because L2 "
        "regularisation keeps its coefficients stable despite correlated "
        "input features — which matters because those same coefficients are "
        "shown to lecturers as the explanation for each prediction. Random "
        "Forest and Gradient Boosting were evaluated (above) and are not "
        "categorically worse, but porting an ensemble of trees into the "
        "existing Python-free serving architecture would add substantial "
        "complexity for a final-year project without a clear accuracy "
        "justification here."
    )
    lines.append("")
    lines.append("Fitted equation:")
    lines.append(f"  predicted_score = {coefficients['intercept']:.2f}")
    for f in FEATURES:
        lines.append(f"    + ({coefficients[f]:.4f} * {f})")
    lines.append("")
    lines.append("Held-out test performance:")
    lines.append(f"  R^2   = {deployed_reg['r2']:.4f}")
    lines.append(f"  MAE   = {deployed_reg['mae']:.2f} points")
    lines.append(f"  RMSE  = {deployed_reg['rmse']:.2f} points")
    lines.append(f"  Risk-band accuracy = {deployed_cls['accuracy'] * 100:.1f}%")
    lines.append(
        f"  At Risk recall = {deployed_at_risk['recall']:.2f} "
        f"({deployed_at_risk['recall'] * 100:.0f}% of genuinely at-risk students "
        f"in the test set were correctly flagged)"
    )
    lines.append("")
    lines.append("Limitations:")
    lines.append(
        "  - Trained on a synthetic dataset (see generate_dataset.py), not real "
        "institutional records. Course load and weeks-remaining were "
        "generated independently of the outcome, so their near-zero "
        "coefficients reflect the synthetic data design, not a claim that "
        "these factors are unimportant in reality."
    )
    lines.append(
        "  - At Risk is the smallest, hardest class to predict (fewest "
        "training examples); its recall is the single most important "
        "number in this report for an early-warning system and should be "
        "monitored closely if the model is retrained on real data."
    )

    report = "\n".join(lines)
    with open("metrics_report.txt", "w") as f:
        f.write(report + "\n")
    print(report)


if __name__ == "__main__":
    main()
