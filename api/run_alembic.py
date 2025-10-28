#!/usr/bin/env python
"""Helper script to run Alembic commands."""
import sys
import subprocess

if __name__ == "__main__":
    # Run alembic with the provided arguments
    result = subprocess.run(
        [sys.executable, "-m", "alembic"] + sys.argv[1:],
        cwd=r"G:\내 드라이브\Developement\PoliticianFinder\api"
    )
    sys.exit(result.returncode)