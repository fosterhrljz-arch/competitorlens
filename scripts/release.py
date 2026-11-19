"""Package the prebuilt independent app. No installation or network access."""
from pathlib import Path
import hashlib
import zipfile

root = Path(__file__).resolve().parents[1]
excluded_dirs = {'node_modules', 'test-results', 'playwright-report', '.git', '.agents', '.codex', '__pycache__', 'dist'}
excluded_files = {'SHA256SUMS.txt', 'launch-error.txt', 'ai-settings.json'}
files = sorted(p for p in root.rglob('*') if p.is_file()
               and not any(part in excluded_dirs for part in p.relative_to(root).parts)
               and p.name not in excluded_files and not p.name.startswith('.env')
               and p.suffix not in {'.tmp', '.log', '.zip', '.pyc'})
for required in ['CompetitorLens.html', 'CompetitorLens.exe', 'runtime/node.exe', 'service/CredentialHelper.exe']:
    if not (root / required).is_file():
        raise SystemExit('Missing release artifact: ' + required)

def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()

manifest = root / 'SHA256SUMS.txt'
manifest.write_text(''.join(digest(p) + '  ' + p.relative_to(root).as_posix() + '\n' for p in files), encoding='utf-8')
destination = root.parent / 'CompetitorLens-V1.5.zip'
temporary = destination.with_suffix('.zip.tmp')
with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for path in [*files, manifest]:
        archive.write(path, 'CompetitorLens/' + path.relative_to(root).as_posix())
temporary.replace(destination)
destination.with_suffix('.zip.sha256').write_text(digest(destination) + '  ' + destination.name + '\n', encoding='utf-8')
with zipfile.ZipFile(destination) as archive:
    failure = archive.testzip()
    if failure:
        raise SystemExit('Archive verification failed: ' + failure)
print(f'Verified {len(files)+1} files: {destination} ({destination.stat().st_size:,} bytes)')
