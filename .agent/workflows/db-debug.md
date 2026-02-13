---
description: Debug de base de datos Firebase - consultar y limpiar datos
---

# Workflow: Debug de Base de Datos

Este workflow permite inspeccionar y limpiar datos en Firestore.

## Comandos Disponibles

// turbo-all

### 1. Listar usuarios
```bash
node scripts/db_debug.js users
```

### 2. Ver resumen de tareas
```bash
node scripts/db_debug.js tasks
```

### 3. Ver tareas de una fecha específica
```bash
node scripts/db_debug.js tasks --date YYYY-MM-DD
```

### 4. Ver tareas de un usuario específico
```bash
node scripts/db_debug.js tasks --user <userId>
```

### 5. Encontrar tareas huérfanas/problemáticas
```bash
node scripts/db_debug.js fix-orphans
```

### 6. Eliminar tareas huérfanas (USAR CON CUIDADO)
```bash
node scripts/db_debug.js fix-orphans --fix
```

### 7. Ver schedules (recurrencias)
```bash
node scripts/db_debug.js schedules
```

### 8. Ver historial
```bash
node scripts/db_debug.js history
```

## Notas
- Todos los comandos se ejecutan desde la raíz del proyecto
- Requiere `serviceAccountKey.json` en la raíz
- El script está en `scripts/db_debug.js`
