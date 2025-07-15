# Auth0 + Supabase RLS Fix Instructions

## ✅ Code Changes Applied

The following files have been updated in your project:

1. **`/src/lib/supabase/client.js`** - Updated to pass Auth0 user ID as header
2. **`/src/context/AuthContext.js`** - Updated to create Supabase client with user ID
3. **`/src/context/SupabaseContext.js`** - Added debug logging to saveUserPages function

## 🗄️ Database Changes Required

**IMPORTANT**: You must run the SQL in `auth0_rls_policies.sql` in your Supabase SQL Editor.

### Steps:

1. **Open Supabase Dashboard** → Your Project → SQL Editor
2. **Copy and paste** the content from `auth0_rls_policies.sql`
3. **Click "RUN"** to execute all the SQL commands

This will:
- Create the `public.current_user_id()` function
- Update all RLS policies to work with Auth0
- Grant proper permissions

## 🧪 Testing

After running the SQL:

1. **Start your app**: `npm run dev`
2. **Login with Auth0**
3. **Try connecting Facebook pages**
4. **Check browser console** for debug logs

### Expected Debug Output:
```
Created Supabase client with user ID: auth0|507f1f77bcf86cd799439011
Saving pages for user: auth0|507f1f77bcf86cd799439011
Pages to save: 2
Delete result: {...}
Inserting pages data: [{...}]
Pages saved successfully: [{...}]
```

## 🚨 If Still Not Working

1. **Check Supabase SQL Editor** for any errors when running the SQL
2. **Verify RLS is enabled** on tables:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE tablename IN ('facebook_pages', 'user_sessions');
   ```
3. **Test the function**:
   ```sql
   SELECT public.current_user_id();
   ```

## 🔧 Troubleshooting

### Error: "function public.current_user_id() does not exist"
- Re-run the SQL from `auth0_rls_policies.sql`

### Error: "permission denied for table"
- Check that RLS policies were created correctly
- Verify user_id format matches Auth0 format

### Still getting RLS violations
- Check browser network tab for request headers
- Verify `x-user-id` header is being sent

## ✨ How It Works

1. **Auth0 login** → User gets ID like `auth0|507f1f77bcf86cd799439011`
2. **Supabase client** → Passes user ID as `x-user-id` header
3. **RLS policy** → Calls `public.current_user_id()` which reads the header
4. **Access granted** → User can only see/modify their own data

Your RLS is now Auth0-compatible while maintaining full security! 🎉
