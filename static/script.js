// 🎙️ Voice Recording
let mediaRecorder;
let audioChunks = [];
let voiceRecordings = []; // store objects: { url: "...", data: { confidence: "...", ... } }

const startVoiceBtn = document.getElementById("startVoiceBtn");
const stopVoiceBtn = document.getElementById("stopVoiceBtn");
const voiceHistory = document.getElementById("voiceHistory");
// FIX: Corrected IDs to match voice.html (vConfidence, vClarity, vEmotion, vTranscript)
const voiceFeedbackConfidence = document.getElementById("vConfidence");
const voiceFeedbackClarity = document.getElementById("vClarity");
const voiceFeedbackEmotion = document.getElementById("vEmotion");
const voiceFeedbackProficiency = document.getElementById("vProficiency");
const voiceFeedbackFluency = document.getElementById("vFluency");
const voiceFeedbackTranscript = document.getElementById("vTranscript");

const voiceSuggestionList = document.getElementById("voiceSuggestionList"); // NEW ELEMENT

// --- SUGGESTION RENDERING FUNCTION ---
function renderSuggestions(suggestions, listElementId) {
    const list = document.getElementById(listElementId);
    if (!list) return;

    list.innerHTML = ""; // Clear existing list

    if (suggestions && suggestions.length > 0) {
        suggestions.forEach(tip => {
            const li = document.createElement("li");
            // Use innerHTML to allow for bolding (e.g., using **Confidence:**)
            li.innerHTML = tip; 
            list.appendChild(li);
        });
    } else {
        const li = document.createElement("li");
        li.textContent = "No specific issues detected. Well done!";
        list.appendChild(li);
    }
}

// --- UTILITY FUNCTIONS FOR OVERALL SCORE ---

/**
 * Updates the circular progress bar visual based on the calculated score.
 */
function updateOverallScore(score, scoreCircleId, scoreTextId) {
    const circle = document.getElementById(scoreCircleId);
    const text = document.getElementById(scoreTextId);
    
    if (!circle || !text) return;

    if (score === '--' || score === 0) {
        text.textContent = '--';
        // Reset to background color
        circle.style.background = `conic-gradient(#1e1e2f 0%, #1e1e2f 100%)`; 
        return;
    }

    const percentage = Math.round(score);
    // Determine color based on score band
    const color = percentage >= 80 ? '#4CAF50' : (percentage >= 50 ? '#FFC107' : '#d9534f');
    
    // Update text and circular gradient
    text.textContent = `${percentage}%`;
    circle.style.background = `conic-gradient(${color} ${percentage}%, #1e1e2f ${percentage}%)`;
}


/**
 * Calculates a weighted overall score for voice performance.
 */
function calculateVoiceScore(data) {
    if (!data.confidence || !data.clarity || !data.emotion || !data.proficiency_level || !data.fluency_score) return 0;

    // Adjusted Weighting (100% total): Conf (25%), Clarity (25%), Emotion (15%), Proficiency (15%), Fluency (20%)
    const CONFIDENCE_WEIGHT = 0.25;
    const CLARITY_WEIGHT = 0.25;
    const EMOTION_WEIGHT = 0.15;
    const PROFICIENCY_WEIGHT = 0.15;
    const FLUENCY_WEIGHT = 0.20; // NEW WEIGHT

    let confScore = data.confidence === 'High' ? 100 : 50;
    let clarityScore = data.clarity === 'Good' ? 100 : 70;
    
    let emotionScore = 0;
    if (data.emotion.includes('Positive')) emotionScore = 100;
    else if (data.emotion.includes('Neutral')) emotionScore = 80;
    else if (data.emotion.includes('Negative')) emotionScore = 50;
    
    let proficiencyScore = 0;
    if (data.proficiency_level === 'Advanced') proficiencyScore = 100;
    else if (data.proficiency_level === 'Intermediate') proficiencyScore = 75;
    else if (data.proficiency_level.includes('Basic')) proficiencyScore = 50;
    else proficiencyScore = 0; // Unknown/Could not transcribe
    
    // Convert fluency score percentage string to number
    const fluencyScore = parseInt(data.fluency_score.replace('%', '')) || 0;


    return (confScore * CONFIDENCE_WEIGHT) + 
           (clarityScore * CLARITY_WEIGHT) + 
           (emotionScore * EMOTION_WEIGHT) +
           (proficiencyScore * PROFICIENCY_WEIGHT) +
           (fluencyScore * FLUENCY_WEIGHT); // NEW FLUENCY COMPONENT
}


/**
 * Calculates a weighted overall score for video performance.
 */
