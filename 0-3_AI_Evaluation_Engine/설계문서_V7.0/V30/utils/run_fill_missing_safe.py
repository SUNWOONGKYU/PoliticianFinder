"""
안전한 래퍼 스크립트 - print 에러 무시하고 실행
"""
import sys
import io

# stdout/stderr를 안전한 버전으로 교체
class SafeWriter:
    def __init__(self, original):
        self.original = original
        
    def write(self, text):
        try:
            if hasattr(self.original, 'buffer'):
                self.original.buffer.write(text.encode('utf-8', errors='ignore'))
                self.original.buffer.flush()
            else:
                pass  # 무시
        except:
            pass  # 모든 에러 무시
            
    def flush(self):
        try:
            if hasattr(self.original, 'flush'):
                self.original.flush()
        except:
            pass

# 안전한 writer로 교체
sys.stdout = SafeWriter(sys.stdout)
sys.stderr = SafeWriter(sys.stderr)

# 이제 실제 스크립트 실행
import fill_missing_evaluations_v30
sys.argv = ['', '--politician_id=f9e00370', '--politician_name=김민석']

try:
    fill_missing_evaluations_v30.main()
except Exception as e:
    # 최소한의 에러 로깅
    with open('error_output.txt', 'w', encoding='utf-8') as f:
        import traceback
        f.write(f"Error: {str(e)}\n")
        f.write(traceback.format_exc())
