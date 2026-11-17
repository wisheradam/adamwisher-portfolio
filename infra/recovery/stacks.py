"""Separate retained vault and disposable runner templates. No AWS mutations."""
import importlib.util
from pathlib import Path
s=importlib.util.spec_from_file_location('foundation',Path(__file__).with_name('template.py'))
m=importlib.util.module_from_spec(s);s.loader.exec_module(m)

def stacks():
 t=m.template(); r=t['Resources']; sub=lambda x:{'Fn::Sub':x}; ref=lambda x:{'Ref':x}
 vault={'AWSTemplateFormatVersion':'2010-09-09','Resources':{k:r.pop(k) for k in ['Archive','ArchivePolicy']}}
 vault['Resources']['ArchivePolicy']['DeletionPolicy']='Retain'
 vault['Resources']['ArchivePolicy']['UpdateReplacePolicy']='Retain'
 vault['Resources']['RecoveryIdentity']={'Type':'AWS::SecretsManager::Secret','DeletionPolicy':'Retain','UpdateReplacePolicy':'Retain','Properties':{'Description':'Owner-populated age identity; independent of disposable runner; never output'}}
 vault['Outputs']={'Bucket':{'Value':ref('Archive')},'KeySecretArn':{'Value':ref('RecoveryIdentity')}}
 for key in ['ArchiveBucket']: t['Outputs'].pop(key,None)
 p=t['Parameters'];p.pop('NeonEndpointCidr');p['SourceCidr']={'Type':'String','AllowedPattern':r'(\d{1,3}\.){3}\d{1,3}/32'};p['TargetCidr']=dict(p['SourceCidr'])
 p.update({'ArchiveBucket':{'Type':'String'},'KeySecretArn':{'Type':'String'},'Expiry':{'Type':'String','AllowedPattern':r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}'}})
 role=r['Role']['Properties'];role.pop('ManagedPolicyArns')
 role['Policies']=[{'PolicyName':'RecoveryOnly','PolicyDocument':{'Version':'2012-10-17','Statement':[
 {'Effect':'Allow','Action':['ssmmessages:CreateControlChannel','ssmmessages:CreateDataChannel','ssmmessages:OpenControlChannel','ssmmessages:OpenDataChannel'],'Resource':'*'},
 {'Effect':'Allow','Action':['ssm:UpdateInstanceInformation'],'Resource':'*'},
 {'Effect':'Allow','Action':['s3:PutObject','s3:GetObjectVersion','s3:AbortMultipartUpload'],'Resource':sub('arn:aws:s3:::${ArchiveBucket}/recovery/*')},
 {'Effect':'Allow','Action':['secretsmanager:GetSecretValue','secretsmanager:DescribeSecret'],'Resource':[ref('DatabaseSecretArn'),ref('KeySecretArn')]},
 {'Effect':'Allow','Action':['ec2:DescribeInstances','ec2:DescribeVolumes','ec2:DescribeSecurityGroups'],'Resource':'*','Condition':{'StringEquals':{'aws:RequestedRegion':'eu-central-1'}}}
 ]}}]
 sg=r['SecurityGroup']['Properties'];sg['SecurityGroupEgress']=[{'IpProtocol':'tcp','FromPort':443,'ToPort':443,'CidrIp':'0.0.0.0/0'}]+[{'IpProtocol':'tcp','FromPort':5432,'ToPort':5432,'CidrIp':ref(k)} for k in ['SourceCidr','TargetCidr']]
 r['DatabaseSecretArn']={'Type':'AWS::SecretsManager::Secret','Properties':{'Description':'Temporary recovery connection configuration; owner-populated only after B'}}
 t['Outputs']['DatabaseSecretArn']={'Value':ref('DatabaseSecretArn')}
 r['SessionDocument']={'Type':'AWS::SSM::Document','Properties':{'DocumentType':'Session','Content':{'schemaVersion':'1.0','description':'Dedicated recovery session; sanitized outputs only','sessionType':'Standard_Stream','inputs':{'s3BucketName':'','s3KeyPrefix':'','s3EncryptionEnabled':True,'cloudWatchLogGroupName':'','cloudWatchEncryptionEnabled':True,'cloudWatchStreamingEnabled':False,'idleSessionTimeout':'15','maxSessionDuration':'60','shellProfile':{'linux':'set +x; export HISTFILE=/dev/null; ulimit -c 0'}}}}}
 r['ExpiryRole']={'Type':'AWS::IAM::Role','Properties':{'AssumeRolePolicyDocument':{'Version':'2012-10-17','Statement':[{'Effect':'Allow','Principal':{'Service':'scheduler.amazonaws.com'},'Action':'sts:AssumeRole','Condition':{'StringEquals':{'aws:SourceAccount':ref('AWS::AccountId')}}}]},'Policies':[{'PolicyName':'TerminateOnlyThisRunner','PolicyDocument':{'Version':'2012-10-17','Statement':[{'Effect':'Allow','Action':'ec2:TerminateInstances','Resource':sub('arn:aws:ec2:${AWS::Region}:${AWS::AccountId}:instance/${Runner}')}]}}]}}
 r['ExpirySchedule']={'Type':'AWS::Scheduler::Schedule','Properties':{'ScheduleExpression':sub('at(${Expiry})'),'ScheduleExpressionTimezone':'UTC','FlexibleTimeWindow':{'Mode':'OFF'},'ActionAfterCompletion':'DELETE','Target':{'Arn':'arn:aws:scheduler:::aws-sdk:ec2:terminateInstances','RoleArn':{'Fn::GetAtt':['ExpiryRole','Arn']},'Input':sub('{"InstanceIds":["${Runner}"]}'),'RetryPolicy':{'MaximumEventAgeInSeconds':3600,'MaximumRetryAttempts':20}}}}
 return {'vault':vault,'runner':t}
if __name__=='__main__':
 import argparse,json
 a=argparse.ArgumentParser();a.add_argument('stack',choices=['vault','runner']);print(json.dumps(stacks()[a.parse_args().stack],indent=2))
