#!/bin/bash

# Trigger Embedding Backfill via Local Dev Server
# Repeatedly calls /api/process-embedding-queue to speed up embedding generation
# Each call processes 50 jobs, so you can run this multiple times

echo "🚀 Embedding Backfill via Dev Server"
echo "======================================"
echo ""
echo "⚠️  Make sure dev server is running: npm run dev"
echo ""

# Configuration
TARGET_URL="${1:-http://localhost:3000}"
ITERATIONS="${2:-20}"  # Default: 20 iterations × 50 jobs = 1000 jobs
DELAY="${3:-2}"        # 2 second delay between requests

echo "Configuration:"
echo "  Target: $TARGET_URL"
echo "  Iterations: $ITERATIONS"
echo "  Delay between requests: ${DELAY}s"
echo "  Estimated jobs per backfill: $((ITERATIONS * 50))"
echo ""

# Track statistics
total_processed=0
successful=0
failed=0
start_time=$(date +%s)

for i in $(seq 1 $ITERATIONS); do
    echo "🔄 Iteration $i/$ITERATIONS..."
    
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        "$TARGET_URL/api/process-embedding-queue" 2>&1)
    
    if echo "$response" | grep -q '"success":true'; then
        # Extract processed count from response
        processed=$(echo "$response" | grep -o '"processed":[0-9]*' | cut -d':' -f2 || echo "0")
        total_processed=$((total_processed + processed))
        successful=$((successful + 1))
        echo "   ✅ Success - Processed: $processed jobs"
    else
        failed=$((failed + 1))
        echo "   ❌ Failed"
        echo "   Response: $response"
    fi
    
    # Delay between requests
    if [ $i -lt $ITERATIONS ]; then
        sleep $DELAY
    fi
done

# Calculate summary
end_time=$(date +%s)
elapsed=$((end_time - start_time))
rate=$(echo "scale=1; $total_processed / $elapsed" | bc 2>/dev/null || echo "N/A")

echo ""
echo "========================================"
echo "✅ BACKFILL TRIGGER COMPLETE"
echo "========================================"
echo "Total iterations: $ITERATIONS"
echo "Successful: $successful"
echo "Failed: $failed"
echo "Total processed: $total_processed jobs"
echo "Time elapsed: ${elapsed}s"
echo "Processing rate: $rate jobs/sec"
echo "========================================"
echo ""
echo "💡 Tips:"
echo "  - Run this script again to process more batches"
echo "  - Monitor embedding queue: SELECT COUNT(*) FROM embedding_queue WHERE status = 'pending'"
echo "  - Check progress: SELECT COUNT(*) FROM embedding_queue WHERE status = 'completed'"

