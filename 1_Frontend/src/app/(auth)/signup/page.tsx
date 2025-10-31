/** P1F4: 회원가입 페이지 */
import SignupForm from '@/components/auth/P1F2_SignupForm';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">회원가입</h1>
        <SignupForm />
      </div>
    </div>
  );
}
