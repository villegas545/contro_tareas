# 🔄 Guía de Migración - Control de Tareas

Esta guía explica cómo migrar gradualmente del `TaskContext` monolítico a la nueva arquitectura modular.

## 📋 Resumen de Cambios

### Antes (TaskContext monolítico)
```tsx
import { useTaskContext } from './context/TaskContext';

const MyComponent = () => {
  const { 
    currentUser, 
    login, 
    logout,
    tasks, 
    addTask, 
    verifyTask,
    users,
    rewards,
    t,
    globalSettings,
    // ... 50+ propiedades más
  } = useTaskContext();
};
```

### Después (Contextos separados)
```tsx
import { useAuth, useTasks, useFamily, useRewards, useSettings } from './src/context';

const MyComponent = () => {
  // Solo lo que necesitas
  const { currentUser, login, logout } = useAuth();
  const { tasks, addTask, verifyTask } = useTasks();
  const { users } = useFamily();
  const { rewards } = useRewards();
  const { t, globalSettings } = useSettings();
};
```

---

## 🚀 Pasos de Migración

### Paso 1: Usar AppProviders (Opcional)

Para usar la nueva arquitectura completamente, envuelve tu app con `AppProviders`:

```tsx
// App.tsx (NUEVO)
import { AppProviders } from './src/context';

export default function App() {
  return (
    <AppProviders>
      <View className="flex-1">
        <NavigationContainer>
          <MainNavigator />
        </NavigationContainer>
      </View>
    </AppProviders>
  );
}
```

### Paso 2: Migración Gradual de Componentes

Puedes migrar componentes uno por uno. Ambos enfoques funcionan simultáneamente:

#### Componente Original (sigue funcionando)
```tsx
import { useTaskContext } from '../context/TaskContext';

const MonitoringTab = () => {
  const { tasks, users, verifyTask, t } = useTaskContext();
  // ...
};
```

#### Componente Migrado (nuevo enfoque)
```tsx
import { useTasks, useFamily, useSettings } from '../src/context';

const MonitoringTab = () => {
  const { tasks, verifyTask } = useTasks();
  const { users } = useFamily();
  const { t } = useSettings();
  // ...
};
```

---

## 🪝 Uso de Hooks Nuevos

### useDateUtils - Utilidades de Fecha
```tsx
import { useDateUtils } from '../src/hooks';

const MyComponent = () => {
  const { to12h, getLocalDateString, isToday } = useDateUtils();

  // Convertir 24h a 12h
  const time = to12h('14:30'); // "2:30 PM"

  // Obtener fecha local
  const today = getLocalDateString(); // "2024-01-23"

  // Verificar si es hoy
  const isTodayCheck = isToday('2024-01-23'); // true/false
};
```

### useFilters - Filtrado Genérico
```tsx
import { useFilters } from '../src/hooks';

const MyComponent = ({ tasks }) => {
  const { 
    filters, 
    setFilter, 
    filteredItems, 
    clearFilters,
    hasActiveFilters 
  } = useFilters({ items: tasks });

  return (
    <>
      <TextInput
        value={filters.searchText}
        onChangeText={(text) => setFilter('searchText', text)}
      />
      <FlatList data={filteredItems} ... />
      {hasActiveFilters && (
        <Button title="Limpiar" onPress={clearFilters} />
      )}
    </>
  );
};
```

### useSelection - Selección Múltiple
```tsx
import { useSelection } from '../src/hooks';

const MyComponent = ({ tasks }) => {
  const { 
    selectedIds, 
    toggleSelection, 
    clearSelection,
    selectedCount,
    hasSelection 
  } = useSelection({
    items: tasks,
    canSelect: (task) => task.status === 'completed',
  });

  return (
    <>
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          selected={selectedIds.has(task.id)}
          onPress={() => toggleSelection(task)}
        />
      ))}
      {hasSelection && (
        <Button 
          title={`Verificar (${selectedCount})`}
          onPress={handleBatchVerify}
        />
      )}
    </>
  );
};
```

### useTaskSort - Ordenamiento
```tsx
import { useTaskSort } from '../src/hooks';

const MyComponent = ({ tasks, categories }) => {
  const { sortByDefault, sortByStatus } = useTaskSort({ categories });

  const sortedTasks = sortByDefault(tasks);
  // o
  const statusSorted = sortByStatus(tasks);
};
```

---

## 📦 Uso de Constantes

### En lugar de strings hardcodeados:
```tsx
// ❌ Antes
if (task.status === 'pending') { ... }
if (task.shift === 'morning') { ... }

// ✅ Después
import { TASK_STATUS, SHIFTS } from '../src/constants';

if (task.status === TASK_STATUS.PENDING) { ... }
if (task.shift === SHIFTS.MORNING) { ... }
```

### Para colores:
```tsx
// ❌ Antes
const color = '#4338ca';

// ✅ Después
import { BRAND_COLORS } from '../src/constants';
const color = BRAND_COLORS.primary;
```

### Para configuración de UI:
```tsx
import { STATUS_CONFIG, SHIFT_CONFIG } from '../src/constants';

// Obtener configuración para un status
const config = STATUS_CONFIG[task.status];
// config = { label: 'status.pending', emoji: '⏳', color: '#f59e0b', bgColor: '#fef3c7' }
```

---

## 🔥 Uso de Servicios Firebase

Para operaciones directas con Firebase (fuera de contextos):

```tsx
import { tasksService, usersService } from '../src/services/firebase';

// Agregar tarea
await tasksService.addTask(newTask);

// Actualizar usuario
await usersService.updateUser(userId, { name: 'Nuevo Nombre' });
```

---

## 📝 Checklist de Migración por Archivo

### Screens
- [ ] LoginScreen.tsx
- [ ] ParentDashboard.tsx
- [ ] ChildDashboard.tsx
- [ ] CreateTaskScreen.tsx
- [ ] StatisticsScreen.tsx
- [ ] AddFamilyMemberScreen.tsx
- [ ] ManageCategoriesScreen.tsx
- [ ] ManageJustificationsScreen.tsx
- [ ] SchoolCalendarScreen.tsx
- [ ] HistoryScreen.tsx
- [ ] AddMessageScreen.tsx

### Dashboard Tabs
- [ ] MonitoringTab.tsx
- [ ] AssignmentTab.tsx
- [ ] FamilyTab.tsx
- [ ] MessagesTab.tsx
- [ ] RewardsTab.tsx
- [ ] SettingsTab.tsx
- [ ] CategoriesTab.tsx

### Components
- [ ] ChildTaskCard.tsx
- [ ] ParentTaskCard.tsx
- [ ] ScheduleModal.tsx
- [ ] TaskTags.tsx

---

## ⚠️ Notas Importantes

1. **Ambos enfoques funcionan**: No es necesario migrar todo de una vez
2. **El contexto original sigue funcionando**: Para compatibilidad
3. **Migra cuando modifiques**: Migra un componente cuando necesites editarlo
4. **Los tipos son compatibles**: Los tipos en `/types/` y `/src/types/` son iguales
