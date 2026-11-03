#!/usr/bin/env bash

set -euo pipefail

REPOSITORY="${MERCURY_REPOSITORY:-erdncyz/mercury-ai-analysis}"
INSTALL_ROOT="${MERCURY_AI_ANALYSIS_HOME:-$HOME/.mercury-ai-analysis}"
RELEASE_ASSET="mercury-ai-analysis.tar.gz"
REQUESTED_VERSION="${MERCURY_VERSION:-latest}"
TEMP_DIR=""

usage() {
  cat <<'EOF'
Install Mercury Ai Analysis from a checksum-verified GitHub Release.

Usage:
  install.sh [--version vX.Y.Z]

Environment:
  MERCURY_AI_ANALYSIS_HOME  Installation directory (default: ~/.mercury-ai-analysis)
  MERCURY_REPOSITORY        GitHub owner/repository
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version)
      [[ $# -ge 2 ]] || { echo "Missing value for --version" >&2; exit 2; }
      REQUESTED_VERSION="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

for command_name in curl tar shasum node; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing required command: $command_name" >&2
    exit 1
  fi
done

if [[ "$INSTALL_ROOT" != /* ]]; then
  INSTALL_ROOT="${PWD}/${INSTALL_ROOT}"
fi
mkdir -p "$INSTALL_ROOT"
INSTALL_ROOT="$(cd "$INSTALL_ROOT" && pwd -P)"

if [[ "${MERCURY_UPDATE_ACTIVE:-0}" != "1" ]]; then
  exec 9>"${INSTALL_ROOT}/.update.lock"
  if ! /usr/bin/lockf -t 0 9 2>/dev/null; then
    echo "Another Mercury Ai Analysis install or update is already running." >&2
    exit 1
  fi
fi

if [[ "$REQUESTED_VERSION" != "latest" ]]; then
  REQUESTED_VERSION="v${REQUESTED_VERSION#v}"
  if [[ ! "$REQUESTED_VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Version must be vX.Y.Z, got: $REQUESTED_VERSION" >&2
    exit 2
  fi
fi

if [[ "$REQUESTED_VERSION" == "latest" ]]; then
  DOWNLOAD_BASE="https://github.com/${REPOSITORY}/releases/latest/download"
else
  DOWNLOAD_BASE="https://github.com/${REPOSITORY}/releases/download/${REQUESTED_VERSION}"
fi

TEMP_DIR="$(mktemp -d)"
cleanup() {
  if [[ -n "$TEMP_DIR" && -d "$TEMP_DIR" ]]; then
    rm -rf "$TEMP_DIR"
  fi
}
trap cleanup EXIT

echo "Downloading Mercury Ai Analysis ${REQUESTED_VERSION}..."
curl --fail --location --silent --show-error --connect-timeout 15 \
  "${DOWNLOAD_BASE}/${RELEASE_ASSET}" --output "${TEMP_DIR}/${RELEASE_ASSET}"
curl --fail --location --silent --show-error --connect-timeout 15 \
  "${DOWNLOAD_BASE}/${RELEASE_ASSET}.sha256" --output "${TEMP_DIR}/${RELEASE_ASSET}.sha256"

(
  cd "$TEMP_DIR"
  shasum -a 256 -c "${RELEASE_ASSET}.sha256"
)

if tar -tzf "${TEMP_DIR}/${RELEASE_ASSET}" | grep -E '(^/|(^|/)\.\.(/|$))' >/dev/null; then
  echo "The release bundle contains an unsafe path." >&2
  exit 1
fi

tar -xzf "${TEMP_DIR}/${RELEASE_ASSET}" -C "$TEMP_DIR"
BUNDLE_DIR="${TEMP_DIR}/mercury-ai-analysis"
VERSION_FILE="${BUNDLE_DIR}/.release-version"

if [[ ! -f "$VERSION_FILE" || ! -d "${BUNDLE_DIR}/dist" || ! -f "${BUNDLE_DIR}/server.mjs" || ! -f "${BUNDLE_DIR}/bin/mercury-ai-analysis" ]]; then
  echo "The release bundle is incomplete." >&2
  exit 1
fi

RELEASE_TAG="$(tr -d '[:space:]' < "$VERSION_FILE")"
if [[ ! "$RELEASE_TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Invalid release version: $RELEASE_TAG" >&2
  exit 1
fi

if [[ "$REQUESTED_VERSION" != "latest" && "$RELEASE_TAG" != "$REQUESTED_VERSION" ]]; then
  echo "Requested $REQUESTED_VERSION but downloaded $RELEASE_TAG." >&2
  exit 1
fi

RELEASE_DIR="${INSTALL_ROOT}/releases/${RELEASE_TAG}"
mkdir -p "${INSTALL_ROOT}/releases" "${INSTALL_ROOT}/config"
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"
cp -R "${BUNDLE_DIR}/." "$RELEASE_DIR"
chmod +x "${RELEASE_DIR}/bin/mercury-ai-analysis"

if [[ ! -f "${INSTALL_ROOT}/config/.env" ]]; then
  cat > "${INSTALL_ROOT}/config/.env" <<'EOF'
ARTIFICIAL_ANALYSIS_API_KEY=
GITHUB_TOKEN=
EOF
fi

ln -sfn "$RELEASE_DIR" "${INSTALL_ROOT}/current.new"
mv -f "${INSTALL_ROOT}/current.new" "${INSTALL_ROOT}/current"

cat > "${INSTALL_ROOT}/mercury-ai-analysis" <<EOF
#!/usr/bin/env bash
set -euo pipefail
exec "${INSTALL_ROOT}/current/bin/mercury-ai-analysis" "\$@"
EOF
chmod +x "${INSTALL_ROOT}/mercury-ai-analysis"

mkdir -p "${HOME}/.local/bin"
ln -sfn "${INSTALL_ROOT}/mercury-ai-analysis" "${HOME}/.local/bin/mercury-ai-analysis"

echo "Installed ${RELEASE_TAG} to ${INSTALL_ROOT}"
echo "Start it with: mercury-ai-analysis up"
echo "Update it with: mercury-ai-analysis update"
echo "API keys live in ${INSTALL_ROOT}/config/.env and are kept across updates."
