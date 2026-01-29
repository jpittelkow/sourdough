import { Logo } from "@/components/logo";

interface AuthPageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function AuthPageLayout({
  title,
  description,
  children,
}: AuthPageLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Logo variant="full" size="lg" />
          </div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
