const axios = require("axios");

/**
 * Fetches data via the proxy endpoint.
 * @param {string} targetUrl - The URL to be fetched via the proxy.
 * @returns {Promise<Object>} - Resolves with the fetched data or rejects with an error.
 */
async function fetchViaProxy(targetUrl) {
    try {
        // ✅ Validate input
        if (!targetUrl) {
            throw new Error("Target URL is required");
        }
        if (!/^https?:\/\//i.test(targetUrl)) {
            throw new Error("Invalid URL format");
        }

        // ✅ Construct Proxy URL
        const proxyUrl = `https://mode.imadiinnovations.com:3002/proxy?url=${encodeURIComponent(targetUrl)}`;
        console.log(proxyUrl);
        // ✅ Fetch data via proxy
        const response = await axios.get(proxyUrl);
        console.log(response);
        return response.data;

    } catch (error) {
        console.error("Error fetching via proxy:", error.message);
        throw new Error(error.message || "Failed to fetch via proxy");
    }
}

module.exports = fetchViaProxy;