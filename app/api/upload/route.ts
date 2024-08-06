import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { S3Client } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  const { filename, contentType } = await request.json()
  try {
    const client = new S3Client({ region: process.env.AWS_REGION })
    const key = uuidv4() + '-' + filename // Include original filename
    const { url, fields } = await createPresignedPost(client, {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Conditions: [
        ['content-length-range', 0, 10485760], // up to 10 MB
        ['starts-with', '$Content-Type', contentType],
      ],
      Fields: {
        acl: 'public-read',
        'Content-Type': contentType,
      },
      Expires: 600, // Seconds before the presigned post expires. 3600 by default.
    })
    
    // Construct the final URL of the uploaded file
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    
    return Response.json({ url, fields, fileUrl })
  } catch (error) {
    return Response.json({ error: error.message })
  }
}
