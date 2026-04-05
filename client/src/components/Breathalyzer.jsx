const [breathResult, setBreathResult] = useState(null);
const [breathTesting, setBreathTesting] = useState(false);

async function startBreathalyzer() {
    setBreathTesting(true);
    setBreathResult(null);
    
    await fetch('/api/sensor/breathalyzer/start', {
        method: 'POST',
        credentials: 'include',
    });

    // poll for result
    const interval = setInterval(async () => {
        const r = await fetch('/api/sensor/breathalyzer/result', { 
            credentials: 'include' 
        });
        const data = await r.json();
        if (data.spike !== undefined) {
            clearInterval(interval);
            setBreathTesting(false);

            if (data.spike > 1.5) {
                setBreathResult({ emoji: '🤢', message: "Yikes... you ok?" });
            } else if (data.spike > 0.8) {
                setBreathResult({ emoji: '🤔', message: "Hmm, drink some water" });
            } else {
                setBreathResult({ emoji: '✅', message: "Fresh as a daisy!" });
            }
        }
    }, 2000);
}