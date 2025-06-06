import * as React from "react";
import { cn } from "@/utils/cn";
import { Label } from "./label";

const FormField = React.forwardRef(({ className, name, label, error, children, ...props }, ref) => {
  return (
    <div className={cn("space-y-2", className)} {...props} ref={ref}>
      <Label htmlFor={name}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
});

FormField.displayName = "FormField";

const Form = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <form
      ref={ref}
      className={cn("space-y-6", className)}
      {...props}
    />
  );
});

Form.displayName = "Form";

export { Form, FormField };
