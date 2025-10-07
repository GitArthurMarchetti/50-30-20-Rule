import { Suspense } from 'react';
import LoginForm from './loginForm';


function LoadingFallback() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-100 p-4">
      <p>Carregando...</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginForm />
    </Suspense>
  );
}