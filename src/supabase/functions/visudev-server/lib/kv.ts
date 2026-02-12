/**
 * KV store abstraction for visudev-server. Single responsibility: key-value persistence.
 */
import { createClient } from "@jsr/supabase__supabase-js";

const kvClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  );

export const kv = {
  set: async (key: string, value: unknown): Promise<void> => {
    const supabase = kvClient();
    const { error } = await supabase.from("kv_store_edf036ef").upsert({
      key,
      value,
    });
    if (error) throw new Error(error.message);
  },

  get: async (key: string): Promise<unknown> => {
    const supabase = kvClient();
    const { data, error } = await supabase
      .from("kv_store_edf036ef")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data?.value;
  },

  del: async (key: string): Promise<void> => {
    const supabase = kvClient();
    const { error } = await supabase
      .from("kv_store_edf036ef")
      .delete()
      .eq("key", key);
    if (error) throw new Error(error.message);
  },

  mset: async (keys: string[], values: unknown[]): Promise<void> => {
    const supabase = kvClient();
    const { error } = await supabase
      .from("kv_store_edf036ef")
      .upsert(keys.map((k, i) => ({ key: k, value: values[i] })));
    if (error) throw new Error(error.message);
  },

  mget: async (keys: string[]): Promise<unknown[]> => {
    const supabase = kvClient();
    const { data, error } = await supabase
      .from("kv_store_edf036ef")
      .select("value")
      .in("key", keys);
    if (error) throw new Error(error.message);
    return data?.map((d) => d.value) ?? [];
  },

  mdel: async (keys: string[]): Promise<void> => {
    const supabase = kvClient();
    const { error } = await supabase
      .from("kv_store_edf036ef")
      .delete()
      .in("key", keys);
    if (error) throw new Error(error.message);
  },

  getByPrefix: async (prefix: string): Promise<unknown[]> => {
    const supabase = kvClient();
    const { data, error } = await supabase
      .from("kv_store_edf036ef")
      .select("key, value")
      .like("key", prefix + "%");
    if (error) throw new Error(error.message);
    return data?.map((d) => d.value) ?? [];
  },
};
