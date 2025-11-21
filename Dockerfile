FROM node

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm install

COPY . .

EXPOSE 3000 
EXPOSE 4111

RUN pnpm run build

CMD ["pnpm", "run", "start"]

# as for debug
# docker run -d -p 4111:4111 mastra-server pnpm run dev
# CMD pnpm run dev

# if instead you want to run the mastra server you can
# docker run -d -p 4111:4111 mastra-server pnpm run mastra:dev
# CMD pnpm run matra:dev

# docker build -t lean-businesses-ai .
# docker run -p 3000:3000 --env-file .env lean-businesses-ai
# docker run -p 4111:4111 --env-file .env lean-businesses-ai pnpm run mastra:dev