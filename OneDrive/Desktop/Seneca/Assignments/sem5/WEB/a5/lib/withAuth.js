import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { isAuthenticated } from './authenticate';

export default function withAuth(Component) {
  return function ProtectedRoute(props) {
    const router = useRouter();

    useEffect(() => {
      if (!isAuthenticated()) {
        router.push('/login');
      }
    }, []);

    return <Component {...props} />;
  };
}
