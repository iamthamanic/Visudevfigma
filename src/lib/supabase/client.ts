/**
 * Supabase Browser-Client für Auth und API-Aufrufe.
 * Nutzt Anon-Key; Session wird von Supabase Auth verwaltet.
 * Ort: src/lib/supabase/client.ts
 */

import { createClient } from "@jsr/supabase__supabase-js";
import { supabaseUrl, publicAnonKey } from "../../utils/supabase/info";

export const supabase = createClient(supabaseUrl, publicAnonKey);
