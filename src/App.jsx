import { useState, useRef, useEffect } from "react";

const GEMINI_API_KEY = "AIzaSyDbyefGWdOb8F7otEqV6MbqPjOWxTza6cY";

const GUJARATI_TRANSLATIONS = {
  "Mixed Solid Waste & Plastic": "મિશ્ર ઘન કચરો અને પ્લાસ્ટિક",
  "Overflowing Dustbin": "ભરાઈ ગયેલ કચરા પેટી",
  "Open Garbage": "ખુલ્લો કચરો",
  "Missing Dustbin": "ગાયબ કચરા પેટી",
  "Clean Area": "સ્વચ્છ વિસ્તાર",
  "High": "ઉચ્ચ",
  "Medium": "મધ્યમ",
  "Low": "નીચું",
};

const analyzeImageWithGemini = async (base64Image, language) => {
  const langInstruction = language === "gu"
    ? "Respond with waste_type and description in Gujarati language."
    : "Respond in English.";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `You are an expert Urban Sanitation Officer for India's Swachh Bharat Mission. ${langInstruction} Analyze this image and respond ONLY with a valid JSON object in this exact format, no extra text:
{
  "waste_type": "Type of waste or issue detected",
  "severity": "High or Medium or Low",
  "description": "One sentence describing what you see",
  "action": "Specific action the municipal corporation should take",
  "is_issue": true or false,
  "points": 10 or 20 or 30
}`,
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image,
              },
            },
          ],
        }],
      }),
    }
  );
  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
};

const getSeverityColor = (severity) => {
  if (severity === "High" || severity === "ઉચ્ચ") return "#ef4444";
  if (severity === "Medium" || severity === "મધ્યમ") return "#f97316";
  return "#22c55e";
};

const MOTIVATIONAL = [
  "Every report brings India one step closer to being clean! 🇮🇳",
  "You are a true Swachh Bharat warrior! 💪",
  "Your action today makes Rajkot cleaner tomorrow! 🌟",
  "Jai Hind! You just did something real for your country! 🙏",
  "Small actions, big change. India is proud of you! 🇮🇳",
];

const getToday = () => new Date().toDateString();

