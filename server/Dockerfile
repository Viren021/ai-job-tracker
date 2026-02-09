# 1. Use a light version of Node.js
FROM node:18-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package files first (better for caching)
COPY package*.json ./
RUN npm install

# 4. Copy the rest of the app code
COPY . .

# 5. Generate Prisma Client (CRITICAL STEP)
# This creates the client specifically for the container's Linux system
RUN npx prisma generate

# 6. Expose the port
EXPOSE 3000

# 7. Start the server in production mode
CMD ["npm", "start"]