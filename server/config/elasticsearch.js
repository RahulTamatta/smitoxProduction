/**
 * Elasticsearch Configuration
 * 
 * Production-grade Elasticsearch client setup for search-as-you-type functionality.
 * Supports autocomplete, fuzzy matching, and field boosting.
 */

import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

dotenv.config();

// Elasticsearch configuration from environment variables
const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
const ELASTICSEARCH_USERNAME = process.env.ELASTICSEARCH_USERNAME || '';
const ELASTICSEARCH_PASSWORD = process.env.ELASTICSEARCH_PASSWORD || '';
const ELASTICSEARCH_INDEX = process.env.ELASTICSEARCH_INDEX || 'products';

// Track connection state to avoid repeated failed attempts
let isElasticsearchAvailable = null; // null = unknown, true/false = checked
let lastConnectionCheck = 0;
const CONNECTION_CHECK_INTERVAL = 60000; // Re-check every 60 seconds

// Create Elasticsearch client with SHORT timeout for fast fallback
const clientConfig = {
  node: ELASTICSEARCH_URL,
  requestTimeout: 3000, // 3 seconds - fail fast
  maxRetries: 1, // Don't retry multiple times
  sniffOnStart: false, // Don't sniff for nodes on startup
  sniffOnConnectionFault: false,
};

// Add authentication if credentials are provided
if (ELASTICSEARCH_USERNAME && ELASTICSEARCH_PASSWORD) {
  clientConfig.auth = {
    username: ELASTICSEARCH_USERNAME,
    password: ELASTICSEARCH_PASSWORD,
  };
}

const client = new Client(clientConfig);

// Index mapping for products with autocomplete support
const productIndexMapping = {
  settings: {
    number_of_shards: 2,
    number_of_replicas: 1,
    analysis: {
      analyzer: {
        autocomplete_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'autocomplete_filter']
        },
        autocomplete_search_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase']
        }
      },
      filter: {
        autocomplete_filter: {
          type: 'edge_ngram',
          min_gram: 1,
          max_gram: 20
        }
      }
    }
  },
  mappings: {
    properties: {
      name: {
        type: 'text',
        analyzer: 'autocomplete_analyzer',
        search_analyzer: 'autocomplete_search_analyzer',
        fields: {
          keyword: { type: 'keyword' },
          suggest: {
            type: 'completion',
            analyzer: 'simple'
          }
        }
      },
      description: {
        type: 'text'
      },
      brand: {
        type: 'text',
        analyzer: 'autocomplete_analyzer',
        search_analyzer: 'autocomplete_search_analyzer',
        fields: { keyword: { type: 'keyword' } }
      },
      brandName: {
        type: 'text',
        analyzer: 'autocomplete_analyzer',
        search_analyzer: 'autocomplete_search_analyzer'
      },
      category: {
        type: 'text',
        analyzer: 'autocomplete_analyzer',
        search_analyzer: 'autocomplete_search_analyzer',
        fields: { keyword: { type: 'keyword' } }
      },
      categoryName: {
        type: 'text',
        analyzer: 'autocomplete_analyzer',
        search_analyzer: 'autocomplete_search_analyzer'
      },
      subcategory: {
        type: 'text',
        fields: { keyword: { type: 'keyword' } }
      },
      subcategoryName: {
        type: 'text',
        analyzer: 'autocomplete_analyzer',
        search_analyzer: 'autocomplete_search_analyzer'
      },
      tags: {
        type: 'text',
        analyzer: 'autocomplete_analyzer',
        search_analyzer: 'autocomplete_search_analyzer'
      },
      sku: {
        type: 'keyword'
      },
      slug: {
        type: 'keyword'
      },
      perPiecePrice: {
        type: 'float'
      },
      mrp: {
        type: 'float'
      },
      stock: {
        type: 'integer'
      },
      isActive: {
        type: 'keyword'
      },
      photos: {
        type: 'keyword'
      },
      popularity: {
        type: 'float'
      },
      salesCount: {
        type: 'integer'
      },
      createdAt: {
        type: 'date'
      },
      updatedAt: {
        type: 'date'
      }
    }
  }
};

/**
 * Initialize the Elasticsearch index with proper mappings
 * Creates the index if it doesn't exist
 */
export const initializeIndex = async () => {
  try {
    const indexExists = await client.indices.exists({ index: ELASTICSEARCH_INDEX });

    if (!indexExists) {
      console.log(`Creating Elasticsearch index: ${ELASTICSEARCH_INDEX}`);
      await client.indices.create({
        index: ELASTICSEARCH_INDEX,
        body: productIndexMapping
      });
      console.log(`Index ${ELASTICSEARCH_INDEX} created successfully`);
    } else {
      console.log(`Elasticsearch index ${ELASTICSEARCH_INDEX} already exists`);
    }

    return true;
  } catch (error) {
    console.error('Error initializing Elasticsearch index:', error.message);
    // Don't throw - allow app to start even if ES is unavailable
    return false;
  }
};

/**
 * Check if Elasticsearch is available (with caching)
 */
export const checkConnection = async () => {
  // Return cached result if checked recently
  const now = Date.now();
  if (isElasticsearchAvailable !== null && (now - lastConnectionCheck) < CONNECTION_CHECK_INTERVAL) {
    return isElasticsearchAvailable;
  }

  try {
    const health = await client.cluster.health({ timeout: '2s' });
    console.log(`Elasticsearch connected. Cluster status: ${health.status}`);
    isElasticsearchAvailable = true;
    lastConnectionCheck = now;
    return true;
  } catch (error) {
    console.error('Elasticsearch connection failed:', error.message);
    isElasticsearchAvailable = false;
    lastConnectionCheck = now;
    return false;
  }
};

/**
 * Quick check if ES is available (non-blocking, uses cached state)
 * Returns false if state is unknown (null) - forces MongoDB fallback
 */
export const isAvailable = () => {
  // If we haven't checked yet, return false to use MongoDB fallback
  // This prevents slow ES connection attempts on every search
  if (isElasticsearchAvailable === null) {
    return false;
  }
  return isElasticsearchAvailable === true;
};

/**
 * Get Elasticsearch connection status
 */
export const getConnectionStatus = async () => {
  try {
    const health = await client.cluster.health();
    return {
      connected: true,
      status: health.status,
      cluster_name: health.cluster_name,
      number_of_nodes: health.number_of_nodes
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
};

export { client, ELASTICSEARCH_INDEX };
export default client;
