import { useEffect, useRef, useCallback, useState } from 'react';
import type { IncomingWebSocketMessage } from '../../../test-task-types';

interface SubscriptionData {
  pair: string;
  token: string;
  chain: string;
}

interface WebSocketMessage {
  event: string;
  data: IncomingWebSocketMessage['data'];
}

type MessageCallback = (message: WebSocketMessage) => void;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeSubscriptions, setActiveSubscriptions] = useState<Set<string>>(
    new Set()
  );
  const messageCallbacksRef = useRef<Set<MessageCallback>>(new Set());

  const handleMessage = useCallback((data: string) => {
    try {
      const message = JSON.parse(data);
      console.log('Parsed WebSocket message:', message);

      // Notify all registered callbacks
      messageCallbacksRef.current.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('Error in message callback:', error);
        }
      });

      // Here we'll add message handling logic later
      // For now, just log the message type
      switch (message.event) {
        case 'tick':
          console.log('Tick event received for pair:', message.data.pair);
          break;
        case 'pair-stats':
          console.log('Pair-stats event received for pair:', message.data.pair);
          break;
        case 'scanner-pairs':
          console.log('Scanner-pairs event received');
          break;
        default:
          console.log('Unknown event type:', message.event);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      wsRef.current = new WebSocket('wss://api-rs.dexcelerate.com/ws');

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      wsRef.current.onclose = event => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setActiveSubscriptions(new Set());
      };

      wsRef.current.onerror = error => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      wsRef.current.onmessage = event => {
        console.log('WebSocket message received:', event.data);
        handleMessage(event.data);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [handleMessage]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const subscribeToPair = useCallback(
    (data: SubscriptionData) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket not connected, cannot subscribe');
        return;
      }

      const subscriptionKey = `pair-${data.pair}-${data.token}`;

      if (activeSubscriptions.has(subscriptionKey)) {
        console.log('Already subscribed to pair:', subscriptionKey);
        return;
      }

      const message = {
        event: 'subscribe-pair',
        data,
      };

      wsRef.current.send(JSON.stringify(message));
      setActiveSubscriptions(prev => new Set(prev).add(subscriptionKey));
      console.log('Subscribed to pair:', subscriptionKey);
    },
    [activeSubscriptions]
  );

  const subscribeToPairStats = useCallback(
    (data: SubscriptionData) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket not connected, cannot subscribe');
        return;
      }

      const subscriptionKey = `pair-stats-${data.pair}-${data.token}`;

      if (activeSubscriptions.has(subscriptionKey)) {
        console.log('Already subscribed to pair-stats:', subscriptionKey);
        return;
      }

      const message = {
        event: 'subscribe-pair-stats',
        data,
      };

      wsRef.current.send(JSON.stringify(message));
      setActiveSubscriptions(prev => new Set(prev).add(subscriptionKey));
      console.log('Subscribed to pair-stats:', subscriptionKey);
    },
    [activeSubscriptions]
  );

  const unsubscribeFromPair = useCallback(
    (data: SubscriptionData) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        return;
      }

      const subscriptionKey = `pair-${data.pair}-${data.token}`;

      if (!activeSubscriptions.has(subscriptionKey)) {
        return;
      }

      const message = {
        event: 'unsubscribe-pair',
        data,
      };

      wsRef.current.send(JSON.stringify(message));
      setActiveSubscriptions(prev => {
        const newSet = new Set(prev);
        newSet.delete(subscriptionKey);
        return newSet;
      });
      console.log('Unsubscribed from pair:', subscriptionKey);
    },
    [activeSubscriptions]
  );

  const unsubscribeFromPairStats = useCallback(
    (data: SubscriptionData) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        return;
      }

      const subscriptionKey = `pair-stats-${data.pair}-${data.token}`;

      if (!activeSubscriptions.has(subscriptionKey)) {
        return;
      }

      const message = {
        event: 'unsubscribe-pair-stats',
        data,
      };

      wsRef.current.send(JSON.stringify(message));
      setActiveSubscriptions(prev => {
        const newSet = new Set(prev);
        newSet.delete(subscriptionKey);
        return newSet;
      });
      console.log('Unsubscribed from pair-stats:', subscriptionKey);
    },
    [activeSubscriptions]
  );

  const addMessageListener = useCallback((callback: MessageCallback) => {
    messageCallbacksRef.current.add(callback);
    return () => {
      messageCallbacksRef.current.delete(callback);
    };
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Bulk subscription methods
  const subscribeToMultiplePairs = useCallback(
    (pairs: SubscriptionData[]) => {
      pairs.forEach(pair => {
        subscribeToPair(pair);
        subscribeToPairStats(pair);
      });
    },
    [subscribeToPair, subscribeToPairStats]
  );

  const unsubscribeFromMultiplePairs = useCallback(
    (pairs: SubscriptionData[]) => {
      pairs.forEach(pair => {
        unsubscribeFromPair(pair);
        unsubscribeFromPairStats(pair);
      });
    },
    [unsubscribeFromPair, unsubscribeFromPairStats]
  );

  const subscribeToScannerFilter = useCallback(
    (filterParams: Record<string, unknown>) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.warn(
          'WebSocket not connected, cannot subscribe to scanner-filter'
        );
        return;
      }

      const message = {
        event: 'scanner-filter',
        data: filterParams,
      };

      wsRef.current.send(JSON.stringify(message));
      console.log('Subscribed to scanner-filter:', filterParams);
    },
    []
  );

  return {
    ws: wsRef.current,
    connect,
    disconnect,
    isConnected,
    activeSubscriptions: Array.from(activeSubscriptions),
    subscribeToPair,
    subscribeToPairStats,
    unsubscribeFromPair,
    unsubscribeFromPairStats,
    subscribeToMultiplePairs,
    unsubscribeFromMultiplePairs,
    subscribeToScannerFilter,
    addMessageListener,
  };
}
