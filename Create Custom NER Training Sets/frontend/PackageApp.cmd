@ECHO OFF
ECHO:============================
ECHO:Deleting old copy of UI Tool
ECHO:============================
IF EXIST "%cd%\UI Tool" (
	RMDIR /s /q "%cd%\UI Tool"
	ECHO:Older copy of UI Tool deleted successfully...
) ELSE (
	ECHO:Older copy of UI Tool doesn't exist!
)
REM ECHO:===========================
REM ECHO:Compiling ExtJS application
REM ECHO:===========================
REM CD NLP
REM CALL sencha app build -c
REM CD..
ECHO:============================
ECHO:Installing node dependencies
ECHO:============================
CD "UI Tool Source"
CALL npm install
ECHO:=================
ECHO:Packaging UI Tool
ECHO:=================
CALL npm run package-app
ECHO:==========================
ECHO:Copying the required files
ECHO:==========================
CD..
REN "UI Tool-win32-x64" "UI Tool"
XCOPY "%cd%\UI Tool Source\configuration" "%cd%\UI Tool\configuration\"
ECHO:========================================
ECHO:Packaging tool completed successfully...
ECHO:========================================
PAUSE