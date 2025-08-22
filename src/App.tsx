import { DataTable } from './components/DataTable';
import { QueryProvider } from './lib/query/QueryProvider';

function App() {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="mx-auto p-4">
          <h1 className="text-3xl font-bold text-center mb-8">
            Scanner Dashboard
          </h1>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
            <div className="bg-[#121417] rounded-lg shadow-lg">
              <DataTable type="trending" />
            </div>

            <div className="bg-[#121417] rounded-lg shadow-lg">
              <DataTable type="new" />
            </div>
          </div>
        </div>
      </div>
    </QueryProvider>
  );
}

export default App;
