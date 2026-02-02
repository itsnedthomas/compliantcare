/**
 * CompliantCare CRM - Data Handler (Supabase)
 * With postcode-to-coordinate mapping for UK facilities
 */

var SUPABASE_URL = 'https://qdrbwvxqtgwjgitcambn.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcmJ3dnhxdGd3amdpdGNhbWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4OTE4NDMsImV4cCI6MjA4NTQ2Nzg0M30.8oJPT8Nyr4FbS2SZp9j9VEsnk5oAumV2_kWNam-RZD4';

// UK region code to name mapping
var UK_REGION_NAMES = {
    '0': 'East of England',
    '1': 'Yorkshire & The Humber',
    '2': 'North West',
    '3': 'South East',
    '4': 'London',
    '5': 'South West',
    '6': 'West Midlands',
    '7': 'East Midlands',
    '8': 'North East',
    '9': 'Other'
};

// UK postcode area approximate coordinates
var UK_POSTCODE_COORDS = {
    'AB': [57.15, -2.09], 'AL': [51.75, -0.34], 'B': [52.48, -1.9], 'BA': [51.38, -2.36],
    'BB': [53.75, -2.48], 'BD': [53.79, -1.75], 'BH': [50.72, -1.88], 'BL': [53.58, -2.43],
    'BN': [50.82, -0.14], 'BR': [51.41, 0.07], 'BS': [51.45, -2.59], 'CA': [54.89, -2.93],
    'CB': [52.2, 0.12], 'CF': [51.48, -3.18], 'CH': [53.2, -2.9], 'CM': [51.73, 0.47],
    'CO': [51.89, 0.9], 'CR': [51.37, -0.1], 'CT': [51.28, 1.08], 'CV': [52.41, -1.51],
    'CW': [53.1, -2.44], 'DA': [51.45, 0.22], 'DD': [56.46, -2.97], 'DE': [52.92, -1.47],
    'DG': [55.07, -3.6], 'DH': [54.78, -1.57], 'DL': [54.52, -1.55], 'DN': [53.52, -1.13],
    'DT': [50.71, -2.44], 'DY': [52.51, -2.08], 'E': [51.55, -0.05], 'EC': [51.52, -0.09],
    'EH': [55.95, -3.19], 'EN': [51.65, -0.08], 'EX': [50.72, -3.53], 'FK': [56.0, -3.78],
    'FY': [53.82, -3.05], 'G': [55.86, -4.25], 'GL': [51.86, -2.24], 'GU': [51.24, -0.75],
    'HA': [51.58, -0.34], 'HD': [53.65, -1.78], 'HG': [54.0, -1.54], 'HP': [51.63, -0.75],
    'HR': [52.06, -2.72], 'HS': [57.76, -7.02], 'HU': [53.74, -0.33], 'HX': [53.73, -1.86],
    'IG': [51.56, 0.07], 'IP': [52.06, 1.16], 'IV': [57.48, -4.22], 'KA': [55.46, -4.56],
    'KT': [51.39, -0.3], 'KW': [58.44, -3.09], 'KY': [56.21, -3.15], 'L': [53.41, -2.99],
    'LA': [54.05, -2.8], 'LD': [52.25, -3.38], 'LE': [52.63, -1.13], 'LL': [53.0, -3.5],
    'LN': [53.23, -0.54], 'LS': [53.8, -1.55], 'LU': [51.88, -0.42], 'M': [53.48, -2.24],
    'ME': [51.35, 0.52], 'MK': [52.04, -0.76], 'ML': [55.78, -3.99], 'N': [51.57, -0.1],
    'NE': [54.98, -1.62], 'NG': [52.95, -1.15], 'NN': [52.24, -0.9], 'NP': [51.59, -2.99],
    'NR': [52.63, 1.3], 'NW': [51.55, -0.17], 'OL': [53.54, -2.1], 'OX': [51.75, -1.26],
    'PA': [55.84, -4.88], 'PE': [52.57, -0.24], 'PH': [56.7, -3.95], 'PL': [50.37, -4.14],
    'PO': [50.82, -1.09], 'PR': [53.76, -2.7], 'RG': [51.45, -0.98], 'RH': [51.12, -0.19],
    'RM': [51.56, 0.18], 'S': [53.38, -1.47], 'SA': [51.62, -3.94], 'SE': [51.49, -0.06],
    'SG': [51.9, -0.1], 'SK': [53.39, -2.13], 'SL': [51.51, -0.6], 'SM': [51.36, -0.18],
    'SN': [51.56, -1.78], 'SO': [50.9, -1.4], 'SP': [51.07, -1.8], 'SR': [54.91, -1.38],
    'SS': [51.54, 0.71], 'ST': [52.99, -2.18], 'SW': [51.46, -0.17], 'SY': [52.71, -2.75],
    'TA': [51.02, -3.1], 'TD': [55.65, -2.51], 'TF': [52.68, -2.49], 'TN': [51.13, 0.27],
    'TQ': [50.47, -3.53], 'TR': [50.26, -5.05], 'TS': [54.57, -1.23], 'TW': [51.45, -0.35],
    'UB': [51.53, -0.45], 'W': [51.52, -0.18], 'WA': [53.39, -2.59], 'WC': [51.52, -0.12],
    'WD': [51.66, -0.39], 'WF': [53.68, -1.5], 'WN': [53.55, -2.63], 'WR': [52.19, -2.22],
    'WS': [52.59, -1.98], 'WV': [52.59, -2.13], 'YO': [53.96, -1.08], 'ZE': [60.15, -1.15]
};

