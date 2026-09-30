@echo off
echo Создание папок для фоновых изображений...
echo.

C:\Users\23232323\Downloads\mc.exe mb myminio/logistic-pro/backgrounds/home
C:\Users\23232323\Downloads\mc.exe mb myminio/logistic-pro/backgrounds/carriers
C:\Users\23232323\Downloads\mc.exe mb myminio/logistic-pro/backgrounds/cargo-owners
C:\Users\23232323\Downloads\mc.exe mb myminio/logistic-pro/backgrounds/team

echo.
echo Папки созданы! Теперь вы можете загружать изображения.
echo.
echo Примеры команд для загрузки:
echo   C:\Users\23232323\Downloads\mc.exe cp hero-bg.jpg myminio/logistic-pro/backgrounds/home/hero-bg.jpg
echo   C:\Users\23232323\Downloads\mc.exe cp carriers-bg.jpg myminio/logistic-pro/backgrounds/carriers/hero-bg.jpg
echo.
echo Просмотр структуры:
echo   C:\Users\23232323\Downloads\mc.exe tree myminio/logistic-pro/backgrounds/
echo.
pause

