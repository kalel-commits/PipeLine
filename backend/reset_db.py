from db import engine
import sqlalchemy as sa

def reset_db():
    print("--- Resetting Database for Unified Schema ---")
    with engine.connect() as conn:
        conn.execute(sa.text("DROP TABLE IF EXISTS vcs_predictions"))
        conn.commit()
    print("✅ Webhook table dropped.")

if __name__ == "__main__":
    reset_db()
