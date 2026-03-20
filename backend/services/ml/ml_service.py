import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV, cross_validate
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.preprocessing import StandardScaler
import joblib
from datetime import datetime
from models.ml.ml_model import MLAlgorithm, MLModel
from models.dataset import Dataset
from sqlalchemy.orm import Session
from services.audit_log_service import log_action
from typing import List, Dict, Any

# Columns to always exclude from ML features (identifiers / strings / timestamps)
_EXCLUDE_COLS = {"label", "pipeline_status", "commit_id", "developer_id", "commit_timestamp"}


def _find_features_file(dataset: Dataset) -> str:
    candidates = [
        dataset.file_path,
        dataset.file_path + ".features.csv",
        dataset.file_path.replace(".cleaned.csv", ".features.csv"),
    ]
    for path in candidates:
        if path and os.path.exists(path) and path.endswith(".csv"):
            return path
    raise FileNotFoundError(
        f"No features file found for dataset #{dataset.id}. "
        f"Tried: {candidates}. Please re-run feature extraction."
    )


def _prepare_xy(df: pd.DataFrame):
    if "label" in df.columns:
        label_col = "label"
    elif "pipeline_status" in df.columns:
        label_col = "pipeline_status"
    else:
        raise ValueError("No label column ('label' or 'pipeline_status') found in features file.")

    y = df[label_col].astype(int)

    drop = _EXCLUDE_COLS | {label_col}
    X = df.drop(columns=[c for c in drop if c in df.columns])

    non_numeric = [c for c in X.columns if not pd.api.types.is_numeric_dtype(X[c])]
    if non_numeric:
        X = X.drop(columns=non_numeric)

    if X.empty:
        raise ValueError("No numeric feature columns found after filtering.")

    return X.astype(float), y


def _evaluate_and_save_model(model, algorithm: MLAlgorithm, X_train, y_train, X_test, y_test, X, scaler, dataset_id: int, user_id: int, best_params=None) -> MLModel:
    cv_scoring = ['accuracy', 'precision', 'recall', 'f1']
    cv_results = cross_validate(model, X_train, y_train, cv=5, scoring=cv_scoring)

    y_pred = model.predict(X_test)

    feature_importances = []
    if hasattr(model, 'feature_importances_') and model.feature_importances_ is not None:
        importances = model.feature_importances_
        for name, imp in zip(X.columns, importances):
            feature_importances.append({"feature": name, "importance": float(imp)})
        feature_importances = sorted(feature_importances, key=lambda x: x["importance"], reverse=True)
    elif algorithm == MLAlgorithm.logistic_regression and hasattr(model, 'coef_'):
        importances = np.abs(model.coef_[0])
        for name, imp in zip(X.columns, importances):
            feature_importances.append({"feature": name, "importance": float(imp)})
        feature_importances = sorted(feature_importances, key=lambda x: x["importance"], reverse=True)

    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1_score": float(f1_score(y_test, y_pred, zero_division=0)),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        "cv": {
            "accuracy_mean": float(np.mean(cv_results['test_accuracy'])),
            "accuracy_std": float(np.std(cv_results['test_accuracy'])),
            "precision_mean": float(np.mean(cv_results['test_precision'])),
            "precision_std": float(np.std(cv_results['test_precision'])),
            "recall_mean": float(np.mean(cv_results['test_recall'])),
            "recall_std": float(np.std(cv_results['test_recall'])),
            "f1_mean": float(np.mean(cv_results['test_f1'])),
            "f1_std": float(np.std(cv_results['test_f1'])),
        },
        "train_size": len(X_train),
        "test_size": len(X_test),
        "feature_names": list(X.columns),
        "feature_importances": feature_importances
    }

    if best_params:
        metrics["best_params"] = best_params

    version = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    _BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    model_dir = os.path.join(_BASE, "ml", "models")
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, f"model_{dataset_id}_{algorithm}_{version}.joblib")
    scaler_path = model_path.replace(".joblib", "_scaler.joblib")
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)

    ml_model = MLModel(
        dataset_id=dataset_id,
        algorithm=algorithm,
        version=version,
        metrics=metrics,
        model_path=model_path,
        trained_by=user_id,
        is_active=False
    )
    return ml_model


