"""Version-pinned bridge around the unchanged official asm-exec runtime resolver.
No secret values are retrieved by engineering tools; this runs on approved EC2 only.
"""
import shlex

def resolve(official,reference,arn,version,label,region):
 expected='{{resolve:secretsmanager:'+arn+':SecretString::'+label+'}}'
 if reference!=expected:raise ValueError('Unapproved dynamic reference')
 original_post=official._mcp_post;original_sma=official._sma_available
 expected_command=['aws','secretsmanager','get-secret-value','--secret-id',arn,'--version-stage',label,'--output','json','--region',region]
 def pinned_post(payload,session_id=None):
  if payload.get('method')=='tools/call':
   params=payload['params']
   if params.get('name')!='aws___call_aws' or set(params.get('arguments',{}))!={'cli_command'}:raise ValueError('Unapproved resolver operation')
   command=shlex.split(params['arguments']['cli_command'])
   if command!=expected_command:raise ValueError('Unapproved resolver request')
   # Secrets Manager atomically requires this VersionId AND this VersionStage to match.
   payload={**payload,'params':{**params,'arguments':{'cli_command':shlex.join(command+['--version-id',version])}}}
  return original_post(payload,session_id)
 try:
  # The bundled SMA path cannot pin VersionId. Never silently fall back to label-only retrieval.
  official._sma_available=False;official._mcp_post=pinned_post
  return official.resolve_string(reference)
 finally:
  official._mcp_post=original_post;official._sma_available=original_sma
