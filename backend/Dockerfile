FROM rust:latest AS builder

WORKDIR /usr/src/app
COPY . .

# Build the application
RUN cargo build --release

# Production image
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /usr/src/app/target/release/finbro-backend .

# Expose port
EXPOSE 8000

# Run the binary
CMD ["./finbro-backend"]