def train_model(
    db: Session, dataset: Dataset, user_id: int, ip: str = None
) -> List[MLModel]:
    features_path = _find_features_file(dataset)
    df = pd.read_csv(features_path)
    X, y = _prepare_xy(df)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42, stratify=y
        )
    except ValueError:
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42
        )

    # Deactivate existing models for this dataset
    db.query(MLModel).filter(MLModel.dataset_id == dataset.id).update({MLModel.is_active: False}, synchronize_session=False)

    # 1. Logistic Regression
    lr = LogisticRegression(max_iter=1000, random_state=42)
    lr.fit(X_train, y_train)

    # 2. Decision Tree
    dt = DecisionTreeClassifier(max_depth=7, min_samples_split=5, random_state=42)
    dt.fit(X_train, y_train)

    # 3. Random Forest (with CV)
    param_grid = {'n_estimators': [50, 100], 'max_depth': [5, 10, None], 'min_samples_split': [2, 5]}
    rf_grid = GridSearchCV(RandomForestClassifier(random_state=42), param_grid, cv=3, scoring='f1', n_jobs=-1)
    rf_grid.fit(X_train, y_train)
    rf_best = rf_grid.best_estimator_

    # 4. Ensemble Voting Classifier
    ensemble = VotingClassifier(
        estimators=[('lr', lr), ('dt', dt), ('rf', rf_best)],
        voting='soft'
    )
    ensemble.fit(X_train, y_train)

    models_to_run = [
        (MLAlgorithm.logistic_regression, lr, None),
        (MLAlgorithm.decision_tree, dt, None),
        (MLAlgorithm.random_forest, rf_best, rf_grid.best_params_),
        (MLAlgorithm.ensemble, ensemble, None)
    ]

    trained_ml_models = []
    best_model = None
    best_f1 = -1

    for algo, model, best_params in models_to_run:
        ml_model = _evaluate_and_save_model(
            model, algo, X_train, y_train, X_test, y_test, X, scaler, dataset.id, user_id, best_params
        )
        trained_ml_models.append(ml_model)

        # Select the best model
        if algo != MLAlgorithm.ensemble:
            f1 = ml_model.metrics.get("f1_score", 0)
            if f1 > best_f1:
                best_f1 = f1
                best_model = ml_model

    # Set the best model as active
    if best_model:
        best_model.is_active = True

    for m in trained_ml_models:
        db.add(m)
    db.commit()

    for m in trained_ml_models:
        db.refresh(m)

    log_action(db, user_id, f"train_multi_models_dataset:{dataset.id}", ip)
    return trained_ml_models

def evaluate_model(db: Session, ml_model: MLModel) -> dict:
    model = joblib.load(ml_model.model_path)
    scaler = joblib.load(ml_model.model_path.replace(".joblib", "_scaler.joblib"))

    features_path = _find_features_file(ml_model.dataset)
    df = pd.read_csv(features_path)
    X, y = _prepare_xy(df)

    X_scaled = scaler.transform(X.astype(float))
    y_pred = model.predict(X_scaled)

    # Return exactly what's actually in ml_model.metrics so the UI has CV and feature importances
    return ml_model.metrics


def predict_model(ml_model: MLModel, input_data: dict) -> dict:
    model = joblib.load(ml_model.model_path)
    scaler = joblib.load(ml_model.model_path.replace(".joblib", "_scaler.joblib"))

    feature_names = (ml_model.metrics or {}).get("feature_names")
    if feature_names:
        values = [float(input_data.get(f, 0)) for f in feature_names]
    else:
        values = [float(v) for v in input_data.values()]

    X = np.array([values])
    X_scaled = scaler.transform(X)
    pred = model.predict(X_scaled)[0]
    prob = model.predict_proba(X_scaled)[0][1] if hasattr(model, "predict_proba") else None

    # Calculate local top risk factors
    top_risk_factors = []
    if feature_names and ml_model.metrics:
        global_importances = {item["feature"]: item["importance"] for item in ml_model.metrics.get("feature_importances", [])}
        if global_importances:
            # We use global importance * normalized feature value as a rough heuristic for local impact
            local_impacts = []
            for i, fname in enumerate(feature_names):
                val = X_scaled[0][i]
                imp = global_importances.get(fname, 0)
                # Only care if it pushed the probability of failure up (positive value in scaled space * importance)
                impact = max(0, val * imp)
                local_impacts.append({"feature": fname, "impact": float(impact), "value": values[i]})
            
            # Sort by impact and take top 3
            local_impacts.sort(key=lambda x: x["impact"], reverse=True)
            
            # Normalize to percentages
            total_impact = sum(x["impact"] for x in local_impacts)
            if total_impact > 0:
                for item in local_impacts[:3]:
                    if item["impact"] > 0:
                        top_risk_factors.append({
                            "feature": item["feature"],
                            "contribution": round((item["impact"] / total_impact) * 100, 1),
                            "value": item["value"]
                        })

    return {
        "prediction": "Success" if int(pred) == 1 else "Failure",
        "probability": float(prob) if prob is not None else None,
        "top_risk_factors": top_risk_factors
    }

def compare_models(db: Session, dataset_id: int) -> list:
    models = db.query(MLModel).filter(MLModel.dataset_id == dataset_id).all()
    
    # Sort models by creation time so newest come last
    models = sorted(models, key=lambda m: m.created_at)

    return [{
        "model_id": m.id,
        "algorithm": m.algorithm,
        "version": m.version,
        "is_active": m.is_active,
        "metrics": {k: v for k, v in (m.metrics or {}).items() if k != "feature_names"},
        "created_at": str(m.created_at)
    } for m in models]
