# Cookie Debugging Instructions

## The Problem

After login/refresh, `document.cookie` shows **empty**, but the user data is returned. This means:

1. ✅ Backend successfully authenticates
2. ✅ Backend returns user data
3. ❓ Cookies might be set but not visible (HttpOnly)
4. ❌ Next request fails with 401

## Why `document.cookie` is Empty

The backend likely sets cookies with `HttpOnly` flag (good for security):
```
Set-Cookie: auth-token=xxx; HttpOnly; Secure; SameSite=Strict
Set-Cookie: refresh-token=yyy; HttpOnly; Secure; SameSite=Strict
```

**HttpOnly cookies:**
- ✅ **CAN'T** be read by JavaScript (`document.cookie`)
- ✅ **ARE** automatically sent by the browser on requests
- ✅ **This is good** - prevents XSS attacks

## How to Debug

### Step 1: Check if Backend Sets Cookies

1. Open DevTools (F12)
2. Go to **Network** tab
3. Go to `/debug-auth` page
4. Click "Test Refresh" or "Login"
5. Find the POST request to `http://localhost:8005/api`
6. Click on it
7. Look at **Response Headers** section
8. **Look for Set-Cookie headers**

**Expected:**
```
Set-Cookie: auth-token=<long-string>; Path=/; HttpOnly; SameSite=Lax
Set-Cookie: refresh-token=<long-string>; Path=/; HttpOnly; SameSite=Lax
```

### Step 2: Check if Browser Sends Cookies

1. Still in Network tab
2. After login/refresh, click "Test /auth/me"
3. Find the new POST request to `/api`
4. Look at **Request Headers** section
5. **Look for Cookie header**

**Expected:**
```
Cookie: auth-token=<string>; refresh-token=<string>
```

### Step 3: Check Application Storage

1. In DevTools, go to **Application** tab (Chrome) or **Storage** tab (Firefox)
2. In left sidebar: **Cookies** → `http://localhost:5174`
3. **Look for cookies**

**Expected:**
```
Name              Value           HttpOnly  Secure  SameSite
auth-token        <long-string>   ✓         ✗       Lax
refresh-token     <long-string>   ✓         ✗       Lax
```

## Common Issues

### Issue 1: No Set-Cookie Headers
**Symptom:** Response Headers don't show Set-Cookie  
**Cause:** Backend not setting cookies  
**Fix:** Check backend session management

### Issue 2: Cookies Not Sent on Requests
**Symptom:** Request Headers don't have Cookie  
**Cause:** CORS or SameSite issue  
**Fix:** 
- Backend must set `Access-Control-Allow-Credentials: true`
- Frontend must use `credentials: 'include'` (already doing this)
- SameSite should be `Lax` not `Strict` for localhost

### Issue 3: Secure Flag on HTTP
**Symptom:** Cookies set but not stored  
**Cause:** `Secure` flag requires HTTPS, but using HTTP  
**Fix:** Backend should NOT set `Secure` flag for localhost development

### Issue 4: Domain Mismatch
**Symptom:** Cookies set but not sent  
**Cause:** Cookie domain doesn't match request domain  
**Fix:** Don't set `Domain` attribute for localhost, or set it to `localhost`

## What to Share

Please share screenshots or copy-paste:

1. **Response Headers** from `/api` POST after login/refresh:
   ```
   Look for: Set-Cookie headers
   ```

2. **Request Headers** from next `/api` POST (auth/me):
   ```
   Look for: Cookie header
   ```

3. **Application → Cookies** storage view:
   ```
   List of all cookies for localhost:5174
   ```

This will tell us exactly what's wrong!

## Quick Test in Console

Run this in browser console after login:
```javascript
// This won't show HttpOnly cookies
console.log('document.cookie:', document.cookie);

// But this will work if cookies are set correctly
fetch('http://localhost:8005/api', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'call',
    id: '1',
    method: 'auth/me',
    args: {}
  })
})
.then(r => r.json())
.then(d => console.log('auth/me result:', d))
.catch(e => console.error('auth/me error:', e))
```

If this works, cookies are being sent correctly!
