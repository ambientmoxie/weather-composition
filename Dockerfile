FROM node:20-alpine
WORKDIR /app

# Cache optimization
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
