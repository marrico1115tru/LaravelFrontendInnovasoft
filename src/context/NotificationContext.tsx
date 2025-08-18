import React, { createContext, useContext } from 'react';
import { toast, Toaster } from 'react-hot-toast';

// Tipos de notificación que manejaremos
type NotificationType = 'success' | 'error' | 'info' | 'warning';

// Definimos la función que nuestro contexto expondrá
interface NotificationContextType {
  showNotification: (message: string, type: NotificationType) => void;
}

// Creamos el contexto
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Creamos el Proveedor del contexto
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const showNotification = (message: string, type: NotificationType) => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'info':
        toast(message, { icon: '🔔' });
        break;
      case 'warning':
        toast(message, { icon: '⚠️' });
        break;
      default:
        toast(message);
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {/* El componente Toaster renderiza las notificaciones. Lo ponemos aquí. */}
      <Toaster position="top-right" reverseOrder={false} />
    </NotificationContext.Provider>
  );
};

// Hook personalizado para usar el contexto fácilmente
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe ser usado dentro de un NotificationProvider');
  }
  return context;
};