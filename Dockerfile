FROM node:20-bookworm-slim

WORKDIR /mnt

RUN mkdir /mnt/user && \
	mkdir /mnt/remotes

WORKDIR /usr/transfer-app/

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build app
RUN npm run build

# Expose port
EXPOSE 3000

# Run app
CMD ["npm", "start"]