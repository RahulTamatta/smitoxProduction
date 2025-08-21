import dotenv from 'dotenv';

// Load env once at startup (server entry should import this early)
dotenv.config();

const env = process.env.NODE_ENV || 'development';

const base = {
  env,
  isProd: env === 'production',
  isDev: env !== 'production',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/smitox',
  jwtSecret: process.env.JWT_SECRET || 'change_me',
  cdn: {
    provider: process.env.CDN_PROVIDER || 'none',
    cloudfront: { distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID },
    cloudflare: { apiToken: process.env.CLOUDFLARE_API_TOKEN, zoneId: process.env.CLOUDFLARE_ZONE_ID }
  },
  images: {
    imagekit: {
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET
    }
  }
};

export default base;
