import React, { useState, useRef, useEffect } from "react";

const VideoRecorder = () => {
  const [mediaBlob, setMediaBlob] = useState(null);
  const [recording, setRecording] = useState(false);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [savedRecordings, setSavedRecordings] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);

  const videoRef = useRef(null);
  const playbackRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunks = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    const videos = JSON.parse(localStorage.getItem("videoRecordings")) || [];
    setSavedRecordings(videos);
  }, []);

  const requestPermission = async () => {
    setError(null);
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      setPermissionGranted(true);
      setStream(userStream);

      if (videoRef.current) {
        videoRef.current.srcObject = userStream;
        videoRef.current.muted = true;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Permission error:", err);
      setError("Permission denied. Please allow access to camera & mic.");
    }
  };
  const stopRecording = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    if (stream) stream.getTracks().forEach((track) => track.stop());
    setRecording(false);
    setPermissionGranted(false);

    clearInterval(timerRef.current);
  };

  const startRecording = () => {
    if (!stream || !permissionGranted) {
      setError("Please grant permission before starting recording.");
      return;
    }

    chunks.current = [];
    setRecordingTime(0);

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp8,opus",
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks.current, { type: "video/webm" });
      setMediaBlob(blob);
      saveRecording(blob);
      chunks.current = [];
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setRecording(true);

    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const saveRecording = (blob) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Video = reader.result;
      const timestamp = new Date().toLocaleString();
      const newRecording = {
        id: Date.now(),
        timestamp,
        video: base64Video,
      };

      const updated = [newRecording, ...savedRecordings];
      setSavedRecordings(updated);
      localStorage.setItem("videoRecordings", JSON.stringify(updated));
    };
    reader.readAsDataURL(blob);
  };

  const deleteRecording = (id) => {
    const filtered = savedRecordings.filter((r) => r.id !== id);
    setSavedRecordings(filtered);
    localStorage.setItem("videoRecordings", JSON.stringify(filtered));
  };

  const deleteAllRecordings = () => {
    if (window.confirm("Delete all saved video recordings?")) {
      setSavedRecordings([]);
      localStorage.removeItem("videoRecordings");
    }
  };

  const formatTime = (seconds) => {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <>
      <div className="video-recorder-container">
        <h2> Video Recorder</h2>
        <video ref={videoRef} autoPlay playsInline muted className="preview" />
        {recording && (
          <p style={{ fontWeight: "bold", marginTop: "10px" }}>
            Recording Time: {formatTime(recordingTime)}
          </p>
        )}
        <div className="video-controls">
          {!permissionGranted ? (
            <button onClick={requestPermission}> Grant Permission</button>
          ) : (
            <button onClick={recording ? stopRecording : startRecording}>
              {recording ? "⏹ Stop" : "⏺ Start Recording"}
            </button>
          )}
        </div>

        {error && (
          <div className="error-popup">
            <p>{error}</p>
            <button onClick={() => setError(null)}>OK</button>
          </div>
        )}

        {mediaBlob && (
          <div className="latest-video">
            <h3> Playback</h3>
            <video
              ref={playbackRef}
              controls
              src={URL.createObjectURL(mediaBlob)}
            />
            <a
              href={URL.createObjectURL(mediaBlob)}
              download="video_recording.webm"
            >
              <button> Download</button>
            </a>
          </div>
        )}
      </div>

      <div className="saved-recordings-box">
        <h3> Saved Recordings</h3>

        {savedRecordings.length === 0 ? (
          <p className="no-recordings">No recordings yet.</p>
        ) : (
          <>
            <button className="delete-all-button" onClick={deleteAllRecordings}>
              Delete All
            </button>

            <div className="recordings-grid">
              {savedRecordings.map((rec) => (
                <div key={rec.id} className="recording-card">
                  <p>
                    <strong> {rec.timestamp}</strong>
                  </p>
                  <video controls src={rec.video} />
                  <div className="video-download-button">
                    <a href={rec.video} download={`video-${rec.id}.webm`}>
                      <button className="download-button"> Download</button>
                    </a>
                    <button
                      className="download-button"
                      onClick={() => deleteRecording(rec.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default VideoRecorder;
