from app.api.v1.endpoints import gitlab, admin, ml, datasets, models

api_router = APIRouter()
api_router.include_router(gitlab.router, prefix="/gitlab", tags=["gitlab"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(ml.router, prefix="/predict", tags=["ml"])
api_router.include_router(datasets.router, prefix="/datasets", tags=["datasets"])
api_router.include_router(models.router, prefix="/models", tags=["models"])
# ... include more as they are migrated ...
