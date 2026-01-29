import { Loader2 } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";

interface SaveButtonProps extends Omit<ButtonProps, "type"> {
  isDirty: boolean;
  isSaving: boolean;
  children?: React.ReactNode;
}

export function SaveButton({ 
  isDirty, 
  isSaving, 
  children = "Save Changes",
  disabled,
  ...props 
}: SaveButtonProps) {
  return (
    <Button 
      type="submit" 
      disabled={!isDirty || isSaving || disabled} 
      {...props}
    >
      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
