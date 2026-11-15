import {S3Client,PutObjectCommand,GetObjectCommand,DeleteObjectCommand} from '@aws-sdk/client-s3';
import {mkdir,writeFile,readFile,unlink} from 'node:fs/promises';
import path from 'node:path';
export class StorageError extends Error {constructor(message,status=503){super(message);this.status=status;}}
export function createMediaStorage({env=process.env,send}={}) {
 let client;
 function config(){
  const driver=env.ADMIN_MEDIA_DRIVER??'local';
  if(!['local','s3'].includes(driver))throw new StorageError('Unknown media storage driver');
  if(driver==='local'){
   if(['neon','aurora-data-api'].includes(env.ADMIN_DATABASE_DRIVER??''))throw new StorageError('Durable media storage is not configured for this environment');
   return {driver,root:path.resolve(env.ADMIN_MEDIA_PATH??path.join(process.cwd(),'.data','admin-media'))};
  }
  const bucket=env.ADMIN_MEDIA_S3_BUCKET,region=env.ADMIN_MEDIA_S3_REGION,prefix=env.ADMIN_MEDIA_S3_PREFIX??'media';
  if(!bucket||!region||!/^[-a-z0-9./]+$/.test(prefix)||prefix.split('/').some(s=>!s||s==='.'||s==='..'))throw new StorageError('S3 media configuration is incomplete');
  return {driver,bucket,region,prefix};
 }
 const invoke=async(command,c)=>{client??=send?undefined:new S3Client({region:c.region,maxAttempts:2});return send?send(command):client.send(command);};
 function key(value,c){if(!/^[a-f0-9-]{36}\.(png|jpeg|jpg|webp|pdf)$/.test(value))throw new StorageError('Invalid media object key',400);return c.prefix+'/'+value;}
 return {
  check:()=>{config();},
  async put(name,bytes,mime){const c=config();key(name,{prefix:'media'});if(c.driver==='local'){await mkdir(c.root,{recursive:true});await writeFile(path.join(c.root,name),bytes,{flag:'wx',mode:0o600});return;}
   await invoke(new PutObjectCommand({Bucket:c.bucket,Key:key(name,c),Body:bytes,ContentType:mime,ContentLength:bytes.length,CacheControl:'private, no-store',ServerSideEncryption:'AES256',IfNoneMatch:'*'}),c);
  },
  async read(name){const c=config();key(name,{prefix:'media'});if(c.driver==='local')return readFile(path.join(c.root,name));
   const response=await invoke(new GetObjectCommand({Bucket:c.bucket,Key:key(name,c)}),c);
   const body=response.Body;if(!body)throw new StorageError('Media object unavailable');
   const parts=[];let size=0;
   try{for await(const chunk of body){size+=chunk.length;if(size>4*1024*1024)throw new StorageError('Media object exceeds size limit');parts.push(Buffer.from(chunk));}return Buffer.concat(parts);}
   finally{body.destroy?.();}
  },
  async discard(name){const c=config();key(name,{prefix:'media'});if(c.driver==='local'){await unlink(path.join(c.root,name)).catch(e=>{if(e.code!=='ENOENT')throw e;});return;}
   await invoke(new DeleteObjectCommand({Bucket:c.bucket,Key:key(name,c)}),c);
  },
 };
}
