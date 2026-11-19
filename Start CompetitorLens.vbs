Option Explicit
Dim shell, fs, folder, runtime, command
Set shell = CreateObject("WScript.Shell")
Set fs = CreateObject("Scripting.FileSystemObject")
folder = fs.GetParentFolderName(WScript.ScriptFullName)
runtime = fs.BuildPath(folder, "runtime\node.exe")
If Not fs.FileExists(runtime) Then
  MsgBox "Extract the complete CompetitorLens Windows package first. The bundled runtime is missing.", 48, "CompetitorLens"
  WScript.Quit 1
End If
command = """" & runtime & """ """ & fs.BuildPath(folder, "service\launch.mjs") & """"
shell.Run command, 0, False