export default function App() {
  const [page, setPage] = useState("home");
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [language, setLanguage] = useState("en");
  const [motivational] = useState(MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)]);
  const [reports, setReports] = useState(
    JSON.parse(localStorage.getItem("swachhata_reports") || "[]")
  );
  const [totalPoints, setTotalPoints] = useState(
    parseInt(localStorage.getItem("swachhata_points") || "0")
  );
  const [streak, setStreak] = useState(
    parseInt(localStorage.getItem("swachhata_streak") || "0")
  );
  const [lastReportDate, setLastReportDate] = useState(
    localStorage.getItem("swachhata_last_date") || ""
  );
  const fileRef = useRef();

  useEffect(() => {
    const today = getToday();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    if (lastReportDate !== today && lastReportDate !== yesterdayStr && lastReportDate !== "") {
      setStreak(0);
      localStorage.setItem("swachhata_streak", "0");
    }
  }, []);

  const getUserLevel = (pts) => {
    if (pts >= 200) return { label: "Swachhata Ambassador 🏆", color: "#f59e0b", next: null };
    if (pts >= 100) return { label: "City Guardian 🛡️", color: "#818cf8", next: 200 };
    if (pts >= 50) return { label: "Cleanliness Hero ⭐", color: "#22c55e", next: 100 };
    return { label: "Cleanliness Cadet 🌱", color: "#60a5fa", next: 50 };
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      const maxW = 800;
      const scale = Math.min(1, maxW / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL("image/jpeg", 0.7);
      setImage(compressed);
      setImageBase64(compressed.split(",")[1]);
      setResult(null);
      setError(null);
    };
    img.src = URL.createObjectURL(file);
  };

  const handleAnalyze = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setError(null);
    try {
      const analysis = await analyzeImageWithGemini(imageBase64, language);
      setResult(analysis);
      const pts = analysis.points || (analysis.severity === "High" ? 30 : analysis.severity === "Medium" ? 20 : 10);
      const newTotal = totalPoints + pts;
      setTotalPoints(newTotal);
      localStorage.setItem("swachhata_points", newTotal.toString());

      // Streak logic
      const today = getToday();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      let newStreak = streak;
      if (lastReportDate === yesterday.toDateString()) {
        newStreak = streak + 1;
      } else if (lastReportDate !== today) {
        newStreak = 1;
      }
      setStreak(newStreak);
      setLastReportDate(today);
      localStorage.setItem("swachhata_streak", newStreak.toString());
      localStorage.setItem("swachhata_last_date", today);

      const newReport = {
        id: Date.now(),
        timestamp: new Date().toLocaleString("en-IN"),
        image: image,
        status: "Pending Action",
        points: pts,
        language: language,
        escalated: false,
        reportedAt: Date.now(),
        ...analysis,
      };
      const updated = [newReport, ...reports];
      setReports(updated);
      localStorage.setItem("swachhata_reports", JSON.stringify(updated));
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    } catch (err) {
      setError("Analysis failed. Please try again with a clearer image.");
    }
    setLoading(false);
  };

  const handleEscalate = (reportId) => {
    const updated = reports.map(r => {
      if (r.id === reportId) {
        return { ...r, escalated: true, status: "Escalated ⚠️", escalatedAt: Date.now() };
      }
      return r;
    });
    setReports(updated);
    localStorage.setItem("swachhata_reports", JSON.stringify(updated));
  };

  const canEscalate = (report) => {
    if (report.escalated) return false;
    const hoursPassed = (Date.now() - report.reportedAt) / (1000 * 60 * 60);
    return hoursPassed >= 48 && report.status === "Pending Action";
  };

  // For demo purposes — show escalate button after 1 minute
  const canEscalateDemo = (report) => {
    if (report.escalated) return false;
    const minsPassed = (Date.now() - report.reportedAt) / (1000 * 60);
    return minsPassed >= 1 && report.status === "Pending Action";
  };

  const level = getUserLevel(totalPoints);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a1a 0%, #1a0533 50%, #0a1a0a 100%)",
      fontFamily: "'Segoe UI', sans-serif",
      color: "#fff",
    }}>

      {/* CELEBRATION OVERLAY */}
      {showCelebration && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.85)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{ fontSize: "80px", marginBottom: "16px" }}>🇮🇳</div>
          <div style={{
            fontSize: "32px", fontWeight: "900", textAlign: "center",
            background: "linear-gradient(90deg, #FF9933, #ffffff, #138808)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            marginBottom: "16px", padding: "0 32px",
          }}>
            Jai Hind! Report Submitted!
          </div>
          <div style={{ fontSize: "18px", color: "rgba(255,255,255,0.8)", textAlign: "center", maxWidth: "400px", lineHeight: "1.6" }}>
            {motivational}
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "24px", flexWrap: "wrap", justifyContent: "center" }}>
            <div style={{
              padding: "12px 32px",
              background: "linear-gradient(90deg, #FF9933, #FF5733)",
              borderRadius: "50px", fontSize: "18px", fontWeight: "700",
            }}>
              +{result?.points || 20} Points Earned! 🌟
            </div>
            {streak > 1 && (
              <div style={{
                padding: "12px 32px",
                background: "linear-gradient(90deg, #f59e0b, #ef4444)",
                borderRadius: "50px", fontSize: "18px", fontWeight: "700",
              }}>
                🔥 {streak} Day Streak!
              </div>
            )}
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 32px",
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        position: "sticky", top: 0, zIndex: 100,
        flexWrap: "wrap", gap: "12px",
      }}>
        <div style={{
          fontSize: "22px", fontWeight: "900",
          background: "linear-gradient(90deg, #FF9933, #ffffff, #138808)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          🧹 SwachhataSutra
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* STREAK */}
          {streak > 0 && (
            <div style={{
              padding: "6px 14px", borderRadius: "20px",
              background: "rgba(245,158,11,0.15)",
              border: "1px solid rgba(245,158,11,0.4)",
              fontSize: "13px", fontWeight: "700", color: "#f59e0b",
            }}>
              🔥 {streak} Day Streak
            </div>
          )}
          {/* POINTS */}
          <div style={{
            padding: "6px 16px", borderRadius: "20px",
            background: "rgba(255,153,51,0.15)",
            border: "1px solid rgba(255,153,51,0.4)",
            fontSize: "13px", fontWeight: "700", color: "#FF9933",
          }}>
            ⭐ {totalPoints} pts · {level.label}
          </div>
          {/* LANGUAGE TOGGLE */}
          <div style={{
            display: "flex", borderRadius: "20px", overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.2)",
          }}>
            <button
              onClick={() => setLanguage("en")}
              style={{
                padding: "6px 14px", border: "none", cursor: "pointer",
                background: language === "en" ? "rgba(255,153,51,0.6)" : "rgba(255,255,255,0.05)",
                color: "#fff", fontWeight: "700", fontSize: "13px",
              }}>EN</button>
            <button
              onClick={() => setLanguage("gu")}
              style={{
                padding: "6px 14px", border: "none", cursor: "pointer",
                background: language === "gu" ? "rgba(255,153,51,0.6)" : "rgba(255,255,255,0.05)",
                color: "#fff", fontWeight: "700", fontSize: "13px",
              }}>ગુ</button>
          </div>
          <button onClick={() => setPage("home")} style={{
            padding: "8px 20px", borderRadius: "20px", border: "none",
            cursor: "pointer", fontWeight: "600", fontSize: "14px",
            background: page === "home" ? "linear-gradient(90deg, #FF9933, #FF5733)" : "rgba(255,255,255,0.08)",
            color: "#fff",
          }}>Report</button>
          <button onClick={() => setPage("dashboard")} style={{
            padding: "8px 20px", borderRadius: "20px", border: "none",
            cursor: "pointer", fontWeight: "600", fontSize: "14px",
            background: page === "dashboard" ? "linear-gradient(90deg, #FF9933, #FF5733)" : "rgba(255,255,255,0.08)",
            color: "#fff",
          }}>Dashboard</button>
        </div>
      </nav>

      {/* REPORT PAGE */}
      {page === "home" && (
        <div style={{ padding: "60px 32px 40px", maxWidth: "700px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>🇮🇳</div>
            <h1 style={{
              fontSize: "42px", fontWeight: "900", margin: "0 0 16px",
              background: "linear-gradient(90deg, #FF9933, #ffffff, #138808)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              lineHeight: "1.2",
            }}>
              {language === "gu" ? "ચાલો આપણો દેશ સ્વચ્છ કરીએ." : "Let's Clean Our Country."}<br />
              {language === "gu" ? "આપણું ઘર." : "Our Home."}
            </h1>
            <p style={{
              fontSize: "17px", color: "rgba(255,255,255,0.65)",
              maxWidth: "480px", margin: "0 auto", lineHeight: "1.7",
            }}>
              {language === "gu"
                ? "રાજકોટમાં સ્વચ્છતાની સમસ્યા જુઓ? તરત રિપોર્ટ કરો. અમારી Gemini AI તેને વિશ્લેષણ કરશે."
                : "Spot a cleanliness issue in Rajkot? Report it in seconds. Our Gemini AI analyzes it instantly."}
            </p>
          </div>

          {/* HOW IT WORKS */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "40px", justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { icon: "📷", text: language === "gu" ? "ફોટો લો" : "Take a Photo" },
              { icon: "🤖", text: language === "gu" ? "AI વિશ્લેષણ" : "AI Analyzes" },
              { icon: "📋", text: language === "gu" ? "રિપોર્ટ બને" : "Report Generated" },
              { icon: "🏙️", text: language === "gu" ? "શહેર જાણ્યું" : "City Notified" },
            ].map((step, i) => (
              <div key={i} style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: "6px", padding: "16px 20px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)",
                minWidth: "100px",
              }}>
                <div style={{ fontSize: "28px" }}>{step.icon}</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", fontWeight: "600" }}>{step.text}</div>
              </div>
            ))}
          </div>

          {/* UPLOAD CARD */}
          <div style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "32px",
          }}>
            <div
              onClick={() => fileRef.current.click()}
              style={{
                border: "2px dashed rgba(255,153,51,0.4)",
                borderRadius: "16px",
                padding: image ? "0" : "48px 32px",
                textAlign: "center",
                cursor: "pointer",
                marginBottom: "24px",
                overflow: "hidden",
              }}>
              {image ? (
                <img src={image} alt="preview" style={{
                  width: "100%", maxHeight: "320px",
                  objectFit: "cover", borderRadius: "14px", display: "block",
                }} />
              ) : (
                <>
                  <div style={{ fontSize: "52px", marginBottom: "16px" }}>📸</div>
                  <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>
                    {language === "gu" ? "સમસ્યાનો ફોટો અપલોડ કરો" : "Upload Photo of the Issue"}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
                    {language === "gu" ? "કચરો, ભરાઈ ગયેલ ડ્રેન, ગાયબ ડસ્ટબિન — કંઈ પણ!" : "Garbage, pothole, overflowing bin, missing dustbin — anything!"}
                  </div>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />

            {image && !result && (
              <button
                onClick={handleAnalyze}
                disabled={loading}
                style={{
                  width: "100%", padding: "16px", borderRadius: "14px",
                  border: "none", cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "17px", fontWeight: "800",
                  background: loading ? "rgba(255,255,255,0.1)" : "linear-gradient(90deg, #FF9933, #FF5733)",
                  color: "#fff",
                  boxShadow: loading ? "none" : "0 4px 24px rgba(255,153,51,0.4)",
                }}>
                {loading
                  ? (language === "gu" ? "🔍 Gemini AI વિશ્લેષણ કરી રહ્યું છે..." : "🔍 Gemini AI is analyzing your photo...")
                  : (language === "gu" ? "🚀 વિશ્લેષણ કરો અને રિપોર્ટ કરો" : "🚀 Analyze & Report This Issue")}
              </button>
            )}

            {error && (
              <div style={{
                marginTop: "16px", padding: "14px", borderRadius: "12px",
                background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
                color: "#fca5a5", textAlign: "center",
              }}>
                {error}
              </div>
            )}

            {result && (
              <div>
                <div style={{
                  borderRadius: "16px", padding: "24px", marginTop: "8px",
                  background: `rgba(${result.severity === "High" || result.severity === "ઉચ્ચ" ? "239,68,68" : result.severity === "Medium" || result.severity === "મધ્યમ" ? "249,115,22" : "34,197,94"},0.1)`,
                  border: `1px solid ${getSeverityColor(result.severity)}40`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <span style={{
                      padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700",
                      background: getSeverityColor(result.severity), color: "#fff",
                    }}>
                      {result.severity} {language === "gu" ? "તીવ્રતા" : "Severity"}
                    </span>
                    <div style={{
                      padding: "6px 14px", borderRadius: "20px",
                      background: "rgba(255,153,51,0.2)",
                      border: "1px solid rgba(255,153,51,0.4)",
                      fontSize: "14px", fontWeight: "700", color: "#FF9933",
                    }}>
                      +{result.points || 20} pts
                    </div>
                  </div>

                  <h3 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: "800" }}>
                    {result.waste_type}
                  </h3>
                  <p style={{ margin: "0 0 20px", color: "rgba(255,255,255,0.75)", lineHeight: "1.6" }}>
                    {result.description}
                  </p>

                  <div style={{
                    background: "rgba(255,255,255,0.06)", borderRadius: "12px", padding: "16px", marginBottom: "16px",
                  }}>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: "700", marginBottom: "6px", letterSpacing: "1px" }}>
                      {language === "gu" ? "મ્યુનિસિપલ કોર્પોરેશન માટે જરૂરી પગલાં" : "MUNICIPAL ACTION REQUIRED"}
                    </div>
                    <div style={{ fontWeight: "600", lineHeight: "1.5" }}>{result.action}</div>
                  </div>

                  <div style={{
                    padding: "14px 16px", borderRadius: "12px",
                    background: "linear-gradient(90deg, rgba(19,136,8,0.2), rgba(255,153,51,0.1))",
                    border: "1px solid rgba(19,136,8,0.3)",
                    fontSize: "14px", color: "#86efac", lineHeight: "1.6",
                    marginBottom: "16px",
                  }}>
                    ✅ {language === "gu"
                      ? "રિપોર્ટ ડેશબોર્ડ પર સેવ · રાજકોટ મ્યુ. કો. ને જાણ · તમારું યોગદાન મહત્વપૂર્ણ છે!"
                      : "Report saved to city dashboard · Rajkot Municipal Corporation notified · Your contribution matters!"}
                  </div>

                  <button
                    onClick={() => { setImage(null); setImageBase64(null); setResult(null); }}
                    style={{
                      width: "100%", padding: "14px", borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.08)",
                      color: "#fff", fontWeight: "700", cursor: "pointer", fontSize: "15px",
                    }}>
                    {language === "gu" ? "બીજી સમસ્યા રિપોર્ટ કરો 📷" : "Report Another Issue 📷"}
                  </button>
                </div>

                <div style={{
                  textAlign: "center", marginTop: "24px", padding: "20px",
                  background: "linear-gradient(135deg, rgba(255,153,51,0.1), rgba(19,136,8,0.1))",
                  borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)",
                }}>
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>🙏</div>
                  <div style={{ fontWeight: "700", fontSize: "16px", marginBottom: "4px" }}>{motivational}</div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>Together we build a Swachh Bharat</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DASHBOARD PAGE */}
      {page === "dashboard" && (
        <div style={{ padding: "48px 32px", maxWidth: "700px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>📊</div>
            <h2 style={{ fontSize: "34px", fontWeight: "900", margin: "0 0 8px" }}>
              Rajkot City Dashboard
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}>
              Real-time cleanliness intelligence powered by Gemini AI
            </p>
          </div>

          {/* LEVEL + STREAK CARD */}
          <div style={{
            background: "linear-gradient(135deg, rgba(255,153,51,0.15), rgba(19,136,8,0.1))",
            border: `1px solid ${level.color}40`,
            borderRadius: "20px", padding: "24px", marginBottom: "16px",
            display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap",
          }}>
            <div style={{ fontSize: "48px" }}>👤</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>YOUR STATUS</div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: level.color }}>{level.label}</div>
              <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>
                {totalPoints} points · {reports.length} reports · {streak} day streak 🔥
              </div>
              {level.next && (
                <div style={{ marginTop: "10px" }}>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>
                    {level.next - totalPoints} pts to next level
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "10px", height: "6px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: "10px",
                      background: `linear-gradient(90deg, ${level.color}, #FF9933)`,
                      width: `${Math.min(100, (totalPoints / level.next) * 100)}%`,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>
              )}
            </div>
            <div style={{
              padding: "12px 20px", borderRadius: "16px",
              background: "rgba(255,153,51,0.2)", border: "1px solid rgba(255,153,51,0.4)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "28px", fontWeight: "900", color: "#FF9933" }}>{totalPoints}</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>TOTAL PTS</div>
            </div>
          </div>

          {/* STREAK CARD */}
          {streak > 0 && (
            <div style={{
              background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.1))",
              border: "1px solid rgba(245,158,11,0.3)",
              borderRadius: "16px", padding: "16px 24px", marginBottom: "24px",
              display: "flex", alignItems: "center", gap: "16px",
            }}>
              <div style={{ fontSize: "40px" }}>🔥</div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: "800", color: "#f59e0b" }}>
                  {streak} Day Reporting Streak!
                </div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
                  Keep reporting daily to maintain your streak
                </div>
              </div>
            </div>
          )}

          {/* STATS */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginBottom: "32px" }}>
            {[
              { label: "Total", value: reports.length, color: "#818cf8", icon: "📋" },
              { label: "High", value: reports.filter(r => r.severity === "High" || r.severity === "ઉચ્ચ").length, color: "#ef4444", icon: "🔴" },
              { label: "Medium", value: reports.filter(r => r.severity === "Medium" || r.severity === "મધ્યમ").length, color: "#f97316", icon: "🟡" },
              { label: "Low", value: reports.filter(r => r.severity === "Low" || r.severity === "નીચું").length, color: "#22c55e", icon: "🟢" },
            ].map((s, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px", padding: "16px", textAlign: "center",
              }}>
                <div style={{ fontSize: "22px", marginBottom: "4px" }}>{s.icon}</div>
                <div style={{ fontSize: "28px", fontWeight: "900", color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* REPORTS LIST */}
          {reports.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "60px 32px",
              background: "rgba(255,255,255,0.03)", borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🌱</div>
              <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>No reports yet</div>
              <div style={{ color: "rgba(255,255,255,0.4)" }}>Be the first to report an issue in Rajkot!</div>
            </div>
          ) : (
            reports.map((r) => (
              <div key={r.id} style={{
                background: r.escalated ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.04)",
                borderRadius: "18px",
                border: r.escalated ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.08)",
                padding: "20px", marginBottom: "14px",
              }}>
                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  {r.image && (
                    <img src={r.image} alt="report" style={{
                      width: "80px", height: "80px", borderRadius: "12px",
                      objectFit: "cover", flexShrink: 0,
                    }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontWeight: "800", fontSize: "16px" }}>{r.waste_type}</span>
                      <span style={{
                        padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700",
                        background: getSeverityColor(r.severity), color: "#fff",
                      }}>{r.severity}</span>
                    </div>
                    <p style={{ margin: "0 0 10px", color: "rgba(255,255,255,0.65)", fontSize: "14px", lineHeight: "1.5" }}>
                      {r.description}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                      <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>🕐 {r.timestamp}</span>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700",
                          background: "rgba(255,153,51,0.2)", color: "#FF9933",
                          border: "1px solid rgba(255,153,51,0.3)",
                        }}>+{r.points || 20} pts</span>
                        <span style={{
                          padding: "3px 10px", borderRadius: "20px", fontSize: "11px",
                          background: r.escalated ? "rgba(239,68,68,0.2)" : "rgba(249,115,22,0.15)",
                          color: r.escalated ? "#fca5a5" : "#fb923c",
                          border: `1px solid ${r.escalated ? "rgba(239,68,68,0.4)" : "rgba(249,115,22,0.3)"}`,
                        }}>{r.status}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ESCALATE BUTTON */}
                {canEscalateDemo(r) && (
                  <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "10px" }}>
                      ⚠️ No action taken yet. You can escalate this complaint.
                    </div>
                    <button
                      onClick={() => handleEscalate(r.id)}
                      style={{
                        padding: "10px 20px", borderRadius: "10px",
                        border: "1px solid rgba(239,68,68,0.5)",
                        background: "rgba(239,68,68,0.15)",
                        color: "#fca5a5", fontWeight: "700", cursor: "pointer", fontSize: "13px",
                      }}>
                      🚨 Escalate Complaint to Higher Authority
                    </button>
                  </div>
                )}

                {r.escalated && (
                  <div style={{
                    marginTop: "14px", paddingTop: "14px",
                    borderTop: "1px solid rgba(239,68,68,0.2)",
                    fontSize: "13px", color: "#fca5a5",
                  }}>
                    🚨 Escalated to higher municipal authority. Response expected within 24 hours.
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* FOOTER */}
      <div style={{
        textAlign: "center", padding: "32px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.3)", fontSize: "13px",
      }}>
        🇮🇳 SwachhataSutra · Built for Swachh Bharat Mission · FutureForge Hackathon 2026<br />
        <span style={{ color: "rgba(255,255,255,0.15)" }}>Powered by Gemini AI · Made with ❤️ in Rajkot</span>
      </div>
    </div>
  );
}
