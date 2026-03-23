from sqlalchemy import Column, Integer, String, DateTime, func, Text
from app.db.base_class import Base

class Dataset(Base):
    __tablename__ = "datasets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    file_path = Column(String(255), nullable=False)
    row_count = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
