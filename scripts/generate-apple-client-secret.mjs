// Generates an Apple Sign in with Apple OAuth client secret (JWT).
// Apple's max lifetime is 6 months — re-run this script every ~5 months
// and paste the new JWT into Supabase Dashboard → Auth → Providers → Apple.
//
// Usage:
// APPLE_TEAM_ID=H3JWJPWX6W \
// APPLE_SERVICES_ID=io.unitcore.budget.web \
// APPLE_KEY_ID=YC9X6A59U5 \
// APPLE_P8_PATH=/Users/spectra/Downloads/AuthKey_YC9X6A59U5.p8 \
// node scripts/generate-apple-client-secret.mjs


import { sign, createPrivateKey } from 'node:crypto'
import { readFileSync } from 'node:fs'

const TEAM_ID = process.env.APPLE_TEAM_ID
const SERVICES_ID = process.env.APPLE_SERVICES_ID
const KEY_ID = process.env.APPLE_KEY_ID
const P8_PATH = process.env.APPLE_P8_PATH

if (!TEAM_ID || !SERVICES_ID || !KEY_ID || !P8_PATH) {
  console.error(
    'Missing env vars. Required: APPLE_TEAM_ID, APPLE_SERVICES_ID, APPLE_KEY_ID, APPLE_P8_PATH'
  )
  process.exit(1)
}

const privateKey = createPrivateKey({
  key: readFileSync(P8_PATH, 'utf8'),
  format: 'pem',
})

const now = Math.floor(Date.now() / 1000)
const header = { alg: 'ES256', kid: KEY_ID, typ: 'JWT' }
const payload = {
  iss: TEAM_ID,
  iat: now,
  exp: now + 60 * 60 * 24 * 180, // 180 days (just under Apple's 6-month max)
  aud: 'https://appleid.apple.com',
  sub: SERVICES_ID,
}

const base64url = (input) => Buffer.from(input).toString('base64url')

const signingInput = `${base64url(JSON.stringify(header))}.${base64url(
  JSON.stringify(payload)
)}`

const signature = sign('SHA256', Buffer.from(signingInput), {
  key: privateKey,
  dsaEncoding: 'ieee-p1363', // raw r||s, not DER — required by JWT spec
})

const jwt = `${signingInput}.${base64url(signature)}`
console.log(jwt)
