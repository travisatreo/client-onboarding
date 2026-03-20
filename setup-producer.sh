#!/bin/bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ProducerOS — Producer Setup CLI
# Sets up a new producer instance on Vercel in under 2 minutes
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

BOLD="\033[1m"
DIM="\033[2m"
GOLD="\033[38;5;179m"
PURPLE="\033[38;5;99m"
GREEN="\033[32m"
RED="\033[31m"
RESET="\033[0m"

echo ""
echo -e "${GOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GOLD}${BOLD}  ProducerOS — New Producer Setup${RESET}"
echo -e "${GOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

# Check dependencies
for cmd in vercel gh; do
    if ! command -v $cmd &>/dev/null; then
        echo -e "${RED}Error: $cmd is required but not installed.${RESET}"
        exit 1
    fi
done

# ── Gather producer info ────────────────────────────────
echo -e "${PURPLE}${BOLD}Producer Info${RESET}"
echo ""

read -p "Producer/brand name (e.g. 'Yasuda Beats'): " PRODUCER_NAME
read -p "URL slug (lowercase, no spaces, e.g. 'yasudabeats'): " PRODUCER_SLUG
read -p "Legal name (for contracts, e.g. 'Trevor Yasuda'): " LEGAL_NAME
read -p "Legal DBA (e.g. 'Yasuda Beats LLC'): " LEGAL_DBA
read -p "Contact email: " PRODUCER_EMAIL
read -p "Producer phone (for SMS notifications): " PRODUCER_PHONE
read -p "Tagline (e.g. 'Beats for the Culture'): " TAGLINE
read -p "Credit line (e.g. 'Produced by Yasuda'): " CREDIT_LINE

echo ""
echo -e "${PURPLE}${BOLD}Rates & Payment${RESET}"
echo ""

read -p "Rate per song [$1500]: " RATE_PER_SONG
RATE_PER_SONG=${RATE_PER_SONG:-1500}
read -p "Minimum negotiable rate [$1000]: " MIN_RATE
MIN_RATE=${MIN_RATE:-1000}
read -p "Deposit percentage [50]: " DEPOSIT_PERCENT
DEPOSIT_PERCENT=${DEPOSIT_PERCENT:-50}
read -p "Payment method (zelle/venmo/cashapp/paypal): " PAYMENT_METHOD
read -p "Payment name (who they pay): " PAYMENT_NAME
read -p "Payment handle (@tag or phone, optional): " PAYMENT_HANDLE

echo ""
echo -e "${PURPLE}${BOLD}Branding (press enter for defaults)${RESET}"
echo ""

