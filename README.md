# 🧹 SwachhataSutra
### *Let's Clean Our Country. Our Home.* 🇮🇳

> AI-powered civic reporting platform for India's Swachh Bharat Mission  
> Built for **Google Solution Challenge 2026** | Aligned with **UN SDG 11: Sustainable Cities**

---

## 🌐 Live Demo
**[swachhatasutra.vercel.app](https://swachhatasutra.vercel.app)**

---

## 📌 Problem Statement

In rapidly urbanizing Indian cities like Rajkot, the gap between citizen-reported cleanliness issues and municipal action is hindered by:
- Fragmented, manual complaint systems
- No real-time visibility for administrators
- Zero incentive for citizens to participate repeatedly
- Unstructured data that is impossible to prioritize

---

## 💡 Solution — SwachhataSutra

SwachhataSutra transforms a citizen's photo into a structured, actionable municipal report in seconds using Google's Gemini AI.

**How it works:**
1. 📷 Citizen uploads a photo of a cleanliness issue (garbage, pothole, overflowing bin, missing dustbin)
2. 🤖 Gemini 2.0 Flash Vision API analyzes the image and classifies:
   - Waste type
   - Severity (High / Medium / Low)
   - Description of the issue
   - Recommended municipal action
3. 📋 Report is saved to the city dashboard automatically
4. ⭐ Citizen earns points and levels up for every verified report

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 AI Photo Analysis | Gemini Vision classifies waste type and severity from a single photo |
| 📋 Auto Report Generation | AI writes a professional municipal action report automatically |
| ⭐ Gamification Engine | Citizens earn 10–30 points per report and level up |
| 🏆 Citizen Levels | Cleanliness Cadet → City Guardian → Cleanliness Hero → Swachhata Ambassador |
| 📊 City Dashboard | Real-time stats: total reports, severity breakdown, report history |
| 🇮🇳 Patriotic Experience | Celebration screen with Indian flag and motivational messages after each report |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js 18 + Vite |
| AI Engine | Google Gemini 2.0 Flash Vision API |
| Styling | CSS-in-JS (inline styles) |
| Image Processing | Canvas API (client-side compression) |
| Storage | localStorage (prototype) |
| Deployment | Vercel |
| Version Control | GitHub |

---

## 🏗️ Architecture

```
Citizen (Browser)
       │
       ▼
React Frontend (Vite)
       │
       ├── Canvas API → Image Compression
       │
       ▼
Gemini 2.0 Flash Vision API
       │
       ▼
JSON Response
{ waste_type, severity, description, action, points }
       │
       ├── localStorage → Report History
       │
       ▼
City Dashboard (Real-time UI)
```

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/HackInShadows/swachhatasutra.git

# Navigate into the project
cd swachhatasutra

# Install dependencies
npm install

# Add your Gemini API key in src/App.jsx
const GEMINI_API_KEY = "YOUR_API_KEY_HERE";

# Start the development server
npm run dev
```

Get your free Gemini API key at [aistudio.google.com](https://aistudio.google.com)

---

## 🎯 UN SDG Alignment

**SDG 11: Sustainable Cities and Communities**  
SwachhataSutra directly supports Target 11.6 — reducing the adverse environmental impact of cities, with special attention to waste management.

---

## 🔮 Future Roadmap

- **Phase 2** — Firebase Firestore backend + Google Maps heatmap
- **Phase 3** — Re-complaint system (48-hour escalation), Missing dustbin detection, Multilingual support (Gujarati, Hindi)
- **Phase 4** — NGO Mode, Government digital certificates, Influencer sharing cards

---

## 👤 Built By

**Upadhyay Foram Jignesh**  
Solo participant | BCA Student at Atmiya University, Rajkot  
Aspiring Software Architect & Data Engineer  
🎓 Applying for M.Sc. Computing Sciences at Tampere University, Finland

*"I built this because I see this problem every day on the streets of Rajkot. Technology should serve people — and this is my contribution to my country."*

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

*Made with ❤️ in Rajkot, Gujarat, India 🇮🇳*  
*Google Solution Challenge 2026 | Swachh Bharat Mission*
