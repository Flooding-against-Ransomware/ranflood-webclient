import React, {
  createContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";

interface WebSocketContextProps {
  socket: WebSocket | null;
  sendMessage: (message: string) => void;
  setWebSocketUrl: (url: string) => void;
  registerMessageHandler: (handler: (message: string) => void) => void;
  unregisterMessageHandler: () => void;
  registerErrorHandler: (handler: (message: string) => void) => void;
  unregisterErrorHandler: () => void;
}

export const WebSocketContext = createContext<
  WebSocketContextProps | undefined
>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [webSocketUrl, setWebSocketUrl] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const messageHandlerRef = useRef<((message: string) => void) | null>(null);
  const errorHandlerRef = useRef<((message: string) => void) | null>(null);

  useEffect(() => {
    // Chiudere la vecchia connessione prima di aprirne una nuova
    if (socketRef.current) {
      socketRef.current.close();
    }

    if (webSocketUrl) {
      const ws = new WebSocket(webSocketUrl);
      socketRef.current = ws;
      setSocket(ws);

      ws.onopen = () => {
        console.log("WebSocket connection opened: " + webSocketUrl);
      };

      ws.onmessage = (event) => {
        if (messageHandlerRef.current) {
          messageHandlerRef.current(event.data);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed");
        setSocket(null);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        if (errorHandlerRef.current) {
          errorHandlerRef.current(error.type);
        }
      };
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [webSocketUrl]);

  const sendMessage = (message: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(message);
    } else {
      // console.error("WebSocket is not open");
      if (errorHandlerRef.current) {
        errorHandlerRef.current("WebSocket is not open");
        throw new Error("WebSocket is not open");
      }
    }
  };

  // Serve per usare funzioni diverse tra manage e strategies
  const registerMessageHandler = (handler: (message: string) => void) => {
    messageHandlerRef.current = handler;
  };

  const unregisterMessageHandler = () => {
    messageHandlerRef.current = null;
  };

  const registerErrorHandler = (handler: (message: string) => void) => {
    errorHandlerRef.current = handler;
  };

  const unregisterErrorHandler = () => {
    errorHandlerRef.current = null;
  };

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        sendMessage,
        setWebSocketUrl,
        registerMessageHandler,
        unregisterMessageHandler,
        registerErrorHandler,
        unregisterErrorHandler,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
