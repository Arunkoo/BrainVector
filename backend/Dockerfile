FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and Prisma schema first
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies, which triggers Prisma Client generation
RUN npm install

# Copy all remaining files for development (volume mount will handle syncing changes)
COPY . .

# Expose backend port
EXPOSE 3000

# Run migrations and then start the application
# `migrate deploy` is safe to run on every startup
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:dev"]