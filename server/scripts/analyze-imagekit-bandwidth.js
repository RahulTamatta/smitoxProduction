require('dotenv').config();
const { MongoClient } = require('mongodb');
const ImageKit = require('imagekit');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb+srv://smitoxJSbWYZGtLBJGWxjO@smitox.rlcilry.mongodb.net/?retryWrites=true&w=majority&appName=smitox',
    database: 'smitox',
    collection: 'images'
  },
  imagekit: {
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || 'public_XxQnBh4c/UCDe8GKiz9RGPfF3pU=',
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'private_w9mQMbhui+mZAeDCB/1v3dGqAf8=',
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/cvv8mhaiu'
  },
  timeframe: {
    startDate: '2025-03-01',
    endDate: '2025-03-06'
  },
  outputDir: path.join(__dirname, '../reports')
};

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: config.imagekit.publicKey,
  privateKey: config.imagekit.privateKey,
  urlEndpoint: config.imagekit.urlEndpoint
});

// Utility function to extract fileId from URL
const extractFileIdFromUrl = (url) => {
  try {
    // First check if fileId is in the query params
    const urlObj = new URL(url);
    const fileId = urlObj.searchParams.get('fileId');
    if (fileId) return fileId;

    // Otherwise try to extract from path
    const pathParts = urlObj.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    
    // ImageKit files often have format like filename_fileId
    if (lastPart.includes('_')) {
      const parts = lastPart.split('_');
      return parts[parts.length - 1].split('?')[0];
    }
    
    return lastPart.split('?')[0]; // Fallback to just using the last part
  } catch (error) {
    console.error(`Error extracting fileId from URL ${url}:`, error);
    return null;
  }
};

// Function to fetch image metadata
async function getImageMetadata(fileId) {
  try {
    const metadata = await imagekit.getFileDetails(fileId);
    return metadata;
  } catch (error) {
    console.error(`Error fetching metadata for fileId ${fileId}:`, error);
    return null;
  }
}

// Function to check image caching headers
async function getImageCachingHeaders(url) {
  try {
    const response = await axios.head(url);
    return {
      cacheControl: response.headers['cache-control'] || 'Not set',
      etag: response.headers['etag'] || 'Not set',
      lastModified: response.headers['last-modified'] || 'Not set',
      expires: response.headers['expires'] || 'Not set'
    };
  } catch (error) {
    console.error(`Error checking cache headers for ${url}:`, error);
    return {
      cacheControl: 'Error',
      etag: 'Error',
      lastModified: 'Error',
      expires: 'Error',
      error: error.message
    };
  }
}

