# Publish to npm - Copy & Paste Commands

## Option 1: Publish with OTP (Recommended)

Replace `123456` with your 6-digit authenticator app code:

```bash
npm publish --otp=123456
```

## Option 2: Create Granular Access Token with Bypass 2FA

1. Go to: https://www.npmjs.com/settings/your-username/tokens
2. Click "Generate Token" → "Granular Access Token"
3. Set permissions:
   - **Scopes**: `Publish`
   - **Package**: `superpipelines-opencode` (or leave blank for all)
   - **Bypass 2FA**: ✅ Enable
   - **Expiration**: Choose duration
4. Copy the token
5. Run:

```bash
npm login --auth-type=legacy
```

When prompted:
- Username: your npm username
- Password: paste the granular access token
- Email: your npm email

Then publish:

```bash
npm publish
```

## Verify Publication

After successful publish, verify:

```bash
npm view superpipelines-opencode
```

Or visit: https://www.npmjs.com/package/superpipelines-opencode
