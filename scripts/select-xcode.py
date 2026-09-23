"""Use the release SDK explicitly instead of the runner's changing default."""
import os
from pathlib import Path
import re
import subprocess

candidates = list(Path('/Applications').glob('Xcode_26*.app'))
if not candidates:
    raise RuntimeError('This runner has no Xcode 26 installation; use a release-compatible runner.')
def version(path):
    return tuple(int(part) for part in re.findall(r'\d+', path.name))
developer = max(candidates, key=version) / 'Contents/Developer'
with open(os.environ['GITHUB_ENV'], 'a') as env:
    env.write(f'DEVELOPER_DIR={developer}\n')
os.environ['DEVELOPER_DIR'] = str(developer)
subprocess.run(['xcodebuild', '-version'], check=True)
subprocess.run(['xcodebuild', '-showsdks'], check=True)
