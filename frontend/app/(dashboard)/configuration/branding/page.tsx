"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Image as ImageIcon } from "lucide-react";

const brandingSchema = z.object({
  logo_url: z.string().url().optional().or(z.literal("")),
  favicon_url: z.string().url().optional().or(z.literal("")),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().or(z.literal("")),
  dark_mode_default: z.boolean(),
  custom_css: z.string().optional(),
});

type BrandingForm = z.infer<typeof brandingSchema>;

export default function BrandingSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isDirty }, setValue, watch } = useForm<BrandingForm>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      logo_url: "",
      favicon_url: "",
      primary_color: "",
      dark_mode_default: false,
      custom_css: "",
    },
  });

  const logoUrl = watch("logo_url");

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (logoUrl) {
      setLogoPreview(logoUrl);
    }
  }, [logoUrl]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/branding");
      const settings = response.data.settings || {};

      Object.keys(settings).forEach((key) => {
        setValue(key as any, settings[key] || "");
      });

      if (settings.logo_url) {
        setLogoPreview(settings.logo_url);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load branding settings");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: BrandingForm) => {
    setIsSaving(true);
    try {
      await api.put("/branding", data);
      toast.success("Branding settings updated successfully");
      await fetchSettings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update branding settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await api.post("/branding/logo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setValue("logo_url", response.data.url);
      setLogoPreview(response.data.url);
      toast.success("Logo uploaded successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to upload logo");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Theme & Branding</h1>
        <p className="text-muted-foreground mt-2">
          Customize the appearance of your application
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>
              Configure logo, colors, and visual identity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  {logoPreview && (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-20 w-auto object-contain border rounded"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={isUploading}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Label
                      htmlFor="logo-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted"
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {isUploading ? "Uploading..." : "Upload Logo"}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-2">
                      Or enter a URL
                    </p>
                  </div>
                </div>
                <Input
                  {...register("logo_url")}
                  placeholder="https://example.com/logo.png"
                />
                {errors.logo_url && (
                  <p className="text-sm text-destructive">
                    {errors.logo_url.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="favicon_url">Favicon URL</Label>
                <Input
                  id="favicon_url"
                  {...register("favicon_url")}
                  placeholder="https://example.com/favicon.ico"
                />
                {errors.favicon_url && (
                  <p className="text-sm text-destructive">
                    {errors.favicon_url.message}
                  </p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary_color"
                    {...register("primary_color")}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                  {watch("primary_color") && (
                    <div
                      className="w-12 h-10 rounded border"
                      style={{
                        backgroundColor: watch("primary_color") || "#3b82f6",
                      }}
                    />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Hex color code (e.g., #3b82f6)
                </p>
                {errors.primary_color && (
                  <p className="text-sm text-destructive">
                    {errors.primary_color.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode Default</Label>
                  <p className="text-sm text-muted-foreground">
                    Set dark mode as the default theme
                  </p>
                </div>
                <Switch
                  checked={watch("dark_mode_default")}
                  onCheckedChange={(checked) =>
                    setValue("dark_mode_default", checked)
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="custom_css">Custom CSS</Label>
                <Textarea
                  id="custom_css"
                  {...register("custom_css")}
                  placeholder="/* Your custom CSS here */"
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  Add custom CSS to override default styles
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={!isDirty || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
