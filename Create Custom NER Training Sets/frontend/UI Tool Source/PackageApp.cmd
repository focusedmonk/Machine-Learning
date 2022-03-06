@ECHO OFF
ECHO:=====================
ECHO:Cleaning build folder
ECHO:=====================
IF EXIST "%cd%\build" (
	RMDIR /s /q "%cd%\build"
	ECHO:build folder deleted successfully...
) ELSE (
	ECHO:build folder doesn't exist!
)
ECHO:============================
ECHO:Installing node dependencies
ECHO:============================
CALL npm install
ECHO:========================
ECHO:Packaging UI Tool
ECHO:========================
CALL npm run package-app
ECHO:==========================
ECHO:Copying the required files
ECHO:==========================
CD build
REN "UI Tool-win32-x64" "UI Tool"
CD..
REM XCOPY "%cd%\_scripts" "%cd%\build\UI Tool\_scripts\"
XCOPY "%cd%\configuration" "%cd%\build\UI Tool\configuration\"
ECHO:========================================
ECHO:Packaging tool completed successfully...
ECHO:========================================
PAUSE