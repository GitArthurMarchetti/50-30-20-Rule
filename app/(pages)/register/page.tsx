import { Suspense } from 'react';
import RegisterForm from './registerForm';

function LoadingFallback() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-100 p-4">
      <p>Loading...</p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RegisterForm />
    </Suspense>
  );
}
