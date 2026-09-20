import {createClient} from "@supabase/supabase-js";import {env} from "./env";
export function db(){if(!env.supabaseUrl||!env.supabaseServiceKey)return null;return createClient(env.supabaseUrl,env.supabaseServiceKey,{auth:{persistSession:false}})}
export async function retrieve(query:string){const s=db();if(!s)return [];const {data}=await s.from("knowledge").select("title,content,source").textSearch("content",query.replace(/[^\w\s]/g," ").split(/\s+/).slice(0,10).join(" & ")).limit(6);return data||[]}
export async function remember(title:string,content:string,source="live-plan"){const s=db();if(!s)return;await s.from("knowledge").insert({title,content,source});}