// Function to fetch usage statistics from ImageKit API
async function getUsageStatistics(fileId) {
  try {
    const startDate = new Date(config.timeframe.startDate);
    const endDate = new Date(config.timeframe.endDate);
    
    // Format dates for ImageKit API
    const fromTimestamp = Math.floor(startDate.getTime() / 1000);
    const toTimestamp = Math.floor(endDate.getTime() / 1000);
    
    // Using axios directly for this since the SDK might not have this endpoint
    const response = await axios.get(
      `https://api.imagekit.io/v1/analytics/usage`,
      {
        params: {
          fromTimestamp,
          toTimestamp,
          fileId
        },
        auth: {
          username: config.imagekit.privateKey,
          password: ''
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching usage statistics for fileId ${fileId}:`, error);
    return null;
  }
}

// Main analysis function
async function analyzeImagekitBandwidth() {
  console.log('Starting ImageKit bandwidth analysis...');
  let client;
  
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true });
    }
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    client = await MongoClient.connect(config.mongodb.uri);
    const db = client.db(config.mongodb.database);
    const collection = db.collection(config.mongodb.collection);
    
    // Query all documents with ImageKit URLs
    const imagesQuery = {
      url: { $regex: 'ik.imagekit.io', $options: 'i' }
    };
    
    const imageDocs = await collection.find(imagesQuery).toArray();
    console.log(`Found ${imageDocs.length} images with ImageKit URLs.`);
    
    // Prepare results array
    const analysisResults = [];
    let totalBandwidth = 0;
    let totalRequests = 0;
    
    // Analyze each image
    for (let i = 0; i < imageDocs.length; i++) {
      const doc = imageDocs[i];
      const url = doc.url;
      const fileId = extractFileIdFromUrl(url);
      
      console.log(`[${i+1}/${imageDocs.length}] Analyzing ${url} (fileId: ${fileId})`);
      
      if (!fileId) {
        analysisResults.push({
          url,
          fileId: 'Not found',
          error: 'Could not extract fileId from URL'
        });
        continue;
      }
      
      // Fetch metadata and caching info in parallel
      const [metadata, cacheHeaders, usageStats] = await Promise.all([
        getImageMetadata(fileId),
        getImageCachingHeaders(url),
        getUsageStatistics(fileId)
      ]);
      
      // Calculate bandwidth efficiency metrics
      let requestCount = 0;
      let bandwidthUsage = 0;
      let bandwidthEfficiency = 'N/A';
      
      if (usageStats && usageStats.requests) {
        requestCount = usageStats.requests.total || 0;
        bandwidthUsage = usageStats.bandwidth?.total || 0;
        
        // Calculate theoretical max bandwidth without caching
        const theoreticalBandwidth = requestCount * (metadata?.size || 0);
        
        // Calculate efficiency (how much bandwidth was saved by caching)
        if (theoreticalBandwidth > 0) {
          const savedBandwidth = theoreticalBandwidth - bandwidthUsage;
          bandwidthEfficiency = `${((savedBandwidth / theoreticalBandwidth) * 100).toFixed(2)}%`;
        }
        
        totalBandwidth += bandwidthUsage;
        totalRequests += requestCount;
      }
      
      // Determine if the image has proper caching configured
      const hasCaching = cacheHeaders.cacheControl && 
                          !cacheHeaders.cacheControl.includes('no-cache') &&
                          !cacheHeaders.cacheControl.includes('no-store') &&
                          !cacheHeaders.cacheControl.includes('Error');
      
      // Determine if this is a high-traffic image
      const isHighTraffic = requestCount > 1000; // Arbitrary threshold
      
      // Determine if this is a large file
      const isLargeFile = metadata && metadata.size > 500 * 1024; // >500KB
      
      // Overall assessment
      let assessmentReason = [];
      if (isHighTraffic) assessmentReason.push('High traffic');
      if (isLargeFile) assessmentReason.push('Large file size');
      if (!hasCaching) assessmentReason.push('Ineffective caching');
      
      // Optimization recommendations
      const recommendations = [];
      if (isLargeFile) {
        recommendations.push('Optimize image size or use responsive images');
        recommendations.push('Consider using WebP or AVIF format');
      }
      if (!hasCaching) {
        recommendations.push('Implement proper cache headers (Cache-Control: public, max-age=31536000)');
      }
      if (isHighTraffic) {
        recommendations.push('Use a CDN if not already');
        recommendations.push('Implement client-side caching strategies');
      }
      
      analysisResults.push({
        url,
        fileId,
        metadata: metadata ? {
          name: metadata.name,
          size: metadata.size,
          format: metadata.fileType,
          dimensions: `${metadata.width}x${metadata.height}`,
          createdAt: metadata.createdAt
        } : 'Error fetching metadata',
        cacheHeaders,
        usage: {
          requests: requestCount,
          bandwidth: bandwidthUsage,
          bandwidthHuman: `${(bandwidthUsage / (1024 * 1024)).toFixed(2)} MB`,
          efficiency: bandwidthEfficiency,
        },
        assessment: {
          isHighTraffic,
          isLargeFile,
          hasCaching,
          reasons: assessmentReason.join(', ') || 'Normal usage pattern',
        },
        recommendations
      });
    }
    
    // Generate the report
    const report = {
      summary: {
        analyzedImages: analysisResults.length,
        totalBandwidth: totalBandwidth,
        totalBandwidthHuman: `${(totalBandwidth / (1024 * 1024 * 1024)).toFixed(2)} GB`,
        totalRequests: totalRequests,
        timeframe: `${config.timeframe.startDate} to ${config.timeframe.endDate}`,
        generatedAt: new Date().toISOString()
      },
      topBandwidthConsumers: [...analysisResults]
        .sort((a, b) => (b.usage?.bandwidth || 0) - (a.usage?.bandwidth || 0))
        .slice(0, 10),
      topRequestedImages: [...analysisResults]
        .sort((a, b) => (b.usage?.requests || 0) - (a.usage?.requests || 0))
        .slice(0, 10),
      imagesNeedingOptimization: analysisResults.filter(img => 
        img.assessment?.isLargeFile || !img.assessment?.hasCaching),
      detailedResults: analysisResults
    };
    
    // Calculate overall findings
    report.findings = {
      highTrafficCount: analysisResults.filter(r => r.assessment?.isHighTraffic).length,
      largeFileCount: analysisResults.filter(r => r.assessment?.isLargeFile).length,
      poorCachingCount: analysisResults.filter(r => !r.assessment?.hasCaching).length,
      recommendedActions: [
        `${report.findings?.largeFileCount} images need size optimization`,
        `${report.findings?.poorCachingCount} images need improved caching`,
        totalBandwidth > 1024 * 1024 * 1024 * 10 ? 'Overall bandwidth usage is very high' : 
          'Overall bandwidth usage is acceptable'
      ]
    };
    
    // Write the report to file
    const dateStr = new Date().toISOString().split('T')[0];
    const reportFilePath = path.join(config.outputDir, `imagekit-bandwidth-analysis-${dateStr}.json`);
    fs.writeFileSync(reportFilePath, JSON.stringify(report, null, 2));
    
    // Write a human-readable summary to file
    const summaryFilePath = path.join(config.outputDir, `imagekit-bandwidth-summary-${dateStr}.txt`);
    const summary = `
ImageKit Bandwidth Analysis Summary
==================================
Generated: ${new Date().toLocaleString()}
Analyzed Period: ${config.timeframe.startDate} to ${config.timeframe.endDate}

OVERALL METRICS
--------------
Total Images Analyzed: ${report.summary.analyzedImages}
Total Bandwidth Usage: ${report.summary.totalBandwidthHuman}
Total Requests: ${report.summary.totalRequests.toLocaleString()}

KEY FINDINGS
-----------
- ${report.findings.highTrafficCount} images have high traffic (>1000 requests)
- ${report.findings.largeFileCount} images are oversized (>500KB)
- ${report.findings.poorCachingCount} images have ineffective caching

TOP BANDWIDTH CONSUMERS
---------------------
${report.topBandwidthConsumers.map((img, i) => 
  `${i+1}. ${img.metadata?.name || 'Unknown'}: ${img.usage?.bandwidthHuman} (${img.usage?.requests || 0} requests)`
).join('\n')}

TOP REQUESTED IMAGES
------------------
${report.topRequestedImages.map((img, i) => 
  `${i+1}. ${img.metadata?.name || 'Unknown'}: ${img.usage?.requests || 0} requests (${img.usage?.bandwidthHuman})`
).join('\n')}

RECOMMENDATIONS
-------------
1. Optimize oversized images (${report.findings.largeFileCount} found)
2. Implement proper cache headers (${report.findings.poorCachingCount} images need this)
3. For high-traffic images, consider:
   - Using responsive images with appropriate sizes
   - Converting to modern formats (WebP/AVIF)
   - Implementing proper caching strategies
   - Using a CDN with edge caching

The detailed analysis report is available at: ${reportFilePath}
`;
    
    fs.writeFileSync(summaryFilePath, summary);
    
    console.log(`Analysis complete. Reports saved to:`);
    console.log(`- Detailed JSON: ${reportFilePath}`);
    console.log(`- Summary: ${summaryFilePath}`);
    
    return {
      status: 'success',
      reportPath: reportFilePath,
      summaryPath: summaryFilePath
    };
  } catch (error) {
    console.error('Error analyzing ImageKit bandwidth:', error);
    return {
      status: 'error',
      message: error.message,
      stack: error.stack
    };
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed.');
    }
  }
}

// Run the analysis
analyzeImagekitBandwidth().then(result => {
  if (result.status === 'success') {
    console.log('Analysis completed successfully!');
  } else {
    console.error('Analysis failed:', result.message);
  }
}).catch(error => {
  console.error('Unhandled error during analysis:', error);
});
