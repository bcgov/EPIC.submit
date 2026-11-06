FROM python:3.12-slim-bookworm
WORKDIR /app
COPY .e2e-deps/common/jobs/epic-cron/ ./
# Use Common's pins; the email task does not need the extractor/scanner dependencies.
RUN pip install --no-cache-dir -c requirements.txt Flask Flask-SQLAlchemy flask-marshmallow marshmallow-sqlalchemy psycopg2-binary requests python-dotenv
COPY ci/e2e/mail.py /mail.py
ENV PYTHONPATH=/app/src:/app
CMD ["sh", "-c", "while python /mail.py; do sleep 2; done"]
