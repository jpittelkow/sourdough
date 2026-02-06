# Frontend Anti-Patterns

### Don't: Duplicate Logic Across Pages

```tsx
// BAD - Logo rendering duplicated in multiple pages
// login/page.tsx
export default function LoginPage() {
  const [logoError, setLogoError] = useState(false);
  const logoUrl = useAppConfig().logoUrl;
  
  return logoUrl && !logoError ? (
    <Image src={logoUrl} onError={() => setLogoError(true)} />
  ) : (
    <span className="font-bold text-xl">AppName</span>
  );
}

// register/page.tsx - SAME CODE DUPLICATED!
export default function RegisterPage() {
  const [logoError, setLogoError] = useState(false);
  // ... same logic repeated
}

// GOOD - Use shared component
// login/page.tsx
import { Logo } from '@/components/logo';

export default function LoginPage() {
  return <Logo variant="full" size="lg" />;
}

// register/page.tsx
import { Logo } from '@/components/logo';

export default function RegisterPage() {
  return <Logo variant="full" size="lg" />;
}
```

**Before writing any logic, ask:**
1. Does this functionality exist elsewhere in the codebase?
2. Could another page need this same functionality?
3. Should this be a shared component in `frontend/components/`?

### Don't: Duplicate Groups Fetch

```tsx
// BAD - fetching groups inline in multiple components
// user-group-picker.tsx
const [groups, setGroups] = useState([]);
useEffect(() => {
  api.get("/groups").then(res => setGroups(res.data?.data ?? []));
}, []);

// users/page.tsx - SAME FETCH DUPLICATED
const [groups, setGroups] = useState([]);
useEffect(() => {
  api.get("/groups").then(res => setGroups(res.data?.data ?? []));
}, []);
```

```tsx
// GOOD - use shared useGroups() hook
import { useGroups } from "@/lib/use-groups";

const { groups, isLoading, error } = useGroups();
```

Use **`useGroups()`** from `frontend/lib/use-groups.ts` for any component that needs the group list (filter dropdown, picker, etc.). See [Recipe: Assign user to groups](../recipes/assign-user-to-groups.md).

### Don't: Create Page-Specific Utilities

```tsx
// BAD - Utility function defined inside a page
// settings/page.tsx
function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

export default function SettingsPage() {
  return <span>{formatDate(user.created_at)}</span>;
}

// GOOD - Put utilities in shared location
// lib/utils.ts
export function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

// settings/page.tsx
import { formatDate } from '@/lib/utils';

export default function SettingsPage() {
  return <span>{formatDate(user.created_at)}</span>;
}
```

### Don't: Fetch Without Error Handling

```tsx
// BAD - no error handling
useEffect(() => {
  const fetchData = async () => {
    const response = await api.get('/examples');
    setExamples(response.data);
  };
  fetchData();
}, []);

// GOOD - proper error handling and loading state
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/examples');
      setExamples(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to load examples');
      toast.error('Failed to load examples');
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

### Don't: Forget Loading States

```tsx
// BAD - no loading indicator (confusing UX)
return <div>{examples.map(e => <Card key={e.id}>{e.name}</Card>)}</div>;

// GOOD - show loading state using shared component
import { SettingsPageSkeleton } from "@/components/ui/settings-page-skeleton";

if (loading) {
  return <SettingsPageSkeleton />;
}

return <div>{examples.map(e => <Card key={e.id}>{e.name}</Card>)}</div>;
```

### Don't: Duplicate Loading Spinners

```tsx
// BAD - inline loading spinner (duplicated across pages)
if (isLoading) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

// GOOD - use the shared component
import { SettingsPageSkeleton } from "@/components/ui/settings-page-skeleton";

if (isLoading) {
  return <SettingsPageSkeleton />;
}
```

### Don't: Duplicate Save Button Logic

```tsx
// BAD - save button logic repeated in every form
<Button type="submit" disabled={!isDirty || isSaving}>
  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Save Changes
</Button>

// GOOD - use the shared component
import { SaveButton } from "@/components/ui/save-button";

<SaveButton isDirty={isDirty} isSaving={isSaving} />
```

### Don't: Hardcode API URLs

```tsx
// BAD - hardcoded URL (breaks in different environments)
const response = await fetch('http://localhost:8080/api/examples');
const response = await fetch('https://myapp.com/api/examples');

// GOOD - use relative path (Nginx proxies to backend)
const response = await api.get('/examples');
// or
const response = await fetch('/api/examples', {
  credentials: 'include',
});
```

### Don't: Forget `credentials: 'include'` for Auth

```tsx
// BAD - auth cookies not sent (401 errors)
const response = await fetch('/api/examples');

// GOOD - include cookies for Sanctum session auth
const response = await fetch('/api/examples', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// BEST - use the api utility which handles this
import { api } from '@/lib/api';
const response = await api.get('/examples');
```

### Don't: Add shadcn/ui Components via npm

```bash
# BAD - shadcn components are not npm packages
npm install @shadcn/button

# GOOD - use the shadcn CLI (run from frontend/)
cd frontend
npx shadcn@latest add button

# Replace existing component
npx shadcn@latest add dialog --overwrite

# Config is in frontend/components.json; components live in frontend/components/ui/
```

### Don't: Create Components Without TypeScript Interfaces

```tsx
// BAD - no type safety
function ExampleCard({ title, description, onClick }) {
  return <Card>...</Card>;
}

// GOOD - typed props
interface ExampleCardProps {
  title: string;
  description?: string;
  onClick?: () => void;
}

function ExampleCard({ title, description, onClick }: ExampleCardProps) {
  return <Card>...</Card>;
}
```

### Don't: Misuse Help System Conventions

```tsx
// BAD - Real URL for help articles in search-pages.php (help opens via modal, not navigation)
'url' => '/help/welcome',

// GOOD - Use help: prefix so the search modal opens the help center
'url' => 'help:welcome',
```

```tsx
// BAD - Adding a help article but forgetting the search entry (users can't find it via Cmd+K)
// Only added to help-content.ts

// GOOD - Add both: help-content.ts AND search-pages.php
```

```tsx
// BAD - Duplicating help content between tooltip and article (maintenance burden)
// Tooltip: "Configures SMTP settings. See Email Configuration article for full guide."
// Article: Same paragraph repeated

// GOOD - Tooltips = 1–2 sentences max. Articles = full explanation with steps.
// Tooltip: "SMTP host for your mail server"
// Article: Full guide with setup steps, troubleshooting, etc.
```

See [Recipe: Add help article](../recipes/add-help-article.md) and [Help System Pattern](../patterns/ui-patterns.md#help-system).