var DataHandler = {
    facilities: [],
    facilitiesMap: new Map(),
    regions: [],
    stats: {
        total: 34220,
        careHomes: 13726,
        outstanding: 2388,
        good: 24316,
        requiresImprovement: 5293,
        inadequate: 257
    },

    // IndexedDB cache configuration
    DB_NAME: 'CompliantCareCRM',
    DB_VERSION: 1,
    STORE_NAME: 'facilities_cache',
    CACHE_MAX_AGE_MS: 60 * 60 * 1000, // 1 hour cache validity
    _db: null,

    // Initialize IndexedDB
    initDB: function () {
        var self = this;
        return new Promise(function (resolve, reject) {
            if (self._db) {
                resolve(self._db);
                return;
            }
            var request = indexedDB.open(self.DB_NAME, self.DB_VERSION);
            request.onerror = function () {
                console.warn('IndexedDB open failed');
                reject(request.error);
            };
            request.onsuccess = function () {
                self._db = request.result;
                resolve(self._db);
            };
            request.onupgradeneeded = function (event) {
                var db = event.target.result;
                if (!db.objectStoreNames.contains(self.STORE_NAME)) {
                    db.createObjectStore(self.STORE_NAME, { keyPath: 'id' });
                }
            };
        });
    },

    init: async function () {
        console.log('DataHandler.init() starting...');

        // Get UI elements for progress updates
        var progressEl = document.getElementById('loading-progress');
        var countEl = document.getElementById('loading-count');
        var statusEl = document.getElementById('loading-status');
        var self = this;

        try {
            // Phase 1: Load pre-aggregated stats instantly (< 1 second)
            if (statusEl) statusEl.textContent = 'Loading dashboard...';
            if (progressEl) progressEl.style.width = '20%';

            await this.loadDashboardStats();
            await this.loadRegionalStats();

            if (progressEl) progressEl.style.width = '40%';
            if (statusEl) statusEl.textContent = 'Dashboard ready!';

            // Initialize IndexedDB
            await this.initDB();

            // Phase 2: Check cache for full facility data
            var cachedData = await this.loadFromCache();

            if (cachedData && cachedData.length > 0) {
                console.log('Found cached data:', cachedData.length, 'records');
                if (statusEl) statusEl.textContent = 'Loading facilities...';
                if (progressEl) progressEl.style.width = '70%';

                this.processRawData(cachedData);

                if (progressEl) progressEl.style.width = '100%';
                if (statusEl) statusEl.textContent = 'Ready!';
                if (countEl) countEl.textContent = cachedData.length.toLocaleString() + ' records';

                // Background refresh if stale
                var cacheAge = await this.getCacheAge();
                if (cacheAge > this.CACHE_MAX_AGE_MS) {
                    console.log('Cache stale, refreshing in background...');
                    this.refreshCacheInBackground();
                }
                return true;
            }

            // No cache - load full data in background, but show dashboard immediately
            if (progressEl) progressEl.style.width = '100%';
            if (statusEl) statusEl.textContent = 'Ready! (Loading full data...)';
            if (countEl) countEl.textContent = this.stats.total.toLocaleString() + ' facilities';

            // Start background fetch without blocking
            this.loadFullDataInBackground(countEl, statusEl);

            return true;

        } catch (error) {
            console.error('DataHandler.init() error:', error);
            throw error;
        }
    },

    // Load pre-aggregated dashboard stats (instant - single row)
    loadDashboardStats: async function () {
        try {
            var response = await fetch(
                SUPABASE_URL + '/rest/v1/dashboard_stats?select=*',
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
                    }
                }
            );
            if (response.ok) {
                var data = await response.json();
                if (data && data[0]) {
                    this.stats = {
                        total: data[0].total || 0,
                        careHomes: data[0].careHomes || 0,
                        outstanding: data[0].outstanding || 0,
                        good: data[0].good || 0,
                        requiresImprovement: data[0].requiresImprovement || 0,
                        inadequate: data[0].inadequate || 0,
                        providers: data[0].providers || 0,
                        people: data[0].people || 0
                    };
                    console.log('Loaded dashboard stats:', this.stats);
                }
            }
        } catch (e) {
            console.warn('Failed to load dashboard stats:', e);
        }
    },

    // Load pre-aggregated regional stats (instant - 10 rows)
    loadRegionalStats: async function () {
        try {
            var response = await fetch(
                SUPABASE_URL + '/rest/v1/regional_stats?select=*',
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
                    }
                }
            );
            if (response.ok) {
                var data = await response.json();
                this.regionalStats = data || [];
                console.log('Loaded regional stats:', this.regionalStats.length, 'regions');
            }
        } catch (e) {
            console.warn('Failed to load regional stats:', e);
        }
    },

    // Load full facility data in background (doesn't block UI)
    loadFullDataInBackground: function (countEl, statusEl) {
        var self = this;
        setTimeout(async function () {
            try {
                console.log('Starting background data load...');
                var allData = await self.fetchAllFacilities(null, countEl, null);
                self.saveToCache(allData);
                self.processRawData(allData);
                if (statusEl) statusEl.textContent = 'Ready!';
                if (countEl) countEl.textContent = allData.length.toLocaleString() + ' records loaded';
                console.log('Background data load complete');
            } catch (e) {
                console.warn('Background data load failed:', e);
            }
        }, 100);
    },

    loadFromCache: async function () {
        try {
            var db = await this.initDB();
            return new Promise(function (resolve) {
                var tx = db.transaction('facilities_cache', 'readonly');
                var store = tx.objectStore('facilities_cache');
                var request = store.get('data');
                request.onsuccess = function () {
                    if (request.result && request.result.facilities) {
                        resolve(request.result.facilities);
                    } else {
                        resolve(null);
                    }
                };
                request.onerror = function () {
                    console.warn('Cache read error');
                    resolve(null);
                };
            });
        } catch (e) {
            console.warn('loadFromCache error:', e);
            return null;
        }
    },

    getCacheAge: async function () {
        try {
            var db = await this.initDB();
            return new Promise(function (resolve) {
                var tx = db.transaction('facilities_cache', 'readonly');
                var store = tx.objectStore('facilities_cache');
                var request = store.get('data');
                request.onsuccess = function () {
                    if (request.result && request.result.timestamp) {
                        resolve(Date.now() - request.result.timestamp);
                    } else {
                        resolve(Infinity);
                    }
                };
                request.onerror = function () {
                    resolve(Infinity);
                };
            });
        } catch (e) {
            return Infinity;
        }
    },

    saveToCache: async function (data) {
        try {
            var db = await this.initDB();
            return new Promise(function (resolve) {
                var tx = db.transaction('facilities_cache', 'readwrite');
                var store = tx.objectStore('facilities_cache');
                store.put({
                    id: 'data',
                    facilities: data,
                    timestamp: Date.now()
                });
                tx.oncomplete = function () {
                    console.log('Saved', data.length, 'records to IndexedDB cache');
                    resolve(true);
                };
                tx.onerror = function () {
                    console.warn('Cache write error');
                    resolve(false);
                };
            });
        } catch (e) {
            console.warn('saveToCache error:', e);
        }
    },

    refreshCacheInBackground: function () {
        var self = this;
        setTimeout(async function () {
            try {
                console.log('Background refresh starting...');
                var freshData = await self.fetchAllFacilities(null, null, null);
                await self.saveToCache(freshData);
                self.processRawData(freshData);
                console.log('Background refresh complete - data updated');
            } catch (e) {
                console.warn('Background refresh failed:', e);
            }
        }, 5000); // Start background refresh after 5 seconds
    },

    fetchAllFacilities: async function (progressEl, countEl, statusEl) {
        var allData = [];
        var pageSize = 500;
        var offset = 0;
        var hasMore = true;
        var estimatedTotal = 13000;

        while (hasMore) {
            var url = SUPABASE_URL + '/rest/v1/facilities?select=*&limit=' + pageSize + '&offset=' + offset;
            console.log('Fetching page at offset:', offset);

            var pageData = null;
            var retries = 5;
            var baseDelay = 2000;

            while (retries > 0) {
                try {
                    var response = await fetch(url, {
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
                        }
                    });

                    if (!response.ok) {
                        throw new Error('API Error: ' + response.status);
                    }

                    pageData = await response.json();
                    break;
                } catch (fetchError) {
                    retries--;
                    if (retries === 0) throw fetchError;

                    var delay = baseDelay * Math.pow(2, 4 - retries);
                    if (statusEl) {
                        statusEl.textContent = 'Connection issue, retrying in ' + (delay / 1000) + 's...';
                        statusEl.style.color = '#f59e0b';
                    }
                    await new Promise(resolve => setTimeout(resolve, delay));
                    if (statusEl) {
                        statusEl.style.color = '';
                        statusEl.textContent = 'Retrying...';
                    }
                }
            }

            if (pageData.length > 0) {
                allData = allData.concat(pageData);
                offset += pageSize;

                var progress = Math.min(100, (allData.length / estimatedTotal) * 100);
                if (progressEl) progressEl.style.width = progress + '%';
                if (countEl) countEl.textContent = allData.length.toLocaleString() + ' / 13,000+ records';
                if (statusEl) {
                    statusEl.textContent = 'Loading facilities... (' + Math.round(progress) + '%)';
                    statusEl.style.color = '';
                }
            }

            if (pageData.length < pageSize) {
                hasMore = false;
            }
        }

        return allData;
    },

    processRawData: function (data) {
        console.log('Processing', data.length, 'records...');
        var regionsSet = {};
        var self = this;

        // Transform data
        this.facilities = data.map(function (f) {
            var postcode = f['Location Post Code'] || '';
            var regionCode = f['Location Region'] || '9';
            var region = UK_REGION_NAMES[regionCode] || 'Unknown';
            regionsSet[region] = true;

            // Use real geocoded coordinates if available, otherwise fall back to postcode estimation
            var lat = f.latitude;
            var lng = f.longitude;

            if (!lat || !lng) {
                // Fall back to postcode-based estimation
                var estimatedCoords = self.getPostcodeCoords(postcode);
                if (estimatedCoords) {
                    lat = estimatedCoords[0];
                    lng = estimatedCoords[1];
                }
            }

            return {
                id: f['Location ID'],
                name: f['Location Name'],
                isCareHome: f['Care Home?'] === 'Y',
                overallRating: f['Latest Rating'],
                domain: f['Domain'] || null,
                publicationDate: f['Publication Date'] || null,
                locationType: f['Location Type'] || null,
                // CQC enrichment fields
                nominatedIndividual: f['nominated_individual_name'] || null,
                registeredManager: f['registered_manager_name'] || null,
                phone: f['cqc_phone'] || null,
                website: f['cqc_website'] || null,
                beds: f['number_of_beds'] || null,
                ratings: {
                    safe: f['rating_safe'] || null,
                    effective: f['rating_effective'] || null,
                    caring: f['rating_caring'] || null,
                    responsive: f['rating_responsive'] || null,
                    wellLed: f['rating_wellled'] || null
                },
                lastInspection: f['last_inspection_date'] || null,
                registrationDate: f['registration_date'] || null,
                latestReportId: f['latest_report_id'] || null,
                latestReportDate: f['latest_report_date'] || null,
                cqcLastSynced: f['cqc_last_synced'] || null,
                address: {
                    street: f['Location Street Address'],
                    city: f['Location City'],
                    postcode: postcode,
                    region: region,
                    latitude: lat || null,
                    longitude: lng || null
                },
                provider: {
                    id: f['Provider ID'],
                    name: f['Provider Name']
                },
                url: f['URL']
            };
        });

        // Build lookup map
        this.facilities.forEach(function (f) {
            self.facilitiesMap.set(f.id, f);
        });

        // Store regions
        this.regions = Object.keys(regionsSet).sort();

        console.log('DataHandler initialized with', this.facilities.length, 'facilities');
    },

    getPostcodeCoords: function (postcode) {
        if (!postcode) return null;

        // Clean and normalize the full postcode
        var cleanPostcode = postcode.trim().toUpperCase().replace(/\s+/g, '');
        if (!cleanPostcode || cleanPostcode.length < 3) return null;

        // Extract outcode (first part before space, e.g., "NN1", "SW1A", "B1")
        var outcode = postcode.split(' ')[0].toUpperCase();
        if (!outcode || outcode.length < 2) return null;

        // Extract area code (first 1-2 letters)
        var areaMatch = outcode.match(/^([A-Z]{1,2})/);
        if (!areaMatch) return null;
        var area = areaMatch[1];

        // Get base coordinates for the area
        var baseCoords = UK_POSTCODE_COORDS[area];
        if (!baseCoords) return null;

        // Create a hash from the FULL POSTCODE for unique positioning per postcode
        var fullHash = this.hashString(cleanPostcode);

        // Determine the spread based on area size (larger areas need more spread)
        var areaSpread = this.getAreaSpread(area);

        // Use the full postcode hash to create consistent, unique offset for each postcode
        // This ensures different full postcodes get different positions
        var latOffset = ((fullHash % 10000) / 10000 - 0.5) * areaSpread.lat;
        var lngOffset = (((fullHash / 10000) % 10000) / 10000 - 0.5) * areaSpread.lng;

        // Add small random jitter for facilities sharing the exact same postcode
        // Reduced jitter since full postcode hash already provides good distribution
        var jitter = 0.003; // ~200m jitter for same-postcode facilities
        latOffset += (Math.random() - 0.5) * jitter;
        lngOffset += (Math.random() - 0.5) * jitter;

        return [baseCoords[0] + latOffset, baseCoords[1] + lngOffset];
    },

    // Simple string hash function for consistent positioning
    hashString: function (str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    },

    // Define spread for each postcode area based on geographic size
    getAreaSpread: function (area) {
        // Larger geographic areas get larger spreads (in degrees)
        // Default spread covers roughly 30km x 40km
        var spreads = {
            // Large rural areas (50-80km)
            'AB': { lat: 0.7, lng: 1.0 }, 'CA': { lat: 0.6, lng: 0.8 }, 'DG': { lat: 0.5, lng: 0.7 },
            'EX': { lat: 0.5, lng: 0.7 }, 'IV': { lat: 0.8, lng: 1.2 }, 'KW': { lat: 0.6, lng: 0.8 },
            'LD': { lat: 0.4, lng: 0.6 }, 'LL': { lat: 0.5, lng: 0.7 }, 'NR': { lat: 0.5, lng: 0.6 },
            'PE': { lat: 0.5, lng: 0.6 }, 'PH': { lat: 0.8, lng: 1.0 }, 'PL': { lat: 0.5, lng: 0.6 },
            'SA': { lat: 0.5, lng: 0.7 }, 'SY': { lat: 0.5, lng: 0.6 }, 'TD': { lat: 0.4, lng: 0.5 },
            'TR': { lat: 0.4, lng: 0.5 }, 'YO': { lat: 0.5, lng: 0.6 },
            // Medium areas (25-45km)
            'B': { lat: 0.35, lng: 0.45 }, 'BA': { lat: 0.4, lng: 0.5 }, 'BB': { lat: 0.3, lng: 0.4 },
            'BD': { lat: 0.35, lng: 0.45 }, 'BS': { lat: 0.35, lng: 0.45 }, 'CB': { lat: 0.35, lng: 0.45 },
            'CH': { lat: 0.35, lng: 0.45 }, 'CM': { lat: 0.4, lng: 0.5 }, 'CO': { lat: 0.35, lng: 0.45 },
            'CV': { lat: 0.35, lng: 0.45 }, 'DE': { lat: 0.35, lng: 0.45 }, 'DN': { lat: 0.4, lng: 0.5 },
            'GL': { lat: 0.4, lng: 0.5 }, 'GU': { lat: 0.4, lng: 0.5 }, 'HP': { lat: 0.35, lng: 0.45 },
            'HU': { lat: 0.35, lng: 0.45 }, 'IP': { lat: 0.4, lng: 0.5 }, 'L': { lat: 0.3, lng: 0.4 },
            'LA': { lat: 0.45, lng: 0.55 }, 'LE': { lat: 0.35, lng: 0.45 }, 'LN': { lat: 0.4, lng: 0.5 },
            'LS': { lat: 0.35, lng: 0.45 }, 'M': { lat: 0.3, lng: 0.4 }, 'MK': { lat: 0.35, lng: 0.45 },
            'NE': { lat: 0.4, lng: 0.5 }, 'NG': { lat: 0.4, lng: 0.5 }, 'NN': { lat: 0.35, lng: 0.45 },
            'OX': { lat: 0.4, lng: 0.5 }, 'PO': { lat: 0.4, lng: 0.5 }, 'PR': { lat: 0.3, lng: 0.4 },
            'RG': { lat: 0.4, lng: 0.5 }, 'S': { lat: 0.4, lng: 0.5 }, 'SO': { lat: 0.35, lng: 0.45 },
            'SP': { lat: 0.35, lng: 0.45 }, 'ST': { lat: 0.35, lng: 0.45 }, 'TN': { lat: 0.4, lng: 0.5 },
            'WA': { lat: 0.3, lng: 0.4 }, 'WF': { lat: 0.3, lng: 0.4 }, 'WR': { lat: 0.35, lng: 0.45 },
            // Smaller urban/suburban areas (15-25km)
            'AL': { lat: 0.2, lng: 0.25 }, 'BH': { lat: 0.25, lng: 0.3 }, 'BL': { lat: 0.2, lng: 0.25 },
            'BN': { lat: 0.3, lng: 0.35 }, 'BR': { lat: 0.18, lng: 0.22 }, 'CF': { lat: 0.25, lng: 0.3 },
            'CR': { lat: 0.15, lng: 0.2 }, 'CT': { lat: 0.25, lng: 0.3 }, 'CW': { lat: 0.25, lng: 0.3 },
            'DA': { lat: 0.2, lng: 0.25 }, 'DH': { lat: 0.25, lng: 0.3 }, 'DL': { lat: 0.3, lng: 0.4 },
            'DT': { lat: 0.3, lng: 0.4 }, 'DY': { lat: 0.2, lng: 0.25 }, 'EN': { lat: 0.2, lng: 0.25 },
            'FY': { lat: 0.2, lng: 0.25 }, 'G': { lat: 0.3, lng: 0.4 }, 'HA': { lat: 0.15, lng: 0.2 },
            'HD': { lat: 0.25, lng: 0.3 }, 'HG': { lat: 0.25, lng: 0.3 }, 'HR': { lat: 0.3, lng: 0.4 },
            'HX': { lat: 0.2, lng: 0.25 }, 'IG': { lat: 0.15, lng: 0.2 }, 'KA': { lat: 0.35, lng: 0.45 },
            'KT': { lat: 0.2, lng: 0.25 }, 'LU': { lat: 0.2, lng: 0.25 }, 'ME': { lat: 0.3, lng: 0.35 },
            'NP': { lat: 0.3, lng: 0.4 }, 'OL': { lat: 0.2, lng: 0.25 }, 'RH': { lat: 0.35, lng: 0.4 },
            'RM': { lat: 0.2, lng: 0.25 }, 'SG': { lat: 0.25, lng: 0.3 }, 'SK': { lat: 0.25, lng: 0.3 },
            'SL': { lat: 0.2, lng: 0.25 }, 'SM': { lat: 0.12, lng: 0.15 }, 'SN': { lat: 0.35, lng: 0.4 },
            'SR': { lat: 0.2, lng: 0.25 }, 'SS': { lat: 0.25, lng: 0.3 }, 'TA': { lat: 0.35, lng: 0.45 },
            'TF': { lat: 0.25, lng: 0.3 }, 'TQ': { lat: 0.3, lng: 0.35 }, 'TS': { lat: 0.3, lng: 0.35 },
            'TW': { lat: 0.15, lng: 0.2 }, 'UB': { lat: 0.15, lng: 0.2 }, 'WD': { lat: 0.18, lng: 0.22 },
            'WN': { lat: 0.2, lng: 0.25 }, 'WS': { lat: 0.2, lng: 0.25 }, 'WV': { lat: 0.2, lng: 0.25 },
            // London postcodes (compact, 8-15km)
            'E': { lat: 0.12, lng: 0.15 }, 'EC': { lat: 0.05, lng: 0.06 }, 'N': { lat: 0.15, lng: 0.18 },
            'NW': { lat: 0.12, lng: 0.15 }, 'SE': { lat: 0.15, lng: 0.18 }, 'SW': { lat: 0.12, lng: 0.15 },
            'W': { lat: 0.1, lng: 0.12 }, 'WC': { lat: 0.04, lng: 0.05 }
        };

        return spreads[area] || { lat: 0.35, lng: 0.45 }; // Default medium spread
    },

    getAllFacilities: function () {
        return this.facilities;
    },

    getFacilityById: function (id) {
        return this.facilitiesMap.get(id);
    },

    getRegions: function () {
        return this.regions;
    },

    getStats: function () {
        return this.stats;
    },

    searchFacilities: function (query) {
        if (!query || query.length < 2) return [];
        var q = query.toLowerCase();
        var results = [];

        for (var i = 0; i < this.facilities.length && results.length < 10; i++) {
            var f = this.facilities[i];
            if ((f.name && f.name.toLowerCase().indexOf(q) >= 0) ||
                (f.address && f.address.postcode && f.address.postcode.toLowerCase().indexOf(q) >= 0) ||
                (f.provider && f.provider.name && f.provider.name.toLowerCase().indexOf(q) >= 0)) {
                results.push(f);
            }
        }

        return results;
    },

    filterFacilities: function (filters) {
        var results = [];
        this.facilities.forEach(function (f) {
            var include = true;

            if (filters.region && f.address && f.address.region !== filters.region) include = false;
            if (filters.rating && f.overallRating !== filters.rating) include = false;
            if (filters.careHome && !f.isCareHome) include = false;

            if (include) results.push(f);
        });
        return results;
    }
};

window.DataHandler = DataHandler;
console.log('DataHandler loaded');
