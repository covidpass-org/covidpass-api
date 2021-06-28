exports.PASS_MIME_TYPE = 'application/vnd.apple.pkpass'
exports.SECRETS = {
  TEAM_ID: process.env.TEAM_ID,
  PASS_TYPE_ID: process.env.PASS_TYPE_ID,
  CERT: Buffer.from(
    typeof process.env.CERT === 'string' ? process.env.CERT : '', 'base64').toString('ascii'),
  PASSPHRASE: process.env.PASSPHRASE,
}
exports.NAME = 'CovidPass'