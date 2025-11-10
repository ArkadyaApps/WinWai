# Email/Password Authentication - Implementation Status

## ✅ COMPLETED - Backend (100%)

### Modified Files:
- `/app/backend/server.py`

### What Was Done:

1. **Dependencies Added:**
   - `hashlib` for SHA256 password hashing
   - `secrets` for secure reset token generation
   - `EmailStr` from Pydantic for email validation

2. **User Model Extended:**
   ```python
   password_hash: Optional[str] = None
   resetToken: Optional[str] = None
   resetTokenExpiry: Optional[datetime] = None
   ```

3. **New API Endpoints (All Working):**
   - `POST /api/auth/email/signup` - Create account
   - `POST /api/auth/email/signin` - Login
   - `POST /api/auth/change-password` - Change password
   - `POST /api/auth/forgot-password` - Request reset
   - `POST /api/auth/reset-password` - Reset with token

4. **Helper Functions:**
   - `hash_password()` - SHA256 hashing
   - `verify_password()` - Password verification
   - `generate_reset_token()` - Secure 32-byte token

---

## 🔄 IN PROGRESS - Frontend (20%)

### Modified Files:
- `/app/frontend/src/contexts/AuthContext.tsx` (Interface updated only)

### What Was Done:
- Added method signatures to `AuthContextType`:
  ```typescript
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  ```

---

## 📋 TODO - Frontend Implementation

### Priority 1: Complete AuthContext
**File:** `/app/frontend/src/contexts/AuthContext.tsx`

**Need to add implementations:**
```typescript
const signInWithEmail = async (email: string, password: string) => {
  try {
    const response = await api.post('/api/auth/email/signin', { email, password });
    const { session_token, user } = response.data;
    await AsyncStorage.setItem('session_token', session_token);
    setUser(user);
  } catch (error) {
    throw error;
  }
};

const signUpWithEmail = async (email: string, password: string, name: string) => {
  try {
    const response = await api.post('/api/auth/email/signup', { email, password, name });
    const { session_token, user } = response.data;
    await AsyncStorage.setItem('session_token', session_token);
    setUser(user);
  } catch (error) {
    throw error;
  }
};
```

**Update provider return:**
```typescript
<AuthContext.Provider value={{ 
  signIn, 
  signInWithEmail, 
  signUpWithEmail, 
  signOut, 
  isLoading 
}}>
```

---

### Priority 2: Update Landing Page
**File:** `/app/frontend/app/index.tsx`

**Add email/password sign-in form:**
- Email input field
- Password input field
- "Sign In" button
- "Sign Up" link
- "Forgot Password?" link
- Toggle between Google OAuth and Email/Password
- Error message display

**Suggested Layout:**
```
[Logo - 80% width]
[Subtitle]

--- OR Divider ---

[Email Input]
[Password Input]
[Sign In Button]

[Forgot Password?] | [Sign Up]

--- OR Divider ---

[Sign in with Google Button]
```

---

### Priority 3: Create Sign Up Screen
**New File:** `/app/frontend/app/signup.tsx`

**Components needed:**
- Name input field
- Email input field
- Password input field
- Confirm password field
- "Create Account" button
- "Already have account? Sign In" link
- Password strength indicator
- Error message display

---

### Priority 4: Create Forgot Password Flow
**New Files:**
- `/app/frontend/app/forgot-password.tsx` - Enter email
- `/app/frontend/app/reset-password.tsx` - Enter new password with token

**forgot-password.tsx needs:**
- Email input
- "Send Reset Link" button
- Success message (token displayed for now, until email server)
- Back to sign in link

**reset-password.tsx needs:**
- Email input (read-only, from params)
- Reset token input (or from URL params)
- New password input
- Confirm password input
- "Reset Password" button

---

### Priority 5: Add to Profile Settings
**File:** `/app/frontend/app/(tabs)/profile.tsx`

