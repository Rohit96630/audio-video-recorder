import React, { useState, useRef, useEffect } from "react";

const AudioRecorder = () => {
  const [mediaBlob, setMediaBlob] = useState(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [savedRecordings, setSavedRecordings] = useState([]);

  const mediaRecorderRef = useRef(null);
  const chunks = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const recordings =
      JSON.parse(localStorage.getItem("audioRecordings")) || [];
    setSavedRecordings(recordings);
  }, []);

  const requestPermission = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setPermissionGranted(true);
    } catch (err) {
      console.error("Mic permission denied:", err);
      setError("Microphone access denied. Please allow permission.");
    }
  };

  const startRecording = () => {
    if (!streamRef.current) {
      setError("Please allow mic permission first.");
      return;
    }

    chunks.current = [];
    setRecordingTime(0);

    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: "audio/webm;codecs=opus",
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks.current, { type: "audio/webm" });
      setMediaBlob(blob);
      saveRecording(blob);
      chunks.current = [];
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);

    timerRef.current = setInterval(() => {
      setRecordingTime((prevTime) => prevTime + 1);
    }, 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setRecording(false);
    setPermissionGranted(false);
    clearInterval(timerRef.current);
  };

  const saveRecording = (blob) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = reader.result;
      const timestamp = new Date().toLocaleString();
      const newRecording = { id: Date.now(), timestamp, audio: base64Audio };

      const updatedRecordings = [newRecording, ...savedRecordings];
      setSavedRecordings(updatedRecordings);
      localStorage.setItem(
        "audioRecordings",
        JSON.stringify(updatedRecordings)
      );
    };
    reader.readAsDataURL(blob);
  };

  const formatTime = (seconds) => {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  const deleteAllRecordings = () => {
    if (
      window.confirm("Are you sure you want to delete all saved recordings?")
    ) {
      localStorage.removeItem("audioRecordings");
      setSavedRecordings([]);
    }
  };

  return (
    <>
      <div className="recorder-container">
        <div className="recorder-box">
          <h2> Audio Recorder</h2>

          {!permissionGranted ? (
            <button onClick={requestPermission}> Grant Mic Permission</button>
          ) : (
            <button onClick={recording ? stopRecording : startRecording}>
              {recording ? "⏹ Stop Recording" : "⏺ Start Recording"}
            </button>
          )}

          {recording && (
            <p className="timer">Recording Time: {formatTime(recordingTime)}</p>
          )}

          {error && (
            <div className="error-popup">
              <p> {error}</p>
              <button onClick={() => setError(null)}>OK</button>
            </div>
          )}

          {mediaBlob && (
            <div className="latest-playback">
              <h3> Latest Playback</h3>
              <audio controls src={URL.createObjectURL(mediaBlob)} />
              <a
                href={URL.createObjectURL(mediaBlob)}
                download="audio_recording.webm"
              >
                <button> Download</button>
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="saved-recordings-box">
        <h3> Saved Recordings</h3>

        {savedRecordings.length === 0 ? (
          <p className="no-recordings">No saved recordings yet.</p>
        ) : (
          <>
            <button className="delete-all-button" onClick={deleteAllRecordings}>
              Delete All Recordings
            </button>

            <div className="recordings-grid">
              {savedRecordings.map((rec) => (
                <div key={rec.id} className="recording-card">
                  <p>
                    <strong> {rec.timestamp}</strong>
                  </p>
                  <audio controls src={rec.audio} />
                  <a href={rec.audio} download={`recording-${rec.id}.webm`}>
                    <button className="download-button"> Download</button>
                  </a>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default AudioRecorder;
