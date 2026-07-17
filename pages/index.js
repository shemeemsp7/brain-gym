// backend/pages/index.js
import dynamic from "next/dynamic";

// Dynamically import the main App component from backend/components
const App = dynamic(() => import("../components/App.jsx"), { ssr: false });

export default function Home() {
  return <App />;
}