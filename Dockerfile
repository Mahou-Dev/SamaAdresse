# ==============================================================================
# Stage 1 : Build du frontend React 19 + Vite 6 + PWA Service Worker
# ==============================================================================
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY backend/src/main/resources/geo-grid.json /app/backend/src/main/resources/geo-grid.json
COPY frontend/ ./
RUN npm run build

# ==============================================================================
# Stage 2 : Packaging Spring Boot 3.4 avec ressources statiques du frontend
# ==============================================================================
FROM maven:3.9.9-eclipse-temurin-21-alpine AS backend-build
WORKDIR /app/backend

COPY backend/pom.xml ./
COPY backend/src/ ./src/
COPY --from=frontend-build /app/frontend/dist/ ./src/main/resources/static/

RUN mvn -B package -DskipTests

# ==============================================================================
# Stage 3 : Image d'exécution légère JRE 21 (utilisateur non-root, RAM 512 Mo)
# ==============================================================================
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

RUN addgroup -S samaadresse && adduser -S samaadresse -G samaadresse \
    && mkdir -p /app/uploads && chown -R samaadresse:samaadresse /app

COPY --from=backend-build --chown=samaadresse:samaadresse /app/backend/target/*.jar /app/app.jar

USER samaadresse

EXPOSE 8082

ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC -Xss512k -Djava.awt.headless=true"
ENV SPRING_PROFILES_ACTIVE="prod"
ENV PORT="8082"

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