function calculateVideoScore(data) {
    if (!data.smile || !data.dominant_emotion) return 0;

    // 1. Smile Score (50%)
    const smilePercentage = parseInt(data.smile.replace('%', '')) || 0;
    
    // 2. Dominant Emotion Score (50%) - Uses the same logic as the Python backend's 'feedback' for confidence
    let emotionConfScore = 0;
    const dominant = data.dominant_emotion ? data.dominant_emotion.toLowerCase() : '';
    
    if (dominant === 'neutral' || (dominant === 'happy' && smilePercentage < 70)) {
        emotionConfScore = 100; // Excellent/Calm
    } else if (dominant === 'happy' && smilePercentage >= 70) {
        emotionConfScore = 80; // Good but needs composure
    } else if (['sad', 'fear', 'disgust', 'anger'].includes(dominant)) {
        emotionConfScore = 50; // Needs significant improvement
    } else {
        emotionConfScore = 60; // Default case (e.g., surprise)
    }
    
    // Formula: (Smile Score * 0.5) + (Emotion Confidence Score * 0.5)
    return (smilePercentage * 0.5) + (emotionConfScore * 0.5);
}

// ---------------------------------------------------------------------------------


if (startVoiceBtn) {
  startVoiceBtn.addEventListener("click", async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    // Clear score and suggestions on start
    updateOverallScore('--', 'voiceScoreCircle', 'voiceScoreText');
    renderSuggestions(null, 'voiceSuggestionList'); // Clear suggestions
    
    // NEW: Set Feedback fields to Loading state
    voiceFeedbackConfidence.textContent = 'Recording...';
    voiceFeedbackClarity.textContent = 'Recording...';
    voiceFeedbackEmotion.textContent = 'Recording...';
    voiceFeedbackProficiency.textContent = 'Recording...';
    voiceFeedbackFluency.textContent = 'Recording...';
    voiceFeedbackTranscript.textContent = 'Recording...';


    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(audioBlob);
      let analysisData = {}; // Initialize data storage

      // NEW: Set Feedback fields to Analyzing state
      voiceFeedbackConfidence.textContent = 'Analyzing...';
      voiceFeedbackClarity.textContent = 'Analyzing...';
      voiceFeedbackEmotion.textContent = 'Analyzing...';
      voiceFeedbackProficiency.textContent = 'Analyzing...';
      voiceFeedbackFluency.textContent = 'Analyzing...';
      voiceFeedbackTranscript.textContent = 'Analyzing...';


      // Send audio to backend for analysis
      const formData = new FormData();
      formData.append("file", audioBlob, "voice.wav");

      try {
        const res = await fetch("/analyze/audio", { method: "POST", body: formData });
        const data = await res.json();
        analysisData = data; // Store the full analysis data

        // Update feedback panel
        if (voiceFeedbackConfidence) voiceFeedbackConfidence.textContent = data.confidence || "--";
        if (voiceFeedbackClarity) voiceFeedbackClarity.textContent = data.clarity || "--";
        if (voiceFeedbackEmotion) voiceFeedbackEmotion.textContent = data.emotion || "--";
        if (voiceFeedbackProficiency) voiceFeedbackProficiency.textContent = data.proficiency_level || "--";
        if (voiceFeedbackFluency) voiceFeedbackFluency.textContent = `${data.filler_count} fillers (${data.fluency_score})`;
        if (voiceFeedbackTranscript) voiceFeedbackTranscript.textContent = data.transcript || "--";
        
        // Calculate and Update Overall Score Indicator
        const overallScore = calculateVoiceScore(data);
        updateOverallScore(overallScore, 'voiceScoreCircle', 'voiceScoreText');
        
        // Render suggestions
        renderSuggestions(data.suggestions, 'voiceSuggestionList');

      } catch (err) {
        console.error("Error analyzing audio:", err);
        updateOverallScore('--', 'voiceScoreCircle', 'voiceScoreText'); // Clear score on error
        // NEW: Show user-facing error message
        voiceFeedbackTranscript.textContent = "Analysis failed. Server or service error.";
      }

      // Store recording URL and analysis data together
      voiceRecordings.push({ url: audioUrl, data: analysisData });
      renderVoiceHistory();
    };

    mediaRecorder.start();
    startVoiceBtn.disabled = true;
    stopVoiceBtn.disabled = false;
  });

  stopVoiceBtn.addEventListener("click", () => {
    mediaRecorder.stop();
    startVoiceBtn.disabled = false;
    stopVoiceBtn.disabled = true;
  });
}

// Render voice recordings list
function renderVoiceHistory() {
  voiceHistory.innerHTML = "";
  voiceRecordings.forEach((recording, index) => {
    const li = document.createElement("li");
    const data = recording.data;
    
    // NEW: Calculate and store score for history display
    const overallScore = calculateVoiceScore(data);
    const scoreText = overallScore > 0 ? `${Math.round(overallScore)}%` : '--';

    const label = document.createElement("span");
    // Display Overall Score in the history list
    label.textContent = `Recording ${index + 1}: (Score: ${scoreText}, Conf: ${data.confidence || '--'}, Clar: ${data.clarity || '--'})`;

    const audioEl = document.createElement("audio");
    audioEl.src = recording.url;
    audioEl.controls = true;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.addEventListener("click", () => {
      voiceRecordings.splice(index, 1);
      renderVoiceHistory();
    });

    li.appendChild(label);
    li.appendChild(audioEl);
    li.appendChild(deleteBtn);
    voiceHistory.appendChild(li);
  });
}

