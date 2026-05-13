import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        glass: "0 30px 80px rgba(148, 163, 184, 0.18)",
        soft: "0 20px 50px rgba(15, 23, 42, 0.08)"
      },
      backgroundImage: {
        mesh:
          "radial-gradient(circle at top left, rgba(255,255,255,0.96), rgba(238,243,248,0.92) 42%, rgba(221,229,238,1))"
      }
    }
  },
  plugins: []
};

export default config;
