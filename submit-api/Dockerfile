FROM python:3.12-slim-bookworm
USER root

# Create working directory
RUN mkdir /opt/app-root && chmod 755 /opt/app-root
WORKDIR /opt/app-root

# Install system requirements
RUN apt-get update && apt-get install -y \
    libsasl2-dev \
    libldap2-dev \
    libssl-dev \
    gcc \
    git \
 && rm -rf /var/lib/apt/lists/*

# Install the requirements
COPY ./requirements.txt .

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN pip install .

USER 1001

# Set Python path
ENV PYTHONPATH=/opt/app-root/src

ENTRYPOINT ["bash", "docker-entrypoint.sh"]
