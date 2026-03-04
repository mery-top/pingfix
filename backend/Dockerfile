# builder
    FROM golang:1.23-alpine AS builder
    RUN apk add --no-cache \
        git \
        gcc \
        musl-dev \
        libwebp-dev \
        ca-certificates
    
    WORKDIR /app
    
    COPY go.mod go.sum ./
    RUN go mod download
    
    COPY . .
    
    # Enable CGO for webp
    ENV CGO_ENABLED=1
    
    RUN go build -o main ./cmd/server
    
    
    #Production 
    FROM alpine:latest
    
   
    RUN apk add --no-cache \
        ca-certificates \
        libwebp
    
    WORKDIR /root/
    
   
    COPY --from=builder /app/main .
    
    EXPOSE 8080
    
    CMD ["./main"]