from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mysql_host: str = "localhost"
    mysql_port: int = 3307
    mysql_user: str = "rankapi"
    mysql_password: str = "rankapi"
    mysql_database: str = "rankapi"

    redis_host: str = "localhost"
    redis_port: int = 6379
    cache_ttl_seconds: int = 300

    model_config = SettingsConfigDict(env_file=".env")

    @property
    def mysql_url(self) -> str:
        return (
            f"mysql+pymysql://{self.mysql_user}:{self.mysql_password}"
            f"@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"
        )


settings = Settings()
