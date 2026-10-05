# OSINT Deployment

Variables de entorno configuradas en GitHub Secrets:
- `IONOS_SFTP_PASSWORD`: Contraseña para SFTP en IONOS
- `OSINT_ACCESS_PASSWORD`: Contraseña de acceso a la web (41034103#$)

## Despliegue automático

El workflow `.github/workflows/deploy-ionos.yml` se ejecuta con cada push a `main`.

## Estructura en IONOS

```
/home/www/OSINT/
├── api/
│   ├── auth-middleware.js
│   ├── exif-ping.js
│   ├── exif.js
│   └── server.js
├── index.html
└── package.json
```

## Acceso

URL: https://osint.goart.es/OSINT/
Contraseña: 41034103#$
