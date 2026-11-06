"""Temporary S3 emulator. Presigned requests still come from the real Document API."""
import boto3
from moto import mock_aws
from moto.server import main

with mock_aws():
    s3 = boto3.client('s3', region_name='us-east-1')
    s3.create_bucket(Bucket='submit')
    s3.put_bucket_cors(Bucket='submit', CORSConfiguration={'CORSRules': [{
        'AllowedOrigins': ['http://localhost:5173'],
        'AllowedMethods': ['GET', 'PUT', 'DELETE', 'HEAD'],
        'AllowedHeaders': ['*'], 'ExposeHeaders': ['ETag'],
    }]})
    main(['-H', '0.0.0.0', '-p', '9000', '-c', '/certs/public.crt', '-k', '/certs/private.key'])
