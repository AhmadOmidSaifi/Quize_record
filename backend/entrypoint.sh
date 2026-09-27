#!/bin/sh
set -eu

python manage.py makemigrations accounts competitions
python manage.py migrate --noinput
exec "$@"
