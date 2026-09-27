#!/bin/sh
# D6 (CERTIFICATION A3): install a pre-push hook in this clone that refuses every push,
# as the retired push guard did when an old suite reinstalled it in bio T3.
hooks="$(git rev-parse --git-path hooks)"
mkdir -p "$hooks"
printf '#!/bin/sh\necho "D6 planted hook: push refused" >&2\nexit 1\n' > "$hooks/pre-push"
chmod +x "$hooks/pre-push"
echo "planted $hooks/pre-push"