read -p "Accent color [#c8a851 gold]: " ACCENT_COLOR
ACCENT_COLOR=${ACCENT_COLOR:-#c8a851}
read -p "Accent light [#e8d5a3]: " ACCENT_LIGHT
ACCENT_LIGHT=${ACCENT_LIGHT:-#e8d5a3}
read -p "Secondary color [#6c5ce7 purple]: " SECONDARY_COLOR
SECONDARY_COLOR=${SECONDARY_COLOR:-#6c5ce7}
read -p "Secondary light [#8b7cf0]: " SECONDARY_LIGHT
SECONDARY_LIGHT=${SECONDARY_LIGHT:-#8b7cf0}

echo ""
echo -e "${PURPLE}${BOLD}Supabase (shared instance or their own)${RESET}"
echo ""

read -p "Supabase URL: " SUPABASE_URL
read -p "Supabase Service Key: " SUPABASE_SERVICE_KEY
read -p "Dashboard password: " DASHBOARD_PASSWORD

echo ""
echo -e "${PURPLE}${BOLD}Optional Integrations${RESET}"
echo ""

read -p "Enable Google Drive auto-folders? (y/n) [n]: " ENABLE_DRIVE_INPUT
ENABLE_DRIVE="false"
GOOGLE_SERVICE_ACCOUNT_KEY=""
GOOGLE_DRIVE_ROOT_FOLDER_ID=""
if [[ "$ENABLE_DRIVE_INPUT" == "y" ]]; then
    ENABLE_DRIVE="true"
    read -p "Google Service Account JSON (paste or path): " GOOGLE_SERVICE_ACCOUNT_KEY
    read -p "Google Drive root folder ID: " GOOGLE_DRIVE_ROOT_FOLDER_ID
fi

read -p "Enable SMS notifications (Twilio)? (y/n) [n]: " ENABLE_SMS_INPUT
ENABLE_SMS="false"
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
if [[ "$ENABLE_SMS_INPUT" == "y" ]]; then
    ENABLE_SMS="true"
    read -p "Twilio Account SID: " TWILIO_ACCOUNT_SID
    read -p "Twilio Auth Token: " TWILIO_AUTH_TOKEN
    read -p "Twilio Phone Number (+1...): " TWILIO_PHONE_NUMBER
fi

read -p "Custom domain (optional, e.g. 'onboarding.yasudabeats.com'): " CUSTOM_DOMAIN

# ── Summary ─────────────────────────────────────────────
echo ""
echo -e "${GOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GOLD}${BOLD}  Setup Summary${RESET}"
echo -e "${GOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "  Producer:    ${BOLD}${PRODUCER_NAME}${RESET}"
echo -e "  Slug:        ${PRODUCER_SLUG}"
echo -e "  Rate:        \$${RATE_PER_SONG}/song (min \$${MIN_RATE})"
echo -e "  Payment:     ${PAYMENT_METHOD} → ${PAYMENT_NAME}"
echo -e "  Colors:      ${ACCENT_COLOR} / ${SECONDARY_COLOR}"
echo -e "  Drive:       ${ENABLE_DRIVE}"
echo -e "  SMS:         ${ENABLE_SMS}"
echo -e "  Domain:      ${CUSTOM_DOMAIN:-none (will use Vercel URL)}"
echo ""

read -p "Deploy this producer? (y/n): " CONFIRM
if [[ "$CONFIRM" != "y" ]]; then
    echo "Cancelled."
    exit 0
fi

# ── Create Vercel project ───────────────────────────────
echo ""
echo -e "${PURPLE}Creating Vercel project: produceros-${PRODUCER_SLUG}...${RESET}"

PROJECT_NAME="produceros-${PRODUCER_SLUG}"

# Link to existing repo (same codebase, different project)
cd "$(dirname "$0")"

# Create the Vercel project by deploying
vercel --yes --name "$PROJECT_NAME" --build-env FORCE_NEW=1

echo -e "${GREEN}✓ Project created${RESET}"

# ── Set environment variables ───────────────────────────
echo -e "${PURPLE}Setting environment variables...${RESET}"

set_env() {
    local key="$1"
    local val="$2"
    if [[ -n "$val" ]]; then
        echo "$val" | vercel env add "$key" production --yes 2>/dev/null || true
    fi
}

set_env "PRODUCER_NAME" "$PRODUCER_NAME"
set_env "PRODUCER_SLUG" "$PRODUCER_SLUG"
set_env "PRODUCER_TAGLINE" "$TAGLINE"
set_env "PRODUCER_LEGAL_NAME" "$LEGAL_NAME"
set_env "PRODUCER_LEGAL_DBA" "$LEGAL_DBA"
set_env "PRODUCER_EMAIL" "$PRODUCER_EMAIL"
set_env "PRODUCER_PHONE" "$PRODUCER_PHONE"
set_env "CREDIT_LINE" "$CREDIT_LINE"
set_env "ACCENT_COLOR" "$ACCENT_COLOR"
set_env "ACCENT_LIGHT" "$ACCENT_LIGHT"
set_env "SECONDARY_COLOR" "$SECONDARY_COLOR"
set_env "SECONDARY_LIGHT" "$SECONDARY_LIGHT"
set_env "RATE_PER_SONG" "$RATE_PER_SONG"
set_env "MIN_RATE" "$MIN_RATE"
set_env "DEPOSIT_PERCENT" "$DEPOSIT_PERCENT"
set_env "PAYMENT_METHOD" "$PAYMENT_METHOD"
set_env "PAYMENT_NAME" "$PAYMENT_NAME"
set_env "PAYMENT_HANDLE" "$PAYMENT_HANDLE"
set_env "SUPABASE_URL" "$SUPABASE_URL"
set_env "SUPABASE_SERVICE_KEY" "$SUPABASE_SERVICE_KEY"
set_env "DASHBOARD_PASSWORD" "$DASHBOARD_PASSWORD"
set_env "ENABLE_DRIVE" "$ENABLE_DRIVE"
set_env "ENABLE_SMS" "$ENABLE_SMS"

if [[ "$ENABLE_DRIVE" == "true" ]]; then
    set_env "GOOGLE_SERVICE_ACCOUNT_KEY" "$GOOGLE_SERVICE_ACCOUNT_KEY"
    set_env "GOOGLE_DRIVE_ROOT_FOLDER_ID" "$GOOGLE_DRIVE_ROOT_FOLDER_ID"
fi

if [[ "$ENABLE_SMS" == "true" ]]; then
    set_env "TWILIO_ACCOUNT_SID" "$TWILIO_ACCOUNT_SID"
    set_env "TWILIO_AUTH_TOKEN" "$TWILIO_AUTH_TOKEN"
    set_env "TWILIO_PHONE_NUMBER" "$TWILIO_PHONE_NUMBER"
fi

echo -e "${GREEN}✓ Environment configured${RESET}"

# ── Deploy with env vars ────────────────────────────────
echo -e "${PURPLE}Deploying to production...${RESET}"
DEPLOY_URL=$(vercel --prod 2>&1 | tail -1)
echo -e "${GREEN}✓ Deployed: ${DEPLOY_URL}${RESET}"

# ── Custom domain ───────────────────────────────────────
if [[ -n "$CUSTOM_DOMAIN" ]]; then
    echo -e "${PURPLE}Adding custom domain: ${CUSTOM_DOMAIN}...${RESET}"
    vercel domains add "$CUSTOM_DOMAIN" 2>/dev/null || true
    echo -e "${GREEN}✓ Domain added (configure DNS: CNAME → cname.vercel-dns.com)${RESET}"
fi

# ── Preview URL ─────────────────────────────────────────
echo ""
echo -e "${GOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GOLD}${BOLD}  🎵 ${PRODUCER_NAME} is LIVE${RESET}"
echo -e "${GOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "  Onboarding:  ${BOLD}${DEPLOY_URL}${RESET}"
echo -e "  Dashboard:   ${BOLD}${DEPLOY_URL}/dashboard${RESET}"
if [[ -n "$CUSTOM_DOMAIN" ]]; then
    echo -e "  Custom URL:  ${BOLD}https://${CUSTOM_DOMAIN}${RESET}"
fi
echo ""
echo -e "${DIM}Send the onboarding link to their first client. 🚀${RESET}"
echo ""

# ── Save producer record ────────────────────────────────
PRODUCERS_DIR="$(dirname "$0")/.producers"
mkdir -p "$PRODUCERS_DIR"
cat > "$PRODUCERS_DIR/${PRODUCER_SLUG}.json" <<ENDJSON
{
    "name": "${PRODUCER_NAME}",
    "slug": "${PRODUCER_SLUG}",
    "legal_name": "${LEGAL_NAME}",
    "email": "${PRODUCER_EMAIL}",
    "phone": "${PRODUCER_PHONE}",
    "deploy_url": "${DEPLOY_URL}",
    "custom_domain": "${CUSTOM_DOMAIN}",
    "rate": ${RATE_PER_SONG},
    "payment_method": "${PAYMENT_METHOD}",
    "enable_drive": ${ENABLE_DRIVE},
    "enable_sms": ${ENABLE_SMS},
    "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
ENDJSON

echo -e "${GREEN}✓ Producer saved to .producers/${PRODUCER_SLUG}.json${RESET}"
