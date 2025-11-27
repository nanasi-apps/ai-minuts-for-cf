import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ORPCError } from "@orpc/server";
import { authMiddleware } from "@/server/middlewares/auth";
import { os } from "@/server/orpc/os";
import { getS3Client } from "@/server/utils/s3";
import { v4 as uuidv4 } from "uuid";

export default {
    generatePresignedUrl: os.minuts.generatePresignedUrl
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const config = useRuntimeConfig();
            const s3 = getS3Client();
            const key = `${context.userId}/${uuidv4()}-${input.filename}`;

            // 署名付きURLの有効期限（秒）
            const expiresIn = 60 * 5; // 5分

            try {
                const command = new PutObjectCommand({
                    Bucket: config.r2BucketName,
                    Key: key,
                    ContentType: input.contentType,
                    ContentLength: input.fileSize,
                });

                const uploadUrl = await getSignedUrl(s3, command, { expiresIn });

                return {
                    uploadUrl,
                    key,
                };
            } catch (error) {
                console.error("Failed to generate presigned URL:", error);
                throw new ORPCError("INTERNAL_SERVER_ERROR", {
                    message: "アップロードURLの生成に失敗しました",
                });
            }
        }),

    list: os.minuts.list.use(authMiddleware).handler(async ({ context }) => {
        // TODO: 実装
        return [];
    }),
};
