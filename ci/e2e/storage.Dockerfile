FROM python:3.12-slim-bookworm
RUN pip install --no-cache-dir 'moto[server]==5.1.16'
COPY ci/e2e/storage.py /storage.py
CMD ["python", "/storage.py"]
