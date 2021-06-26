'use strict';

require('dotenv').config({path: '/run/secrets/env'})

const consts = require('./constants')
const utils = require('./utils')
const img = require('./img')

const { Payload } = require('./payload')
const { Template, constants } = require("@walletpass/pass-js")

const express = require('express')
var cors = require('cors')

const PORT = 8000
const HOST = '0.0.0.0'
const ALLOWED_ORIGINS = ['http://localhost:3000', 'https://covidpass.marvinsextro.de']

const app = express()
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true)
    if (ALLOWED_ORIGINS.indexOf(origin) === -1){
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.'
      return callback(new Error(msg), false)
    }
    return callback(null, true)
  }
}))
app.use(express.json())

app.post('/covid.pkpass', async (req, res) => {

  let valueSets

  try {
    valueSets = await utils.getValueSets()
  } catch {
    res.status(500).send('Failed to load external json files')
  }

  let payload

  try {
    payload = new Payload(req.body, valueSets)
  } catch (e) {
    res.status(400).send('Failed to generate pass: ' + e.message)
  }

  const template = new Template("generic", {
    passTypeIdentifier: consts.SECRETS.PASS_TYPE_ID,
    teamIdentifier: consts.SECRETS.TEAM_ID,
    sharingProhibited: true,
    voided: false,
    formatVersion: 1,
    logoText: consts.NAME,
    organizationName: consts.NAME,
    description: consts.NAME,
    labelColor: payload.labelColor,
    foregroundColor: payload.foregroundColor,
    backgroundColor: payload.backgroundColor,
  })

  const img1x = img.img1xblack
  const img2x = img.img2xblack

  await template.images.add("icon", img1x, '1x')
  await template.images.add("icon", img2x, '2x')
  await template.images.add("logo", img1x, '1x')
  await template.images.add("logo", img2x, '2x')

  template.setCertificate(
    consts.SECRETS.CERT, 
    consts.SECRETS.PASSPHRASE
  )

  const qrCode = {
    message: payload.raw,
    format: "PKBarcodeFormatQR",
    messageEncoding: "utf-8"
  }

  const pass = template.createPass({
    serialNumber: payload.uvci,
    barcodes: [qrCode],
    barcode: qrCode
  });

  pass.headerFields.add({ 
    key: "type", 
    label: "Certificate Type", 
    value: payload.certificateType 
  })

  pass.primaryFields.add({ 
    key: "name", 
    label: "Name", 
    value: payload.name 
  })

  pass.secondaryFields.add({ 
    key: "dose", 
    label: "Dose", 
    value: payload.dose 
  })
  pass.secondaryFields.add({ 
    key: "dov", 
    label: "Date of Vaccination", 
    value: payload.dateOfVaccination, 
    textAlignment: constants.textDirection.RIGHT })

  pass.auxiliaryFields.add({ 
    key: "vaccine", 
    label: "Vaccine", 
    value: payload.vaccineName 
  })
  pass.auxiliaryFields.add({ 
    key: "dob", 
    label: "Date of Birth", value: 
    payload.dateOfBirth, 
    textAlignment: constants.textDirection.RIGHT 
  })

  pass.backFields.add({ 
    key: "uvci", 
    label: "Unique Certificate Identifier (UVCI)", 
    value: payload.uvci
  })
  pass.backFields.add({ 
    key: "issuer", 
    label: "Certificate Issuer", 
    value: payload.certificateIssuer 
  })
  pass.backFields.add({ 
    key: "country", 
    label: "Country of Vaccination", 
    value: payload.countryOfVaccination
  })
  pass.backFields.add({ 
    key: "manufacturer", 
    label: "Manufacturer", 
    value: payload.manufacturer 
  })
  pass.backFields.add({ 
    key: "disclaimer", 
    label: "Disclaimer", 
    value: "This certificate is only valid in combination with the ID card of the certificate holder and expires one year + 14 days after the last dose. The validity of this certificate was not checked by CovidPass."
  })

  let buf

  try {
    buf = await pass.asBuffer();
  } catch {
    res.status(500).send('Failed to create buffer from pass')
  }

  res.type(consts.PASS_MIME_TYPE)
  res.status(200).send(buf)
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
