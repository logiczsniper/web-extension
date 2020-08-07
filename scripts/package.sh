#!/bin/bash
set -e
source ./.env

ESC="\x1b"
RESET="$ESC[0m"
BOLD="$ESC[1m"
DIM="$ESC[2m"
RED="$ESC[91m"
GREEN="$ESC[92m"
BLUE="$ESC[94m"
TEAL="$ESC[96m"
CODE="$BOLD$TEAL"

title() {
    echo -e "\n${BOLD}${BLUE}$1${RESET}"
}

step() {
    echo -e "${DIM} - ${RESET}$1${RESET}"
}

run() {
    step "$1"
    echo -e "##### $1 #####\n" | sed 's/\x1B\[[0-9;]\+[A-Za-z]//g' >> "$LOG_FILE"
    eval "$2 2>&1 >> '$LOG_FILE'"
    echo -e "\n" >> "$LOG_FILE"
}

onFailure() {
    echo ""
    echo -e "${BOLD}${RED}Packaging failed...${RESET}"
    echo ""
    exit 1
}
trap 'onFailure' ERR

# SETUP ################################
PACKAGE_VERSION=$(node -e 'console.log(require("./package.json").version)')
PACKAGE_NAME=$(node -e 'console.log(require("./package.json").name)')
OUTPUT_DIRECTORY="artifacts"
LOG_DIRECTORY="$OUTPUT_DIRECTORY/logs"
LOG_FILE="$LOG_DIRECTORY/$(date '+%Y-%m-%d_%H-%M-%S').log"
OUTPUT_NAME="$OUTPUT_DIRECTORY/$PACKAGE_NAME-$PACKAGE_VERSION"

echo -e "\n${BOLD}Packaging Web Extension${RESET}"

title   "Build Info"
echo -e "  ${DIM}PACKAGE_VERSION:  ${RESET}${BOLD}$PACKAGE_VERSION${RESET}"
echo -e "  ${DIM}PACKAGE_NAME:     ${RESET}${BOLD}$PACKAGE_NAME${RESET}"
echo -e "  ${DIM}OUTPUT_DIRECTORY: ${RESET}${BOLD}$OUTPUT_DIRECTORY${RESET}"
echo -e "  ${DIM}LOG_DIRECTORY:    ${RESET}${BOLD}$LOG_DIRECTORY${RESET}"
echo -e "  ${DIM}LOG_FILE:         ${RESET}${BOLD}$LOG_FILE${RESET}"
echo -e "  ${DIM}OUTPUT_NAME:      ${RESET}${BOLD}$OUTPUT_NAME${RESET}"

# CLEANUP ##############################
title "Prepare Output Directories"
mkdir -p "$LOG_DIRECTORY"

run "rm ${CODE}dist"            "rm -rf 'dist'"
run "rm ${CODE}$OUTPUT_NAME/*"  "rm -rf '$OUTPUT_NAME'"
run "mkdir ${CODE}$OUTPUT_NAME" "mkdir -p '$OUTPUT_NAME'"

# PREPACKAGE ###########################
title "Pre-package"
run "Install dependencies" "yarn install"
run "Build ${CODE}dist/"   "yarn build"
run "Verify manifest"      "yarn web-ext --config=.web-ext.config.js lint"

# PACKAGE ##############################
title "Packaging Artifacts"
# Chrome
run "Create ${CODE}chrome.zip" "zip -r '$OUTPUT_NAME/chrome.zip' dist/*"
# Firefox
run "Create ${CODE}firefox.zip" "yarn web-ext --config=.web-ext.config.js build -a '$OUTPUT_NAME' -n 'firefox.zip'"
run "Signing ${CODE}firefox.xpi" "yarn web-ext --config=.web-ext.config.js sign -a '$OUTPUT_NAME' -n 'firefox.xpi' --api-key '$FIREFOX_SIGNING_ISSUER' --api-secret '$FIREFOX_SIGNING_SECRET' --id='$FIREFOX_SIGNING_ID'"
mv "$OUTPUT_NAME/anime_skip-$PACKAGE_VERSION-an+fx.xpi" "$OUTPUT_NAME/firefox.xpi"
# TODO - Edge & Opera

# DEPLOY ###############################
run "Create and push V$PACKAGE_JSON_VERSION tag" "git tag 'v$PACKAGE_VERSION' & git push --tags"
# TODO

# CLEANUP ##############################
echo ""
echo -e "${BOLD}${GREEN}Done!${RESET}"
echo ""
exit 0
