import { useEffect, useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { getProductosVencidos, getProductosProximosAVencer } from '../Api/alertasService';

// Define cada cuántos milisegundos se volverá a verificar. 180000 ms = 3 minutos.
const CHECK_INTERVAL = 180000;

/**
 * Hook que verifica periódicamente si hay alertas de productos
 * y muestra notificaciones usando el NotificationContext.
 */
export const useNotificationCheck = () => {
  const { showNotification } = useNotification();
  const [shownAlerts, setShownAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkAlerts = async () => {
      const [vencidos, proximosAVencer] = await Promise.all([
        getProductosVencidos(),
        getProductosProximosAVencer(),
      ]);

      const newAlerts = new Set(shownAlerts);
      let foundNewNotifications = false;

      proximosAVencer.forEach(producto => {
        const alertKey = `proximo-${producto.nombre}`;
        if (!newAlerts.has(alertKey)) {
          showNotification(
            `Próximo a vencer: ${producto.nombre} (Stock: ${producto.stock_total})`,
            'warning'
          );
          newAlerts.add(alertKey);
          foundNewNotifications = true;
        }
      });

      vencidos.forEach(producto => {
        const alertKey = `vencido-${producto.nombre}`;
        if (!newAlerts.has(alertKey)) {
          showNotification(`¡Producto Vencido!: ${producto.nombre}`, 'error');
          newAlerts.add(alertKey);
          foundNewNotifications = true;
        }
      });

      if (foundNewNotifications) {
        setShownAlerts(newAlerts);
      }
    };

    checkAlerts(); // Ejecuta la revisión una vez al cargar la página.
    const intervalId = setInterval(checkAlerts, CHECK_INTERVAL);

    // Detiene el intervalo si el usuario se va, para no gastar recursos.
    return () => clearInterval(intervalId);
  }, [showNotification, shownAlerts]);
};