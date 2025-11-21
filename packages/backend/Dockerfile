FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 3001
# Start the local server we just made
CMD ["npm", "run", "start:local"]