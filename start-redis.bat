@echo off
echo Starting Redis server in WSL...
wsl sudo service redis-server start
echo Redis server started successfully!
echo You can test the connection with: wsl redis-cli ping
pause 