// 🎥 Video Recording
let videoRecorder;
let videoStream;
let videoChunks = [];
let videoRecordings = []; // store objects: { url: "...", data: { dominant_emotion: "...", smile: "...", ... } }

const startVideoBtn = document.getElementById("startVideoBtn");
const stopVideoBtn = document.getElementById("stopVideoBtn");
const videoPreview = document.getElementById("videoPreview");
const videoHistory = document.getElementById("videoHistory");
const videoFeedbackConfidence = document.getElementById("vidConfidence");
const videoFeedbackEmotion = document.getElementById("vidEmotion");
const videoFeedbackSmile = document.getElementById("vidSmile");

const videoSuggestionList = document.getElementById("videoSuggestionList"); // NEW ELEMENT

if (startVideoBtn) {
  startVideoBtn.addEventListener("click", async () => {
    // Acquire stream
    videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    videoPreview.srcObject = videoStream;
    videoRecorder = new MediaRecorder(videoStream);
    videoChunks = [];

    // Clear score and suggestions on start
    updateOverallScore('--', 'videoScoreCircle', 'videoScoreText');
    renderSuggestions(null, 'videoSuggestionList'); // Clear suggestions

    // NEW: Set Feedback fields to Recording state
    videoFeedbackConfidence.textContent = 'Recording...';
    videoFeedbackEmotion.textContent = 'Recording...';
    videoFeedbackSmile.textContent = 'Recording...';

    videoRecorder.ondataavailable = e => videoChunks.push(e.data);
    
    // ASYNCHRONOUS PROCESSING AND CLEANUP
    videoRecorder.onstop = async () => {
      const videoBlob = new Blob(videoChunks, { type: "video/webm" });
      const videoUrl = URL.createObjectURL(videoBlob);
      let analysisData = {}; // Initialize data storage

      // NEW: Set Feedback fields to Analyzing state
      videoFeedbackConfidence.textContent = 'Analyzing...';
      videoFeedbackEmotion.textContent = 'Analyzing...';
      videoFeedbackSmile.textContent = 'Analyzing...';

      // Send video to backend for analysis
      const formData = new FormData();
      formData.append("file", videoBlob, "video.webm");

      try {
        const res = await fetch("/analyze/video", { method: "POST", body: formData });
        const data = await res.json();
        analysisData = data; // Store the full analysis data

        // Update feedback panel
        if (videoFeedbackConfidence) videoFeedbackConfidence.textContent = data.feedback || "--";
        if (videoFeedbackEmotion) videoFeedbackEmotion.textContent = data.dominant_emotion || "--";
        if (videoFeedbackSmile) videoFeedbackSmile.textContent = data.smile || "--"; // Reads the calculated smile percentage
        
        // Calculate and Update Overall Score Indicator
        const overallScore = calculateVideoScore(data);
        updateOverallScore(overallScore, 'videoScoreCircle', 'videoScoreText');

        // Render suggestions
        renderSuggestions(data.suggestions, 'videoSuggestionList');

      } catch (err) {
        console.error("Error analyzing video:", err);
        updateOverallScore('--', 'videoScoreCircle', 'videoScoreText'); // Clear score on error
        // NEW: Show user-facing error message
        videoFeedbackConfidence.textContent = "Analysis failed. Server or service error.";
      }
      
      // *** CRITICAL FIX: CLEANUP AND BUTTON RESET MOVED HERE ***
      // Ensure the camera stream is stopped ONLY AFTER the data has been sent/processed.
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
      startVideoBtn.disabled = false;
      stopVideoBtn.disabled = true;
      // *******************************************************
      
      // Store recording URL and analysis data together
      videoRecordings.push({ url: videoUrl, data: analysisData });
      renderVideoHistory();
    };

    videoRecorder.start();
    startVideoBtn.disabled = true;
    stopVideoBtn.disabled = false;
  });

  // BUTTON CLICK LISTENER
  stopVideoBtn.addEventListener("click", () => {
    // *** CRITICAL FIX: ONLY STOP THE RECORDER HERE ***
    // The onstop event handler will perform the rest of the cleanup asynchronously.
    videoRecorder.stop();
  });
}

// Render video recordings list
function renderVideoHistory() {
  videoHistory.innerHTML = "";
  videoRecordings.forEach((recording, index) => {
    const li = document.createElement("li");
    const data = recording.data;

    // NEW: Calculate and store score for history display
    const overallScore = calculateVideoScore(data);
    const scoreText = overallScore > 0 ? `${Math.round(overallScore)}%` : '--';

    const label = document.createElement("span");
    // Display Overall Score in the history list
    label.textContent = `Video ${index + 1}: (Score: ${scoreText}, Smile: ${data.smile || '--'})`;

    const videoEl = document.createElement("video");
    videoEl.src = recording.url;
    videoEl.controls = true;
    videoEl.width = 200;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.addEventListener("click", () => {
      videoRecordings.splice(index, 1);
      renderVideoHistory();
    });

    li.appendChild(label);
    li.appendChild(videoEl);
    li.appendChild(deleteBtn);
    videoHistory.appendChild(li);
  });
}