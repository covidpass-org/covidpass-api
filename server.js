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
  let data = JSON.parse(JSON.parse(JSON.stringify(req.body))["payload"])
  const valueSets = await util.getValueSets()

  let raw = data.raw
  let decoded = data.decoded

  const template = new Template("generic", {
    passTypeIdentifier: consts.SECRETS.PASS_TYPE_ID,
    teamIdentifier: consts.SECRETS.TEAM_ID,
    sharingProhibited: true,
    voided: false,
    formatVersion: 1,
    logoText: "CovidPass",
    organizationName: "CovidPass",
    description: "CovidPass",
    labelColor: "rgb(0, 0, 0)",
    foregroundColor: "rgb(0, 0, 0)",
    backgroundColor: "rgb(255, 255, 255)",
  })

  await template.images.add("icon", img.img1xblack48dp, '1x')
  await template.images.add("icon", img.img2xblack48dp, '2x')
  await template.images.add("logo", img.img1xblack48dp, '1x')
  await template.images.add("logo", img.img2xblack48dp, '2x')

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
  const vaccine_prophylaxis = valueSets.vaccine_prophylaxis["valueSetValues"][v["vp"]]["display"]
  const country_of_vaccination = valueSets.country_codes["valueSetValues"][v["co"]]["display"]
  const marketing_auth_holder = valueSets.marketing_auth_holders["valueSetValues"][v["ma"]]["display"]

  pass.headerFields.add({ key: "type", label: "Certificate Type", value: "Vaccination" })

  pass.primaryFields.add({ key: "vaccine", label: "Vaccine", value: vaccine_name })

  pass.secondaryFields.add({ key: "name", label: "Name", value: nam["fn"] + ', ' + nam["gn"] })
  pass.secondaryFields.add({ key: "dob", label: "Date of Birth", value: dob, textAlignment: constants.textDirection.RIGHT })

  pass.auxiliaryFields.add({ key: "dose", label: "Dose", value: v["dn"] + '/' + v["sd"] })
  pass.auxiliaryFields.add({ key: "dov", label: "Date of Vaccination", value: v["dt"], textAlignment: constants.textDirection.RIGHT })

  pass.backFields.add({ key: "uvci", label: "Unique Certificate Identifier (UVCI)", value: v["ci"]})
  pass.backFields.add({ key: "issuer", label: "Certificate Issuer", value: v["is"] })
  pass.backFields.add({ key: "cov", label: "Country of Vaccination", value: country_of_vaccination})
  pass.backFields.add({ key: "vp", label: "Vaccine Prophylaxis", value: vaccine_prophylaxis })
  pass.backFields.add({ key: "ma", label: "Marketing Authorization Holder", value: marketing_auth_holder })

  const buf = await pass.asBuffer();

  res.type(consts.PASS_MIME_TYPE)
  res.status(200).send(buf)
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
