FROM python:3.11-slim-bookworm
WORKDIR /app
COPY .e2e-deps/document/epic-document-api/ ./
RUN pip install --no-cache-dir -r requirements.txt && pip install --no-deps .
ENV PYTHONPATH=/app/src FLASK_APP=wsgi.py
CMD ["sh", "-c", "flask db upgrade && gunicorn --bind 0.0.0.0:8080 wsgi:application"]
