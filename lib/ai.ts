import OpenAI from "openai"; import {env} from "./env";
export async function chat(messages:{role:"system"|"user"|"assistant";content:string}[],json=false){
 if(!env.aiKey) return null;
 const client=new OpenAI({apiKey:env.aiKey,baseURL:env.aiBaseUrl});
 const r=await client.chat.completions.create({model:env.aiModel,messages,temperature:.2,max_tokens:900,response_format:json?{type:"json_object"}:undefined});
 return r.choices[0]?.message?.content||null;
}
export async function agentIntent(message:string,context:string){
 const raw=await chat([{role:"system",content:`You are SafePath AI's route-planning agent. Return JSON only with keys action, preference, destination, reason. action must be one of chat, reroute, explain. preference can be safest, balanced, fastest or null. Never invent a location. Context: ${context}`},{role:"user",content:message}],true);
 if(!raw)return {action:"chat",preference:null,destination:null,reason:"AI key not configured"};
 try{return JSON.parse(raw)}catch{return {action:"chat",preference:null,destination:null,reason:"invalid model response"}}
}
