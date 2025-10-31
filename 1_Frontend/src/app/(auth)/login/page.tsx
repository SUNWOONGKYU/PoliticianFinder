/** P1F3: 로그인 페이지 */
import LoginForm from '@/components/auth/P1F1_LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">로그인</h1>
        <LoginForm />
      </div>
    </div>
  );
}
