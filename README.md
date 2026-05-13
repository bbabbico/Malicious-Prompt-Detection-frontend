# Malicious Prompt Detection

악성 프롬프트 탐지를 위한 프론트엔드(React/Vite) 및 백엔드(FastAPI) 서비스입니다.

## 프로젝트 구조

- `server`: FastAPI 기반의 백엔드 API 및 머신러닝 모델
- `client`: React 및 Vite를 사용한 프론트엔드 대시보드
- `shared`: 프론트엔드와 백엔드에서 공유하는 상수 및 설정

## Docker로 실행하기

이 프로젝트는 Docker와 Docker Compose를 사용하여 간편하게 실행할 수 있습니다.

### 사전 준비

- [Docker](https://www.docker.com/get-started) 설치
- [Docker Compose](https://docs.docker.com/compose/install/) 설치

### 실행 방법

1. 프로젝트 루트 디렉토리에서 다음 명령어를 실행하여 컨테이너를 빌드하고 실행합니다:

   ```bash
   docker-compose up --build
   ```

2. 실행이 완료되면 다음 주소에서 서비스를 확인할 수 있습니다:

   - **프론트엔드**: [http://localhost](http://localhost)
   - **백엔드 API**: [http://localhost:8000](http://localhost:8000)
   - **API 문서 (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 서비스 구성

- **Backend (FastAPI)**:
  - Python 3.11 환경에서 실행됩니다.
  - 소스 코드는 `./server` 디렉토리에 위치하며, 실시간 변경 사항이 반영되도록 볼륨 마운트가 설정되어 있습니다.
- **Frontend (React/Vite)**:
  - `pnpm`을 사용하여 빌드되며, 최종 결과물은 `nginx`를 통해 서비스됩니다.

## 수동 설치 및 실행 (로컬 환경)

### Backend
```bash
cd server
pip install -r requirements.txt
python main.py
```

### Frontend
```bash
cd client
pnpm install
pnpm dev
```
