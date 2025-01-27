let selectedAgent = null;
const API_URL = 'https://api.micron.sh';

// Error messages
const ERROR_MESSAGES = {
    NETWORK: 'Network error. Please check your connection.',
    SERVER: 'Server error. Please try again later.',
    INVALID_TOKEN: 'Invalid token address format.',
    NO_AGENT: 'Please select an agent before sending a message.',
    EMPTY_MESSAGE: 'Please enter a message.',
    RATE_LIMIT: 'Too many requests. Please wait a moment.',
    AUTH: 'Authentication error. Please check your API key.',
};

// Helper function to handle API errors
function handleApiError(error, element) {
    console.error('API Error:', error);
    
    if (!navigator.onLine) {
        element.textContent = 'Network error. Please check your connection.';
        return;
    }
    
    if (error.response) {
        switch (error.response.status) {
            case 429:
                element.textContent = 'Too many requests. Please wait a moment.';
                break;
            case 401:
            case 403:
                element.textContent = 'Authentication error. Please check your API key.';
                break;
            case 500:
                element.textContent = 'Server error. Please try again later.';
                break;
            default:
                element.textContent = error.message || 'An unexpected error occurred';
        }
    } else {
        element.textContent = 'Failed to connect to the server';
    }
}

// Check API health status
async function checkHealth() {
    try {
        const response = await fetch(`${API_URL}/health`);
        if (!response.ok) throw new Error('Health check failed');
        const data = await response.json();
        
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        if (data.status === 'healthy') {
            statusDot.classList.add('healthy');
            statusDot.classList.remove('unhealthy');
            statusText.textContent = `API Healthy (v${data.version})`;
        } else {
            statusDot.classList.add('unhealthy');
            statusDot.classList.remove('healthy');
            statusText.textContent = 'API Unhealthy';
        }
    } catch (error) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        statusDot.classList.add('unhealthy');
        statusDot.classList.remove('healthy');
        handleApiError(error, statusText);
    }
}

// Fetch and display agents when page loads
window.addEventListener('load', async () => {
    // Check health status immediately and every 30 seconds
    checkHealth();
    setInterval(checkHealth, 30000);
    
    try {
        const response = await fetch(`${API_URL}/v1/agents`);
        if (!response.ok) throw new Error('Failed to fetch agents');
        const { data } = await response.json();
        
        const agentsList = document.getElementById('agentsList');
        if (!data || !data.length) {
            agentsList.innerHTML = '<p>No agents available</p>';
            return;
        }
        
        data.forEach(agent => {
            const agentElement = document.createElement('div');
            agentElement.className = 'agent-card';
            agentElement.innerHTML = `
                <h3>${agent.name}</h3>
                <p>${agent.description}</p>
            `;
            agentElement.onclick = () => selectAgent(agent);
            agentsList.appendChild(agentElement);
        });
    } catch (error) {
        const agentsList = document.getElementById('agentsList');
        agentsList.innerHTML = '<p class="error">Failed to load agents</p>';
        handleApiError(error, agentsList);
    }
});

function selectAgent(agent) {
    selectedAgent = agent;
    // Update UI to show selected agent
    document.querySelectorAll('.agent-card').forEach(card => {
        card.classList.remove('selected');
        if (card.querySelector('h3').textContent === agent.name) {
            card.classList.add('selected');
        }
    });
}

async function analyzeToken() {
    const address = document.getElementById('tokenAddress').value;
    const responseElement = document.getElementById('tokenResponse');
    
    if (!address) {
        responseElement.textContent = 'Please enter a token address';
        return;
    }

    // Basic Solana address validation
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
        responseElement.textContent = 'Invalid token address format';
        return;
    }

    try {
        responseElement.textContent = 'Loading...';
        const response = await fetch(`${API_URL}/v1/token/${address}`);
        if (!response.ok) throw new Error('Failed to fetch token data');
        const data = await response.json();
        responseElement.textContent = JSON.stringify(data, null, 2);
    } catch (error) {
        handleApiError(error, responseElement);
    }
}

async function sendMessage() {
    const message = document.getElementById('chatMessage').value;
    const responseElement = document.getElementById('chatResponse');

    if (!selectedAgent) {
        responseElement.textContent = 'Please select an agent first';
        return;
    }

    if (!message) {
        responseElement.textContent = 'Please enter a message';
        return;
    }

    try {
        responseElement.textContent = 'Loading...';
        const response = await fetch(`${API_URL}/v1/agents/${selectedAgent.id}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [{
                    role: 'user',
                    content: message
                }]
            })
        });
        
        if (!response.ok) throw new Error('Failed to send message');
        
        const data = await response.json();
        if (!data.data || !data.data.response) {
            throw new Error('Invalid response from server');
        }
        responseElement.textContent = data.data.response;
        document.getElementById('chatMessage').value = '';
    } catch (error) {
        handleApiError(error, responseElement);
    }
} 