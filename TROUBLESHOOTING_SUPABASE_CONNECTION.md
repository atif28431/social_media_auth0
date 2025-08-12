# Supabase Connection Troubleshooting Guide

## Issue: "TypeError: Failed to fetch" Error

This error typically occurs when running the application through ngrok and indicates that the browser is having trouble connecting to your Supabase backend.

## Root Cause

The error is likely caused by:
1. **CORS (Cross-Origin Resource Sharing) restrictions** between your ngrok domain and Supabase
2. **Network connectivity issues** when using ngrok tunnels
3. **Supabase project configuration** not allowing requests from ngrok domains

## Solutions

### 1. Configure Supabase CORS Settings

You need to add your ngrok URL to the Supabase CORS settings:

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project: `social_media` (project ID: `ububohnboqcftnfgflpd`)
3. Go to **Settings** → **API**
4. Under **CORS**, add your ngrok URL to the allowed origins:
   - `https://e16e208cf2a3.ngrok-free.app`
   - `https://*.ngrok-free.app` (for wildcard matching)

### 2. Update Environment Variables

Ensure your `.env.local` file contains the correct values:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ububohnboqcftnfgflpd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVidWJvaG5ib3FjZnRuZmdmbHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MjI3ODEsImV4cCI6MjA2NDA5ODc4MX0.ISomr__boxC6zsAydWL2m6Nb_0Q2wwb_m0HwApA_tL4

# Auth0 Configuration
AUTH0_BASE_URL=https://e16e208cf2a3.ngrok-free.app
AUTH0_ISSUER_BASE_URL=https://dev-nydmklgsa0qtpya8.us.auth0.com
```

### 3. Test Supabase Connection

You can test the connection by running this in your browser console:

```javascript
// Test basic connectivity
fetch('https://ububohnboqcftnfgflpd.supabase.co/rest/v1/')
  .then(res => console.log('Connection successful:', res))
  .catch(err => console.error('Connection failed:', err));
```

### 4. Alternative Solutions

#### Option A: Use Local Development
Instead of ngrok, try running locally:
```bash
npm run dev
```
Then access via `http://localhost:3000`

#### Option B: Update Supabase Client Configuration
The application has been updated with better error handling and retry logic. These changes include:
- **Retry mechanism** with exponential backoff
- **Better error messages** for network issues
- **Graceful degradation** when Supabase is unavailable

### 5. Check Browser Console

Look for specific CORS errors in your browser console:
1. Open Developer Tools (F12)
2. Check the **Console** tab for detailed error messages
3. Check the **Network** tab to see which requests are failing

### 6. Verify Supabase Project Status

Your Supabase project is active and healthy:
- **Project ID**: ububohnboqcftnfgflpd
- **Status**: ACTIVE_HEALTHY
- **Region**: ap-south-1
- **Database**: PostgreSQL 15.8.1.094

### 7. Restart Development Server

After making changes:
```bash
# Stop the current server
Ctrl+C

# Start fresh
npm run dev
```

## Expected Behavior

After implementing these fixes, you should see:
- No more "TypeError: Failed to fetch" errors
- Successful authentication flow
- Social media tokens being stored and retrieved correctly
- User sessions being maintained properly

## Additional Support

If issues persist:
1. Check the Supabase dashboard logs for specific error details
2. Verify your ngrok tunnel is stable
3. Ensure your internet connection is stable
4. Try clearing browser cache and cookies

## Monitoring

The application now includes enhanced error handling that will:
- Log detailed error information to the console
- Provide user-friendly error messages
- Retry failed operations automatically
- Gracefully handle network interruptions