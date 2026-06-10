---
name: figuscan-ops
description: Guía operativa y técnica para gestionar los despliegues, base de datos y diseño seguro de cromos de FiguScan.
---

# FiguScan Operations Skill

Este kit de habilidades enseña a los agentes de IA cómo gestionar, compilar y desplegar con éxito la landing page y la aplicación de **FiguScan**, garantizando la compatibilidad con el álbum oficial Panini Mundial 2026 y la seguridad legal sobre derechos de autor.

---

## 1. Reglas de Rebranding y Seguridad de Marca
* **Nombre Comercial**: El proyecto debe nombrarse siempre como **FiguScan** (no FiguMatch, ni Figus Scan).
* **Derechos de Autor (Copyright)**:
  - **PROHIBIDO** utilizar logos oficiales de la AFA, CBF, FIFA, Adidas, Nike o marcas registradas de Panini en las imágenes.
  - Los diseños de cromos deben ser **estilo animé de medio cuerpo, de frente**, con uniformes genéricos que recuerden a los países pero sin marcas comerciales ni escudos oficiales.

---

## 2. Estructura de la Base de Datos de Cromos
Los IDs de los cromos deben alinearse con la numeración oficial del álbum Panini del Mundial de Fútbol 2026 (y no usar IDs inventados):
- **Emiliano Martínez (Dibu)**: `ARG-2`
- **Nahuel Molina**: `ARG-3`
- **Cristian Romero (Cuti)**: `ARG-4`
- **Nicolás Otamendi**: `ARG-5`
- **Lionel Messi**: `ARG-17`
- Si un jugador no tiene un cromo de animé personalizado generado en `/public/stickers/`, el sistema debe usar la plantilla de fallback genérica (ej: `/stickers/generic_ARG.png`) en lugar de mostrar una imagen rota.

---

## 3. Flujo de Compilación de la Landing Page
La landing page (`landing_page_hostinger.html`) utiliza estilos compilados de Tailwind y estilos custom inyectados en línea para máxima velocidad en servidores estáticos como Hostinger.

### Instrucciones de compilación local:
1. Asegúrate de compilar los estilos globales del proyecto:
   ```bash
   npm run build
   ```
2. Ejecuta el compilador de la landing page para inyectar el CSS e inlinear los estilos:
   ```bash
   node build_landing.js
   ```
3. Esto actualizará el archivo `landing_page_hostinger.html` en el directorio raíz.

---

## 4. Despliegue Automatizado a Hostinger (GitHub Actions)
El archivo `.github/workflows/deploy-landing.yml` maneja el ciclo de vida de integración y despliegue continuo (CI/CD).

### Configuración de GitHub Secrets:
Para que el despliegue automático funcione al hacer `git push origin main`, el repositorio de GitHub debe tener definidos los siguientes secretos en **Settings > Secrets and variables > Actions**:

| Nombre del Secret | Valor Recomendado | Notas |
| :--- | :--- | :--- |
| `FTP_SERVER` | `srv722.hstgr.io` | Dirección directa del servidor de Hostinger. |
| `FTP_USERNAME` | `u543991373` | Tu usuario principal de la cuenta de Hostinger. |
| `FTP_PASSWORD` | *(Tu contraseña de Hostinger)* | Contraseña del usuario principal. |
| `FTP_PROTOCOL` | `sftp` | Evita bloqueos de firewall y sniffers. |
| `FTP_PORT` | `65002` | Puerto SSH/SFTP estándar de Hostinger. |
| `FTP_REMOTE_DIR` | `./` | Carpeta de inicio (Hostinger redirige a `public_html/` de forma nativa para este usuario). |

---

## 5. Script de Validación de Producción
Para validar que el despliegue en producción sea correcto y que ninguna imagen esté rota, se puede utilizar el siguiente script de node:

```javascript
// scratch/check_images.js
import https from 'https';

const url = 'https://figuscan.maxdevssolutions.com/';
https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const regex = /src=["']https:\/\/gen-lang-client-0069814546\.web\.app\/stickers\/([^"']+)["']/g;
    let match;
    console.log("Validando imágenes en la landing...");
    while ((match = regex.exec(data)) !== null) {
      const imgUrl = `https://gen-lang-client-0069814546.web.app/stickers/${match[1]}`;
      https.get(imgUrl, (imgRes) => {
        console.log(`- Cromo: ${match[1]} | Código HTTP: ${imgRes.statusCode}`);
      });
    }
  });
});
```
