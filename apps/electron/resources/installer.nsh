; Manhwa Studio NSIS lifecycle hooks.
; Do not override $INSTDIR here: electron-builder chooses the correct
; per-machine Program Files location and uses the same path for shortcuts.

!macro customUnInstall
  DetailPrint "Closing Manhwa Studio processes..."
  nsExec::ExecToLog 'taskkill /IM "Manhwa Studio.exe" /T /F'
  Pop $0
  nsExec::ExecToLog 'taskkill /IM "mini-backend.exe" /T /F'
  Pop $0
  Sleep 1200

  ; Remove any remaining bundled backend files before NSIS removes the app dir.
  RMDir /r "$INSTDIR\resources\mini-backend"
!macroend

!macro customUnInit
  DetailPrint "Stopping Manhwa Studio processes before uninstall..."
  nsExec::ExecToLog 'taskkill /IM "Manhwa Studio.exe" /T /F'
  Pop $0
  nsExec::ExecToLog 'taskkill /IM "mini-backend.exe" /T /F'
  Pop $0
  Sleep 800
!macroend
