FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash

# Add Bun to PATH for all users
RUN echo 'export PATH="$HOME/.bun/bin:$PATH"' >> /etc/bash.bashrc
RUN echo 'export PATH="$HOME/.bun/bin:$PATH"' >> /etc/zsh/zshrc

# Install additional tools that might be useful for 3D development
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    vim \
    nano \
    tree \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Set up workspace
WORKDIR /workspaces/gity-skylines

# Copy package files for better layer caching
COPY github-city-generator/package.json github-city-generator/bun.lock* ./github-city-generator/

# Install dependencies using the vscode user
USER vscode
RUN /home/vscode/.bun/bin/bun install --cwd github-city-generator

USER root
