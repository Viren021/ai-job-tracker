const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'https://api.adzuna.com/v1/api/jobs/in/search/1';

async function fetchExternalJobs(query = 'developer') {
  try {
    const APP_ID = process.env.ADZUNA_APP_ID ? process.env.ADZUNA_APP_ID.trim() : '';
    const APP_KEY = process.env.ADZUNA_APP_KEY ? process.env.ADZUNA_APP_KEY.trim() : '';

    console.log(`🌍 Connecting to Adzuna with ID: ${APP_ID.substring(0, 4)}***`);

    const response = await axios.get(BASE_URL, {
      params: {
        app_id: APP_ID,
        app_key: APP_KEY,
        what: query,
        results_per_page: 50,
        'content-type': 'application/json'
      }
    });

    if (!response.data.results || response.data.results.length === 0) {
      console.log("⚠️ API returned 0 jobs.");
      return [];
    }

    const jobs = response.data.results.map(job => {
        let finalType = 'Full-time'; 
        
        // 1. Clean the text first
        const titleClean = job.title.replace(/<\/?[^>]+(>|$)/g, ""); 
        const descClean = job.description.replace(/<\/?[^>]+(>|$)/g, "");
        
        const textToScan = (titleClean + " " + descClean).toLowerCase();

        // 2. AGGRESSIVE DETECTION
        const isInternship = 
            /\bintern\b/.test(textToScan) ||  
            /\binterns\b/.test(textToScan) || 
            /\binternship\b/.test(textToScan) ||
            /\btrainee\b/.test(textToScan);

        if (isInternship) {
            finalType = 'Internship';
        } 
        else if (job.contract_time === 'contract') {
            finalType = 'Contract';
        }
        else if (job.contract_time === 'part_time') {
            finalType = 'Part-time';
        }

        // 3. Debug Log (Optional: See what's happening in terminal)
        if (finalType === 'Internship') {
            // console.log(`🎓 Found Internship: ${titleClean}`); 
        }

        return {
          title: titleClean,
          company: job.company.display_name,
          location: job.location.display_name,
          description: descClean,
          type: finalType,
          salary: job.salary_min ? `₹${job.salary_min}` : 'Not disclosed',
          jobUrl: job.redirect_url 
        };
    });

    console.log(`✅ Fetched ${jobs.length} valid jobs.`);
    return jobs;

  } catch (error) {
    console.error("❌ ADZUNA ERROR:", error.message);
    return [];
  }
}

module.exports = { fetchExternalJobs };