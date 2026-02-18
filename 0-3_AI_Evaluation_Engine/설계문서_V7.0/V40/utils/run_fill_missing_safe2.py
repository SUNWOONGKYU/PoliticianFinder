"""
개선된 안전한 래퍼 스크립트
"""
import sys
import io
import os

# 원본 stdout/stderr 백업
_original_stdout = sys.stdout
_original_stderr = sys.stderr

# 안전한 BytesIO buffer 생성
class SafeBuffer:
    def __init__(self):
        self.data = io.BytesIO()
    
    def write(self, data):
        try:
            if isinstance(data, str):
                data = data.encode('utf-8', errors='ignore')
            self.data.write(data)
            return len(data)
        except:
            return 0
    
    def flush(self):
        pass

# SafeWriter with buffer attribute
class SafeWriter:
    def __init__(self):
        self.buffer = SafeBuffer()
        self.encoding = 'utf-8'
        
    def write(self, text):
        try:
            if isinstance(text, bytes):
                text = text.decode('utf-8', errors='ignore')
            # 진짜 출력 시도
            _original_stdout.write(text)
            return len(text)
        except:
            # 실패해도 계속
            return len(text)
            
    def flush(self):
        try:
            _original_stdout.flush()
        except:
            pass

# 안전한 writer로 교체 (buffer 속성 포함)
sys.stdout = SafeWriter()
sys.stderr = SafeWriter()

# 스크립트 실행
try:
    import fill_missing_evaluations_v40
    sys.argv = ['', '--politician_id=f9e00370', '--politician_name=김민석']
    fill_missing_evaluations_v40.main()
    print("\n✅ 완료!")
except Exception as e:
    with open('error_output.txt', 'w', encoding='utf-8') as f:
        import traceback
        f.write(f"Error: {str(e)}\n")
        f.write(traceback.format_exc())
    print(f"\n❌ 에러 발생: {str(e)}")
    print("자세한 내용은 error_output.txt 참조")
