#!/usr/bin/env python3
"""Start the local school once, then open it in the default browser."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import time
from urllib.request import urlopen
import webbrowser

URL = 'http://127.0.0.1:8742'


def running():
    try:
        with urlopen(URL + '/api/status', timeout=1) as r:
            return json.load(r).get('app') == 'law-school-learning-foundation'
    except Exception:
        return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--no-open', action='store_true')
    args = parser.parse_args()
    if not running():
        state = Path.home() / '.local/state/law-school-learning-foundation'
        state.mkdir(parents=True, exist_ok=True, mode=0o700)
        log = os.open(state / 'server.log', os.O_CREAT | os.O_APPEND | os.O_WRONLY, 0o600)
        try:
            process = subprocess.Popen([sys.executable, str(Path(__file__).with_name('local_server.py'))],
                                       stdin=subprocess.DEVNULL, stdout=log, stderr=log, start_new_session=True)
        finally:
            os.close(log)
        for _ in range(60):
            if running():
                break
            if process.poll() is not None:
                raise SystemExit('Could not start the school. See ~/.local/state/law-school-learning-foundation/server.log')
            time.sleep(.1)
        else:
            raise SystemExit('The school did not start. Port 8742 may already be in use.')
    if not args.no_open:
        webbrowser.open(URL)
    print(URL)


if __name__ == '__main__':
    main()
