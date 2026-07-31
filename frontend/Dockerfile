FROM node:20-alpine

WORKDIR /app

# Especificamos package.json directamente en lugar de package*.json
COPY package.json ./

# Forzamos la instalación permitiendo resolver peer dependencies
RUN npm install --legacy-peer-deps

COPY . .

# Comando para levantar el servidor en desarrollo
CMD ["npm", "run", "dev"]