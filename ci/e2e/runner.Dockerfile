FROM mcr.microsoft.com/playwright:v1.57.0-noble
WORKDIR /tests
COPY submit-web/package.json submit-web/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY submit-web/ ./
ENV CI=true
CMD ["npx", "playwright", "test", "--config=playwright.isolated.config.ts"]
