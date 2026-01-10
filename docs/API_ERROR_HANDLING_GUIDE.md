# API Error Handling Guide

## Overview
JobPing uses a standardized error handling system across all API routes for consistency, proper logging, and user-friendly error responses.

## Core Components

### 1. Error Classes (`lib/errors.ts`)
```typescript
import { AppError, ValidationError, NotFoundError, asyncHandler } from "@/lib/errors";

// Standard error types
throw new AppError("Something went wrong", 500, "INTERNAL_ERROR");
throw new ValidationError("Invalid input", { field: "email" });
throw new NotFoundError("User");
```

### 2. Async Handler Wrapper
```typescript
import { asyncHandler } from "@/lib/errors";

export const GET = asyncHandler(async (req: NextRequest) => {
  // Your code here - errors are automatically caught and handled
  return NextResponse.json({ data: "success" });
});
```

## Migration Pattern

### Before (Old Pattern)
```typescript
export async function GET(req: NextRequest) {
  try {
    // Your code
    return NextResponse.json({ data: "success" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### After (New Pattern)
```typescript
import { asyncHandler, AppError } from "@/lib/errors";

export const GET = asyncHandler(async (req: NextRequest) => {
  // Your code - throw AppError instances for specific errors
  if (!valid) {
    throw new ValidationError("Invalid input");
  }

  return NextResponse.json({ data: "success" });
});
```

## Benefits

1. **Consistent Error Responses**: All errors follow the same JSON structure
2. **Automatic Logging**: Errors are logged with proper context and request IDs
3. **Request ID Tracking**: Every request gets a unique ID for debugging
4. **Type Safety**: Error classes provide type-safe error handling
5. **Reduced Boilerplate**: No need to write try-catch in every route

## Error Response Format

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": { "additional": "context" },
  "requestId": "uuid-for-debugging"
}
```

## Routes Already Updated
- ✅ `/api/signup` (Premium)
- ✅ `/api/signup/free` (Free)
- ✅ `/api/preferences`
- ✅ `/api/stats`
- ✅ `/api/countries`

## Next Steps
Update remaining routes following this pattern:
1. Add imports: `import { asyncHandler, AppError } from "@/lib/errors";`
2. Change `export async function METHOD` to `export const METHOD = asyncHandler(async`
3. Remove try-catch blocks
4. Throw `AppError` instances instead of returning error responses
5. Remove manual error logging (handled automatically)