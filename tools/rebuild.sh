#!/bin/sh
set -e
P=/tmp/claude-0/-home-claude/1590c83c-e5e9-51e8-806a-d009d34d2fd8/scratchpad/artifact-files/507b23b4-3826-4bc6-8f0c-85f624e3081e/project
cp $P/app/*.jsx /home/claude/psystema-app/src/app/
cd /home/claude/psystema-app && node build.mjs | tail -1
