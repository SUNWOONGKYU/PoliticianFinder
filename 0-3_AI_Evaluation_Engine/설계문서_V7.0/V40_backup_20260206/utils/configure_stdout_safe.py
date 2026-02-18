"""
안전한 stdout 설정 모듈
한 번만 설정되도록 보장
"""
import sys
import io

_stdout_configured = False

def configure_utf8_output():
    """UTF-8 출력 설정 (한 번만 실행)"""
    global _stdout_configured
    
    if _stdout_configured:
        return  # 이미 설정됨
    
    if sys.platform == 'win32':
        try:
            # stdout가 이미 TextIOWrapper인지 확인
            if not isinstance(sys.stdout, io.TextIOWrapper):
                sys.stdout = io.TextIOWrapper(
                    sys.stdout.buffer, 
                    encoding='utf-8', 
                    line_buffering=True,
                    errors='replace'  # 에러 문자는 ? 로 대체
                )
            
            # stderr도 동일하게
            if not isinstance(sys.stderr, io.TextIOWrapper):
                sys.stderr = io.TextIOWrapper(
                    sys.stderr.buffer, 
                    encoding='utf-8', 
                    line_buffering=True,
                    errors='replace'
                )
            
            _stdout_configured = True
            
        except Exception as e:
            # 설정 실패해도 계속 진행
            print(f"Warning: Failed to configure UTF-8 output: {e}", file=sys.stderr)
            pass

# 모듈 import 시 자동 설정
configure_utf8_output()
