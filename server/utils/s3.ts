import { S3Client } from "@aws-sdk/client-s3";

let s3Client: S3Client | null = null;

export const getS3Client = () => {
    if (s3Client) return s3Client;

    const config = useRuntimeConfig();

    s3Client = new S3Client({
        region: "auto",
        endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: config.r2AccessKeyId,
            secretAccessKey: config.r2SecretAccessKey,
        },
    });

    return s3Client;
};
