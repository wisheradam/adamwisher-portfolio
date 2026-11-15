export class StorageError extends Error {status:number;constructor(message:string,status?:number)}
export function createMediaStorage(options?: {env?:NodeJS.ProcessEnv}): {check():void;put(name:string,bytes:Uint8Array,mime:string):Promise<void>;read(name:string):Promise<Uint8Array>;discard(name:string):Promise<void>};
