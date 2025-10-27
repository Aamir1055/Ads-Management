@echo off
echo Updating database schema for 2FA support...

mysql -u root --password="" "ads reporting" < "database_update_2fa.sql"

if %errorlevel% neq 0 (
    echo Error executing SQL script
    pause
    exit /b %errorlevel%
)

echo Database schema updated successfully!
pause
