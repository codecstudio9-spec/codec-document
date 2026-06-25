import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const documentId = searchParams.get('documentId');

    sessionStorage.setItem('isPurchased', 'true');
    if (documentId) {
      localStorage.setItem(`codec_purchase_${documentId}`, 'true');
    }

    if (documentId) {
      navigate(`/preview/${documentId}`, { replace: true });
      return;
    }

    navigate('/', { replace: true });
  }, [navigate, searchParams]);

  return null;
}
