# Etapa base
FROM node:22.17.0-alpine3.21

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos
COPY package*.json ./
RUN npm install

# Copiar el resto del código fuente
COPY . .

# Exponer el puerto que usa React en desarrollo
ENV API=https:apivi.miweb.com

# Ejecutar la app en modo desarrollo
CMD ["npm", "run","dev"]