#!/bin/sh
# Writes the runtime API URL into env.js, which index.html loads before the app
# bundle. This is what lets one image serve every environment.
#
# Runs from /docker-entrypoint.d/ in the nginx image, before nginx starts.

set -e

WEB_ROOT="${WEB_ROOT:-/usr/share/nginx/html}"

# If VITE_API_URL is unset or empty, do nothing -
# leaves the static env.js from the build intact as the fallback.
if [ -z "${VITE_API_URL}" ]; then
  exit 0
fi

cat > "${WEB_ROOT}/env.js" <<EOF
window.env = {
  VITE_API_URL: "${VITE_API_URL}"
};
EOF
