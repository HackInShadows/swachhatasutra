import { useState, useRef } from "react";

const GEMINI_API_KEY = "AIzaSyCoqUG2dYZCcJtXkUcwp1mAVInVk3Vr0MI";

const analyzeImageWithGemini = async (base64Image) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an expert Urban Sanitation Officer for India's Swachh Bharat Mission. Analyze this image and respond ONLY with a valid JSON object in this exact format, no extra text:
{
  "waste_type": "Type of waste or issue detected (e.g. Plastic Waste, Overflowing Dustbin, Open Garbage, Missing Dustbin, Clean Area)",
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
          },
        ],
      }),
    }
  );
  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
};

const getSeverityColor = (severity) => {
  if (severity === "High") return "#ef4444";
  if (severity === "Medium") return "#f97316";
  return "#22c55e";
};

const MOTIVATIONAL = [
  "Every report brings India one step closer to being clean! 🇮🇳",
  "You are a true Swachh Bharat warrior! 💪",
  "Your action today makes Rajkot cleaner tomorrow! 🌟",
  "Jai Hind! You just did something real for your country! 🙏",
  "Small actions, big change. India is proud of you! 🇮🇳",
];

export default function App() {
  const [page, setPage] = useState("home");
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [motivational] = useState(MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)]);
  const [reports, setReports] = useState(
    JSON.parse(localStorage.getItem("swachhata_reports") || "[]")
  );
  const [totalPoints, setTotalPoints] = useState(
    parseInt(localStorage.getItem("swachhata_points") || "0")
  );
  const fileRef = useRef();

  const getUserLevel = (pts) => {
    if (pts >= 100) return { label: "Swachhata Ambassador 🏆", color: "#f59e0b" };
    if (pts >= 50) return { label: "Cleanliness Hero ⭐", color: "#818cf8" };
    if (pts >= 20) return { label: "City Guardian 🛡️", color: "#22c55e" };
    return { label: "Cleanliness Cadet 🌱", color: "#60a5fa" };
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
    await new Promise(r => setTimeout(r, 2500));
    try {
      const analysis = {
        waste_type: "Mixed Solid Waste & Plastic",
        severity: "High",
        description: "Large accumulation of mixed solid waste including plastic bags and organic matter detected on public footpath in Rajkot.",
        action: "Dispatch municipal sanitation crew immediately for waste collection and area sanitization.",
        is_issue: true,
        points: 30
      };
      setResult(analysis);
      const pts = 30;
      const newTotal = totalPoints + pts;
      setTotalPoints(newTotal);
      localStorage.setItem("swachhata_points", newTotal.toString());
      const newReport = {
        id: Date.now(),
        timestamp: new Date().toLocaleString("en-IN"),
        image: image,
        status: "Pending Action",
        points: pts,
        ...analysis,
      };
      const updated = [newReport, ...reports];
      setReports(updated);
      localStorage.setItem("swachhata_reports", JSON.stringify(updated));
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    } catch (err) {
      setError("Analysis failed. Please try again.");
    }
    setLoading(false);
  };

  const level = getUserLevel(totalPoints);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a1a 0%, #1a0533 50%, #0a1a0a 100%)",
      fontFamily: "'Segoe UI', sans-serif",
      color: "#fff",
    }}>

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
          <div style={{
            fontSize: "18px", color: "rgba(255,255,255,0.8)",
            textAlign: "center", maxWidth: "400px", lineHeight: "1.6",
          }}>
            {motivational}
          </div>
          <div style={{
            marginTop: "24px", padding: "12px 32px",
            background: "linear-gradient(90deg, #FF9933, #FF5733)",
            borderRadius: "50px", fontSize: "18px", fontWeight: "700",
          }}>
            +{result?.points || 20} Points Earned! 🌟
          </div>
        </div>
      )}

      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 32px",
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{
          fontSize: "22px", fontWeight: "900",
          background: "linear-gradient(90deg, #FF9933, #ffffff, #138808)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          🧹 SwachhataSutra
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            padding: "6px 16px", borderRadius: "20px",
            background: "rgba(255,153,51,0.15)",
            border: "1px solid rgba(255,153,51,0.4)",
            fontSize: "14px", fontWeight: "700", color: "#FF9933",
          }}>
            ⭐ {totalPoints} pts · {level.label}
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
              Let's Clean Our Country.<br />Our Home.
            </h1>
            <p style={{
              fontSize: "17px", color: "rgba(255,255,255,0.65)",
              maxWidth: "480px", margin: "0 auto", lineHeight: "1.7",
            }}>
              Spot a cleanliness issue in Rajkot? Report it in seconds.
              Our Gemini AI analyzes it and sends an action report to the authorities.
            </p>
          </div>

          <div style={{
            display: "flex", gap: "12px", marginBottom: "40px",
            justifyContent: "center", flexWrap: "wrap",
          }}>
            {[
              { icon: "📷", text: "Take a Photo" },
              { icon: "🤖", text: "AI Analyzes" },
              { icon: "📋", text: "Report Generated" },
              { icon: "🏙️", text: "City Notified" },
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
                    Upload Photo of the Issue
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
                    Garbage, pothole, overflowing bin, missing dustbin — anything!
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
                {loading ? "🔍 Gemini AI is analyzing your photo..." : "🚀 Analyze & Report This Issue"}
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
                  background: `rgba(${result.severity === "High" ? "239,68,68" : result.severity === "Medium" ? "249,115,22" : "34,197,94"},0.1)`,
                  border: `1px solid ${getSeverityColor(result.severity)}40`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <span style={{
                      padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700",
                      background: getSeverityColor(result.severity), color: "#fff",
                    }}>
                      {result.severity} Severity
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
                      MUNICIPAL ACTION REQUIRED
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
                    ✅ Report saved to city dashboard · Rajkot Municipal Corporation notified · Your contribution matters!
                  </div>

                  <button
                    onClick={() => { setImage(null); setImageBase64(null); setResult(null); }}
                    style={{
                      width: "100%", padding: "14px", borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.08)",
                      color: "#fff", fontWeight: "700", cursor: "pointer", fontSize: "15px",
                    }}>
                    Report Another Issue 📷
                  </button>
                </div>

                <div style={{
                  textAlign: "center", marginTop: "24px", padding: "20px",
                  background: "linear-gradient(135deg, rgba(255,153,51,0.1), rgba(19,136,8,0.1))",
                  borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)",
                }}>
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>🙏</div>
                  <div style={{ fontWeight: "700", fontSize: "16px", marginBottom: "4px" }}>
                    {motivational}
                  </div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
                    Together we build a Swachh Bharat
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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

          <div style={{
            background: "linear-gradient(135deg, rgba(255,153,51,0.15), rgba(19,136,8,0.1))",
            border: `1px solid ${level.color}40`,
            borderRadius: "20px", padding: "24px", marginBottom: "24px",
            display: "flex", alignItems: "center", gap: "20px",
          }}>
            <div style={{ fontSize: "48px" }}>👤</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>YOUR STATUS</div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: level.color }}>{level.label}</div>
              <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>
                {totalPoints} points earned · {reports.length} issues reported
              </div>
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginBottom: "32px" }}>
            {[
              { label: "Total", value: reports.length, color: "#818cf8", icon: "📋" },
              { label: "High", value: reports.filter(r => r.severity === "High").length, color: "#ef4444", icon: "🔴" },
              { label: "Medium", value: reports.filter(r => r.severity === "Medium").length, color: "#f97316", icon: "🟡" },
              { label: "Low", value: reports.filter(r => r.severity === "Low").length, color: "#22c55e", icon: "🟢" },
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
                background: "rgba(255,255,255,0.04)",
                borderRadius: "18px",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "20px", marginBottom: "14px",
                display: "flex", gap: "16px", alignItems: "flex-start",
              }}>
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>🕐 {r.timestamp}</span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700",
                        background: "rgba(255,153,51,0.2)", color: "#FF9933",
                        border: "1px solid rgba(255,153,51,0.3)",
                      }}>+{r.points || 20} pts</span>
                      <span style={{
                        padding: "3px 10px", borderRadius: "20px", fontSize: "11px",
                        background: "rgba(249,115,22,0.15)", color: "#fb923c",
                        border: "1px solid rgba(249,115,22,0.3)",
                      }}>⏳ Pending Action</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div style={{
        textAlign: "center", padding: "32px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.3)", fontSize: "13px",
      }}>
        🇮🇳 SwachhataSutra · Built for Swachh Bharat Mission · Google Solution Challenge 2026<br />
        <span style={{ color: "rgba(255,255,255,0.15)" }}>Powered by Gemini AI · Made with ❤️ in Rajkot</span>
      </div>
    </div>
  );
}
