export async function getJson<T>(url:string, init?:RequestInit):Promise<T>{
 const r=await fetch(url,{...init,headers:{"User-Agent":"SafePath-AI/1.0 (safety navigation demo)",...(init?.headers||{})},next:{revalidate:0}});
 if(!r.ok) throw new Error(`${r.status} ${r.statusText}`);
 return r.json();
}