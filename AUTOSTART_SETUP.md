# Project Grid 자동 시작 설정 가이드

## 📋 개요
PC를 켜면 **자동으로 Project Grid가 시작**되도록 설정합니다.

---

## 🚀 빠른 설정 (3단계)

### 1단계: 관리자로 실행
```
setup_autostart.bat 파일을 마우스 우클릭
→ "관리자로 실행" 선택
```

### 2단계: 자동 등록
배치 파일이 Windows 작업 스케줄러에 자동 등록됩니다.

### 3단계: 다음 부팅 시 확인
PC를 재부팅하면 자동으로 시작됩니다.

---

## 📂 설정된 파일들

| 파일 | 용도 |
|------|------|
| `start_project_grid.bat` | 포트 9999, 8090 동시 시작 |
| `setup_autostart.bat` | 작업 스케줄러 자동 등록 |
| `logs/server_8090.log` | 포트 8090 로그 |
| `logs/server_9999.log` | 포트 9999 로그 |

---

## ✅ 수동 확인 방법

### 작업 스케줄러에서 확인
1. **Windows 키 + R** 입력
2. `taskschd.msc` 입력하고 Enter
3. 왼쪽 "작업 스케줄러 라이브러리" → "ProjectGrid_AutoStart" 확인

### 작업 상세 정보
- **작업 이름:** ProjectGrid_AutoStart
- **작업:** `start_project_grid.bat` 실행
- **트리거:** 매번 부팅 시

---

## 🔍 상태 확인

### 포트가 정상 실행 중인지 확인
```bash
netstat -ano | findstr :8090
netstat -ano | findstr :9999
```

결과:
```
TCP    0.0.0.0:8090    0.0.0.0:0    LISTENING    ✅
TCP    0.0.0.0:9999    0.0.0.0:0    LISTENING    ✅
```

### 로그 파일 확인
```
logs/server_8090.log  - 포트 8090 상태
logs/server_9999.log  - 포트 9999 상태
```

---

## 🎯 접속 방법

### 자동 시작 후 접속
```
http://localhost:9999/viewer/project_grid_최종통합뷰어_v4.html
```

### 크롬 즐겨찾기 추가
1. 위 주소로 접속
2. **Ctrl + D** 또는 주소창의 별 아이콘 클릭
3. 원하는 폴더에 저장

---

## ❌ 자동 시작 해제

### 작업 스케줄러에서 삭제
```bash
schtasks /delete /tn "ProjectGrid_AutoStart" /f
```

### 또는 GUI에서 삭제
1. 작업 스케줄러 열기 (taskschd.msc)
2. "ProjectGrid_AutoStart" 마우스 우클릭
3. "삭제" 선택

---

## 🚨 문제 해결

### 포트 8090/9999가 이미 사용 중일 때
```bash
# 기존 프로세스 종료
netstat -ano | findstr :8090
taskkill /pid [PID] /f

netstat -ano | findstr :9999
taskkill /pid [PID] /f
```

### 로그 파일 크기가 너무 클 때
```bash
# 로그 파일 삭제
del logs\server_8090.log
del logs\server_9999.log
```

### 자동 시작이 안 될 때
1. 관리자 권한 확인
2. `setup_autostart.bat`를 **관리자로 실행**
3. 작업 스케줄러에서 수동 등록

---

## 📊 로그 모니터링

### 실시간 로그 확인
```bash
# 포트 8090 로그 모니터링
tail -f logs/server_8090.log

# 포트 9999 로그 모니터링
tail -f logs/server_9999.log
```

### 로그에서 오류 찾기
```bash
findstr "ERROR" logs/server_8090.log
findstr "ERROR" logs/server_9999.log
```

---

## 💡 팁

### 1. 바탕화면 바로가기 만들기
```
1. start_project_grid.bat 마우스 우클릭
2. "바로가기 만들기" 선택
3. 바탕화면으로 이동
```

### 2. 빠른 중지
```bash
# 포트 8090 중지
taskkill /F /IM python.exe

# 또는 수동으로 서버 재시작
start_project_grid.bat
```

### 3. 자동 시작 일시 중지
작업 스케줄러에서 "ProjectGrid_AutoStart" → "사용 안 함"

---

## 📝 설정 후 확인 사항

- [ ] `setup_autostart.bat`를 관리자로 실행했는가?
- [ ] 작업 스케줄러에 "ProjectGrid_AutoStart" 생성되었는가?
- [ ] `logs` 디렉토리가 생성되었는가?
- [ ] 포트 8090, 9999가 LISTENING 상태인가?

모두 확인되었다면 **자동 시작이 정상 설정**되었습니다! ✅

---

**마지막 업데이트:** 2025-11-04
**상태:** ✅ 완성 및 테스트됨
