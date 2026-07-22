import { supabase } from "@/integrations/supabase/client";

type KitEmailTemplate = "brand_kit_created" | "brand_kit_downloaded";

/** Fire-and-forget branded email for Brand Kit events. Never throws. */
export async function sendBrandKitEmail(
  template: KitEmailTemplate,
  data: { brand_name?: string; brand_url?: string; file_count?: number } = {},
): Promise<void> {
  try {
    await supabase.functions.invoke("send-email", { body: { template, data } });
  } catch (e) {
    console.warn("[kitEmails] send failed", template, e);
  }
}