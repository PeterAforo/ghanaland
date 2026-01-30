'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

interface UseNotificationsSocketReturn {
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotification: (notificationId: string) => void;
}

export function useNotificationsSocket(): UseNotificationsSocketReturn {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Connect to WebSocket
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      return;
    }

    // Create socket connection
    const socket = io(`${API_BASE_URL}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('Notifications socket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Notifications socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error: Error) => {
      console.error('Notifications socket connection error:', error.message);
      setIsConnected(false);
    });

    // Notification events
    socket.on('notification', (notification: Notification) => {
      console.log('Received notification:', notification);
      setNotifications(prev => [notification, ...prev]);
    });

    socket.on('notification:read', (notificationId: string) => {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    });

    socket.on('notifications:all-read', () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    });

    socket.on('notification:deleted', (notificationId: string) => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('markAsRead', { notificationId });
    }
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('markAllAsRead');
    }
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  // Clear notification
  const clearNotification = useCallback((notificationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('deleteNotification', { notificationId });
    }
    // Optimistic update
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  return {
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
  };
}
