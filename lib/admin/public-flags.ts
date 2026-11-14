import "server-only";
import { store } from "./db";
export type PublicFlag="show_apps"|"show_history"|"enable_ask_adam"|"show_education"|"show_experimental_projects";
const defaults:Record<PublicFlag,boolean>={show_apps:true,show_history:false,enable_ask_adam:true,show_education:true,show_experimental_projects:false};
export async function publicFlag(key:PublicFlag):Promise<boolean>{
  if(process.env.PUBLIC_CONTENT_SOURCE!=="database")return defaults[key];
  // A missing row preserves the existing website. A configured database error
  // must remain observable instead of silently reverting an owner's decision.
  const rows=await store.query("SELECT enabled FROM feature_flags WHERE flag_key=$1 LIMIT 1",[key]);
  return rows.length?rows[0].enabled===true:defaults[key];
}
