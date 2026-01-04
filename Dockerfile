# Build stage
FROM golang:1.25-alpine AS builder

# Install build dependencies for CGO (required by SQLite)
RUN apk add --no-cache gcc musl-dev

WORKDIR /app

# Copy go mod files first for better caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary with CGO enabled for SQLite
RUN CGO_ENABLED=1 GOOS=linux go build -o server ./cmd/server/main.go

# ---------------------------------------------------------
# Final stage (Runtime)
# ---------------------------------------------------------
FROM alpine:latest

# ✅ FIX: Install 'git' here so the server can clone repos!
RUN apk add --no-cache ca-certificates libc6-compat git openssh

WORKDIR /app

# Copy the binary from builder stage
COPY --from=builder /app/server .

# Expose port 8080
EXPOSE 8080

# Run the server
CMD ["./server"]