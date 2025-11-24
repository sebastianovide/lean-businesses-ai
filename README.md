# Lean Business AI - Setup Guide

## Prerequisites

- Docker Desktop installed on your computer
- An OpenAI or Gemini API key

## Setup Steps

### 1. Get Your API Key

Create an account and get an API key from:
- [OpenAI](https://platform.openai.com/api-keys) or
- [Google AI Studio](https://aistudio.google.com/app/apikey) (for Gemini)

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Open `.env` in a text editor and configure:

**Required:**
- Add your API key (OpenAI or Gemini)
- Set your AI model

**Example configuration for OpenAI:**
```
OPENAI_API_KEY=sk-proj-your-key-here
AI_MODEL=openai/gpt-5-pro
```

**Example configuration for Gemini:**
```
GOOGLE_GENERATIVE_AI_API_KEY=your-key-here
AI_MODEL=google/gemini-2.5-pro
```

**Important:** The `.env` file must be in the same folder as `docker-compose.yml`.

### 3. Install Docker Desktop

Download and install from: [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)

### 4. Run the Application

```bash
docker compose up
```

Once running, open your browser to:
- **Main App**: `http://localhost:3000`
- **Mastra Playground**: `http://localhost:4111`

## Stop the Application

Press `Ctrl+C` in the terminal.