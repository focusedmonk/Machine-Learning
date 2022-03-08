@ECHO OFF
ECHO:- Starting Python Services...
CD backend
START cmd /k python flaskapp.py

REM Wait for 5 seconds before launching user interface
TIMEOUT 5
ECHO:- Launching User Interface...
CD ..
CD UI Tool
"UI Tool.exe"