/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./pages/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "system-ui", "sans-serif"],
        body: ["Source Sans 3", "system-ui", "sans-serif"]
      },
      colors: {
        ink: "#0b0d12",
        fog: "#f3f4f6",
        ember: "#f97316",
        tide: "#0f172a",
        mist: "#e2e8f0"
      },
      boxShadow: {
        glow: "0 20px 60px rgba(249, 115, 22, 0.25)",
        lift: "0 18px 40px rgba(15, 23, 42, 0.15)"
      },
      backgroundImage: {
        "hero-gradient": "radial-gradient(circle at top, rgba(249,115,22,0.25), transparent 60%), linear-gradient(120deg, #0f172a, #0b0d12)",
        "card-gradient": "linear-gradient(135deg, rgba(248,250,252,0.95), rgba(226,232,240,0.85))"
      }
    }
  },
  plugins: []
};
