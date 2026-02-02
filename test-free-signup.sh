#!/bin/bash

# Test the free signup API with CORRECT form structure
# Career paths: strategy-business-design, data-analytics, sales-client-success, marketing-growth, 
#               finance-investment, operations-supply-chain, product-innovation, 
#               tech-transformation, sustainability-esg

echo "Testing /api/signup/free with correct FREE form structure..."
echo ""

curl -s -i -X POST http://localhost:3000/api/signup/free \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test-diagnostic-free@example.com",
    "full_name":"Test Diagnostic User",
    "cities":["London","Berlin"],
    "careerPath":["data-analytics"],
    "languages":[],
    "workEnvironment":[],
    "visaStatus":"",
    "entryLevelPreferences":[],
    "targetCompanies":[],
    "roles":[],
    "industries":[],
    "companySizePreference":"",
    "skills":[],
    "careerKeywords":"",
    "gdprConsent":true,
    "ageVerified":true,
    "termsAccepted":true
  }' 2>&1

