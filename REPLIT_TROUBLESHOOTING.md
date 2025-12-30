# Replit Troubleshooting Guide

Common issues when deploying Civix on Replit and how to fix them.

## Issue 1: "The nix environment failed to build"

### Symptoms
```
The nix environment failed to build
Check if your .replit and replit.nix files are configured properly
```

### Root Causes
1. Nix channel version is too new or unavailable
2. Package names have changed
3. PostgreSQL package conflicts

### Solution

#### Option A: Use Stable Nix Channel (Recommended)

Update `.replit`:
```toml
run = "npm run dev"

[nix]
channel = "stable-23_11"

[deployment]
run = ["sh", "-c", "npm run build && npm run start"]

[[ports]]
localPort = 3000
externalPort = 80
```

Update `replit.nix`:
```nix
{ pkgs }: {
  deps = [
    pkgs.nodejs-20_x
    pkgs.openssl
  ];
}
```

**Changes:**
- Downgraded from `stable-24_05` to `stable-23_11` (more stable)
- Removed `pkgs.postgresql` (conflicts with Neon)
- Removed `pkgs.nodePackages.typescript-language-server` (not needed)

#### Option B: Recover Original Configuration

In Replit, click **"Recover original configuration files"** button, then manually configure:

1. Let Replit auto-detect as Node.js project
2. It will generate working `.replit` and `replit.nix`
3. Just ensure `run = "npm run dev"`

#### Option C: Minimal Configuration (Simplest)

Delete both files and let Replit auto-detect:

```bash
# In Replit Shell
rm .replit replit.nix

# Click "Configure" in Replit
# Select "Node.js"
# Done!
```

## Issue 2: "Module not found" or npm install fails

### Symptoms
```
Error: Cannot find module 'next'
npm install fails
```

### Solution

```bash
# In Replit Shell
rm -rf node_modules package-lock.json
npm install
```

## Issue 3: Database Connection Issues

### Symptoms
```
Can't reach database server
Connection refused
```

### Solution: Set Up Neon Database

1. **Add Neon PostgreSQL Integration**
   - In Replit sidebar, click "Tools" → "Database"
   - Click "Add Database"
   - Select "PostgreSQL (Neon)"
   - Replit auto-creates `DATABASE_URL` secret

2. **Verify DATABASE_URL**
   - Click "Secrets" (lock icon)
   - Check `DATABASE_URL` exists
   - Format: `postgresql://user:pass@host/db?sslmode=require`

3. **Initialize Database**
   ```bash
   # In Replit Shell
   npm run db:push
   npm run db:seed
   ```

## Issue 4: Port Already in Use

### Symptoms
```
Error: listen EADDRINUSE: address already in use :::3000
Port 3000 is already in use
```

### Solution

```bash
# In Replit Shell
# Kill existing process
pkill -f node

# Or use different port
PORT=3001 npm run dev
```

## Issue 5: Build Fails in Deployment

### Symptoms
Deployment fails during `npm run build`

### Solution

Check for:

1. **Environment Variables Missing**
   ```bash
   # Add to Secrets:
   DATABASE_URL=your-neon-url
   NEXTAUTH_SECRET=generate-with-openssl
   NODE_ENV=production
   ```

2. **Build Command Correct**
   In `.replit`:
   ```toml
   [deployment]
   run = ["sh", "-c", "npm run build && npm run start"]
   ```

3. **Prisma Generation**
   ```bash
   # Test locally first
   npm run build
   ```

## Issue 6: "Command not found: npx" or "npm"

### Symptoms
```bash
bash: npx: command not found
bash: npm: command not found
```

### Solution

Replit's Nix environment isn't loading. Fix `replit.nix`:

```nix
{ pkgs }: {
  deps = [
    pkgs.nodejs-20_x  # Includes npm, npx
  ];
}
```

Then restart the Repl.

## Issue 7: Slow or Unresponsive Repl

### Symptoms
- Slow to start
- Frequent disconnections
- Out of memory errors

### Solutions

1. **Upgrade to Hacker Plan**
   - Free tier: Limited resources, sleeps after inactivity
   - Hacker ($7/mo): Always-on, more resources

2. **Optimize Build**
   ```bash
   # Clear build cache
   rm -rf .next
   npm run build
   ```

3. **Reduce Dependencies**
   - Remove unused packages from `package.json`
   - Use lighter alternatives

## Issue 8: Prisma Client Not Found

### Symptoms
```
Cannot find module '@prisma/client'
Error: @prisma/client did not initialize
```

### Solution

```bash
# Regenerate Prisma Client
npx prisma generate

# Restart dev server
npm run dev
```

## Issue 9: TypeScript Errors in Replit

### Symptoms
Red squiggly lines everywhere, but code works

