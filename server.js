'use strict';

require('dotenv').config({path: '/run/secrets/env'})

const img = require('./img')
const util = require('./utils')
const consts = require('./constants')

const { Template, constants } = require("@walletpass/pass-js")

const express = require('express')
var bodyParser = require('body-parser')

const PORT = 8000
const HOST = '0.0.0.0'

const app = express()
app.use(bodyParser.urlencoded({ extended: false }))

app.post('/covid.pkpass', async (req, res) => {
  let data = JSON.parse(JSON.stringify(req.body))

  let payload = JSON.parse(data["payload"])
  let color = data["color"]

  let dark = (color !== 'white')
  
  let backgroundColor = consts.COLORS.white
  let labelColor = consts.COLORS.grey
  let foregroundColor = consts.COLORS.black
  let img1x = img.img1xblack
  let img2x = img.img2xblack

  if (dark) {
    backgroundColor = consts.COLORS[color]
    labelColor = consts.COLORS.white
    foregroundColor = consts.COLORS.white
    img1x = img.img2xwhite
    img2x = img.img2xwhite
  }

  const valueSets = await util.getValueSets()

  let raw = payload.raw
  let decoded = payload.decoded

  const template = new Template("generic", {
    passTypeIdentifier: consts.SECRETS.PASS_TYPE_ID,
    teamIdentifier: consts.SECRETS.TEAM_ID,
    sharingProhibited: true,
    voided: false,
    formatVersion: 1,
    logoText: consts.NAME,
    organizationName: consts.NAME,
    description: consts.NAME,
    labelColor: labelColor,
    foregroundColor: foregroundColor,
    backgroundColor: backgroundColor,
  })

  await template.images.add("icon", img1x, '1x')
  await template.images.add("icon", img2x, '2x')
  await template.images.add("logo", img1x, '1x')
  await template.images.add("logo", img2x, '2x')

  template.setCertificate(
    consts.SECRETS.CERT, 
    consts.SECRETS.PASSPHRASE
  )

  const qrCode = {
    "message": raw,
    "format": "PKBarcodeFormatQR",
    "messageEncoding": "utf-8"
  }

  const v = decoded["-260"]["1"]["v"][0]
  const nam = decoded["-260"]["1"]["nam"]
  const dob = decoded["-260"]["1"]["dob"]

  const pass = template.createPass({
    serialNumber: v["ci"],
    barcodes: [qrCode],
    barcode: qrCode
  });

  const vaccine_name = valueSets.vaccine_medical_products["valueSetValues"][v["mp"]]["display"]
  const country_of_vaccination = valueSets.country_codes["valueSetValues"][v["co"]]["display"]
  const manufacturer = valueSets.marketing_auth_holders["valueSetValues"][v["ma"]]["display"]

  pass.headerFields.add({ key: "type", label: "Certificate Type", value: "Vaccination" })

  pass.primaryFields.add({ key: "name", label: "Name", value: nam["fn"] + ', ' + nam["gn"] })

  pass.secondaryFields.add({ key: "dose", label: "Dose", value: v["dn"] + '/' + v["sd"] })
  pass.secondaryFields.add({ key: "dov", label: "Date of Vaccination", value: v["dt"], textAlignment: constants.textDirection.RIGHT })

  pass.auxiliaryFields.add({ key: "vaccine", label: "Vaccine", value: vaccine_name })
  pass.auxiliaryFields.add({ key: "dob", label: "Date of Birth", value: dob, textAlignment: constants.textDirection.RIGHT })

  pass.backFields.add({ key: "uvci", label: "Unique Certificate Identifier (UVCI)", value: v["ci"]})
  pass.backFields.add({ key: "issuer", label: "Certificate Issuer", value: v["is"] })
  pass.backFields.add({ key: "cov", label: "Country of Vaccination", value: country_of_vaccination})
  pass.backFields.add({ key: "ma", label: "Manufacturer", value: manufacturer })
  pass.backFields.add({ key: "disclaimer", label: "Disclaimer", value: "This certificate is only valid in combination with the ID card of the certificate holder and expires one year + 14 days after the last dose." })

  const buf = await pass.asBuffer();

  res.type(consts.PASS_MIME_TYPE)
  res.status(200).send(buf)
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
