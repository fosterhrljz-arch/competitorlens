# Local research service and Windows launcher

End users extract the full package and double-click `CompetitorLens.exe`. It starts `runtime/node.exe service/launch.mjs` hidden, then opens the default browser at `http://127.0.0.1:4184/`. A compatible running service is reused. No installation or terminal is required. `Start CompetitorLens.vbs` is an alternative launcher.

The V1.5 local service serves the portable application, health/collection/stop endpoints, and authenticated AI settings/test/models/analysis endpoints. Workspace data stays in browser storage. Non-sensitive AI preferences and DPAPI-encrypted credentials are stored separately in `%LOCALAPPDATA%\CompetitorLens\ai-settings.json`; unsupported secure storage falls back to a session-only key. No research logs or plaintext keys are written there. File-based browser storage is separate: use JSON backup/restore to transfer it. The service exits after 30 minutes without app/research/API activity; health polls do not extend this. A failed launch writes `launch-error.txt` and leaves manual HTML mode available.

## Rebuild the launcher (developers)

Use the Windows .NET Framework C# compiler from the project root:

```powershell
& 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe' /nologo /codepage:65001 /target:winexe /optimize+ /reference:System.Windows.Forms.dll /out:CompetitorLens.exe .\service\Launcher.cs
& 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe' /nologo /codepage:65001 /target:exe /optimize+ /reference:System.Security.dll /out:service/CredentialHelper.exe .\service\CredentialHelper.cs
```

Keep `runtime/node.exe` (OpenJS-signed Node.js 24.16.0 Windows x64) and `runtime/LICENSE.txt` in the package. The native launcher itself is unsigned. UI builds use `npm.cmd run build`; no production npm installation is needed.

## Collection policy

Explicit public HTTP/HTTPS hostnames, standard ports, no credentials/cookies, checked and pinned public DNS, redirect revalidation, robots rules, bounded rate/size/time, no script execution. The loopback API requires exact Host/Origin and a per-process token. No wildcard CORS, account integration, file browser, or remote-control interface is exposed. Missing/blocked/non-text/unsupported pages receive actionable errors and manual import remains available.

Tests can inject a collector through the server function for deterministic fixtures. Production launch does not expose that option. `CL_NO_BROWSER=1` is used only to suppress default-browser opening in the isolated launcher smoke test; it does not weaken collection controls.

The AI transport supports OpenAI-compatible Chat Completions and model listing, public HTTPS with checked/pinned DNS, and explicitly opted-in loopback providers. Redirects are refused. Keys are transmitted only to the configured endpoint; changing it clears credentials. The vault helper uses CurrentUser DPAPI with stdin/stdout pipes, never secret command-line arguments. Model output is schema-validated with exact citations; malformed or unsupported results do not enter research records. Provider text/errors are not logged, and responses redact the configured credential.

Testing can set `CL_TEST_DATA_DIR` to an isolated temporary vault directory. The normal launcher does not set it. `tests/ai-fixtures.mjs` is a synthetic local provider for regression tests, not an AI engine shipped in production behavior. No real credentials are present in tests or examples.

After UI/native builds, run `python scripts/release.py` to regenerate the SHA-256 manifest and standalone ZIP outside the source folder. It excludes development dependencies, test output, temporary files, and local credential files. The prebuilt app and bundled runtime work without npm installation.
