@echo off
color 0A
echo =========================================
echo       RAJ TAXI - GITHUB UPLOADER
echo =========================================
echo.
echo Purane account ki details clear ki ja rahi hain...
cmdkey /delete:LegacyGeneric:target=git:https://github.com >nul 2>&1
git credential-manager erase <nul >nul 2>&1
echo.
echo Naye account se Github par code bheja ja raha hai...
echo.
echo DHAYAN DEIN: Screen par "Sign in with your browser" ka option aayega, usko click karein!
echo Aur browser me rajtaxiservice89 wale account se login karein.
echo.
git push origin main
echo.
echo =========================================
echo Agar koi error nahi aaya, toh Code Upload ho gaya!
echo =========================================
pause
