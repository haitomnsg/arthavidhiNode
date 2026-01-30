# ArthaVidhi - cPanel Deployment Guide

This guide explains how to deploy ArthaVidhi to a cPanel hosting environment.

## Prerequisites

- cPanel hosting with Node.js support (Node.js Selector)
- MySQL database access
- SSH access (recommended but optional)
- Node.js 18+ support on your hosting

## Step 1: Prepare Your Database

1. **Create a MySQL Database in cPanel:**
   - Go to cPanel → MySQL Databases
   - Create a new database (e.g., `yourusername_arthavidhi`)
   - Create a new database user with a strong password
   - Add the user to the database with ALL PRIVILEGES

2. **Import the Database Schema:**
   - Go to cPanel → phpMyAdmin
   - Select your database
   - Import the `sql/database.sql` file

3. **Note your database credentials:**
   ```
   Host: localhost (usually)
   Database: yourusername_arthavidhi
   User: yourusername_dbuser
   Password: your_secure_password
   Port: 3306 (default)
   ```

## Step 2: Prepare the Application Files

### Option A: Build Locally (Recommended)

1. **Build the application on your local machine:**
   ```bash
   # Install dependencies
   npm install

   # Build for production
   npm run build
   ```

2. **Files to upload to cPanel:**
   ```
   .next/              (entire folder)
   node_modules/       (entire folder - or run npm install on server)
   public/             (entire folder)
   package.json
   package-lock.json
   server.js
   next.config.mjs
   .env                (create from .env.example with your values)
   ```

### Option B: Build on Server (if SSH available)

1. Upload all source files via File Manager or FTP
2. Connect via SSH and run:
   ```bash
   cd ~/your-app-directory
   npm install
   npm run build
   ```

## Step 3: Configure Environment Variables

1. Create a `.env` file in your application root:
   ```env
   # Database Configuration
   DATABASE_URL="mysql://yourusername_dbuser:password@localhost:3306/yourusername_arthavidhi"
   
   # Server Configuration
   NODE_ENV=production
   PORT=3000
   HOSTNAME=0.0.0.0
   
   # Database Pool (keep low for shared hosting)
   DB_CONNECTION_LIMIT=5
   DB_SSL=false
   
   # Image Optimization (disable for cPanel)
   DISABLE_IMAGE_OPTIMIZATION=true
   ```

2. **Important:** If your database password contains special characters, URL encode them:
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - etc.

## Step 4: Set Up Node.js Application in cPanel

1. **Go to cPanel → Setup Node.js App**

2. **Create Application:**
   - Node.js version: Select 18.x or higher
   - Application mode: Production
   - Application root: Path to your app (e.g., `/home/username/arthavidhi`)
   - Application URL: Your domain or subdomain
   - Application startup file: `server.js`

3. **Environment Variables (Alternative method):**
   - You can also set environment variables directly in the Node.js App setup
   - Add each variable from your `.env` file

4. **Click "Create"**

## Step 5: Start the Application

1. In the Node.js App section, click "Run NPM Install" (if you didn't upload node_modules)
2. Click "Start App"
3. Your application should now be accessible at your configured URL

## Troubleshooting

### Application won't start
- Check the error logs in cPanel → Errors
- Verify all environment variables are set correctly
- Ensure DATABASE_URL is properly formatted

### Database connection errors
- Verify the database user has proper permissions
- Check if the password is URL-encoded if it contains special characters
- Try connecting via phpMyAdmin to verify credentials

### 502 Bad Gateway
- The Node.js app might still be starting up - wait a few seconds
- Check if the PORT matches what cPanel expects
- Review the Node.js app logs

### Memory issues
- Reduce `DB_CONNECTION_LIMIT` to 3
- Disable image optimization: `DISABLE_IMAGE_OPTIMIZATION=true`

### Static files not loading
- Ensure the `public/` folder was uploaded
- Check the `.htaccess` file exists in `public/`

## Updating the Application

1. Build locally: `npm run build`
2. Stop the app in cPanel
3. Upload the new `.next/` folder and any changed files
4. Start the app in cPanel

## Performance Tips

1. **Enable caching:** The `.htaccess` file includes caching rules for static assets
2. **Monitor memory:** Keep connection pool small on shared hosting
3. **Use CDN:** Consider using Cloudflare for static assets

## File Structure After Deployment

```
~/arthavidhi/
├── .env                 # Environment variables
├── .next/               # Built Next.js application
├── node_modules/        # Dependencies
├── package.json         # Package manifest
├── package-lock.json    # Dependency lock file
├── public/              # Static files
│   ├── .htaccess        # Apache configuration
│   └── uploads/         # User uploads
├── server.js            # Custom server entry point
└── next.config.mjs      # Next.js configuration
```

## Health Check

After deployment, verify the application is running:

```
https://yourdomain.com/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-01-30T...",
  "env": "production"
}
```

## Support

If you encounter issues:
1. Check cPanel error logs
2. Review the Node.js application logs
3. Verify all environment variables are correct
4. Ensure database connectivity
