# Configuración local de propuestas

El modo predeterminado es `off`. El SDK lee configuración explícita y el llamador inyecta el puerto de propuestas. El parser de configuración no crea clientes, lee secretos ni abre conexiones.

| Variable | Valores |
| --- | --- |
| `IAMOTION_PROPOSAL_MODE` | `off`, `mock`, `host`. |
| `IAMOTION_PROPOSAL_MODEL` | ID fijado por el llamador. Obligatorio en modo activo. |
| `IAMOTION_PROPOSAL_TIMEOUT_MS` | Presupuesto de tiempo, hasta 30000 ms. |
| `IAMOTION_PROPOSAL_MAX_INPUT_CHARS` | Límite de caracteres de entrada, hasta 32768. |
| `IAMOTION_PROPOSAL_MAX_OUTPUT_CHARS` | Límite de caracteres de respuesta, hasta 32768. |
| `IAMOTION_PROPOSAL_REPAIR_ONCE` | `true` permite una segunda respuesta ante JSON o esquema inválido. Por defecto `false`. |

El smoke test usa un corpus y un proveedor sintéticos. Los resultados son propuestas para revisión. El recibo registra hashes y el resultado, sin guardar el texto completo enviado o recibido.

```sh
pnpm run build
pnpm smoke:rag lab/staging/rag-corpora > lab/staging/rag-durable.json
pnpm smoke:proposal > lab/staging/proposal.json
```