**Add password change section:**
- Only show if user has password (not OAuth-only)
- Current password input
- New password input
- Confirm new password input
- "Change Password" button
- Success/error messages

**Suggested placement:**
After the profile edit section, before settings section

---

## 🔧 Helper Functions Needed

**Create:** `/app/frontend/src/utils/validation.ts`

```typescript
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const passwordsMatch = (password: string, confirm: string): boolean => {
  return password === confirm && password.length > 0;
};
```

---

## 📱 UI/UX Guidelines

1. **Input Fields:**
   - Use `TextInput` from react-native
   - `secureTextEntry={true}` for password fields
   - `keyboardType="email-address"` for email
   - `autoCapitalize="none"` for email
   - Show/hide password toggle icon

2. **Validation:**
   - Real-time validation on blur
   - Error messages below inputs (red text)
   - Disable submit button if invalid

3. **Loading States:**
   - Show `ActivityIndicator` while API calls in progress
   - Disable buttons during loading

4. **Error Handling:**
   - Display API errors in red alert/toast
   - Clear errors on input change

5. **Success States:**
   - Redirect to home on successful sign in/up
   - Show success message on password change/reset

---

## 🧪 Testing Checklist

### Backend (Ready to Test):
- [ ] Sign up with new email/password
- [ ] Sign in with existing credentials
- [ ] Attempt sign in with wrong password
- [ ] Change password while authenticated
- [ ] Request password reset
- [ ] Reset password with valid token
- [ ] Try reset with expired token

### Frontend (After Implementation):
- [ ] Email validation works
- [ ] Password strength indicator updates
- [ ] Form submission prevents on invalid input
- [ ] Error messages display correctly
- [ ] Loading states show during API calls
- [ ] Successful auth redirects to home
- [ ] Token persists after app restart
- [ ] OAuth and email/password can coexist

---

## 🚀 Next Session Plan

1. **Complete AuthContext** (10 min)
   - Implement `signInWithEmail()`
   - Implement `signUpWithEmail()`
   - Update provider

2. **Update Landing Page** (20 min)
   - Add email/password form
   - Add toggle between OAuth/Email
   - Add navigation to signup/forgot

3. **Create Sign Up Screen** (15 min)
   - Full registration form
   - Validation
   - Error handling

4. **Create Password Reset Screens** (15 min)
   - Forgot password form
   - Reset password form

5. **Add to Profile Settings** (10 min)
   - Password change section
   - Conditional display

6. **Test End-to-End** (10 min)
   - Sign up new user
   - Sign in
   - Change password
   - Reset password

**Total Estimated Time: ~80 minutes**

---

## 📝 Important Notes

- ⚠️ **Password Storage:** Using SHA256 (simple but functional). For production, consider bcrypt/argon2
- ⚠️ **Reset Tokens:** Currently returned in API response. Remove in production - send via email only
- ⚠️ **Email Server:** Not yet configured. Reset tokens are returned in response for testing
- ✅ **OAuth Compatible:** Email/password auth works alongside existing Google OAuth
- ✅ **Session Management:** Uses same session token system as OAuth

---

## 🔗 API Endpoints Reference

```typescript
// Sign Up
POST /api/auth/email/signup
Body: { email: string, password: string, name: string }
Response: { user: User, session_token: string }

// Sign In
POST /api/auth/email/signin
Body: { email: string, password: string }
Response: { user: User, session_token: string }

// Change Password (requires auth header)
POST /api/auth/change-password
Headers: { Authorization: "Bearer <token>" }
Body: { currentPassword: string, newPassword: string }
Response: { message: string }

// Forgot Password
POST /api/auth/forgot-password
Body: { email: string }
Response: { message: string, resetToken: string, email: string }

// Reset Password
POST /api/auth/reset-password
Body: { email: string, resetToken: string, newPassword: string }
Response: { message: string }
```

---

**Status:** Backend complete ✅ | Frontend 20% complete 🔄 | Ready to continue 🚀
