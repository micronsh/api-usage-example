let selectedAgent = null;
const API_URL = 'https://api.micron.sh';

// Check API health status
async function checkHealth() {
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        if (data.status === 'healthy') {
            statusDot.classList.add('healthy');
            statusText.textContent = `API Healthy (v${data.version})`;
        } else {
            statusDot.classList.add('unhealthy');
            statusText.textContent = 'API Unhealthy';
        }
    } catch (error) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        statusDot.classList.add('unhealthy');
        statusText.textContent = 'API Unavailable';
    }
}

// Fetch and display agents when page loads
window.addEventListener('load', async () => {
    // Check health status immediately and every 30 seconds
    checkHealth();
    setInterval(checkHealth, 30000);
    
    try {
        const response = await fetch(`${API_URL}/v1/agents`);
        const { data } = await response.json();
        
        const agentsList = document.getElementById('agentsList');
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
        console.error('Error fetching agents:', error);
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

    try {
        responseElement.textContent = 'Loading...';
        const response = await fetch(`${API_URL}/v1/token/${address}`);
        const data = await response.json();
        responseElement.textContent = JSON.stringify(data, null, 2);
    } catch (error) {
        responseElement.textContent = 'Error analyzing token: ' + error.message;
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
        
        const data = await response.json();
        responseElement.textContent = data.data.response;
        document.getElementById('chatMessage').value = '';
    } catch (error) {
        responseElement.textContent = 'Error sending message: ' + error.message;
    }
} 