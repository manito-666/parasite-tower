APP_NAME := parasite-server
DOCKER_IMAGE := parasite-tower
GO := go
GOFLAGS := -ldflags="-s -w"

.PHONY: all build run test clean docker docker-up docker-down apk lint

all: build

## ---------- Go Server ----------

build:
	$(GO) build $(GOFLAGS) -o $(APP_NAME) ./cmd/server

run: build
	./$(APP_NAME)

test:
	$(GO) test ./... -v -cover

lint:
	$(GO) vet ./...

clean:
	rm -f $(APP_NAME)
	rm -rf android/app/build

## ---------- Docker ----------

docker:
	docker build -t $(DOCKER_IMAGE) .

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

## ---------- Android APK ----------

apk:
	cd android && ./gradlew assembleRelease
	cp android/app/build/outputs/apk/release/parasite-tower-release.apk android/parasite-tower-release.apk
	@echo "APK: android/parasite-tower-release.apk"

## ---------- Help ----------

help:
	@echo "make build       - 编译Go服务端"
	@echo "make run         - 编译并运行"
	@echo "make test        - 运行单元测试"
	@echo "make docker      - 构建Docker镜像"
	@echo "make docker-up   - 启动容器"
	@echo "make docker-down - 停止容器"
	@echo "make apk         - 打包Android APK"
	@echo "make clean       - 清理构建产物"
