import type {LatLng,ScoredRoute,SafetyBreakdown,Amenity} from "./types";
export function haversine(a:LatLng,b:LatLng){const R=6371000,p=Math.PI/180,dLat=(b.lat-a.lat)*p,dLon=(b.lng-a.lng)*p;const x=Math.sin(dLat/2)**2+Math.cos(a.lat*p)*Math.cos(b.lat*p)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
export function nightNow(date=new Date()){const h=date.getHours();return h<6||h>=19}
export function distanceToNearest(point:LatLng,items:Amenity[]){let best=Infinity;for(const x of items)best=Math.min(best,haversine(point,x));return best}
export function scoreRoute(route:{geometry:LatLng[],distance:number,duration:number},amenities:Amenity[],night:boolean,weather:{precipitation:number;wind:number}):{score:number;breakdown:SafetyBreakdown;reasons:string[]}{
 const police=amenities.filter(a=>a.kind==="police"), medical=amenities.filter(a=>["hospital","clinic","pharmacy"].includes(a.kind)), shops=amenities.filter(a=>a.kind==="shop");
 const samples=route.geometry.filter((_,i)=>i%Math.max(1,Math.floor(route.geometry.length/30))===0);
 const emergency=samples.length?Math.max(0,100-(samples.reduce((s,p)=>s+Math.min(distanceToNearest(p,[...police,...medical]),2000),0)/samples.length)/20):50;
 const populated=samples.length?Math.max(0,100-(samples.reduce((s,p)=>s+Math.min(distanceToNearest(p,shops),3000),0)/samples.length)/30):50;
 const lighting=night?Math.max(10,Math.min(100,populated*0.65+emergency*0.35)):90;
 const isolation=Math.max(0,100-populated*.65-emergency*.35);
 const weather=Math.max(5,100-Math.min(60,weather.precipitation*15)-Math.min(25,weather.wind*1.2));
 const time=night?55:90;
 const score=Math.round(lighting*.22+populated*.18+emergency*.24+(100-isolation)*.16+weather*.12+time*.08);
 const reasons:string[]=[];
 if(night) reasons.push("Night-time visibility is weighted heavily.");
 if(emergency>65) reasons.push("Emergency/medical access is relatively close along sampled segments.");
 if(populated<45) reasons.push("Some segments appear less populated from mapped amenities.");
 if(weather<70) reasons.push("Current weather reduces the safety score.");
 return {score,breakdown:{lighting:Math.round(lighting),populated:Math.round(populated),emergency:Math.round(emergency),isolation:Math.round(isolation),weather:Math.round(weather),time},reasons};
}