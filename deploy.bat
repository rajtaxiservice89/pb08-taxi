@echo off
color 0b
echo ========================================================
echo        PB08 TAXI - Vercel Deployment Script
echo ========================================================
echo.
echo Step 1: Logging into Vercel...
echo (A browser window will open. Please click "Continue with GitHub" or your preferred login method)
call npx vercel login

echo.
echo Step 2: Linking Project...
call npx vercel link --yes

echo.
echo Step 3: Deploying to Production! Please wait...
call npx vercel --prod

echo.
echo ========================================================
echo        DEPLOYMENT COMPLETE!
echo ========================================================
pause
