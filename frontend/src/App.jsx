import { useEffect } from "react";

function App() {
  useEffect(() => {
    fetch("http://localhost:5000/health")
      .then((res) => res.json())
      .then((data) => console.log("Backend response:", data))
      .catch((err) => console.error("Error:", err));
  }, []);

  return <h1>ISL Translator App</h1>;
}

export default App;
