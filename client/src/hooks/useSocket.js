import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { updateUserRewards } from '../store/slices/authSlice';
import confetti from 'canvas-confetti';

export const useSocket = () => {
  const socketRef = useRef(null);
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Connect to Socket server (uses VITE_SOCKET_URL if defined, otherwise falls back to relative path for Vite proxy)
    const socketUrl = import.meta.env.VITE_SOCKET_URL || '/';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[SOCKET CLIENT] Connected to websocket server');
      
      // Join personal room for real-time notifications
      socket.emit('join:user', user.id);

      // Join admin pool if credentials permit
      if (user.role === 'admin') {
        socket.emit('join:admins');
      }
    });

    // Real-time points/badge upgrades handler
    socket.on('rewards:update', (data) => {
      console.log('[SOCKET EVENT] Rewards earned:', data);
      
      // Trigger Redux store sync
      dispatch(updateUserRewards({
        points: data.points,
        level: data.level,
        badges: data.badges
      }));

      // Celebrate success with premium canvas-confetti bursts!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#16a34a', '#4ade80', '#fbbf24']
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, user, dispatch]);

  return socketRef.current;
};

export default useSocket;
