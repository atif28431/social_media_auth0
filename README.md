# Social Media Manager

A multi-platform social media management application built with Next.js, Supabase, and shadcn/ui. Currently supports Facebook with plans for expansion to other platforms.

## Features

- Connect and manage multiple Facebook pages
- Create and publish posts to Facebook pages
- Schedule posts for future publication
- View, edit, and delete scheduled posts
- Modern UI with shadcn/ui components
- Secure authentication with Auth0
- Enhanced session management with Supabase
- Data persistence with Supabase

## Prerequisites

- Node.js 18+ and npm
- Facebook Developer Account and App
- Supabase Account and Project

## Getting Started

### 1. Set up Supabase

1. Create a new Supabase project at [https://supabase.com](https://supabase.com)
2. Get your Supabase URL and anon key from the project settings
3. Apply the database migrations:
   - Copy the SQL from `supabase/migrations/20231101000000_initial_schema.sql`
   - Copy the SQL from `supabase/migrations/20240701000000_user_sessions.sql`
   - Paste and run them in the Supabase SQL Editor

### 2. Configure environment variables

Create or update your `.env.local` file with the following variables:

```
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Run the development server

```bash
npm run dev
```

## Session Management

This application uses Auth0 for authentication but stores session information in Supabase for better persistence and logout handling. This approach resolves issues with incomplete logout and improves session management.

### How it works

1. User authenticates with Auth0
2. Session information (tokens, user data) is stored in Supabase's `user_sessions` table
3. Facebook access tokens are also stored in Supabase instead of just localStorage
4. On logout, all session data is cleared from:
   - Supabase `user_sessions` table
   - Browser localStorage and sessionStorage
   - All cookies

This ensures a complete logout process and prevents issues with lingering authentication data.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/src/app` - Next.js app router pages and API routes
- `/src/components` - React components including UI components
- `/src/context` - React context providers for auth and Supabase
- `/src/lib` - Utility libraries including Supabase client
- `/src/utils` - Utility functions for Facebook API
- `/supabase` - Supabase migrations and configuration

## Adding More Social Media Platforms

To add support for additional platforms:

1. Create a new OAuth provider in NextAuth configuration
2. Add platform-specific utility functions in `/src/utils`
3. Create UI components for the new platform
4. Update the database schema to include the new platform

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Facebook Graph API Documentation](https://developers.facebook.com/docs/graph-api)
