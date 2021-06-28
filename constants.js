exports.PASS_MIME_TYPE = 'application/vnd.apple.pkpass'
exports.SECRETS = {
  TEAM_ID: process.env.TEAM_ID,
  PASS_TYPE_ID: process.env.PASS_TYPE_ID,
  CERT: Buffer.from(
    typeof process.env.CERT === 'string' ? process.env.CERT : '', 'base64').toString('ascii'),
  PASSPHRASE: process.env.PASSPHRASE,
}
exports.NAME = 'CovidPass'
exports.HASHES = {
  IMG1X_WHITE: '9dcdd385e848610f020cf3bfc65ddc413beb5e87',
  IMG2X_WHITE: '4e8a383fd25dc26c686f8ac70f2a251d5bd60979',
  IMG1X_BLACK: '8fe995e82fa5fa28178df005a1340ae52dcf60e3',
  IMG2X_BLACK: '28cbd85eee40f0ac79a1cfe96524a64036c9cb9e'
}