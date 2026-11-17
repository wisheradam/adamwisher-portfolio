"""Generate a dedicated temporary runner stack; never applies infrastructure."""
import json

def template():
    ref=lambda k:{'Ref':k}
    sub=lambda s:{'Fn::Sub':s}
    resources={
      'Vpc':{'Type':'AWS::EC2::VPC','Properties':{'CidrBlock':'10.243.0.0/24','EnableDnsSupport':True,'EnableDnsHostnames':True}},
      'Gateway':{'Type':'AWS::EC2::InternetGateway'},
      'Attachment':{'Type':'AWS::EC2::VPCGatewayAttachment','Properties':{'VpcId':ref('Vpc'),'InternetGatewayId':ref('Gateway')}},
      'Subnet':{'Type':'AWS::EC2::Subnet','Properties':{'VpcId':ref('Vpc'),'CidrBlock':'10.243.0.0/26','MapPublicIpOnLaunch':False}},
      'Routes':{'Type':'AWS::EC2::RouteTable','Properties':{'VpcId':ref('Vpc')}},
      'Route':{'Type':'AWS::EC2::Route','DependsOn':'Attachment','Properties':{'RouteTableId':ref('Routes'),'DestinationCidrBlock':'0.0.0.0/0','GatewayId':ref('Gateway')}},
      'Association':{'Type':'AWS::EC2::SubnetRouteTableAssociation','Properties':{'RouteTableId':ref('Routes'),'SubnetId':ref('Subnet')}},
      'SecurityGroup':{'Type':'AWS::EC2::SecurityGroup','Properties':{'GroupDescription':'No inbound; outbound TLS only','VpcId':ref('Vpc'),'SecurityGroupIngress':[],'SecurityGroupEgress':[{'IpProtocol':'tcp','FromPort':443,'ToPort':443,'CidrIp':'0.0.0.0/0'},{'IpProtocol':'tcp','FromPort':5432,'ToPort':5432,'CidrIp':ref('NeonEndpointCidr')}]}},
      'Archive':{'Type':'AWS::S3::Bucket','DeletionPolicy':'Retain','UpdateReplacePolicy':'Retain','Properties':{'PublicAccessBlockConfiguration':{'BlockPublicAcls':True,'BlockPublicPolicy':True,'IgnorePublicAcls':True,'RestrictPublicBuckets':True},'OwnershipControls':{'Rules':[{'ObjectOwnership':'BucketOwnerEnforced'}]},'VersioningConfiguration':{'Status':'Enabled'},'BucketEncryption':{'ServerSideEncryptionConfiguration':[{'ServerSideEncryptionByDefault':{'SSEAlgorithm':'AES256'}}]},'LifecycleConfiguration':{'Rules':[{'Id':'AbortInterruptedUploads','Status':'Enabled','AbortIncompleteMultipartUpload':{'DaysAfterInitiation':1}}]}}},
      'ArchivePolicy':{'Type':'AWS::S3::BucketPolicy','Properties':{'Bucket':ref('Archive'),'PolicyDocument':{'Version':'2012-10-17','Statement':[{'Effect':'Deny','Principal':'*','Action':'s3:*','Resource':[{'Fn::GetAtt':['Archive','Arn']},sub('${Archive.Arn}/*')],'Condition':{'Bool':{'aws:SecureTransport':'false'}}}]}}},
      'Role':{'Type':'AWS::IAM::Role','Properties':{'AssumeRolePolicyDocument':{'Version':'2012-10-17','Statement':[{'Effect':'Allow','Principal':{'Service':'ec2.amazonaws.com'},'Action':'sts:AssumeRole'}]},'ManagedPolicyArns':['arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'],'Policies':[{'PolicyName':'DedicatedRecoveryOnly','PolicyDocument':{'Version':'2012-10-17','Statement':[{'Effect':'Allow','Action':['s3:PutObject','s3:GetObject','s3:GetObjectVersion'],'Resource':sub('${Archive.Arn}/recovery/*')},{'Effect':'Allow','Action':['s3:ListBucket'],'Resource':{'Fn::GetAtt':['Archive','Arn']},'Condition':{'StringLike':{'s3:prefix':['recovery/*']}}}]}}]}},
      'Profile':{'Type':'AWS::IAM::InstanceProfile','Properties':{'Roles':[ref('Role')]}},
      'Runner':{'Type':'AWS::EC2::Instance','DependsOn':'Route','Properties':{'ImageId':ref('ReviewedAmi'),'InstanceType':'t3.small','CreditSpecification':{'CPUCredits':'standard'},'IamInstanceProfile':ref('Profile'),'MetadataOptions':{'HttpTokens':'required','HttpEndpoint':'enabled','HttpPutResponseHopLimit':1},'BlockDeviceMappings':[{'DeviceName':'/dev/sda1','Ebs':{'Encrypted':True,'VolumeType':'gp3','VolumeSize':16,'DeleteOnTermination':True}}],'NetworkInterfaces':[{'DeviceIndex':'0','SubnetId':ref('Subnet'),'AssociatePublicIpAddress':True,'GroupSet':[ref('SecurityGroup')]}],'Tags':[{'Key':'Purpose','Value':'adamwisher-neon-recovery'},{'Key':'Expiry','Value':ref('Expiry')}]}},
    }
    return {'AWSTemplateFormatVersion':'2010-09-09','Description':'Unapplied recovery foundation; requires checkpoint B approval', 'Rules':{'AccountRegion':{'Assertions':[{'Assert':{'Fn::Equals':[ref('AWS::AccountId'),'533267008693']},'AssertDescription':'Approved account only'},{'Assert':{'Fn::Equals':[ref('AWS::Region'),'eu-central-1']},'AssertDescription':'Approved region only'}]}},'Parameters':{'ReviewedAmi':{'Type':'AWS::EC2::Image::Id','Default':'ami-04bbcae8eccec8bce'},'NeonEndpointCidr':{'Type':'String','AllowedPattern':r'(\d{1,3}\.){3}\d{1,3}/32','Description':'Reviewed direct Neon endpoint IPv4 /32; refresh requires approval'},'Expiry':{'Type':'String','Description':'Owner reviewed UTC expiry; tag is not automatic termination'}},'Resources':resources,'Outputs':{'InstanceId':{'Value':ref('Runner')},'ArchiveBucket':{'Value':ref('Archive')}}}

if __name__=='__main__':
    raise SystemExit('Legacy foundation disabled. Use stacks.py vault or stacks.py runner; owner checkpoint B required.')
