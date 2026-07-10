from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file="../../.env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    google_api_key: str = ""
    cors_origins: str = (
        "http://localhost:3000,"
        "http://127.0.0.1:3000,"
        "https://trydocumind.vercel.app"
    )
    session_ttl_minutes: int = 30
    rate_limit_per_hour: int = 20
    max_pdf_size_mb: int = 10
    cleanup_interval_seconds: int = 300

    # S3-compatible object storage (Backblaze B2 / R2 / MinIO)
    s3_endpoint_url: str = ""
    s3_region: str = ""
    s3_access_key_id: str = ""
    s3_secret_access_key: str = ""
    s3_bucket_name: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]

    @property
    def max_pdf_size_bytes(self) -> int:
        return self.max_pdf_size_mb * 1024 * 1024

    @property
    def s3_enabled(self) -> bool:
        return bool(
            self.s3_endpoint_url.strip()
            and self.s3_access_key_id.strip()
            and self.s3_secret_access_key.strip()
            and self.s3_bucket_name.strip()
        )


settings = Settings()
