import toast from 'react-hot-toast';

export function getErrorMessage(error, fallback = 'Something went wrong') {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export function showErrorToast(error, fallback) {
  const message = getErrorMessage(error, fallback);

  toast.error(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      borderRadius: '10px',
      background: '#fff',
      color: '#991b1b',
      border: '1px solid #fecaca',
      boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
      fontWeight: 600,
    },
    iconTheme: {
      primary: '#dc2626',
      secondary: '#fff',
    },
  });
}