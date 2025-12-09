FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye

# Install Infisical CLI
RUN curl -1sLf 'https://dl.cloudsmith.io/public/infisical/infisical-cli/setup.deb.sh' | bash \
    && apt-get update && apt-get install -y infisical postgresql-client \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Enable Corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate
