# ---------- Build stage ----------
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copy Maven wrapper and config
COPY mvnw pom.xml ./
COPY .mvn .mvn

# Make wrapper executable (in case Git permissions are weird)
RUN chmod +x mvnw

# Download dependencies first (layer cache)
RUN ./mvnw -q -DskipTests=true dependency:go-offline

# Copy the source code
COPY src src

# Build the jar
RUN ./mvnw -q -DskipTests=true package

# ---------- Run stage ----------
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the built jar from the previous stage
COPY --from=build /app/target/professional-network-1.0.0.jar app.jar

# Expose default Spring Boot port
EXPOSE 8080

# Use env PORT if Render sets it
ENV PORT=8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
