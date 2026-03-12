import React, { useEffect } from 'react';
import { CheckCircle, Info, X } from 'lucide-react';

interface NotificationToastProps {
  message: string;
  type: 'success' | 'info';
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto close after 5s

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-20 right-4 md:right-8 z-[100] animate-fade-in max-w-sm w-full">
      <div className={`rounded-lg shadow-lg border p-4 flex items-start space-x-3 ${
        type === 'success' ? 'bg-white border-green-200' : 'bg-white border-blue-200'
      }`}>
        <div className={`flex-shrink-0 mt-0.5 ${
            type === 'success' ? 'text-green-500' : 'text-blue-500'
        }`}>
            {type === 'success' ? <CheckCircle size={20} /> : <Info size={20} />}
        </div>
        <div className="flex-1">
            <h4 className={`text-sm font-bold ${
                 type === 'success' ? 'text-green-800' : 'text-blue-800'
            }`}>
                {type === 'success' ? 'Success' : 'New Update'}
            </h4>
            <p className="text-sm text-gray-600 mt-1">{message}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default NotificationToast;