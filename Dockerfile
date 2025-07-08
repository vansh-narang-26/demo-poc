# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
ENV SERVER_URL=https://langflow.prod.neuralcompany.team/api/v1/run/5177b7bb-2161-4e4a-9927-6f62d3d2e2b0
ARG NEXT_PUBLIC_ADMIN_USERNAME
ENV NEXT_PUBLIC_ADMIN_USERNAME=$NEXT_PUBLIC_ADMIN_USERNAME
ARG NEXT_PUBLIC_ADMIN_PASSWORD
ENV NEXT_PUBLIC_ADMIN_PASSWORD=$NEXT_PUBLIC_ADMIN_PASSWORD
ARG SERVER_API_KEY
ENV SERVER_API_KEY=$SERVER_API_KEY
ARG NEXT_PUBLIC_AUTO_LOGIN
ENV NEXT_PUBLIC_AUTO_LOGIN=$NEXT_PUBLIC_AUTO_LOGIN

COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

# Set environment variables
ENV SERVER_URL=https://langflow.prod.neuralcompany.team/api/v1/run/5177b7bb-2161-4e4a-9927-6f62d3d2e2b0
ARG NEXT_PUBLIC_ADMIN_USERNAME
ENV NEXT_PUBLIC_ADMIN_USERNAME=$NEXT_PUBLIC_ADMIN_USERNAME
ARG NEXT_PUBLIC_ADMIN_PASSWORD
ENV NEXT_PUBLIC_ADMIN_PASSWORD=$NEXT_PUBLIC_ADMIN_PASSWORD
ARG SERVER_API_KEY
ENV SERVER_API_KEY=$SERVER_API_KEY
ARG NEXT_PUBLIC_AUTO_LOGIN
ENV NEXT_PUBLIC_AUTO_LOGIN=$NEXT_PUBLIC_AUTO_LOGIN

# Copy necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Clean up
RUN npm cache clean --force && \
    rm -rf /var/cache/apk/*

EXPOSE 3000
CMD ["npm", "run", "start"]
