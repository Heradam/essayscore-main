import os


class Config:
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    @staticmethod
    def _build_db_uri():
        host = os.getenv("MYSQL_HOST", "localhost")
        user = os.getenv("MYSQL_USER", "root")
        password = os.getenv("MYSQL_ROOT_PASSWORD", "123456")
        database = os.getenv("MYSQL_DATABASE", "essay_scoring")
        return f"mysql+pymysql://{user}:{password}@{host}/{database}?charset=utf8mb4"

    SQLALCHEMY_DATABASE_URI = _build_db_uri.__func__()
