# 🏆 Nix.js Framework Benchmark

[![Version](https://img.shields.io/badge/version-1.7.3-blue.svg)](https://www.npmjs.com/package/@deijose/nix-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Una aplicación interactiva para medir y visualizar el rendimiento de **Nix.js**, el micro-framework JavaScript ultra-ligero enfocado en reactividad nativa y simplicidad extrema.

## ❄️ ¿Qué es Nix.js?

Nix.js es un micro-framework de ultra-bajo peso (~10KB gzipped) diseñado para desarrolladores que buscan:
- **Cero dependencias**: Sin sobrecarga innecesaria.
- **Reactividad Nativa**: Basado en el sistema de *Signals*.
- **Sin Build Steps**: Compatible directamente con ES Modules en el navegador.

## 🚀 Sobre este Benchmark

Este proyecto implementa un test de rendimiento basado en el estándar de [js-framework-benchmark](https://github.com/krausest/js-framework-benchmark), permitiendo medir operaciones comunes del DOM sobre **1,000 registros**:

- **Creación**: Tiempo en renderizar 1,000 filas desde cero.
- **Reemplazo**: Tiempo en sustituir 1,000 filas existentes por nuevas.
- **Actualización**: Modificación parcial de registros (1 de cada 10).
- **Selección**: Resaltado reactivo de una fila específica.
- **Intercambio**: Swap de posiciones entre filas (ej. fila 2 y 998).
- **Eliminación**: Limpieza total o borrado individual.

### Modos de Medición
1. **JS Only**: Mide únicamente el tiempo de ejecución del código JavaScript del framework.
2. **Full Render**: Mide el tiempo total que incluye ejecución JS + Layout + Paint del navegador (usando `MutationObserver` y `requestAnimationFrame`).

## 🛠️ Instalación y Uso Local

Para ejecutar este benchmark localmente, asegúrate de tener [Bun](https://bun.sh) instalado:

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/DeijoseDevelop/nix-js-framework-benchmark.git
   cd nix-js-framework-benchmark
   ```

2. **Inicia el servidor de desarrollo:**
   ```bash
   bun dev
   ```

3. **Abre en tu navegador:**
   Visita `http://localhost:3000` (o el puerto indicado en la consola).

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Creado con ❤️ por **Deiver Vasquez (DeijoseDevelop)**.
