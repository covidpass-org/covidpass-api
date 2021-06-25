# CovidPass API

API for generating a wallet pass from an official EU COVID-19 Vaccination Certificate QR code

## Debug locally

```sh
docker build . -t covidpass-api
docker run --env-file .env -t -i -p 8000:8000 covidpass-api
```