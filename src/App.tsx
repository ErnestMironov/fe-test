import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import { DataTable } from './components/DataTable';
import { QueryProvider } from './lib/query/QueryProvider';
import { useWebSocket } from './lib/hooks/useWebSocket';

function App() {
  const [count, setCount] = useState(0);
  const { isConnected, activeSubscriptions } = useWebSocket();

  return (
    <QueryProvider>
      <div className="min-h-screen bg-gray-100">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="flex gap-8 mb-8">
            <a
              href="https://vite.dev"
              target="_blank"
              className="hover:scale-110 transition-transform"
            >
              <img src={viteLogo} className="h-24 w-24" alt="Vite logo" />
            </a>
            <a
              href="https://react.dev"
              target="_blank"
              className="hover:scale-110 transition-transform"
            >
              <img
                src={reactLogo}
                className="h-24 w-24 animate-spin"
                alt="React logo"
              />
            </a>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-8">
            Vite + React
          </h1>
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              ></div>
              <span className="text-sm text-gray-600">
                WebSocket: {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="text-xs text-gray-500 mb-4">
              Active subscriptions: {activeSubscriptions.length}
            </div>
            <button
              onClick={() => setCount(count => count + 1)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors mb-4"
            >
              count is {count}
            </button>
            <p className="text-gray-600 text-center">
              Edit{' '}
              <code className="bg-gray-200 px-2 py-1 rounded text-sm">
                src/App.tsx
              </code>{' '}
              and save to test HMR
            </p>
          </div>
          <p className="text-gray-500 mb-12 text-center">
            Click on the Vite and React logos to learn more
          </p>
        </div>

        <div className="space-y-16 pb-16">
          <DataTable />
        </div>
      </div>
    </QueryProvider>
  );
}

export default App;