### Solution

Replit's TypeScript server might be outdated:

```bash
# Install/update dependencies
npm install

# Restart Repl (top-right menu → Restart)
```

Or ignore if code runs fine - Replit's editor linting can be buggy.

## Complete Setup Checklist for Replit

- [ ] `.replit` uses stable Nix channel (`stable-23_11`)
- [ ] `replit.nix` includes `nodejs-20_x`
- [ ] Neon PostgreSQL database connected
- [ ] `DATABASE_URL` secret exists
- [ ] `NEXTAUTH_SECRET` secret set
- [ ] `npm install` completed successfully
- [ ] `npm run db:push` completed
- [ ] `npm run db:seed` completed
- [ ] `npm run dev` starts without errors
- [ ] Can access app in Replit webview

## Recommended .replit Configuration

**Minimal (Recommended):**
```toml
run = "npm run dev"

[nix]
channel = "stable-23_11"

[[ports]]
localPort = 3000
externalPort = 80
```

**Full (With Deployment):**
```toml
run = "npm run dev"

[nix]
channel = "stable-23_11"

[deployment]
run = ["sh", "-c", "npm run build && npm run start"]

[[ports]]
localPort = 3000
externalPort = 80

[env]
NODE_ENV = "development"
```

## Recommended replit.nix Configuration

**Minimal:**
```nix
{ pkgs }: {
  deps = [
    pkgs.nodejs-20_x
  ];
}
```

**With OpenSSL (for Prisma):**
```nix
{ pkgs }: {
  deps = [
    pkgs.nodejs-20_x
    pkgs.openssl
  ];
}
```

## Quick Recovery Steps

If everything is broken:

```bash
# 1. Backup your code
git add .
git commit -m "backup before reset"

# 2. Clean everything
rm -rf node_modules .next package-lock.json
rm .replit replit.nix

# 3. Let Replit auto-configure
# Click "Configure" → "Node.js"

# 4. Reinstall
npm install

# 5. Rebuild database
npm run db:push
npm run db:seed

# 6. Start
npm run dev
```

## Still Not Working?

### Check Replit Status
- Visit [Replit Status](https://status.replit.com/)
- Nix builds sometimes fail during outages

### Enable Verbose Logging

In Shell:
```bash
# Show detailed npm logs
npm run dev --verbose

# Show Prisma logs
DEBUG=prisma:* npm run dev
```

### Contact Replit Support
- Use the "?" button in Replit
- Ask in [Replit Discord](https://replit.com/discord)
- Check [Replit Docs](https://docs.replit.com)

## Alternative: Skip Nix, Use Node.js Runtime

If Nix keeps failing:

1. Delete `.replit` and `replit.nix`
2. In Replit: Settings → Language → Select "Node.js"
3. Set Run command to `npm run dev`
4. Replit will use native Node.js runtime (no Nix)

This usually works better for Next.js projects.

## Prevention Tips

1. **Pin Dependencies**
   ```json
   {
     "engines": {
       "node": "20.x",
       "npm": "10.x"
     }
   }
   ```

2. **Use LTS Versions**
   - Stick with Node 20 (LTS)
   - Use stable Nix channel

3. **Test Locally First**
   - Clone your Repl
   - Test changes in a duplicate
   - Then apply to production

4. **Keep It Simple**
   - Minimal `replit.nix`
   - Only essential packages
   - Let npm handle everything else

## Common Replit-Specific Issues

### Auto-Sleep (Free Tier)
Repl sleeps after inactivity. Solutions:
- Upgrade to Hacker plan
- Use Always-On (Hacker feature)
- Accept it for MVP testing

### Limited Storage
Free tier has limited disk space:
```bash
# Check disk usage
du -sh node_modules/
du -sh .next/

# Clean up
npm prune
rm -rf .next
```

### Network Restrictions
Some npm packages fail on Replit:
- Native modules may not compile
- Some binaries unavailable in Nix
- Use pure JavaScript alternatives

## Recommended First Steps

When you import your repo to Replit:

```bash
# 1. Let Replit configure automatically first
# Don't manually create .replit yet

# 2. Add Neon database
# Tools → Database → PostgreSQL (Neon)

# 3. Install dependencies
npm install

# 4. Set up database
npm run db:push
npm run db:seed

# 5. Start server
npm run dev

# 6. Only if step 5 fails, then update .replit
```

## Success Indicators

You'll know it's working when:

✅ Replit Shell shows: `ready - started server on 0.0.0.0:3000`
✅ Webview displays your landing page
✅ No errors in Console tab
✅ `/dashboard/tester` loads successfully
✅ Can create a decision and get results

---

**Pro Tip**: Replit works best with simple, standard configurations. Don't over-engineer `.replit` and `replit.nix` files!
