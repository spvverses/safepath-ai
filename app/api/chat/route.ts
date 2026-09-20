import {NextResponse} from "next/server";import {agentIntent,chat} from "@/lib/ai";import {plan} from "@/lib/providers";import {retrieve,remember} from "@/lib/rag";import type {PlanResult} from "@/lib/types";
export const maxDuration=30;
export async function POST(req:Request){try{const {message,context,origin,destination}=await req.json();const rag=await retrieve(message);const intent=await agentIntent(message,JSON.stringify(context||{}));let newPlan:PlanResult|null=null;
 if(intent.action==="reroute"&&origin&&destination)newPlan=await plan(origin,destination,intent.preference||undefined);
 const system=`You are SafePath AI, a safety-first navigation copilot. Use the supplied live route context and retrieved knowledge. Be transparent: mapped data cannot guarantee safety. If asked to change route, describe what the agent actually changed. Keep answers concise.\nLIVE CONTEXT:\n${JSON.stringify({context,intent,newPlan,rag})}`;
 const answer=await chat([{role:"system",content:system},{role:"user",content:message}])||(
   intent.action==="reroute"&&newPlan?`I re-ran the route planner. The current safest scored option is ${newPlan.routes[0]?.score}/100.`:
   "AI is not configured yet. Add HF_TOKEN in Vercel Environment Variables to enable the open-model copilot."
 );
 if(newPlan)await remember("Route agent decision",`User: ${message}\nAgent: ${JSON.stringify(intent)}\nScore: ${newPlan.routes[0]?.score}`,"live-agent");
 return NextResponse.json({answer,intent,plan:newPlan});
}catch(e){return NextResponse.json({error:String(e)},{status:500})}}