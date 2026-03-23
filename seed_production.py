import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User
from app.models.dataset import Dataset
from app.models.ml.ml_model import MLModel
from app.models.audit_log import AuditLog
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import time

DB_URL = "sqlite:///c:/Users/ajay/Desktop/SE Project/backend/db/dev.db"

def seed():
    engine = create_engine(DB_URL)
    Session = sessionmaker(bind=engine)
    db = Session()
    try:
        # 1. Seed Datasets (Fixes Analyst Dashboard)
        if db.query(Dataset).count() == 0:
            print("Seeding Datasets...")
            ds1 = Dataset(
                name="production_v1.csv",
                description="Historical CI/CD failure data from Q1-Q2",
                file_path="/data/datasets/production_v1.csv",
                row_count=1542
            )
            ds2 = Dataset(
                name="pipeline_v2_synthetic.csv",
                description="Synthetic edge-case failures for model robustness",
                file_path="/data/datasets/pipeline_v2_synthetic.csv",
                row_count=892
            )
            db.add(ds1); db.add(ds2)
            db.flush() 

            # 2. Seed ML Models (Fixes AI Console stats)
            print("Seeding ML Models...")
            m1 = MLModel(
                name="RandomForest_Classifier",
                version="1.2.0",
                accuracy=0.94,
                f1_score=0.92,
                precision=0.93,
                recall=0.91
            )
            m2 = MLModel(
                name="XGBoost_Optimized",
                version="2.0.4",
                accuracy=0.96,
                f1_score=0.95,
                precision=0.94,
                recall=0.96
            )
            m3 = MLModel(
                name="Ensemble_Voter_v1",
                version="1.0.1",
                accuracy=0.97,
                f1_score=0.96,
                precision=0.97,
                recall=0.95
            )
            db.add(m1); db.add(m2); db.add(m3)

        # 3. Ensure User Exists
        if db.query(User).count() == 0:
             print("Seeding Admin User...")
             admin = User(
                 email="admin@pipeline.ai",
                 name="Admin",
                 role="Admin",
                 is_active=True
             )
             db.add(admin)

        db.commit()
        print("✅ Seeding complete!")
    except Exception as e:
        print(f"❌ Seeding failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
