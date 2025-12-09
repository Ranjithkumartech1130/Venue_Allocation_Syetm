const axios = require('axios');

const checkServices = async () => {
    console.log('--- Final Connectivity Check ---');
    try {
        const res = await axios.get('http://localhost:5000/api/test-email');
        console.log('Backend (Test Email): SUCCESS', res.data);
    } catch (error) {
        console.error('Backend (Test Email): FAILED', error.message);
        if (error.response) console.error(error.response.data);
    }
};

checkServices();
