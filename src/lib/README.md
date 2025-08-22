# API Configuration & React Query Setup

This project is configured with Axios and React Query for efficient API communication.

## Structure

```
src/lib/
├── api/
│   ├── axios.ts          # Axios client configuration
│   └── types.ts          # API type definitions
├── query/
│   ├── queryClient.ts    # React Query client configuration
│   └── QueryProvider.tsx # React Query provider component
└── hooks/
    ├── useApi.ts         # Base API hooks
    └── useScannerData.ts # Scanner-specific hooks
```

## Base URL

All API requests use the base URL: `https://api-rs.dexcelerate.com`

## Usage Examples

### Basic Query

```typescript
import { useScannerData } from './lib/hooks/useScannerData';

function MyComponent() {
  const { data, isLoading, error } = useScannerData();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* render data */}</div>;
}
```

### Mutation

```typescript
import { useApiPost } from './lib/hooks/useApi';

function MyForm() {
  const mutation = useApiPost('/scanner/results');

  const handleSubmit = (formData: any) => {
    mutation.mutate(formData);
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

## Configuration

### React Query Settings

- **Stale Time**: 5 minutes
- **GC Time**: 10 minutes
- **Retry**: 3 attempts with exponential backoff
- **Refetch on Window Focus**: Disabled
- **Refetch on Reconnect**: Enabled

### Axios Settings

- **Timeout**: 10 seconds
- **Base URL**: https://api-rs.dexcelerate.com
- **Content-Type**: application/json
- **Interceptors**: Request/response logging and error handling
