To run this project on your local machine, you need to have docker desktop installed and a .env file with your openai or gemini api keys.

# Copy .env.example to .env and fill it with your api keys

`cp .env.example .env`


# Install docker desktop

Just follow the instructions on the [docker website](https://www.docker.com/products/docker-desktop)

# Run the canvas businesses AI

`docker run --pull always -p 3000:3000 --env-file .env ghcr.io/sebastianovide/lean-businesses-ai:main`

# Run mastra playground

`docker run --pull always -p 4111:4111 --env-file .env ghcr.io/sebastianovide/lean-businesses-ai:main pnpm run mastra:dev`
